import { z } from "zod";
import { ok, badRequest, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { getHostProfile, upsertHostProfile } from "@/server/services/hostProfileService";

export const runtime = "nodejs";

const putSchema = z.object({
  firstName: z.string().min(1).max(40),
  lastName: z.string().min(1).max(40),
  age: z.coerce.number().int().min(0).max(99),
  interests: z
    .union([z.array(z.string().min(1).max(60)), z.string()])
    .optional()
    .transform((v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  venueName: z.string().min(1).max(120),
  venueAddress: z.string().min(1).max(240),
  cuisines: z
    .union([z.array(z.string().min(1).max(40)), z.string()])
    .transform((v) => {
      if (Array.isArray(v)) return v;
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  activities: z
    .union([z.array(z.string().min(1).max(60)), z.string()])
    .transform((v) => {
      if (Array.isArray(v)) return v;
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["HOST"]);
    const profile = await getHostProfile(ctx.userId);
    return ok(
      profile ?? {
        firstName: "",
        lastName: "",
        age: 0,
        interests: [],
        name: "",
        venueId: null,
        venueName: "",
        venueAddress: "",
        cuisines: [],
        activities: [],
        latitude: null,
        longitude: null
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    return unauthorized();
  }
}

export async function PUT(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["HOST"]);

    const json = await req.json().catch(() => null);
    const parsed = putSchema.safeParse(json);
    if (!parsed.success) return badRequest(parsed.error.message);

    const updated = await upsertHostProfile(ctx.userId, parsed.data);
    return ok(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    if (msg.toLowerCase().includes("missing token")) return unauthorized();
    return serverError(msg);
  }
}

