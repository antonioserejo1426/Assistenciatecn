import { Router, type Request, type Response } from "express";
import express from "express";
import { stripe } from "../lib/stripe";
import { processarWebhook } from "../services/assinaturaService";
import { logger } from "../lib/logger";

const router = Router();

router.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    if (!stripe) return res.status(503).send("stripe nao configurado");
    const sig = req.headers["stripe-signature"];
    const secret = process.env["STRIPE_WEBHOOK_SECRET"];
    let event;
    try {
      if (secret && sig) {
        event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, secret);
      } else {
        event = JSON.parse((req.body as Buffer).toString("utf8"));
      }
    } catch (err) {
      logger.error({ err }, "webhook verify falhou");
      return res.status(400).send(`erro: ${(err as Error).message}`);
    }
    try {
      await processarWebhook(event as { type: string; data: { object: Record<string, unknown> } });
      res.json({ received: true });
    } catch (err) {
      logger.error({ err }, "webhook handler falhou");
      res.status(500).json({ error: "handler_falhou" });
    }
  },
);

export default router;
