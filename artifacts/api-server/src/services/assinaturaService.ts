import { db, planos, assinaturas, empresas, sistemaConfig } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { stripe } from "../lib/stripe";
import { logger } from "../lib/logger";

export async function getSistemaConfig() {
  const [cfg] = await db.select().from(sistemaConfig).limit(1);
  if (cfg) {
    if (cfg.trialDiasPadrao !== 0) {
      await db
        .update(sistemaConfig)
        .set({ trialDiasPadrao: 0, atualizadoEm: new Date() })
        .where(eq(sistemaConfig.id, cfg.id));
      return { ...cfg, trialDiasPadrao: 0 };
    }
    return cfg;
  }
  const [novo] = await db
    .insert(sistemaConfig)
    .values({ trialDiasPadrao: 0 })
    .returning();
  return novo!;
}

export async function getTrialDiasPadrao(): Promise<number> {
  return 0;
}

export async function updateSistemaConfig(_input: { trialDiasPadrao?: number }) {
  return getSistemaConfig();
}

export async function listPlanos() {
  const lista = await db.select().from(planos).where(eq(planos.ativo, true));
  return lista.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    preco: Number(p.preco),
    intervalo: p.intervalo,
    recursos: p.recursos ? safeParseList(p.recursos) : [],
  }));
}

function safeParseList(s: string): string[] {
  try {
    const v = JSON.parse(s);
    if (Array.isArray(v)) return v.map(String);
  } catch {
    /* noop */
  }
  return [];
}

export async function getAssinaturaEmpresa(empresaId: number) {
  const [a] = await db.select().from(assinaturas).where(eq(assinaturas.empresaId, empresaId)).limit(1);
  if (!a) return null;
  const [p] = a.planoId
    ? await db.select().from(planos).where(eq(planos.id, a.planoId)).limit(1)
    : [null];
  const [emp] = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
  return {
    id: a.id,
    status: a.status,
    planoId: a.planoId,
    plano: p
      ? {
          id: p.id,
          nome: p.nome,
          descricao: p.descricao,
          preco: Number(p.preco),
          intervalo: p.intervalo,
          recursos: p.recursos ? safeParseList(p.recursos) : [],
        }
      : null,
    trialFim: emp?.trialFim ?? null,
    proximoVencimento: a.proximoVencimento,
    inicio: a.inicio,
  };
}

export async function criarCheckout(
  empresaId: number,
  planoId: number,
  origin: string,
  _pularTrial = false,
): Promise<{ url: string }> {
  if (!stripe) throw new Error("STRIPE_NAO_CONFIGURADO");
  const [empresa] = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
  if (!empresa) throw new Error("EMPRESA_NAO_ENCONTRADA");
  const [plano] = await db.select().from(planos).where(eq(planos.id, planoId)).limit(1);
  if (!plano || !plano.stripePriceId) throw new Error("PLANO_SEM_STRIPE");

  let customerId = empresa.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ name: empresa.nome });
    customerId = customer.id;
    await db.update(empresas).set({ stripeCustomerId: customerId }).where(eq(empresas.id, empresa.id));
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: plano.stripePriceId, quantity: 1 }],
    payment_intent_data: {
      metadata: { empresaId: String(empresaId), planoId: String(planoId) },
    },
    metadata: { empresaId: String(empresaId), planoId: String(planoId) },
    success_url: `${origin}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/assinatura/cancelado`,
  });

  if (!session.url) throw new Error("SESSION_SEM_URL");
  return { url: session.url };
}

export async function criarPortal(_empresaId: number, _origin: string): Promise<{ url: string }> {
  throw new Error("PORTAL_INDISPONIVEL_PAGAMENTO_UNICO");
}

