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

router.post("/admin/empresas/:id/bloquear", async (req, res) => {
  const bloqueada = !!req.body?.bloqueada;
  await svc.adminBloquear(Number(req.params.id), bloqueada);
  res.json({ ok: true });
});

router.post("/admin/empresas/:id/estender-trial", async (req, res) => {
  const dias = Number(req.body?.dias ?? 7);
  const r = await svc.adminEstenderTrial(Number(req.params.id), dias);
  res.json(r);
});

router.post("/admin/empresas/:id/ativar", async (req, res) => {
  const planoId = Number(req.body?.planoId);
  const dias = Number(req.body?.dias ?? 30);
  if (!planoId) return res.status(400).json({ error: "planoId_obrigatorio" });
  const r = await svc.adminAtivarManual(Number(req.params.id), planoId, dias);
  res.json(r);
});

router.post("/admin/usuarios/:id/bloquear", async (req, res) => {
  const { db, usuarios } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const ativo = req.body?.bloqueado ? false : true;
  await db.update(usuarios).set({ ativo }).where(eq(usuarios.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
