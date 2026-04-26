import { Router } from "express";
import { requireAuth } from "../lib/auth";
import * as svc from "../services/assinaturaService";
import { getOrigin, stripeEnabled } from "../lib/stripe";
import { logger } from "../lib/logger";

const router = Router();

router.get("/planos", async (_req, res) => {
  const list = await svc.listPlanos();
  res.json(list);
});

router.get("/assinatura", requireAuth, async (req, res) => {
  if (!req.auth?.empresaId) return res.status(404).json({ error: "sem_empresa" });
  const a = await svc.getAssinaturaEmpresa(req.auth.empresaId);
  if (!a) return res.status(404).json({ error: "nao_encontrada" });
  res.json(a);
});

router.post("/assinatura/checkout", requireAuth, async (req, res) => {
  try {
    if (!stripeEnabled) {
      logger.error("checkout falhou: STRIPE_SECRET_KEY ausente em produção");
      return res.status(503).json({ error: "STRIPE_NAO_CONFIGURADO" });
    }
    if (!req.auth?.empresaId) return res.status(403).json({ error: "sem_empresa" });
    const planoId = Number(req.body?.planoId);
    if (!planoId) return res.status(400).json({ error: "planoId_obrigatorio" });
    const pularTrial = Boolean(req.body?.pularTrial);
    const origin = getOrigin(req);
    const result = await svc.criarCheckout(req.auth.empresaId, planoId, origin, pularTrial);
    res.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    logger.error({ err: msg, stack: (e as Error).stack, empresaId: req.auth?.empresaId, planoId: req.body?.planoId }, "checkout falhou");
    res.status(400).json({ error: msg });
  }
});

router.post("/assinatura/portal", requireAuth, async (req, res) => {
  try {
    if (!req.auth?.empresaId) return res.status(403).json({ error: "sem_empresa" });
    const origin = getOrigin(req);
    const result = await svc.criarPortal(req.auth.empresaId, origin);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
