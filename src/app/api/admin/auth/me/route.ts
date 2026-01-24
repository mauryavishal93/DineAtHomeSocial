import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { getAdminById } from "@/server/services/adminAuthService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    const admin = await getAdminById(ctx.adminId);
    if (!admin) {
      console.error("Admin not found for ID:", ctx.adminId);
      return unauthorized("Admin not found");
    }
    return ok(admin);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const lowerMsg = msg.toLowerCase();
    
    // Only log unexpected errors, not standard auth failures
    if (!lowerMsg.includes("missing token") && 
        !lowerMsg.includes("invalid token") && 
        !lowerMsg.includes("admin access required") &&
        !lowerMsg.includes("invalid")) {
      console.error("Admin auth/me error:", msg);
    }
    
    if (lowerMsg.includes("missing token") || lowerMsg.includes("invalid token") || lowerMsg.includes("invalid")) {
      return unauthorized("Invalid or missing authentication token");
    }
    if (lowerMsg.includes("admin access required")) {
      return unauthorized("Admin access required");
    }
    
    return unauthorized(msg || "Unauthorized");
  }
}
