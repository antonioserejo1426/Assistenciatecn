import { Router } from "express";
import rateLimit from "express-rate-limit";
import { db, usuarios, empresas } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { registerEmpresa, authenticate } from "../services/empresaService";
import { requestPasswordReset, confirmPasswordReset } from "../services/passwordResetService";
import { logger } from "../lib/logger";

const router = Router();

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "muitas_tentativas", message: "Muitas tentativas. Tente novamente em alguns minutos." },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "muitas_tentativas", message: "Muitas tentativas. Tente novamente em alguns minutos." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "muitas_tentativas", message: "Muitas tentativas. Tente novamente em alguns minutos." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "muitas_tentativas", message: "Muitos cadastros desse IP. Tente novamente mais tarde." },
});

router.post("/auth/register", registerLimiter, async (req, res) => {
  try {
    const { empresaNome, nome, email, senha } = req.body ?? {};
    if (!empresaNome || !nome || !email || !senha) {
      return res.status(400).json({ error: "campos_obrigatorios" });
    }
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "email_invalido" });
    }
    if (typeof senha !== "string" || senha.length < 6) {
      return res.status(400).json({ error: "senha_curta", message: "A senha precisa ter pelo menos 6 caracteres." });
    }
    if (typeof empresaNome !== "string" || empresaNome.trim().length < 2) {
      return res.status(400).json({ error: "empresa_nome_invalido" });
    }
    if (typeof nome !== "string" || nome.trim().length < 2) {
      return res.status(400).json({ error: "nome_invalido" });
    }
    const result = await registerEmpresa({
      empresaNome: empresaNome.trim(),
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
    });
    res.json({
      token: result.token,
      user: {
        id: result.user.id,
        nome: result.user.nome,
        email: result.user.email,
        role: result.user.role,
        empresaId: result.user.empresaId,
      },
      empresa: result.empresa
        ? {
            id: result.empresa.id,
            nome: result.empresa.nome,
            logoUrl: result.empresa.logoUrl,
            ativa: result.empresa.ativa,
            trialFim: result.empresa.trialFim,
          }
        : null,
    });
  } catch (err) {
    const e = err as Error;
    if (e.message === "EMAIL_JA_USADO") return res.status(409).json({ error: e.message });
    logger.error({ err }, "register failed");
    res.status(500).json({ error: "erro_interno" });
  }
});

router.post("/auth/login", loginLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body ?? {};
    if (!email || !senha) return res.status(400).json({ error: "campos_obrigatorios" });
    if (typeof email !== "string" || typeof senha !== "string") {
      return res.status(400).json({ error: "campos_obrigatorios" });
    }
    const result = await authenticate(email.trim().toLowerCase(), senha);
    if (!result) return res.status(401).json({ error: "credenciais_invalidas" });
    res.json({
      token: result.token,
      user: {
        id: result.user.id,
        nome: result.user.nome,
        email: result.user.email,
        role: result.user.role,
        empresaId: result.user.empresaId,
      },
    });
  } catch (err) {
    logger.error({ err }, "login failed");
    res.status(500).json({ error: "erro_interno" });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const auth = req.auth!;
  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, auth.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "user_not_found" });
  let empresa = null;
  let assinaturaStatus: string | null = null;
  if (user.empresaId) {
    const [emp] = await db.select().from(empresas).where(eq(empresas.id, user.empresaId)).limit(1);
    empresa = emp ?? null;
    if (emp) {
      const { getAssinaturaEmpresa } = await import("../services/assinaturaService");
      const a = await getAssinaturaEmpresa(emp.id);
      assinaturaStatus = a?.status ?? null;
    }
  }
  const { getEmpresaFeatures } = await import("../services/featureService");
  const features = await getEmpresaFeatures(user.empresaId, user.role);
  res.json({
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      empresaId: user.empresaId,
    },
    empresa: empresa
      ? {
          id: empresa.id,
          nome: empresa.nome,
          logoUrl: empresa.logoUrl,
          ativa: empresa.ativa,
          bloqueada: empresa.bloqueada,
          trialFim: empresa.trialFim,
        }
      : null,
    assinaturaStatus: empresa?.bloqueada ? "bloqueada" : assinaturaStatus,
    features,
  });
});

router.post("/auth/forgot-password", forgotLimiter, async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email_obrigatorio" });
    }
    await requestPasswordReset(email);
    res.json({
      ok: true,
      message:
        "Se o email estiver cadastrado, você receberá em instantes um link para redefinir a senha.",
    });
  } catch (err) {
    logger.error({ err }, "forgot-password failed");
    res.json({
      ok: true,
      message:
        "Se o email estiver cadastrado, você receberá em instantes um link para redefinir a senha.",
    });
  }
});

router.post("/auth/reset-password", resetLimiter, async (req, res) => {
  try {
    const { token, senha } = req.body ?? {};
    if (!token || !senha) return res.status(400).json({ error: "campos_obrigatorios" });
    if (typeof token !== "string" || typeof senha !== "string") {
      return res.status(400).json({ error: "campos_obrigatorios" });
    }
    const result = await confirmPasswordReset(token, senha);
    if (!result.ok) {
      const messages: Record<string, string> = {
        token_invalido: "Link inválido. Solicite um novo email de redefinição.",
        token_expirado: "Link expirado. Solicite um novo email de redefinição.",
        senha_curta: "A senha precisa ter pelo menos 6 caracteres.",
      };
      return res.status(400).json({ error: result.reason, message: messages[result.reason] });
    }
    res.json({ ok: true, message: "Senha redefinida com sucesso. Você já pode entrar." });
  } catch (err) {
    logger.error({ err }, "reset-password failed");
    res.status(500).json({ error: "erro_interno" });
  }
});

export default router;
