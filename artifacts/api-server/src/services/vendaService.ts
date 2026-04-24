import { db, vendas, vendaItens, produtos, estoqueMovimentacoes } from "@workspace/db";
import { and, eq, desc, sql, gte } from "drizzle-orm";

export async function listVendas(empresaId: number) {
  const rows = await db
    .select({
      id: vendas.id,
      total: vendas.total,
      custo: vendas.custoTotal,
      lucro: vendas.lucro,
      cliente: vendas.cliente,
      formaPagamento: vendas.formaPagamento,
      criadoEm: vendas.criadoEm,
      itensCount: sql<number>`(select count(*)::int from venda_itens vi where vi.venda_id = ${vendas.id})`,
    })
    .from(vendas)
    .where(eq(vendas.empresaId, empresaId))
    .orderBy(desc(vendas.criadoEm))
    .limit(200);
  return rows.map((r) => ({
    id: r.id,
    total: Number(r.total),
    custo: Number(r.custo),
    lucro: Number(r.lucro),
    cliente: r.cliente,
    formaPagamento: r.formaPagamento,
    criadoEm: r.criadoEm,
    itensCount: r.itensCount,
  }));
}

export async function getVendaDetalhada(empresaId: number, id: number) {
  const [v] = await db
    .select()
    .from(vendas)
    .where(and(eq(vendas.empresaId, empresaId), eq(vendas.id, id)))
    .limit(1);
  if (!v) return null;
  const itens = await db
    .select({
      id: vendaItens.id,
      produtoId: vendaItens.produtoId,
      produtoNome: produtos.nome,
      quantidade: vendaItens.quantidade,
      precoUnitario: vendaItens.precoUnitario,
      custoUnitario: vendaItens.custoUnitario,
    })
    .from(vendaItens)
    .leftJoin(produtos, eq(produtos.id, vendaItens.produtoId))
    .where(eq(vendaItens.vendaId, v.id));

  return {
    id: v.id,
    total: Number(v.total),
    custo: Number(v.custoTotal),
    lucro: Number(v.lucro),
    cliente: v.cliente,
    formaPagamento: v.formaPagamento,
    criadoEm: v.criadoEm,
    itensCount: itens.length,
    itens: itens.map((i) => ({
      id: i.id,
      produtoId: i.produtoId,
      produtoNome: i.produtoNome,
      quantidade: i.quantidade,
      precoUnitario: Number(i.precoUnitario),
      custoUnitario: Number(i.custoUnitario),
    })),
  };
}

export async function createVenda(
  empresaId: number,
  usuarioId: number | null,
  data: {
    cliente?: string | null;
    formaPagamento?: string | null;
    itens: Array<{ produtoId: number; quantidade: number; precoUnitario?: number | null }>;
  },
) {
  if (!data.itens || data.itens.length === 0) throw new Error("SEM_ITENS");

  return await db.transaction(async (tx) => {
    let total = 0;
    let custoTotal = 0;
    const itensComputados: Array<{
      produtoId: number;
      quantidade: number;
      precoUnitario: number;
      custoUnitario: number;
    }> = [];

    for (const item of data.itens) {
      const [p] = await tx
        .select()
        .from(produtos)
        .where(and(eq(produtos.empresaId, empresaId), eq(produtos.id, item.produtoId)))
        .limit(1);
      if (!p) throw new Error(`PRODUTO_${item.produtoId}_NAO_ENCONTRADO`);
      if (p.estoque < item.quantidade) throw new Error(`ESTOQUE_INSUFICIENTE_${p.id}`);
      const preco = item.precoUnitario ?? Number(p.preco);
      const custo = Number(p.custo);
      total += preco * item.quantidade;
      custoTotal += custo * item.quantidade;
      itensComputados.push({
        produtoId: p.id,
        quantidade: item.quantidade,
        precoUnitario: preco,
        custoUnitario: custo,
      });
      await tx
        .update(produtos)
        .set({ estoque: p.estoque - item.quantidade })
        .where(eq(produtos.id, p.id));
    }

    const [venda] = await tx
      .insert(vendas)
      .values({
        empresaId,
        usuarioId,
        cliente: data.cliente ?? null,
        formaPagamento: data.formaPagamento ?? null,
        total: total.toFixed(2),
        custoTotal: custoTotal.toFixed(2),
        lucro: (total - custoTotal).toFixed(2),
      })
      .returning();
    if (!venda) throw new Error("FALHA_VENDA");

    for (const i of itensComputados) {
      await tx.insert(vendaItens).values({
        vendaId: venda.id,
        produtoId: i.produtoId,
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario.toFixed(2),
        custoUnitario: i.custoUnitario.toFixed(2),
      });
      await tx.insert(estoqueMovimentacoes).values({
        empresaId,
        produtoId: i.produtoId,
        tipo: "saida",
        quantidade: i.quantidade,
        motivo: `Venda #${venda.id}`,
        vendaId: venda.id,
      });
    }

    return {
      id: venda.id,
      total: Number(venda.total),
      custo: Number(venda.custoTotal),
      lucro: Number(venda.lucro),
      cliente: venda.cliente,
      formaPagamento: venda.formaPagamento,
      criadoEm: venda.criadoEm,
      itensCount: itensComputados.length,
    };
  });
}

