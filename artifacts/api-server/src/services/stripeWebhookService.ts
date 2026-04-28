import { db, planos, assinaturas, empresas, stripeEventos } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

export interface StripeWebhookEvent {
  id?: string;
  type: string;
  data: { object: Record<string, unknown> };
}

async function upsertAssinatura(
  empresaId: number,
  planoId: number,
  paymentIntentId: string | undefined,
  status: string,
): Promise<void> {
  const [exist] = await db
    .select()
    .from(assinaturas)
    .where(eq(assinaturas.empresaId, empresaId))
    .limit(1);
  if (exist) {
    await db
      .update(assinaturas)
      .set({
        planoId,
        status,
        stripeSubscriptionId: paymentIntentId ?? exist.stripeSubscriptionId,
        inicio: status === "ativa" && !exist.inicio ? new Date() : exist.inicio,
      })
      .where(eq(assinaturas.id, exist.id));
  } else {
    await db.insert(assinaturas).values({
      empresaId,
      planoId,
      status,
      stripeSubscriptionId: paymentIntentId,
      inicio: new Date(),
    });
  }
}

async function recordEvent(event: StripeWebhookEvent): Promise<boolean> {
  if (!event.id) return true;
  try {
    await db.insert(stripeEventos).values({ eventId: event.id, tipo: event.type });
    return true;
  } catch {
    logger.info({ eventId: event.id, type: event.type }, "evento stripe duplicado, ignorando");
    return false;
  }
}

async function handleCheckoutCompleted(obj: Record<string, unknown>): Promise<void> {
  const meta = (obj["metadata"] ?? {}) as Record<string, string>;
  const empresaId = Number(meta["empresaId"]);
  const planoId = Number(meta["planoId"]);
  const paymentIntentId = obj["payment_intent"] as string | undefined;
  const paymentStatus = obj["payment_status"] as string | undefined;
  if (!empresaId || !planoId) return;
  const novoStatus = paymentStatus === "paid" ? "ativa" : "pendente";
  await upsertAssinatura(empresaId, planoId, paymentIntentId, novoStatus);
  if (novoStatus === "ativa") {
    await db
      .update(empresas)
      .set({ bloqueada: false, ativa: true })
      .where(eq(empresas.id, empresaId));
  }
}

async function handlePaymentSucceeded(obj: Record<string, unknown>): Promise<void> {
  const meta = (obj["metadata"] ?? {}) as Record<string, string>;
  const empresaId = Number(meta["empresaId"]);
  const planoId = Number(meta["planoId"]);
  const paymentIntentId = obj["id"] as string | undefined;
  if (!empresaId || !planoId) return;
  await upsertAssinatura(empresaId, planoId, paymentIntentId, "ativa");
  await db
    .update(empresas)
    .set({ bloqueada: false, ativa: true })
    .where(eq(empresas.id, empresaId));
}

async function handlePaymentFailedOrExpired(obj: Record<string, unknown>): Promise<void> {
  const meta = (obj["metadata"] ?? {}) as Record<string, string>;
  const empresaId = Number(meta["empresaId"]);
  if (!empresaId) return;
  const [exist] = await db
    .select()
    .from(assinaturas)
    .where(eq(assinaturas.empresaId, empresaId))
    .limit(1);
  if (exist && exist.status !== "ativa") {
    await db
      .update(assinaturas)
      .set({ status: "falha_pagamento" })
      .where(eq(assinaturas.id, exist.id));
  }
}

async function handleChargeRefunded(obj: Record<string, unknown>): Promise<void> {
  const paymentIntentId = obj["payment_intent"] as string | undefined;
  if (!paymentIntentId) return;
  await db
    .update(assinaturas)
    .set({ status: "reembolsada", canceladaEm: new Date() })
    .where(eq(assinaturas.stripeSubscriptionId, paymentIntentId));
  const [a] = await db
    .select()
    .from(assinaturas)
    .where(eq(assinaturas.stripeSubscriptionId, paymentIntentId))
    .limit(1);
  if (a) {
    await db
      .update(empresas)
      .set({ bloqueada: true })
      .where(eq(empresas.id, a.empresaId));
  }
}

export async function processarWebhook(event: StripeWebhookEvent): Promise<void> {
  logger.info({ type: event.type, id: event.id }, "stripe webhook recebido");

  const isFresh = await recordEvent(event);
  if (!isFresh) return;

  const obj = event.data.object;

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(obj);
      break;
    case "payment_intent.succeeded":
      await handlePaymentSucceeded(obj);
      break;
    case "payment_intent.payment_failed":
    case "checkout.session.expired":
      await handlePaymentFailedOrExpired(obj);
      break;
    case "charge.refunded":
      await handleChargeRefunded(obj);
      break;
    default:
      logger.debug({ type: event.type }, "stripe webhook tipo nao tratado");
  }

  // ensure planos table referenced in some flows
  void planos;
}
