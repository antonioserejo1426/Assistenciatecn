import { Router } from "express";
import { requireAuth, requireSuperAdmin } from "../lib/auth";
import {
  deleteBackup,
  listBackups,
  resolveBackupPath,
  runBackup,
  streamBackup,
} from "../services/backupService";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth, requireSuperAdmin);

router.get("/admin/backups", async (_req, res) => {
  const files = await listBackups();
  res.json(
    files.map((f) => ({
      filename: f.filename,
      size: f.size,
      createdAt: f.createdAt.toISOString(),
    })),
  );
});

router.post("/admin/backups", async (_req, res) => {
  try {
    const f = await runBackup();
    res.json({
      filename: f.filename,
      size: f.size,
      createdAt: f.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "backup manual falhou");
    res.status(500).json({ error: "backup_falhou", message: (err as Error).message });
  }
});

router.get("/admin/backups/:filename/download", (req, res) => {
  const filename = req.params.filename;
  const full = resolveBackupPath(filename);
  if (!full) {
    res.status(400).json({ error: "nome_invalido" });
    return;
  }
  const stream = streamBackup(filename);
  if (!stream) {
    res.status(404).json({ error: "backup_nao_encontrado" });
    return;
  }
  res.setHeader("Content-Type", "application/gzip");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  stream.on("error", (err) => {
    logger.error({ err, filename }, "erro ao transmitir backup");
    if (!res.headersSent) res.status(500).end();
  });
  stream.pipe(res);
});

router.delete("/admin/backups/:filename", async (req, res) => {
  const ok = await deleteBackup(req.params.filename);
  if (!ok) {
    res.status(404).json({ error: "backup_nao_encontrado" });
    return;
  }
  res.json({ ok: true });
});

export default router;
