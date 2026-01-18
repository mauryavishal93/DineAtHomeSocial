import { verifyAccessToken } from "@/server/auth/jwt";
import type { Role } from "@/server/models/_types";
import type { AdminRole } from "@/server/models/Admin";
import { hasPermission } from "@/server/models/Admin";

export type AuthContext = {
  userId: string;
  role: Role;
  adminRole?: AdminRole;
  username?: string;
};

export type AdminAuthContext = {
  adminId: string;
  role: "ADMIN";
  adminRole: AdminRole;
  username: string;
};

export async function requireAuth(req: { headers: Headers }): Promise<AuthContext> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!token) throw new Error("Missing token");
  const verified = await verifyAccessToken(token);
  return verified;
}

export async function requireAdminAuth(req: { headers: Headers }): Promise<AdminAuthContext> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!token) throw new Error("Missing token");
  const verified = await verifyAccessToken(token);
  if (verified.role !== "ADMIN" || !verified.adminRole) {
    throw new Error("Admin access required");
  }
  return {
    adminId: verified.userId,
    role: "ADMIN",
    adminRole: verified.adminRole as AdminRole,
    username: verified.username || ""
  };
}

export function requireRole(ctx: AuthContext, roles: Role[]) {
  if (!roles.includes(ctx.role)) throw new Error("Forbidden");
}

export function requireAdminPermission(
  ctx: AdminAuthContext,
  permission: keyof typeof import("@/server/models/Admin").ADMIN_PERMISSIONS.SUPER_ADMIN
) {
  // SUPER_ADMIN has all permissions
  if (ctx.adminRole === "SUPER_ADMIN") {
    return;
  }
  
  if (!hasPermission(ctx.adminRole, permission)) {
    throw new Error("Insufficient permissions");
  }
}
