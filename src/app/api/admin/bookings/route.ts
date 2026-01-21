import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth, requireAdminPermission } from "@/server/auth/rbac";
import { listBookings } from "@/server/services/adminService";
import "@/server/models/Booking";
import "@/server/models/EventSlot";
import "@/server/models/User";
import "@/server/models/HostProfile";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canManageBookings");

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const eventId = url.searchParams.get("eventId") || undefined;
    const hostUserId = url.searchParams.get("hostUserId") || undefined;
    const guestUserId = url.searchParams.get("guestUserId") || undefined;
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10);

    const data = await listBookings({ status, eventId, hostUserId, guestUserId, page, limit });
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Insufficient permissions")) {
      return serverError("You don't have permission to view bookings");
    }
    return serverError(`Failed to load bookings: ${msg}`);
  }
}
