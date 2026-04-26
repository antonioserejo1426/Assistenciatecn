import { db, produtos, estoqueMovimentacoes } from "@workspace/db";
import { and, eq, ilike, or, desc, sql } from "drizzle-orm";

export async function listProdutos(
  empresaId: number,
  q?: string,
  limit = 200,
) {
  const conditions = [eq(produtos.empresaId, empresaId), eq(produtos.ativo, true)];
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    const search = or(ilike(produtos.nome, term), ilike(produtos.codigoBarras, term));
    if (search) conditions.push(search);
  }
  return db
    .select()
    .from(produtos)
    .where(and(...conditions))
    .orderBy(desc(produtos.criadoEm))
    .limit(limit);
}

export async function getProduto(empresaId: number, id: number) {
  const [p] = await db
    .select()
    .from(produtos)
    .where(and(eq(produtos.empresaId, empresaId), eq(produtos.id, id)))
    .limit(1);
  return p ?? null;
}

export async function getProdutoByCodigo(empresaId: number, codigo: string) {
  const [p] = await db
    .select()
    .from(produtos)
    .where(
      and(
        eq(produtos.empresaId, empresaId),
        eq(produtos.codigoBarras, codigo),
        eq(produtos.ativo, true),
      ),
    )
    .limit(1);
  return p ?? null;
}

export async function createProduto(
  empresaId: number,
  data: {
    nome: string;
    codigoBarras?: string | null;
    preco: number;
    custo: number;
    estoque: number;
    descricao?: string | null;
    imagemUrl?: string | null;
  },
) {
  if (data.codigoBarras && data.codigoBarras.trim()) {
    const existing = await getProdutoByCodigo(empresaId, data.codigoBarras.trim());
    if (existing) throw new Error("CODIGO_DUPLICADO");
  }
  const [p] = await db
    .insert(produtos)
    .values({
      empresaId,
      nome: data.nome,
      codigoBarras: data.codigoBarras?.trim() || null,
      preco: String(data.preco),
      custo: String(data.custo),
      estoque: data.estoque,
      descricao: data.descricao ?? null,
      imagemUrl: data.imagemUrl ?? null,
      ativo: true,
    })
    .returning();
  if (!p) throw new Error("FALHA_CRIAR");
  if (data.estoque > 0) {
    await db.insert(estoqueMovimentacoes).values({
      empresaId,
      produtoId: p.id,
      tipo: "entrada",
      quantidade: data.estoque,
      motivo: "Estoque inicial",
    });
  }
  return p;
}

export async function updateProduto(
  empresaId: number,
  id: number,
  data: Partial<{
    nome: string;
    codigoBarras: string | null;
    preco: number;
    custo: number;
    estoque: number;
    descricao: string | null;
    imagemUrl: string | null;
  }>,
) {
  const update: Record<string, unknown> = {};
  if (data.nome !== undefined) update["nome"] = data.nome;
  if (data.codigoBarras !== undefined)
    update["codigoBarras"] = data.codigoBarras?.toString().trim() || null;
  if (data.preco !== undefined) update["preco"] = String(data.preco);
  if (data.custo !== undefined) update["custo"] = String(data.custo);
  if (data.estoque !== undefined) update["estoque"] = data.estoque;
  if (data.descricao !== undefined) update["descricao"] = data.descricao;
  if (data.imagemUrl !== undefined) update["imagemUrl"] = data.imagemUrl;
  const [p] = await db
    .update(produtos)
    .set(update)
    .where(and(eq(produtos.empresaId, empresaId), eq(produtos.id, id)))
    .returning();
  return p ?? null;
}

export async function deleteProduto(empresaId: number, id: number) {
  await db
    .update(produtos)
    .set({ ativo: false })
    .where(and(eq(produtos.empresaId, empresaId), eq(produtos.id, id)));
  return { ok: true };
}

export async function listMovimentacoes(empresaId: number) {
  const rows = await db
    .select({
      id: estoqueMovimentacoes.id,
      produtoId: estoqueMovimentacoes.produtoId,
      produtoNome: produtos.nome,
      tipo: estoqueMovimentacoes.tipo,
      quantidade: estoqueMovimentacoes.quantidade,
      motivo: estoqueMovimentacoes.motivo,
      criadoEm: estoqueMovimentacoes.criadoEm,
    })
    .from(estoqueMovimentacoes)
    .leftJoin(produtos, eq(produtos.id, estoqueMovimentacoes.produtoId))
    .where(eq(estoqueMovimentacoes.empresaId, empresaId))
    .orderBy(desc(estoqueMovimentacoes.criadoEm))
    .limit(200);
  return rows;
}

export async function createMovimentacao(
  empresaId: number,
  data: { produtoId: number; tipo: string; quantidade: number; motivo?: string | null },
) {
  if (data.quantidade <= 0) throw new Error("QUANTIDADE_INVALIDA");
  const produto = await getProduto(empresaId, data.produtoId);
  if (!produto) throw new Error("PRODUTO_NAO_ENCONTRADO");

  const delta = data.tipo === "entrada" ? data.quantidade : -data.quantidade;

  const updated = await db
    .update(produtos)
    .set({ estoque: sql`${produtos.estoque} + ${delta}` })
    .where(
      and(
        eq(produtos.id, produto.id),
        eq(produtos.empresaId, empresaId),
        sql`${produtos.estoque} + ${delta} >= 0`,
      ),
    )
    .returning({ id: produtos.id });
  if (updated.length === 0) throw new Error("ESTOQUE_NEGATIVO");

  const [mov] = await db
    .insert(estoqueMovimentacoes)
    .values({
      empresaId,
      produtoId: produto.id,
      tipo: data.tipo,
      quantidade: data.quantidade,
      motivo: data.motivo ?? null,
    })
    .returning();
  if (!mov) throw new Error("FALHA_MOV");
  return {
    id: mov.id,
    produtoId: mov.produtoId,
    produtoNome: produto.nome,
    tipo: mov.tipo,
    quantidade: mov.quantidade,
    motivo: mov.motivo,
    criadoEm: mov.criadoEm,
  };
}

export async function totalProdutos(empresaId: number) {
  const [r] = await db
    .select({ total: sql<number>`count(*)::int`, baixo: sql<number>`count(*) filter (where estoque < 5)::int` })
    .from(produtos)
    .where(and(eq(produtos.empresaId, empresaId), eq(produtos.ativo, true)));
  return r ?? { total: 0, baixo: 0 };
}
