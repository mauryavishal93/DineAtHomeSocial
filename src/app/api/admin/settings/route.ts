import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth, requireAdminPermission } from "@/server/auth/rbac";
import { getPlatformSettings, updatePlatformSettings } from "@/server/services/adminService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canManageSettings");

    const settings = await getPlatformSettings();
    return ok(settings);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Failed to load settings: ${msg}`);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    requireAdminPermission(ctx, "canManageSettings");

    const body = await req.json();
    const settings = await updatePlatformSettings(body, ctx.adminId, ctx.username);
    return ok(settings);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Failed to update settings: ${msg}`);
  }
}
