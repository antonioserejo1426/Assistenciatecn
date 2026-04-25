import { Router } from "express";
import { db, usuarios, empresas } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { registerEmpresa, authenticate } from "../services/empresaService";
import { logger } from "../lib/logger";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { empresaNome, nome, email, senha } = req.body ?? {};
    if (!empresaNome || !nome || !email || !senha) {
      return res.status(400).json({ error: "campos_obrigatorios" });
    }
    const result = await registerEmpresa({ empresaNome, nome, email, senha });
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

router.post("/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body ?? {};
    if (!email || !senha) return res.status(400).json({ error: "campos_obrigatorios" });
    const result = await authenticate(email, senha);
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

export default router;
