import { randomBytes, createHash } from "crypto";
import { db, usuarios } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import { sendEmail } from "./emailService";
import { logger } from "../lib/logger";

const RESET_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildResetUrl(token: string): string {
  const base = process.env["APP_URL"] || process.env["PUBLIC_URL"] || "";
  const cleanBase = base.replace(/\/$/, "");
  return `${cleanBase}/redefinir-senha?token=${encodeURIComponent(token)}`;
}

export async function requestPasswordReset(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  if (!email) return;

  const [user] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email))
    .limit(1);

  if (!user || !user.ativo) {
    logger.info({ email }, "reset solicitado para email inexistente/inativo (silencioso)");
    return;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await db
    .update(usuarios)
    .set({
      senhaResetTokenHash: tokenHash,
      senhaResetExpiraEm: expiresAt,
    })
    .where(eq(usuarios.id, user.id));

  const resetUrl = buildResetUrl(token);

  const text = [
    `Olá ${user.nome},`,
    "",
    "Recebemos um pedido para redefinir a senha da sua conta TecnoFix.",
    "",
    "Use o link abaixo para criar uma nova senha (válido por 30 minutos):",
    resetUrl,
    "",
    "Se você não pediu isso, pode ignorar este email — sua senha continua a mesma.",
    "",
    "— Equipe TecnoFix",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #c2410c;">Redefinir sua senha</h2>
      <p>Olá <strong>${escapeHtml(user.nome)}</strong>,</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta TecnoFix.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background:#c2410c;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;">
          Criar nova senha
        </a>
      </p>
      <p style="font-size: 13px; color:#555;">O link é válido por 30 minutos. Se você não pediu, pode ignorar — sua senha continua a mesma.</p>
      <p style="font-size: 12px; color:#888; word-break: break-all;">
        Ou copie e cole no navegador:<br>${resetUrl}
      </p>
      <p style="font-size: 12px; color:#888; margin-top: 24px;">— Equipe TecnoFix</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: "Redefinir senha — TecnoFix",
    text,
    html,
  });
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; reason: "token_invalido" | "token_expirado" | "senha_curta" }> {
  if (!token || typeof token !== "string") return { ok: false, reason: "token_invalido" };
  if (!newPassword || newPassword.length < 6) return { ok: false, reason: "senha_curta" };

  const tokenHash = hashToken(token);

  const [user] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.senhaResetTokenHash, tokenHash))
    .limit(1);

  if (!user) return { ok: false, reason: "token_invalido" };
  if (!user.senhaResetExpiraEm || user.senhaResetExpiraEm.getTime() < Date.now()) {
    return { ok: false, reason: "token_expirado" };
  }

  const senhaHash = await hashPassword(newPassword);
  await db
    .update(usuarios)
    .set({
      senhaHash,
      senhaResetTokenHash: null,
      senhaResetExpiraEm: null,
    })
    .where(eq(usuarios.id, user.id));

  logger.info({ userId: user.id }, "senha redefinida com sucesso");
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
