import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const empresas = pgTable(
  "empresas",
  {
    id: serial("id").primaryKey(),
    nome: varchar("nome", { length: 200 }).notNull(),
    logoUrl: text("logo_url"),
    ativa: boolean("ativa").notNull().default(true),
    bloqueada: boolean("bloqueada").notNull().default(false),
    trialFim: timestamp("trial_fim", { withTimezone: true }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 200 }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("empresas_stripe_customer_idx").on(t.stripeCustomerId)],
);

export const usuarios = pgTable(
  "usuarios",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id").references(() => empresas.id, {
      onDelete: "cascade",
    }),
    nome: varchar("nome", { length: 200 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    senhaHash: text("senha_hash").notNull(),
    role: varchar("role", { length: 32 }).notNull().default("admin"),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("usuarios_email_idx").on(t.email),
    index("usuarios_empresa_idx").on(t.empresaId),
  ],
);

export const planos = pgTable("planos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  preco: numeric("preco", { precision: 12, scale: 2 }).notNull(),
  intervalo: varchar("intervalo", { length: 20 }).notNull().default("mes"),
  stripeProductId: varchar("stripe_product_id", { length: 200 }),
  stripePriceId: varchar("stripe_price_id", { length: 200 }),
  recursos: text("recursos"),
  ativo: boolean("ativo").notNull().default(true),
});

export const assinaturas = pgTable(
  "assinaturas",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    planoId: integer("plano_id").references(() => planos.id),
    status: varchar("status", { length: 32 }).notNull().default("trial"),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 200 }),
    inicio: timestamp("inicio", { withTimezone: true }),
    proximoVencimento: timestamp("proximo_vencimento", { withTimezone: true }),
    canceladaEm: timestamp("cancelada_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("assinaturas_empresa_idx").on(t.empresaId),
    uniqueIndex("assinaturas_stripe_sub_idx").on(t.stripeSubscriptionId),
  ],
);

export const produtos = pgTable(
  "produtos",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 200 }).notNull(),
    codigoBarras: varchar("codigo_barras", { length: 64 }),
    preco: numeric("preco", { precision: 12, scale: 2 }).notNull().default("0"),
    custo: numeric("custo", { precision: 12, scale: 2 }).notNull().default("0"),
    estoque: integer("estoque").notNull().default(0),
    descricao: text("descricao"),
    imagemUrl: text("imagem_url"),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("produtos_empresa_codigo_idx").on(t.empresaId, t.codigoBarras),
    index("produtos_empresa_idx").on(t.empresaId),
  ],
);

export const estoqueMovimentacoes = pgTable(
  "estoque_movimentacoes",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    produtoId: integer("produto_id")
      .notNull()
      .references(() => produtos.id, { onDelete: "cascade" }),
    tipo: varchar("tipo", { length: 16 }).notNull(),
    quantidade: integer("quantidade").notNull(),
    motivo: text("motivo"),
    vendaId: integer("venda_id"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("mov_empresa_idx").on(t.empresaId),
    index("mov_produto_idx").on(t.produtoId),
  ],
);

export const vendas = pgTable(
  "vendas",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    usuarioId: integer("usuario_id").references(() => usuarios.id, {
      onDelete: "set null",
    }),
    cliente: varchar("cliente", { length: 200 }),
    formaPagamento: varchar("forma_pagamento", { length: 64 }),
    total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
    custoTotal: numeric("custo_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    lucro: numeric("lucro", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("vendas_empresa_idx").on(t.empresaId)],
);

export const vendaItens = pgTable(
  "venda_itens",
  {
    id: serial("id").primaryKey(),
    vendaId: integer("venda_id")
      .notNull()
      .references(() => vendas.id, { onDelete: "cascade" }),
    produtoId: integer("produto_id")
      .notNull()
      .references(() => produtos.id),
    quantidade: integer("quantidade").notNull(),
    precoUnitario: numeric("preco_unitario", { precision: 12, scale: 2 })
      .notNull(),
    custoUnitario: numeric("custo_unitario", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
  },
  (t) => [index("venda_itens_venda_idx").on(t.vendaId)],
);

export const tecnicos = pgTable(
  "tecnicos",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 200 }).notNull(),
    especialidade: varchar("especialidade", { length: 200 }),
    telefone: varchar("telefone", { length: 32 }),
    ativo: boolean("ativo").notNull().default(true),
  },
  (t) => [index("tecnicos_empresa_idx").on(t.empresaId)],
);

export const servicos = pgTable(
  "servicos",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    descricao: text("descricao").notNull(),
    cliente: varchar("cliente", { length: 200 }),
    clienteTelefone: varchar("cliente_telefone", { length: 32 }),
    aparelho: varchar("aparelho", { length: 200 }),
    tecnicoId: integer("tecnico_id").references(() => tecnicos.id, {
      onDelete: "set null",
    }),
    status: varchar("status", { length: 32 }).notNull().default("aberto"),
    valor: numeric("valor", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    custoPecas: numeric("custo_pecas", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finalizadoEm: timestamp("finalizado_em", { withTimezone: true }),
  },
  (t) => [
    index("servicos_empresa_idx").on(t.empresaId),
    index("servicos_status_idx").on(t.status),
  ],
);

export const servicoPecas = pgTable("servico_pecas", {
  id: serial("id").primaryKey(),
  servicoId: integer("servico_id")
    .notNull()
    .references(() => servicos.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id),
  quantidade: integer("quantidade").notNull(),
  custoUnitario: numeric("custo_unitario", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
});

export const adminMaster = pgTable("admin_master", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  criadoEm: timestamp("criado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sistemaConfig = pgTable("sistema_config", {
  id: serial("id").primaryKey(),
  trialDiasPadrao: integer("trial_dias_padrao").notNull().default(7),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Empresa = typeof empresas.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
export type Plano = typeof planos.$inferSelect;
export type Assinatura = typeof assinaturas.$inferSelect;
export type Produto = typeof produtos.$inferSelect;
export type Movimentacao = typeof estoqueMovimentacoes.$inferSelect;
export type Venda = typeof vendas.$inferSelect;
export type VendaItem = typeof vendaItens.$inferSelect;
export type Tecnico = typeof tecnicos.$inferSelect;
export type Servico = typeof servicos.$inferSelect;
