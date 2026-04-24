import { Router } from "express";
import { requireAuth, requireSuperAdmin } from "../lib/auth";
import * as svc from "../services/assinaturaService";
import { stripe } from "../lib/stripe";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth, requireSuperAdmin);

router.get("/admin/resumo", async (_req, res) => {
  res.json(await svc.adminResumo());
});

router.get("/admin/empresas", async (_req, res) => {
  res.json(await svc.adminListEmpresas());
});

router.post("/admin/empresas/:id/bloqueio", async (req, res) => {
  const bloqueada = !!req.body?.bloqueada;
  await svc.adminBloquear(Number(req.params.id), bloqueada);
  res.json({ ok: true });
});

router.post("/admin/empresas/:id/trial", async (req, res) => {
  const dias = Number(req.body?.dias ?? 7);
  const r = await svc.adminEstenderTrial(Number(req.params.id), dias);
  res.json(r);
});

router.post("/admin/empresas/:id/ativar-assinatura", async (req, res) => {
  const planoId = Number(req.body?.planoId);
  const dias = Number(req.body?.dias ?? 30);
  if (!planoId) return res.status(400).json({ error: "planoId_obrigatorio" });
  const r = await svc.adminAtivarManual(Number(req.params.id), planoId, dias);
  res.json(r);
});

router.post("/admin/usuarios/:id/bloqueio", async (req, res) => {
  const { db, usuarios } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const ativo = req.body?.bloqueada ? false : true;
  await db.update(usuarios).set({ ativo }).where(eq(usuarios.id, Number(req.params.id)));
  res.json({ ok: true });
});

router.get("/admin/empresas/:id/usuarios", async (req, res) => {
  const { db, usuarios } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const lista = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.empresaId, Number(req.params.id)));
  res.json(
    lista.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      role: u.role,
      ativo: u.ativo,
      empresaId: u.empresaId,
      criadoEm: u.criadoEm ? new Date(u.criadoEm).toISOString() : null,
    })),
  );
});

router.patch("/admin/usuarios/:id", async (req, res) => {
  const { db, usuarios } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const { hashPassword, SUPER_ADMIN_EMAIL } = await import("../lib/auth");
  const id = Number(req.params.id);
  const [alvo] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  if (!alvo) return res.status(404).json({ error: "usuario_nao_encontrado" });

  const updates: Record<string, unknown> = {};
  if (typeof req.body?.nome === "string" && req.body.nome.trim()) {
    updates["nome"] = req.body.nome.trim();
  }
  if (typeof req.body?.email === "string" && req.body.email.trim()) {
    const novoEmail = req.body.email.trim().toLowerCase();
    if (novoEmail !== alvo.email) {
      if (alvo.email === SUPER_ADMIN_EMAIL) {
        return res.status(400).json({ error: "nao_pode_alterar_email_do_super_admin" });
      }
      const [existente] = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.email, novoEmail))
        .limit(1);
      if (existente && existente.id !== id) {
        return res.status(409).json({ error: "email_ja_usado" });
      }
      updates["email"] = novoEmail;
    }
  }
  if (typeof req.body?.senha === "string" && req.body.senha.length >= 4) {
    updates["senhaHash"] = await hashPassword(req.body.senha);
  }
  if (typeof req.body?.ativo === "boolean") {
    if (alvo.email === SUPER_ADMIN_EMAIL && req.body.ativo === false) {
      return res.status(400).json({ error: "nao_pode_desativar_super_admin" });
    }
    updates["ativo"] = req.body.ativo;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "nenhum_campo_para_atualizar" });
  }
  await db.update(usuarios).set(updates).where(eq(usuarios.id, id));
  res.json({ ok: true });
});

router.delete("/admin/usuarios/:id", async (req, res) => {
  const { db, usuarios } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const { SUPER_ADMIN_EMAIL } = await import("../lib/auth");
  const id = Number(req.params.id);
  const [alvo] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  if (!alvo) return res.status(404).json({ error: "usuario_nao_encontrado" });
  if (alvo.email === SUPER_ADMIN_EMAIL || alvo.role === "super_admin") {
    return res.status(400).json({ error: "nao_pode_excluir_super_admin" });
  }
  await db.delete(usuarios).where(eq(usuarios.id, id));
  res.json({ ok: true });
});

