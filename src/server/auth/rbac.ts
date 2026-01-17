import { verifyAccessToken } from "@/server/auth/jwt";
import type { Role } from "@/server/models/_types";

export type AuthContext = {
  userId: string;
  role: Role;
};

export async function requireAuth(req: { headers: Headers }): Promise<AuthContext> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!token) throw new Error("Missing token");
  return verifyAccessToken(token);
}

export function requireRole(ctx: AuthContext, roles: Role[]) {
  if (!roles.includes(ctx.role)) throw new Error("Forbidden");
}

