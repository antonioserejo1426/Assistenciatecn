import crypto from "crypto";

interface SessaoEntry {
  empresaId: number;
  criadoEm: number;
}

const sessoes = new Map<string, SessaoEntry>();
const TTL_MS = 15 * 60 * 1000;

function gc() {
  const now = Date.now();
  for (const [k, v] of sessoes.entries()) {
    if (now - v.criadoEm > TTL_MS) sessoes.delete(k);
  }
}

export function criarSessao(empresaId: number, baseUrl: string): { sessaoId: string; qrUrl: string } {
  gc();
  const sessaoId = crypto.randomBytes(24).toString("hex");
  sessoes.set(sessaoId, { empresaId, criadoEm: Date.now() });
  const qrUrl = `${baseUrl}/scan/${sessaoId}`;
  return { sessaoId, qrUrl };
}

export function getSessao(sessaoId: string): SessaoEntry | null {
  gc();
  return sessoes.get(sessaoId) ?? null;
}
