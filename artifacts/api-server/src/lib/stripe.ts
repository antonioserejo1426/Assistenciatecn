import Stripe from "stripe";
import { logger } from "./logger";

const key = process.env["STRIPE_SECRET_KEY"];

export const stripe = key
  ? new Stripe(key, { apiVersion: "2026-03-25.dahlia" })
  : null;

export const stripeEnabled = stripe !== null;

if (!stripeEnabled) {
  logger.warn("STRIPE_SECRET_KEY not set — Stripe features disabled");
}

export function getOrigin(req: { protocol: string; get: (h: string) => string | undefined }): string {
  const host = req.get("host");
  const proto = req.get("x-forwarded-proto") || req.protocol;
  return `${proto}://${host}`;
}
