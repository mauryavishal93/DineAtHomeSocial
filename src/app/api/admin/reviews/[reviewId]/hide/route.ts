import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth, requireAdminPermission } from "@/server/auth/rbac";
import { hideReview } from "@/server/services/adminService";
import "@/server/models/Feedback";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canModerateReviews");

    const { reviewId } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason as string | undefined;

    await hideReview(reviewId, ctx.adminId, ctx.username, reason);
    return ok({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Failed to hide review: ${msg}`);
  }
}
