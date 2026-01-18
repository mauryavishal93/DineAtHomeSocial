import { ok, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { getRevenueBreakdown } from "@/server/services/adminService";
// Ensure models are registered
import "@/server/models/User";
import "@/server/models/Payment";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    // All admins have access - permission check removed per requirements

    const url = new URL(req.url);
    const days = Number.parseInt(url.searchParams.get("days") || "30", 10);

    const data = await getRevenueBreakdown(days);
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("Admin revenue error:", msg);
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
    
    return serverError(`Failed to load revenue: ${msg}`);
  }
}
