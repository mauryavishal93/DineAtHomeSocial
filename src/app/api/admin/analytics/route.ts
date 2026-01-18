import { ok, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { getAnalyticsSummary } from "@/server/services/adminService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    // All admins have access - permission check removed per requirements

    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const data = await getAnalyticsSummary(start, end);
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("Admin analytics error:", msg);
    console.error("Error stack:", stack);
    console.error("Full error:", e);
    
    const lowerMsg = msg.toLowerCase();
    
    // Authentication errors
    if (lowerMsg.includes("missing token") || lowerMsg.includes("invalid token") || lowerMsg.includes("invalid")) {
      return unauthorized("Invalid or missing authentication token");
    }
    // Authorization errors
    if (lowerMsg.includes("admin access required")) {
      return unauthorized("Admin access required. Please log in as admin.");
    }
    // Permission errors
    if (lowerMsg.includes("insufficient permissions") || lowerMsg.includes("forbidden")) {
      return forbidden("Insufficient permissions");
    }
    
    // All other errors - return 500 with detailed message
    return serverError(`Failed to load analytics: ${msg}`);
  }
}
