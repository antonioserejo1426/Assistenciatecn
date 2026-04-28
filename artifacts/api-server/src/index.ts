import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { initSocket } from "./lib/socket";
import { ensureSuperAdmin, ensureSeedPlanos, syncStripePlanos } from "./services/empresaService";
import { ensurePlanoFeatures } from "./services/featureService";
import { runBackup } from "./services/backupService";
import { scheduleDaily } from "./lib/scheduler";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function bootstrap(): Promise<void> {
  try {
    await ensureSuperAdmin();
    await ensureSeedPlanos();
    await ensurePlanoFeatures();
    void syncStripePlanos().catch((err) => logger.error({ err }, "syncStripePlanos failed"));
  } catch (err) {
    logger.error({ err }, "bootstrap seed failed");
  }
}

const httpServer = http.createServer(app);
initSocket(httpServer);

void bootstrap().then(() => {
  httpServer.listen(port, () => {
    logger.info({ port }, "TecnoFix API + WS listening");
    scheduleDaily({
      name: "backup-postgres",
      hourUtc: 3,
      minuteUtc: 0,
      run: () => runBackup(),
    });
  });
});
