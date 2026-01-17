import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { env } from "@/server/env";
import type { Role } from "@/server/models/_types";

export type AccessTokenClaims = {
  sub: string; // userId
  role: Role;
};

function enc(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(claims: AccessTokenClaims) {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_TTL_SECONDS}s`)
    .sign(enc(env.JWT_ACCESS_SECRET));
}

export async function signRefreshToken(userId: string) {
  const tokenId = crypto.randomUUID();
  // refresh token has a token id, enabling rotation / revocation if needed
  return new SignJWT({ tid: tokenId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_REFRESH_TTL_SECONDS}s`)
    .sign(enc(env.JWT_REFRESH_SECRET));
}

export async function verifyAccessToken(token: string) {
  const res = await jwtVerify(token, enc(env.JWT_ACCESS_SECRET));
  const userId = res.payload.sub;
  const role = (res.payload as { role?: Role }).role;
  if (!userId || typeof userId !== "string" || !role) throw new Error("Invalid token");
  return { userId, role };
}

export async function verifyRefreshToken(token: string) {
  const res = await jwtVerify(token, enc(env.JWT_REFRESH_SECRET));
  const userId = res.payload.sub;
  if (!userId || typeof userId !== "string") throw new Error("Invalid token");
  const tid = (res.payload as { tid?: string }).tid;
  if (!tid) throw new Error("Invalid token");
  return { userId, tokenId: tid };
}

