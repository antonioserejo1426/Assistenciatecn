import { Router } from "express";
import { getSistemaConfig } from "../services/assinaturaService";

const router: Router = Router();

router.get("/sistema/info", async (_req, res) => {
  try {
    const config = await getSistemaConfig();
    res.setHeader("Cache-Control", "no-store");
    res.json({ trialDiasPadrao: config.trialDiasPadrao });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
