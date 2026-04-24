import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { db, usuarios, empresas, assinaturas } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env["JWT_SECRET"] || process.env["SESSION_SECRET"] || "dev-fallback";
export const SUPER_ADMIN_EMAIL = "antonioserejo1426@gmail.com";

export interface AuthContext {
  userId: number;
  empresaId: number | null;
  role: string;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

export async function hashPassword(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verifyPassword(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export function signToken(payload: AuthContext): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthContext | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthContext;
    return decoded;
  } catch {
    return null;
  }
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ error: "missing_token" });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "invalid_token" });
  }
  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, payload.userId)).limit(1);
  if (!user || !user.ativo) {
    return res.status(401).json({ error: "user_inactive" });
  }
  req.auth = { userId: user.id, empresaId: user.empresaId, role: user.role };
  next();
}

export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.auth) return res.status(401).json({ error: "no_auth" });
  if (req.auth.role === "super_admin") return next();
  if (!req.auth.empresaId) return res.status(403).json({ error: "no_empresa" });

  const [empresa] = await db
    .select()
    .from(empresas)
    .where(eq(empresas.id, req.auth.empresaId))
    .limit(1);

  if (!empresa) return res.status(403).json({ error: "empresa_not_found" });
  if (empresa.bloqueada || !empresa.ativa) {
    return res.status(403).json({ error: "empresa_bloqueada" });
  }

  const [assinatura] = await db
    .select()
    .from(assinaturas)
    .where(eq(assinaturas.empresaId, empresa.id))
    .limit(1);

  if (!assinatura) return res.status(403).json({ error: "sem_assinatura" });

  const now = new Date();
  if (assinatura.status === "trial") {
    if (empresa.trialFim && empresa.trialFim < now) {
      await db
        .update(assinaturas)
        .set({ status: "cancelada" })
        .where(eq(assinaturas.id, assinatura.id));
      return res.status(402).json({ error: "trial_expirado" });
    }
    return next();
  }
  if (assinatura.status === "ativa") return next();

  return res.status(402).json({ error: "assinatura_inativa", status: assinatura.status });
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: "no_auth" });
  if (req.auth.role !== "super_admin") {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}
