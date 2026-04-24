import { Router } from "express";
import { requireAuth, requireActiveSubscription, requireFeature } from "../lib/auth";
import * as svc from "../services/tecnicoServicoService";

const router = Router();
router.use(requireAuth, requireActiveSubscription);

router.get("/tecnicos", requireFeature("tecnicos"), async (req, res) => {
  const list = await svc.listTecnicos(req.auth!.empresaId!);
  res.json(list);
});

router.post("/tecnicos", requireFeature("tecnicos"), async (req, res) => {
  const t = await svc.createTecnico(req.auth!.empresaId!, req.body);
  res.json(t);
});

router.delete("/tecnicos/:id", requireFeature("tecnicos"), async (req, res) => {
  await svc.deleteTecnico(req.auth!.empresaId!, Number(req.params.id));
  res.json({ ok: true });
});

router.get("/servicos", requireFeature("servicos"), async (req, res) => {
  const list = await svc.listServicos(req.auth!.empresaId!, req.query["status"] as string | undefined);
  res.json(list);
});

router.post("/servicos", requireFeature("servicos"), async (req, res) => {
  const s = await svc.createServico(req.auth!.empresaId!, req.body);
  res.json(s);
});

router.patch("/servicos/:id", requireFeature("servicos"), async (req, res) => {
  const s = await svc.updateServico(
    req.auth!.empresaId!,
    Number(req.params.id),
    req.body,
  );
  res.json(s);
});

export default router;
