import { ok, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { listUsers, updateUserStatus } from "@/server/services/adminService";
import type { AccountStatus, Role } from "@/server/models/_types";
// Ensure models are registered
import "@/server/models/User";
import "@/server/models/HostProfile";
import "@/server/models/GuestProfile";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    // All admins have access - permission check removed per requirements

    const url = new URL(req.url);
    const roleParam = url.searchParams.get("role");
    const statusParam = url.searchParams.get("status");
    const search = url.searchParams.get("search") || undefined;
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10);

    const role = roleParam ? (roleParam as Role) : undefined;
    const status = statusParam ? (statusParam as AccountStatus) : undefined;

    const data = await listUsers({ role, status, search, page, limit });
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("Admin users GET error:", msg);
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
    
    return serverError(`Failed to load users: ${msg}`);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    // All admins have access - permission check removed per requirements

    const body = await req.json();
    const { userId, status } = body as { userId: string; status: AccountStatus };

    if (!userId || !status) {
      return serverError("Missing userId or status");
    }

    await updateUserStatus(userId, status, ctx.adminId, ctx.username);
    return ok({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("Admin users PATCH error:", msg);
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
    
    return serverError(`Failed to update user: ${msg}`);
  }
}
