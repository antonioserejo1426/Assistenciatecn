import { Router } from "express";
import { requireAuth, requireActiveSubscription } from "../lib/auth";
import * as svc from "../services/vendaService";

const router = Router();
router.use(requireAuth, requireActiveSubscription);

router.get("/vendas", async (req, res) => {
  const list = await svc.listVendas(req.auth!.empresaId!);
  res.json(list);
});

router.post("/vendas", async (req, res) => {
  try {
    const v = await svc.createVenda(req.auth!.empresaId!, req.auth!.userId, req.body);
    res.json(v);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/vendas/:id", async (req, res) => {
  const v = await svc.getVendaDetalhada(req.auth!.empresaId!, Number(req.params.id));
  if (!v) return res.status(404).json({ error: "nao_encontrada" });
  res.json(v);
});

router.get("/dashboard/resumo", async (req, res) => {
  const { totalProdutos } = await import("../services/produtoService");
  const { totalServicosAbertos } = await import("../services/tecnicoServicoService");
  const empresaId = req.auth!.empresaId!;
  const [resumo, prods, servAb] = await Promise.all([
    svc.dashboardResumo(empresaId),
    totalProdutos(empresaId),
    totalServicosAbertos(empresaId),
  ]);
  res.json({
    ...resumo,
    produtosTotal: Number(prods.total),
    estoqueBaixo: Number(prods.baixo),
    servicosAbertos: servAb,
  });
});

router.get("/dashboard/top-produtos", async (req, res) => {
  const list = await svc.topProdutos(req.auth!.empresaId!);
  res.json(list);
});

router.get("/dashboard/vendas-recentes", async (req, res) => {
  const list = await svc.listVendas(req.auth!.empresaId!);
  res.json(list.slice(0, 10));
});

export default router;
