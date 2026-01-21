import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth, requireAdminPermission } from "@/server/auth/rbac";
import { getUserDetail } from "@/server/services/adminService";
import "@/server/models/User";
import "@/server/models/HostProfile";
import "@/server/models/GuestProfile";
import "@/server/models/Booking";
import "@/server/models/EventSlot";
import "@/server/models/Feedback";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canViewUserDetails");

    const { userId } = await params;
    const data = await getUserDetail(userId);
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Failed to load user details: ${msg}`);
  }
}
