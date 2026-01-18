import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth, requireAdminPermission } from "@/server/auth/rbac";
import { listVenues } from "@/server/services/adminService";
import "@/server/models/Venue";
import "@/server/models/User";
import "@/server/models/HostProfile";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canManageVenues");

    const url = new URL(req.url);
    const hostUserId = url.searchParams.get("hostUserId") || undefined;
    const locality = url.searchParams.get("locality") || undefined;
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10);

    const data = await listVenues({ hostUserId, locality, page, limit });
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Failed to load venues: ${msg}`);
  }
}
