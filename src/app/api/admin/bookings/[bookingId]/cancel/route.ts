import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth, requireAdminPermission } from "@/server/auth/rbac";
import { cancelBooking } from "@/server/services/adminService";
import "@/server/models/Booking";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canCancelBookings");

    const { bookingId } = await params;
    await cancelBooking(bookingId, ctx.adminId, ctx.username);
    return ok({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Failed to cancel booking: ${msg}`);
  }
}
