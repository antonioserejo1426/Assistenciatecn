import { spawn } from "node:child_process";
import { createGzip } from "node:zlib";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { logger } from "../lib/logger";

const BACKUP_DIR = path.resolve(process.cwd(), "backups");
const RETENTION = 14;
const BACKUP_PREFIX = "tecnofix-";
const BACKUP_EXT = ".sql.gz";

export interface BackupFile {
  filename: string;
  size: number;
  createdAt: Date;
}

let runningBackup: Promise<BackupFile> | null = null;

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  );
}

async function ensureDir(): Promise<void> {
  await mkdir(BACKUP_DIR, { recursive: true });
}

function isValidBackupName(name: string): boolean {
  return (
    name.startsWith(BACKUP_PREFIX) &&
    name.endsWith(BACKUP_EXT) &&
    !name.includes("/") &&
    !name.includes("\\") &&
    !name.includes("..")
  );
}

export function resolveBackupPath(filename: string): string | null {
  if (!isValidBackupName(filename)) return null;
  return path.join(BACKUP_DIR, filename);
}

export async function listBackups(): Promise<BackupFile[]> {
  await ensureDir();
  const entries = await readdir(BACKUP_DIR);
  const files: BackupFile[] = [];
  for (const name of entries) {
    if (!isValidBackupName(name)) continue;
    try {
      const st = await stat(path.join(BACKUP_DIR, name));
      if (st.isFile()) {
        files.push({ filename: name, size: st.size, createdAt: st.mtime });
      }
    } catch {
      /* skip */
    }
  }
  files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return files;
}

async function pruneOld(): Promise<number> {
  const files = await listBackups();
  if (files.length <= RETENTION) return 0;
  const toDelete = files.slice(RETENTION);
  let removed = 0;
  for (const f of toDelete) {
    try {
      await unlink(path.join(BACKUP_DIR, f.filename));
      removed += 1;
    } catch (err) {
      logger.warn({ err, file: f.filename }, "falha ao remover backup antigo");
    }
  }
  return removed;
}

function runPgDump(databaseUrl: string, outFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dump = spawn("pg_dump", ["--no-owner", "--no-acl", databaseUrl], {
      env: { ...process.env, PGPASSWORD: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const gzip = createGzip();
    const out = createWriteStream(outFile);

    let stderr = "";
    dump.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    dump.on("error", reject);
    out.on("error", reject);
    gzip.on("error", reject);

    out.on("finish", () => resolve());

    dump.stdout.pipe(gzip).pipe(out);

    dump.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`));
      }
    });
  });
}

export async function runBackup(): Promise<BackupFile> {
  if (runningBackup) return runningBackup;

  runningBackup = (async () => {
    const databaseUrl = process.env["DATABASE_URL"];
    if (!databaseUrl) throw new Error("DATABASE_URL_NAO_CONFIGURADO");
    await ensureDir();
    const filename = `${BACKUP_PREFIX}${timestamp()}${BACKUP_EXT}`;
    const fullPath = path.join(BACKUP_DIR, filename);
    const start = Date.now();
    logger.info({ filename }, "backup iniciado");
    try {
      await runPgDump(databaseUrl, fullPath);
      const st = await stat(fullPath);
      const removed = await pruneOld();
      logger.info(
        { filename, size: st.size, durationMs: Date.now() - start, removidos: removed },
        "backup concluido",
      );
      return { filename, size: st.size, createdAt: st.mtime };
    } catch (err) {
      try {
        await unlink(fullPath);
      } catch {
        /* ignore */
      }
      logger.error({ err, filename }, "backup falhou");
      throw err;
    }
  })();

  try {
    return await runningBackup;
  } finally {
    runningBackup = null;
  }
}

export async function deleteBackup(filename: string): Promise<boolean> {
  const full = resolveBackupPath(filename);
  if (!full) return false;
  try {
    await unlink(full);
    return true;
  } catch {
    return false;
  }
}

export function streamBackup(filename: string): NodeJS.ReadableStream | null {
  const full = resolveBackupPath(filename);
  if (!full) return null;
  return createReadStream(full);
}
