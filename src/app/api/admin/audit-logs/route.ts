import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth, requireAdminPermission } from "@/server/auth/rbac";
import { listAuditLogs } from "@/server/services/adminService";
import "@/server/models/AdminAction";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canViewAuditLogs");

    const url = new URL(req.url);
    const adminUserId = url.searchParams.get("adminUserId") || undefined;
    const actionType = url.searchParams.get("actionType") || undefined;
    const targetType = url.searchParams.get("targetType") || undefined;
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10);

    const data = await listAuditLogs({ adminUserId, actionType, targetType, page, limit });
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Failed to load audit logs: ${msg}`);
  }
}
