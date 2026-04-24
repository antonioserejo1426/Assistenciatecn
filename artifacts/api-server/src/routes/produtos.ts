import { Router } from "express";
import { requireAuth, requireActiveSubscription } from "../lib/auth";
import * as svc from "../services/produtoService";

const router = Router();
router.use(requireAuth, requireActiveSubscription);

function mapProduto(p: {
  id: number;
  nome: string;
  codigoBarras: string | null;
  preco: string;
  custo: string;
  estoque: number;
  descricao: string | null;
  imagemUrl: string | null;
}) {
  return {
    id: p.id,
    nome: p.nome,
    codigoBarras: p.codigoBarras,
    preco: Number(p.preco),
    custo: Number(p.custo),
    estoque: p.estoque,
    descricao: p.descricao,
    imagemUrl: p.imagemUrl,
  };
}

router.get("/produtos", async (req, res) => {
  const list = await svc.listProdutos(req.auth!.empresaId!, req.query["q"] as string | undefined);
  res.json(list.map(mapProduto));
});

router.post("/produtos", async (req, res) => {
  try {
    const p = await svc.createProduto(req.auth!.empresaId!, req.body);
    res.json(mapProduto(p));
  } catch (e) {
    const msg = (e as Error).message;
    res.status(400).json({ error: msg });
  }
});

router.get("/produtos/codigo/:codigo", async (req, res) => {
  const p = await svc.getProdutoByCodigo(req.auth!.empresaId!, req.params.codigo);
  if (!p) return res.status(404).json({ error: "nao_encontrado" });
  res.json(mapProduto(p));
});

router.get("/produtos/:id", async (req, res) => {
  const p = await svc.getProduto(req.auth!.empresaId!, Number(req.params.id));
  if (!p) return res.status(404).json({ error: "nao_encontrado" });
  res.json(mapProduto(p));
});

router.put("/produtos/:id", async (req, res) => {
  const p = await svc.updateProduto(req.auth!.empresaId!, Number(req.params.id), req.body);
  if (!p) return res.status(404).json({ error: "nao_encontrado" });
  res.json(mapProduto(p));
});

router.delete("/produtos/:id", async (req, res) => {
  await svc.deleteProduto(req.auth!.empresaId!, Number(req.params.id));
  res.json({ ok: true });
});

router.get("/estoque/movimentacoes", async (req, res) => {
  const list = await svc.listMovimentacoes(req.auth!.empresaId!);
  res.json(list);
});

router.post("/estoque/movimentacoes", async (req, res) => {
  try {
    const m = await svc.createMovimentacao(req.auth!.empresaId!, req.body);
    res.json(m);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
