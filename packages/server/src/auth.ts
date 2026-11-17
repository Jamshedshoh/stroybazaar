import { prisma, type Language, type UserRole } from "@stroybazaar/db";
import type { RequestHandler } from "express";
import { SignJWT, jwtVerify } from "jose";
import { unauthorized } from "./errors";

export interface AuthUser {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  language: Language;
  supplierId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const DEV_SECRET = "dev-only-insecure-jwt-secret-change-me";

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  return new TextEncoder().encode(secret ?? DEV_SECRET);
}

export async function signAccessToken(userId: string) {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
  return { token, expiresAt };
}

/**
 * Resolves `Authorization: Bearer <JWT>` into `req.user`. Requests without the header pass
 * through anonymously; routes enforce access themselves. The user is re-read on every request
 * so role and supplier changes take effect immediately.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.header("authorization");
  if (!header) return next();

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) throw unauthorized();

  let userId: string | undefined;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    userId = payload.sub;
  } catch {
    throw unauthorized();
  }
  if (!userId) throw unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, name: true, role: true, language: true, supplierId: true },
  });
  if (!user) throw unauthorized();

  req.user = user;
  next();
};
