import { db, planos, assinaturas, empresas } from "@workspace/db";
import { eq } from "drizzle-orm";

export type FeatureCode =
  | "tecnicos"
  | "servicos"
  | "lucratividade"
  | "filiais"
  | "relatorios_avancados";

export const ALL_FEATURES: FeatureCode[] = [
  "tecnicos",
  "servicos",
  "lucratividade",
  "filiais",
  "relatorios_avancados",
];

export const PLANO_FEATURES: Record<string, FeatureCode[]> = {
  Starter: [],
  Profissional: ["tecnicos", "servicos", "lucratividade"],
  Premium: ["tecnicos", "servicos", "lucratividade", "filiais", "relatorios_avancados"],
};

function safeParse(json: string | null | undefined): FeatureCode[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as FeatureCode[]) : [];
  } catch {
    return [];
  }
}

export async function ensurePlanoFeatures(): Promise<void> {
  const lista = await db.select().from(planos);
  for (const p of lista) {
    const expected = PLANO_FEATURES[p.nome];
    if (!expected) continue;
    const current = safeParse(p.features);
    const same =
      current.length === expected.length &&
      expected.every((f) => current.includes(f));
    if (p.features && same) continue;
    await db
      .update(planos)
      .set({ features: JSON.stringify(expected) })
      .where(eq(planos.id, p.id));
  }
}

export async function getEmpresaFeatures(
  empresaId: number | null,
  role: string,
): Promise<FeatureCode[]> {
  if (role === "super_admin") return ALL_FEATURES;
  if (!empresaId) return [];

  const [empresa] = await db
    .select()
    .from(empresas)
    .where(eq(empresas.id, empresaId))
    .limit(1);
  if (!empresa) return [];

  const [assinatura] = await db
    .select()
    .from(assinaturas)
    .where(eq(assinaturas.empresaId, empresaId))
    .limit(1);
  if (!assinatura) return [];

  if (assinatura.status === "trial") {
    const trialAtivo = empresa.trialFim ? empresa.trialFim > new Date() : false;
    return trialAtivo ? ALL_FEATURES : [];
  }

  if (assinatura.status !== "ativa") return [];

  if (!assinatura.planoId) return [];
  const [plano] = await db
    .select()
    .from(planos)
    .where(eq(planos.id, assinatura.planoId))
    .limit(1);
  if (!plano) return [];
  return safeParse(plano.features);
}