router.patch("/admin/planos/:id", async (req, res) => {
  const { db, planos } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const id = Number(req.params.id);
  const [alvo] = await db.select().from(planos).where(eq(planos.id, id)).limit(1);
  if (!alvo) return res.status(404).json({ error: "plano_nao_encontrado" });

  const updates: Record<string, unknown> = {};
  let precoMudou = false;
  let nomeMudou = false;
  let descricaoMudou = false;

  if (typeof req.body?.nome === "string" && req.body.nome.trim()) {
    if (req.body.nome.trim() !== alvo.nome) nomeMudou = true;
    updates["nome"] = req.body.nome.trim();
  }
  if (typeof req.body?.descricao === "string" || req.body?.descricao === null) {
    const novaDesc = req.body.descricao ? String(req.body.descricao) : null;
    if (novaDesc !== alvo.descricao) descricaoMudou = true;
    updates["descricao"] = novaDesc;
  }
  if (typeof req.body?.intervalo === "string" && req.body.intervalo.trim()) {
    updates["intervalo"] = req.body.intervalo.trim();
  }
  if (typeof req.body?.ativo === "boolean") {
    updates["ativo"] = req.body.ativo;
  }
  if (Array.isArray(req.body?.recursos)) {
    updates["recursos"] = JSON.stringify(req.body.recursos.map(String));
  }
  if (req.body?.preco !== undefined) {
    const novoPreco = Number(req.body.preco);
    if (Number.isNaN(novoPreco) || novoPreco < 0) {
      return res.status(400).json({ error: "preco_invalido" });
    }
    const novoStr = novoPreco.toFixed(2);
    if (novoStr !== String(alvo.preco)) precoMudou = true;
    updates["preco"] = novoStr;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "nenhum_campo_para_atualizar" });
  }

  if (precoMudou && stripe && alvo.stripeProductId) {
    try {
      const novoStripePrice = await stripe.prices.create({
        product: alvo.stripeProductId,
        unit_amount: Math.round(Number(updates["preco"]) * 100),
        currency: "brl",
        recurring: { interval: "month" },
      });
      if (alvo.stripePriceId) {
        try {
          await stripe.prices.update(alvo.stripePriceId, { active: false });
        } catch (err) {
          logger.warn({ err, oldPriceId: alvo.stripePriceId }, "falha ao desativar price antigo");
        }
      }
      updates["stripePriceId"] = novoStripePrice.id;
      logger.info({ planoId: id, priceId: novoStripePrice.id }, "novo stripe price criado");
    } catch (err) {
      logger.error({ err, planoId: id }, "falha ao atualizar preco no stripe");
    }
  }

  if (stripe && alvo.stripeProductId && (nomeMudou || descricaoMudou)) {
    try {
      await stripe.products.update(alvo.stripeProductId, {
        name: `TecnoFix ${updates["nome"] ?? alvo.nome}`,
        description: (updates["descricao"] as string | null) ?? alvo.descricao ?? undefined,
      });
    } catch (err) {
      logger.warn({ err, planoId: id }, "falha ao atualizar product no stripe");
    }
  }

  await db.update(planos).set(updates).where(eq(planos.id, id));
  const [atual] = await db.select().from(planos).where(eq(planos.id, id)).limit(1);
  if (!atual) return res.status(500).json({ error: "erro_interno" });
  res.json({
    id: atual.id,
    nome: atual.nome,
    descricao: atual.descricao,
    preco: Number(atual.preco),
    intervalo: atual.intervalo,
    stripePriceId: atual.stripePriceId,
    recursos: atual.recursos
      ? (() => {
          try {
            const v = JSON.parse(atual.recursos!);
            return Array.isArray(v) ? v.map(String) : [];
          } catch {
            return [];
          }
        })()
      : [],
  });
});

export default router;