export async function dashboardResumo(empresaId: number) {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [agg] = await db
    .select({
      faturamento: sql<string>`coalesce(sum(${vendas.total}), 0)::text`,
      lucro: sql<string>`coalesce(sum(${vendas.lucro}), 0)::text`,
      qtd: sql<number>`count(*)::int`,
    })
    .from(vendas)
    .where(and(eq(vendas.empresaId, empresaId), gte(vendas.criadoEm, inicioMes)));

  const faturamentoMes = Number(agg?.faturamento ?? 0);
  const lucroMes = Number(agg?.lucro ?? 0);
  const vendasMes = Number(agg?.qtd ?? 0);
  const ticketMedio = vendasMes > 0 ? faturamentoMes / vendasMes : 0;

  const inicio30 = new Date();
  inicio30.setDate(inicio30.getDate() - 29);
  inicio30.setHours(0, 0, 0, 0);

  const serie = await db
    .select({
      data: sql<string>`to_char(${vendas.criadoEm}, 'YYYY-MM-DD')`,
      valor: sql<string>`coalesce(sum(${vendas.total}), 0)::text`,
      lucro: sql<string>`coalesce(sum(${vendas.lucro}), 0)::text`,
    })
    .from(vendas)
    .where(and(eq(vendas.empresaId, empresaId), gte(vendas.criadoEm, inicio30)))
    .groupBy(sql`to_char(${vendas.criadoEm}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${vendas.criadoEm}, 'YYYY-MM-DD')`);

  return {
    faturamentoMes,
    lucroMes,
    vendasMes,
    ticketMedio,
    faturamentoSerie: serie.map((s) => ({
      data: s.data,
      valor: Number(s.valor),
      lucro: Number(s.lucro),
    })),
  };
}

export async function topProdutos(empresaId: number, limit = 5) {
  const rows = await db
    .select({
      produtoId: vendaItens.produtoId,
      nome: produtos.nome,
      quantidade: sql<number>`sum(${vendaItens.quantidade})::int`,
      faturamento: sql<string>`sum(${vendaItens.precoUnitario} * ${vendaItens.quantidade})::text`,
    })
    .from(vendaItens)
    .innerJoin(vendas, eq(vendas.id, vendaItens.vendaId))
    .leftJoin(produtos, eq(produtos.id, vendaItens.produtoId))
    .where(eq(vendas.empresaId, empresaId))
    .groupBy(vendaItens.produtoId, produtos.nome)
    .orderBy(desc(sql`sum(${vendaItens.quantidade})`))
    .limit(limit);
  return rows.map((r) => ({
    produtoId: r.produtoId,
    nome: r.nome ?? "Produto",
    quantidade: r.quantidade,
    faturamento: Number(r.faturamento ?? 0),
  }));
}