export async function processarWebhook(event: { type: string; data: { object: Record<string, unknown> } }) {
  logger.info({ type: event.type }, "stripe webhook recebido");

  if (event.type === "checkout.session.completed") {
    const sess = event.data.object as Record<string, unknown>;
    const meta = (sess["metadata"] ?? {}) as Record<string, string>;
    const empresaId = Number(meta["empresaId"]);
    const planoId = Number(meta["planoId"]);
    const paymentIntentId = sess["payment_intent"] as string | undefined;
    const paymentStatus = sess["payment_status"] as string | undefined;
    if (empresaId && planoId) {
      const novoStatus = paymentStatus === "paid" ? "ativa" : "pendente";
      await upsertAssinatura(empresaId, planoId, paymentIntentId, novoStatus);
      if (novoStatus === "ativa") {
        await db
          .update(empresas)
          .set({ bloqueada: false, ativa: true })
          .where(eq(empresas.id, empresaId));
      }
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Record<string, unknown>;
    const meta = (pi["metadata"] ?? {}) as Record<string, string>;
    const empresaId = Number(meta["empresaId"]);
    const planoId = Number(meta["planoId"]);
    const paymentIntentId = pi["id"] as string | undefined;
    if (empresaId && planoId) {
      await upsertAssinatura(empresaId, planoId, paymentIntentId, "ativa");
      await db
        .update(empresas)
        .set({ bloqueada: false, ativa: true })
        .where(eq(empresas.id, empresaId));
    }
  }

  if (event.type === "payment_intent.payment_failed" || event.type === "checkout.session.expired") {
    const obj = event.data.object as Record<string, unknown>;
    const meta = (obj["metadata"] ?? {}) as Record<string, string>;
    const empresaId = Number(meta["empresaId"]);
    if (empresaId) {
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
  }

  if (event.type === "charge.refunded") {
    const ch = event.data.object as Record<string, unknown>;
    const paymentIntentId = ch["payment_intent"] as string | undefined;
    if (paymentIntentId) {
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
  }
}

async function upsertAssinatura(
  empresaId: number,
  planoId: number,
  paymentIntentId: string | undefined,
  status: string,
) {
  const [exist] = await db.select().from(assinaturas).where(eq(assinaturas.empresaId, empresaId)).limit(1);
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

export async function adminResumo() {
  const [total] = await db.select({ n: sql<number>`count(*)::int` }).from(empresas);
  const [ativas] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(assinaturas)
    .where(eq(assinaturas.status, "ativa"));
  const [trial] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(assinaturas)
    .where(eq(assinaturas.status, "trial"));
  const [vencidas] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(assinaturas)
    .where(eq(assinaturas.status, "vencida"));
  const [mrr] = await db
    .select({
      v: sql<string>`coalesce(sum(${planos.preco}), 0)::text`,
    })
    .from(assinaturas)
    .innerJoin(planos, eq(planos.id, assinaturas.planoId))
    .where(eq(assinaturas.status, "ativa"));
  return {
    totalEmpresas: Number(total?.n ?? 0),
    ativas: Number(ativas?.n ?? 0),
    trial: Number(trial?.n ?? 0),
    vencidas: Number(vencidas?.n ?? 0),
    mrr: Number(mrr?.v ?? 0),
  };
}

export async function adminListEmpresas() {
  const rows = await db
    .select({
      id: empresas.id,
      nome: empresas.nome,
      ativa: empresas.ativa,
      bloqueada: empresas.bloqueada,
      trialFim: empresas.trialFim,
      criadoEm: empresas.criadoEm,
      status: assinaturas.status,
      planoNome: planos.nome,
      proximoVencimento: assinaturas.proximoVencimento,
    })
    .from(empresas)
    .leftJoin(assinaturas, eq(assinaturas.empresaId, empresas.id))
    .leftJoin(planos, eq(planos.id, assinaturas.planoId))
    .orderBy(sql`${empresas.criadoEm} desc`);
  return rows;
}

export async function adminBloquear(empresaId: number, bloqueada: boolean) {
  await db.update(empresas).set({ bloqueada }).where(eq(empresas.id, empresaId));
  return { ok: true };
}

export type ModoTrial = "adicionar" | "definir" | "data";

export async function adminEstenderTrial(
  empresaId: number,
  input: { modo?: ModoTrial; dias?: number; trialFim?: string | Date },
) {
  const [emp] = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
  if (!emp) throw new Error("NOT_FOUND");

  const modo: ModoTrial = input.modo ?? "adicionar";
  let novoFim: Date;

  if (modo === "data") {
    if (!input.trialFim) throw new Error("TRIAL_FIM_OBRIGATORIO");
    novoFim = new Date(input.trialFim);
    if (Number.isNaN(novoFim.getTime())) throw new Error("DATA_INVALIDA");
  } else {
    const dias = Number(input.dias);
    if (!Number.isFinite(dias) || dias < 0 || dias > 3650) throw new Error("DIAS_INVALIDO");
    if (modo === "definir") {
      novoFim = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
    } else {
      const base = emp.trialFim && emp.trialFim > new Date() ? emp.trialFim : new Date();
      novoFim = new Date(base.getTime() + dias * 24 * 60 * 60 * 1000);
    }
  }

  await db.update(empresas).set({ trialFim: novoFim, bloqueada: false, ativa: true }).where(eq(empresas.id, empresaId));
  const [exist] = await db.select().from(assinaturas).where(eq(assinaturas.empresaId, empresaId)).limit(1);
  if (exist) {
    await db
      .update(assinaturas)
      .set({ status: "trial", proximoVencimento: novoFim })
      .where(eq(assinaturas.empresaId, empresaId));
  } else {
    await db.insert(assinaturas).values({
      empresaId,
      status: "trial",
      inicio: new Date(),
      proximoVencimento: novoFim,
    });
  }
  return { trialFim: novoFim };
}

export async function adminAtivarManual(empresaId: number, planoId: number, dias: number) {
  const proximo = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  const [exist] = await db.select().from(assinaturas).where(eq(assinaturas.empresaId, empresaId)).limit(1);
  if (exist) {
    await db
      .update(assinaturas)
      .set({ planoId, status: "ativa", proximoVencimento: proximo, inicio: new Date() })
      .where(eq(assinaturas.id, exist.id));
  } else {
    await db.insert(assinaturas).values({
      empresaId,
      planoId,
      status: "ativa",
      inicio: new Date(),
      proximoVencimento: proximo,
    });
  }
  await db.update(empresas).set({ bloqueada: false, ativa: true }).where(eq(empresas.id, empresaId));
  return { ok: true };
}
