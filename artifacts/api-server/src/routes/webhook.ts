import { Router, type Request, type Response } from "express";
import express from "express";
import { stripe } from "../lib/stripe";
import { processarWebhook } from "../services/stripeWebhookService";
import { logger } from "../lib/logger";

const router = Router();

router.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response): Promise<void> => {
    if (!stripe) {
      res.status(503).send("stripe nao configurado");
      return;
    }
    const sig = req.headers["stripe-signature"];
    const secret = process.env["STRIPE_WEBHOOK_SECRET"];

    if (!secret) {
      logger.error("STRIPE_WEBHOOK_SECRET nao configurado — recusando webhook por seguranca");
      res.status(503).send("webhook secret nao configurado");
      return;
    }
    if (!sig) {
      logger.warn("requisicao sem stripe-signature recebida em /webhooks/stripe");
      res.status(400).send("assinatura ausente");
      return;
    }

    let event: { id?: string; type: string; data: { object: Record<string, unknown> } };
    try {
      const stripeEvent = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, secret);
      event = stripeEvent as unknown as { id?: string; type: string; data: { object: Record<string, unknown> } };
    } catch (err) {
      logger.error({ err }, "webhook verify falhou");
      res.status(400).send(`erro: ${(err as Error).message}`);
      return;
    }

    try {
      await processarWebhook(event);
      res.json({ received: true });
    } catch (err) {
      logger.error({ err, eventId: event.id, type: event.type }, "webhook handler falhou");
      res.status(500).json({ error: "handler_falhou" });
    }
  },
);

export default router;
