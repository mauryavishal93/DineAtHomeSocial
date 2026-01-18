import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAuth } from "@/server/auth/rbac";
import { getMe } from "@/server/services/accountService";
import { getAdminById } from "@/server/services/adminAuthService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    
    // If admin token, return admin info
    if (ctx.role === "ADMIN" && ctx.adminRole) {
      const admin = await getAdminById(ctx.userId);
      if (!admin) {
        return unauthorized("Admin not found");
      }
      // Return in format expected by UserNav
      return ok({
        userId: admin.id,
        email: admin.email,
        role: "ADMIN" as const,
        displayName: admin.fullName
      });
    }
    
    // Regular user
    const me = await getMe(ctx.userId);
    return ok(me);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("/api/me error:", msg);
    console.error("Error stack:", stack);
    
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes("missing token") || lowerMsg.includes("invalid")) {
      return unauthorized("Invalid or missing authentication token");
    }
    return serverError(`Failed to get user info: ${msg}`);
  }
}

