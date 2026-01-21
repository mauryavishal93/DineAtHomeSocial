import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth, requireAdminPermission } from "@/server/auth/rbac";
import { processRefund } from "@/server/services/adminService";
import "@/server/models/Payment";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canProcessRefunds");

    const { paymentId } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason as string | undefined;

    await processRefund(paymentId, ctx.adminId, ctx.username, reason);
    return ok({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Failed to process refund: ${msg}`);
  }
}
