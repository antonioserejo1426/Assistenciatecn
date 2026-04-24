import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import empresaRouter from "./empresa";
import produtosRouter from "./produtos";
import vendasRouter from "./vendas";
import tecnicosServicosRouter from "./tecnicosServicos";
import scannerRouter from "./scanner";
import assinaturaRouter from "./assinatura";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(empresaRouter);
router.use(produtosRouter);
router.use(vendasRouter);
router.use(tecnicosServicosRouter);
router.use(scannerRouter);
router.use(assinaturaRouter);
router.use(adminRouter);

export default router;
