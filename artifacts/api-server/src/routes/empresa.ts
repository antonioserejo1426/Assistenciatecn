import { Router } from "express";
import { db, empresas } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/empresa", requireAuth, async (req, res) => {
  if (!req.auth?.empresaId) return res.status(404).json({ error: "sem_empresa" });
  const [e] = await db.select().from(empresas).where(eq(empresas.id, req.auth.empresaId)).limit(1);
  if (!e) return res.status(404).json({ error: "nao_encontrada" });
  res.json({ id: e.id, nome: e.nome, logoUrl: e.logoUrl, ativa: e.ativa, trialFim: e.trialFim });
});

router.put("/empresa", requireAuth, async (req, res) => {
  if (!req.auth?.empresaId) return res.status(403).json({ error: "sem_empresa" });
  const { nome, logoUrl } = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (nome !== undefined) update["nome"] = nome;
  if (logoUrl !== undefined) update["logoUrl"] = logoUrl;
  const [e] = await db
    .update(empresas)
    .set(update)
    .where(eq(empresas.id, req.auth.empresaId))
    .returning();
  if (!e) return res.status(404).json({ error: "nao_encontrada" });
  res.json({ id: e.id, nome: e.nome, logoUrl: e.logoUrl, ativa: e.ativa, trialFim: e.trialFim });
});

export default router;
