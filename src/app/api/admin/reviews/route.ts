import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth, requireAdminPermission } from "@/server/auth/rbac";
import { listReviews } from "@/server/services/adminService";
import "@/server/models/Feedback";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canModerateReviews");

    const url = new URL(req.url);
    const feedbackType = url.searchParams.get("feedbackType") || undefined;
    const toUserId = url.searchParams.get("toUserId") || undefined;
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10);

    const data = await listReviews({ feedbackType, toUserId, page, limit });
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Failed to load reviews: ${msg}`);
  }
}
