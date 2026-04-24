import { db, tecnicos, servicos } from "@workspace/db";
import { and, eq, desc, sql } from "drizzle-orm";

export async function listTecnicos(empresaId: number) {
  return db
    .select()
    .from(tecnicos)
    .where(and(eq(tecnicos.empresaId, empresaId), eq(tecnicos.ativo, true)))
    .orderBy(tecnicos.nome);
}

export async function createTecnico(
  empresaId: number,
  data: { nome: string; especialidade?: string | null; telefone?: string | null },
) {
  const [t] = await db
    .insert(tecnicos)
    .values({
      empresaId,
      nome: data.nome,
      especialidade: data.especialidade ?? null,
      telefone: data.telefone ?? null,
      ativo: true,
    })
    .returning();
  if (!t) throw new Error("FALHA");
  return t;
}

export async function deleteTecnico(empresaId: number, id: number) {
  await db
    .update(tecnicos)
    .set({ ativo: false })
    .where(and(eq(tecnicos.empresaId, empresaId), eq(tecnicos.id, id)));
  return { ok: true };
}

export async function listServicos(empresaId: number, status?: string) {
  const conditions = [eq(servicos.empresaId, empresaId)];
  if (status) conditions.push(eq(servicos.status, status));
  const rows = await db
    .select({
      id: servicos.id,
      descricao: servicos.descricao,
      cliente: servicos.cliente,
      clienteTelefone: servicos.clienteTelefone,
      aparelho: servicos.aparelho,
      tecnicoId: servicos.tecnicoId,
      tecnicoNome: tecnicos.nome,
      status: servicos.status,
      valor: servicos.valor,
      custoPecas: servicos.custoPecas,
      criadoEm: servicos.criadoEm,
    })
    .from(servicos)
    .leftJoin(tecnicos, eq(tecnicos.id, servicos.tecnicoId))
    .where(and(...conditions))
    .orderBy(desc(servicos.criadoEm))
    .limit(200);
  return rows.map((r) => ({
    id: r.id,
    descricao: r.descricao,
    cliente: r.cliente,
    clienteTelefone: r.clienteTelefone,
    aparelho: r.aparelho,
    tecnicoId: r.tecnicoId,
    tecnicoNome: r.tecnicoNome,
    status: r.status,
    valor: Number(r.valor),
    custoPecas: Number(r.custoPecas),
    criadoEm: r.criadoEm,
  }));
}

export async function createServico(
  empresaId: number,
  data: {
    descricao: string;
    cliente?: string | null;
    clienteTelefone?: string | null;
    aparelho?: string | null;
    tecnicoId?: number | null;
    valor?: number;
    status?: string;
  },
) {
  const [s] = await db
    .insert(servicos)
    .values({
      empresaId,
      descricao: data.descricao,
      cliente: data.cliente ?? null,
      clienteTelefone: data.clienteTelefone ?? null,
      aparelho: data.aparelho ?? null,
      tecnicoId: data.tecnicoId ?? null,
      status: data.status ?? "aberto",
      valor: String(data.valor ?? 0),
    })
    .returning();
  if (!s) throw new Error("FALHA");
  return s;
}

export async function updateServico(
  empresaId: number,
  id: number,
  data: Partial<{
    status: string;
    valor: number;
    custoPecas: number;
    descricao: string;
    tecnicoId: number | null;
  }>,
) {
  const update: Record<string, unknown> = {};
  if (data.status !== undefined) {
    update["status"] = data.status;
    if (data.status === "concluido" || data.status === "entregue") {
      update["finalizadoEm"] = new Date();
    }
  }
  if (data.valor !== undefined) update["valor"] = String(data.valor);
  if (data.custoPecas !== undefined) update["custoPecas"] = String(data.custoPecas);
  if (data.descricao !== undefined) update["descricao"] = data.descricao;
  if (data.tecnicoId !== undefined) update["tecnicoId"] = data.tecnicoId;
  const [s] = await db
    .update(servicos)
    .set(update)
    .where(and(eq(servicos.empresaId, empresaId), eq(servicos.id, id)))
    .returning();
  return s ?? null;
}

export async function totalServicosAbertos(empresaId: number) {
  const [r] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(servicos)
    .where(
      and(
        eq(servicos.empresaId, empresaId),
        sql`${servicos.status} in ('aberto', 'em_andamento')`,
      ),
    );
  return Number(r?.total ?? 0);
}
