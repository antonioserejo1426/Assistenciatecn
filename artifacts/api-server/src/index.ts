import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { initSocket } from "./lib/socket";
import { ensureSuperAdmin, ensureSeedPlanos, syncStripePlanos } from "./services/empresaService";

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
  });
});
