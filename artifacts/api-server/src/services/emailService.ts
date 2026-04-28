import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "../lib/logger";

let cachedTransporter: Transporter | null = null;
let cachedConfigured: boolean | null = null;

function getTransporter(): Transporter | null {
  if (cachedConfigured === false) return null;
  if (cachedTransporter) return cachedTransporter;

  const host = process.env["SMTP_HOST"];
  const portStr = process.env["SMTP_PORT"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];

  if (!host || !user || !pass) {
    cachedConfigured = false;
    logger.warn(
      "SMTP_HOST/SMTP_USER/SMTP_PASS não configurados — emails serão registrados no log apenas",
    );
    return null;
  }

  const port = portStr ? Number(portStr) : 587;
  const secure = port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  cachedConfigured = true;
  logger.info({ host, port, secure }, "SMTP configurado");
  return cachedTransporter;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ sent: boolean }> {
  const transporter = getTransporter();
  const from =
    process.env["SMTP_FROM"] ||
    process.env["SMTP_USER"] ||
    "TecnoFix <no-reply@tecnofix.local>";

  if (!transporter) {
    logger.info(
      { to: params.to, subject: params.subject, body: params.text },
      "[email não enviado: SMTP não configurado] conteúdo abaixo",
    );
    return { sent: false };
  }

  try {
    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    logger.info({ to: params.to, subject: params.subject }, "email enviado");
    return { sent: true };
  } catch (err) {
    logger.error({ err, to: params.to }, "falha ao enviar email");
    throw err;
  }
}

export function isEmailConfigured(): boolean {
  return getTransporter() !== null;
}
