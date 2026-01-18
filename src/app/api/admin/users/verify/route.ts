import { ok, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { verifyUser } from "@/server/services/adminService";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    // All admins have access - permission check removed per requirements

    const body = await req.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return serverError("Missing userId");
    }

    await verifyUser(userId, ctx.adminId);
    return ok({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("Admin verify user error:", msg);
    console.error("Error stack:", stack);
    console.error("Full error:", e);
    
    const lowerMsg = msg.toLowerCase();
    
    if (lowerMsg.includes("missing token") || lowerMsg.includes("invalid token") || lowerMsg.includes("invalid")) {
      return unauthorized("Invalid or missing authentication token");
    }
    if (lowerMsg.includes("admin access required")) {
      return unauthorized("Admin access required. Please log in as admin.");
    }
    if (lowerMsg.includes("insufficient permissions") || lowerMsg.includes("forbidden")) {
      return forbidden("Insufficient permissions");
    }
    
    return serverError(`Failed to verify user: ${msg}`);
  }
}
