import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth, requireAdminPermission } from "@/server/auth/rbac";
import { approveEvent } from "@/server/services/adminService";
import "@/server/models/EventSlot";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canApproveEvents");

    const { eventId } = await params;
    await approveEvent(eventId, ctx.adminId, ctx.username);
    return ok({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Failed to approve event: ${msg}`);
  }
}
