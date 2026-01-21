import { z } from "zod";
import { ok, badRequest, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { getGuestProfile, upsertGuestProfile } from "@/server/services/guestProfileService";

export const runtime = "nodejs";

const putSchema = z.object({
  name: z.string().min(1).max(80),
  age: z.coerce.number().int().min(0).max(99),
  gender: z.enum(["Male", "Female", "Other"]),
  bio: z.string().max(1000).optional(),
  interests: z
    .union([z.array(z.string().min(1).max(40)), z.string()])
    .transform((v) => {
      if (Array.isArray(v)) return v;
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    })
});

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["GUEST"]);
    const profile = await getGuestProfile(ctx.userId);
    return ok(profile ?? { name: "", age: 0, gender: "", bio: "", interests: [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    return unauthorized();
  }
}

export async function PUT(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["GUEST"]);

    const json = await req.json().catch(() => null);
    const parsed = putSchema.safeParse(json);
    if (!parsed.success) return badRequest(parsed.error.message);

    const updated = await upsertGuestProfile(ctx.userId, parsed.data);
    return ok(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    if (msg.toLowerCase().includes("missing token")) return unauthorized();
    return serverError(msg);
  }
}

