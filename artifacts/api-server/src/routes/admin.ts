import { Router } from "express";
import { requireAuth, requireSuperAdmin } from "../lib/auth";
import * as svc from "../services/assinaturaService";

const router = Router();
router.use(requireAuth, requireSuperAdmin);

router.get("/admin/resumo", async (_req, res) => {
  res.json(await svc.adminResumo());
});

router.get("/admin/empresas", async (_req, res) => {
  res.json(await svc.adminListEmpresas());
});

router.post("/admin/empresas/:id/bloqueio", async (req, res) => {
  const bloqueada = !!req.body?.bloqueada;
  await svc.adminBloquear(Number(req.params.id), bloqueada);
  res.json({ ok: true });
});

router.post("/admin/empresas/:id/trial", async (req, res) => {
  const dias = Number(req.body?.dias ?? 7);
  const r = await svc.adminEstenderTrial(Number(req.params.id), dias);
  res.json(r);
});

router.post("/admin/empresas/:id/ativar-assinatura", async (req, res) => {
  const planoId = Number(req.body?.planoId);
  const dias = Number(req.body?.dias ?? 30);
  if (!planoId) return res.status(400).json({ error: "planoId_obrigatorio" });
  const r = await svc.adminAtivarManual(Number(req.params.id), planoId, dias);
  res.json(r);
});

router.post("/admin/usuarios/:id/bloqueio", async (req, res) => {
  const { db, usuarios } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const ativo = req.body?.bloqueada ? false : true;
  await db.update(usuarios).set({ ativo }).where(eq(usuarios.id, Number(req.params.id)));
  res.json({ ok: true });
});

router.get("/admin/empresas/:id/usuarios", async (req, res) => {
  const { db, usuarios } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const lista = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.empresaId, Number(req.params.id)));
  res.json(
    lista.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      role: u.role,
      ativo: u.ativo,
      empresaId: u.empresaId,
      criadoEm: u.criadoEm ? new Date(u.criadoEm).toISOString() : null,
    })),
  );
});

router.patch("/admin/usuarios/:id", async (req, res) => {
  const { db, usuarios } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const { hashPassword, SUPER_ADMIN_EMAIL } = await import("../lib/auth");
  const id = Number(req.params.id);
  const [alvo] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  if (!alvo) return res.status(404).json({ error: "usuario_nao_encontrado" });

  const updates: Record<string, unknown> = {};
  if (typeof req.body?.nome === "string" && req.body.nome.trim()) {
    updates["nome"] = req.body.nome.trim();
  }
  if (typeof req.body?.email === "string" && req.body.email.trim()) {
    const novoEmail = req.body.email.trim().toLowerCase();
    if (novoEmail !== alvo.email) {
      if (alvo.email === SUPER_ADMIN_EMAIL) {
        return res.status(400).json({ error: "nao_pode_alterar_email_do_super_admin" });
      }
      const [existente] = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.email, novoEmail))
        .limit(1);
      if (existente && existente.id !== id) {
        return res.status(409).json({ error: "email_ja_usado" });
      }
      updates["email"] = novoEmail;
    }
  }
  if (typeof req.body?.senha === "string" && req.body.senha.length >= 4) {
    updates["senhaHash"] = await hashPassword(req.body.senha);
  }
  if (typeof req.body?.ativo === "boolean") {
    if (alvo.email === SUPER_ADMIN_EMAIL && req.body.ativo === false) {
      return res.status(400).json({ error: "nao_pode_desativar_super_admin" });
    }
    updates["ativo"] = req.body.ativo;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "nenhum_campo_para_atualizar" });
  }
  await db.update(usuarios).set(updates).where(eq(usuarios.id, id));
  res.json({ ok: true });
});

export default router;
