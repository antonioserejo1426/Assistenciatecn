import { Router } from "express";
import { requireAuth, requireActiveSubscription } from "../lib/auth";
import * as svc from "../services/tecnicoServicoService";

const router = Router();
router.use(requireAuth, requireActiveSubscription);

router.get("/tecnicos", async (req, res) => {
  const list = await svc.listTecnicos(req.auth!.empresaId!);
  res.json(list);
});

router.post("/tecnicos", async (req, res) => {
  const t = await svc.createTecnico(req.auth!.empresaId!, req.body);
  res.json(t);
});

router.delete("/tecnicos/:id", async (req, res) => {
  await svc.deleteTecnico(req.auth!.empresaId!, Number(req.params.id));
  res.json({ ok: true });
});

router.get("/servicos", async (req, res) => {
  const list = await svc.listServicos(req.auth!.empresaId!, req.query["status"] as string | undefined);
  res.json(list);
});

router.post("/servicos", async (req, res) => {
  const s = await svc.createServico(req.auth!.empresaId!, req.body);
  res.json({
    id: s.id,
    descricao: s.descricao,
    cliente: s.cliente,
    clienteTelefone: s.clienteTelefone,
    aparelho: s.aparelho,
    tecnicoId: s.tecnicoId,
    tecnicoNome: null,
    status: s.status,
    valor: Number(s.valor),
    custoPecas: Number(s.custoPecas),
    criadoEm: s.criadoEm,
  });
});

router.put("/servicos/:id", async (req, res) => {
  const s = await svc.updateServico(req.auth!.empresaId!, Number(req.params.id), req.body);
  if (!s) return res.status(404).json({ error: "nao_encontrado" });
  res.json({
    id: s.id,
    descricao: s.descricao,
    cliente: s.cliente,
    clienteTelefone: s.clienteTelefone,
    aparelho: s.aparelho,
    tecnicoId: s.tecnicoId,
    tecnicoNome: null,
    status: s.status,
    valor: Number(s.valor),
    custoPecas: Number(s.custoPecas),
    criadoEm: s.criadoEm,
  });
});

export default router;
