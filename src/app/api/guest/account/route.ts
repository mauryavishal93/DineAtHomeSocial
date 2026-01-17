import { ok, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { getGuestAccountOverview } from "@/server/services/accountService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["GUEST"]);
    const data = await getGuestAccountOverview(ctx.userId);
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    if (msg.toLowerCase().includes("missing token")) return unauthorized();
    if (msg.toLowerCase().includes("invalid")) return unauthorized();
    return serverError(msg);
  }
}

