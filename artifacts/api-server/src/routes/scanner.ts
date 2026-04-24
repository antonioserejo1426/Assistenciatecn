import { Router } from "express";
import { requireAuth, requireActiveSubscription } from "../lib/auth";
import { criarSessao, getSessao } from "../services/scannerService";
import { getProdutoByCodigo } from "../services/produtoService";

const router = Router();

router.post("/scanner/sessao", requireAuth, requireActiveSubscription, (req, res) => {
  const empresaId = req.auth!.empresaId!;
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = req.get("host");
  const baseUrl = `${proto}://${host}`;
  const result = criarSessao(empresaId, baseUrl);
  res.json(result);
});

router.get("/scanner/sessao/:id", async (req, res) => {
  const sessao = getSessao(req.params.id);
  if (!sessao) return res.status(404).json({ error: "sessao_invalida" });
  res.json({ sessaoId: req.params.id, empresaId: sessao.empresaId, valida: true });
});

router.get("/scanner/sessao/:id/produto/:codigo", async (req, res) => {
  const sessao = getSessao(req.params.id);
  if (!sessao) return res.status(404).json({ error: "sessao_invalida" });
  const p = await getProdutoByCodigo(sessao.empresaId, req.params.codigo);
  if (!p) return res.status(404).json({ error: "nao_encontrado" });
  res.json({
    id: p.id,
    nome: p.nome,
    codigoBarras: p.codigoBarras,
    preco: Number(p.preco),
    custo: Number(p.custo),
    estoque: p.estoque,
  });
});

router.post("/scanner/sessao/:id/produto", async (req, res) => {
  const sessao = getSessao(req.params.id);
  if (!sessao) return res.status(404).json({ error: "sessao_invalida" });
  const { createProduto } = await import("../services/produtoService");
  try {
    const p = await createProduto(sessao.empresaId, req.body);
    res.json({
      id: p.id,
      nome: p.nome,
      codigoBarras: p.codigoBarras,
      preco: Number(p.preco),
      custo: Number(p.custo),
      estoque: p.estoque,
    });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
