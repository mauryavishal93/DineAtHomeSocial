import { ok, forbidden, unauthorized, serverError, notFound } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { getAdminEventDetail } from "@/server/services/adminService";
// Ensure models are registered
import "@/server/models/EventSlot";
import "@/server/models/User";
import "@/server/models/HostProfile";
import "@/server/models/Booking";
import "@/server/models/Payment";
import "@/server/models/Venue";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    // All admins have access - permission check removed per requirements

    const { eventId } = await params;
    const data = await getAdminEventDetail(eventId);
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("Admin event detail error:", msg);
    console.error("Error stack:", stack);
    console.error("Full error:", e);

    const lowerMsg = msg.toLowerCase();

    if (lowerMsg.includes("event not found")) {
      return notFound("Event not found");
    }
    if (lowerMsg.includes("missing token") || lowerMsg.includes("invalid token") || lowerMsg.includes("invalid")) {
      return unauthorized("Invalid or missing authentication token");
    }
    if (lowerMsg.includes("admin access required")) {
      return unauthorized("Admin access required. Please log in as admin.");
    }
    if (lowerMsg.includes("insufficient permissions") || lowerMsg.includes("forbidden")) {
      return forbidden("Insufficient permissions");
    }

    return serverError(`Failed to load event details: ${msg}`);
  }
}
