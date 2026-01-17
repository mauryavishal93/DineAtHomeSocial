import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAuth } from "@/server/auth/rbac";
import { getMe } from "@/server/services/accountService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    const me = await getMe(ctx.userId);
    return ok(me);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg.toLowerCase().includes("missing token")) return unauthorized();
    if (msg.toLowerCase().includes("invalid")) return unauthorized();
    return serverError(msg);
  }
}

