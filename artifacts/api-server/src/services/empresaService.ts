import { db, empresas, usuarios, planos, assinaturas } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, signToken, SUPER_ADMIN_EMAIL } from "../lib/auth";
import { stripe } from "../lib/stripe";
import { logger } from "../lib/logger";

export async function ensureSuperAdmin(): Promise<void> {
  const [existing] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, SUPER_ADMIN_EMAIL))
    .limit(1);
  if (existing) {
    if (existing.role !== "super_admin") {
      await db
        .update(usuarios)
        .set({ role: "super_admin", empresaId: null, ativo: true })
        .where(eq(usuarios.id, existing.id));
    }
    return;
  }
  const senhaHash = await hashPassword("antonioserejo90");
  await db.insert(usuarios).values({
    email: SUPER_ADMIN_EMAIL,
    nome: "Antonio Serejo",
    senhaHash,
    role: "super_admin",
    ativo: true,
    empresaId: null,
  });
  logger.info({ email: SUPER_ADMIN_EMAIL }, "super_admin criado");
}

const SEED_PLANOS = [
  {
    nome: "Starter",
    descricao: "Para lojas começando — 1 usuário, controle de estoque e PDV",
    preco: "0.50",
    intervalo: "unico",
    recursos: JSON.stringify([
      "1 usuário",
      "Estoque ilimitado",
      "PDV completo",
      "Scanner via celular",
    ]),
    features: JSON.stringify([]),
    ativo: true,
  },
  {
    nome: "Profissional",
    descricao: "Para oficinas em crescimento — múltiplos usuários e técnicos",
    preco: "0.50",
    intervalo: "unico",
    recursos: JSON.stringify([
      "Usuários ilimitados",
      "Gestão de técnicos e serviços",
      "Dashboard de lucratividade",
      "Scanner via celular",
      "Suporte prioritário",
    ]),
    features: JSON.stringify(["tecnicos", "servicos", "lucratividade"]),
    ativo: true,
  },
  {
    nome: "Premium",
    descricao: "Para redes — relatórios avançados e múltiplas filiais",
    preco: "0.50",
    intervalo: "unico",
    recursos: JSON.stringify([
      "Tudo do Profissional",
      "Múltiplas filiais",
      "Relatórios avançados",
      "API completa",
      "Suporte 24/7",
    ]),
    features: JSON.stringify([
      "tecnicos",
      "servicos",
      "lucratividade",
      "filiais",
      "relatorios_avancados",
    ]),
    ativo: true,
  },
];

export async function ensureSeedPlanos(): Promise<void> {
  const existentes = await db.select().from(planos);
  if (existentes.length === 0) {
    await db.insert(planos).values(SEED_PLANOS);
    logger.info("planos seed criados");
    return;
  }
  for (const seed of SEED_PLANOS) {
    const existente = existentes.find((p) => p.nome === seed.nome);
    if (!existente) continue;
    const precoAtual = Number(existente.preco).toFixed(2);
    const precoNovo = Number(seed.preco).toFixed(2);
    if (precoAtual !== precoNovo) {
      await db
        .update(planos)
        .set({ preco: seed.preco, stripeProductId: null, stripePriceId: null })
        .where(eq(planos.id, existente.id));
      logger.info({ planoId: existente.id, nome: seed.nome, precoNovo }, "preco do plano atualizado");
    }
  }
}

export async function syncStripePlanos(): Promise<void> {
  if (!stripe) return;
  const lista = await db.select().from(planos);
  for (const plano of lista) {
    if (plano.stripePriceId) continue;
    try {
      const product = await stripe.products.create({
        name: `TecnoFix ${plano.nome}`,
        description: plano.descricao ?? undefined,
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(Number(plano.preco) * 100),
        currency: "brl",
      });
      await db
        .update(planos)
        .set({ stripeProductId: product.id, stripePriceId: price.id })
        .where(eq(planos.id, plano.id));
      logger.info({ planoId: plano.id, priceId: price.id }, "stripe price criado");
    } catch (err) {
      logger.error({ err, planoId: plano.id }, "falha ao sincronizar plano com stripe");
    }
  }
}

export async function registerEmpresa(input: {
  empresaNome: string;
  nome: string;
  email: string;
  senha: string;
}) {
  const [existing] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, input.email))
    .limit(1);
  if (existing) {
    throw new Error("EMAIL_JA_USADO");
  }

  let stripeCustomerId: string | null = null;
  if (stripe) {
    try {
      const customer = await stripe.customers.create({
        name: input.empresaNome,
        email: input.email,
        metadata: { empresaNome: input.empresaNome },
      });
      stripeCustomerId = customer.id;
    } catch (err) {
      logger.error({ err }, "falha ao criar customer no stripe");
    }
  }

  const [empresa] = await db
    .insert(empresas)
    .values({
      nome: input.empresaNome,
      ativa: true,
      bloqueada: false,
      trialFim: null,
      stripeCustomerId,
    })
    .returning();

  if (!empresa) throw new Error("FALHA_CRIAR_EMPRESA");

  const senhaHash = await hashPassword(input.senha);
  const role = input.email === SUPER_ADMIN_EMAIL ? "super_admin" : "admin";
  const [user] = await db
    .insert(usuarios)
    .values({
      empresaId: role === "super_admin" ? null : empresa.id,
      nome: input.nome,
      email: input.email,
      senhaHash,
      role,
      ativo: true,
    })
    .returning();

  if (!user) throw new Error("FALHA_CRIAR_USUARIO");

  await db.insert(assinaturas).values({
    empresaId: empresa.id,
    status: "pendente",
    inicio: new Date(),
    proximoVencimento: null,
  });

  const token = signToken({ userId: user.id, empresaId: user.empresaId, role: user.role });
  return { token, user, empresa };
}

export async function authenticate(email: string, senha: string) {
  const [user] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
  if (!user || !user.ativo) return null;
  const { verifyPassword } = await import("../lib/auth");
  const ok = await verifyPassword(senha, user.senhaHash);
  if (!ok) return null;
  const token = signToken({ userId: user.id, empresaId: user.empresaId, role: user.role });
  return { token, user };
}
