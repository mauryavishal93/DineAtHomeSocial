import { z } from "zod";
import { ok, badRequest, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { HostProfile } from "@/server/models/HostProfile";
import { Venue } from "@/server/models/Venue";
import { EventSlot } from "@/server/models/EventSlot";

export const runtime = "nodejs";

const csvToList = z
  .union([z.array(z.string()), z.string()])
  .transform((v) => {
    if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  });

const schema = z.object({
  eventName: z.string().min(1).max(120),
  startAt: z.string().min(1), // datetime-local or ISO
  durationHours: z.coerce.number().int().min(1).max(24),
  maxGuests: z.coerce.number().int().min(1).max(200),
  basePricePerGuest: z.coerce.number().int().min(0),
  foodType: z.string().max(120).optional().default(""),
  cuisines: csvToList.optional().default([]),
  activities: csvToList.optional().default([]),
  tags: csvToList.optional().default([]),
  optionVeg: z.coerce.boolean().optional().default(true),
  optionNonVeg: z.coerce.boolean().optional().default(false),
  optionAlcohol: z.coerce.boolean().optional().default(false),
  optionNonAlcohol: z.coerce.boolean().optional().default(true)
});

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["HOST"]);

    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) return badRequest(parsed.error.message);

    await connectMongo();

    const hostProfile = await HostProfile.findOne({ userId: ctx.userId }).lean();
    const venueId = (hostProfile as any)?.venueId;
    const venue = venueId
      ? await Venue.findById(venueId).lean()
      : await Venue.findOne({ hostUserId: ctx.userId }).lean();
    if (!venue) return badRequest("Missing venue. Please complete host setup first.");

    const start = new Date(parsed.data.startAt);
    if (Number.isNaN(start.getTime())) return badRequest("Invalid start date");
    const end = new Date(start.getTime() + parsed.data.durationHours * 60 * 60 * 1000);

    const tags = [
      ...(parsed.data.tags ?? []),
      parsed.data.optionVeg ? "VEG" : null,
      parsed.data.optionNonVeg ? "NON_VEG" : null,
      parsed.data.optionAlcohol ? "ALCOHOL" : null,
      parsed.data.optionNonAlcohol ? "NON_ALCOHOL" : null
    ].filter(Boolean) as string[];

    const cuisines =
      parsed.data.cuisines.length > 0 ? parsed.data.cuisines : (venue as any).foodCategories ?? [];
    const activities =
      parsed.data.activities.length > 0
        ? parsed.data.activities
        : (venue as any).gamesAvailable ?? [];

    const slot = await EventSlot.create({
      hostUserId: ctx.userId,
      venueId: (venue as any)._id,
      eventName: parsed.data.eventName,
      startAt: start,
      endAt: end,
      maxGuests: parsed.data.maxGuests,
      seatsRemaining: parsed.data.maxGuests,
      basePricePerGuest: parsed.data.basePricePerGuest,
      foodType: parsed.data.foodType ?? "",
      cuisines,
      foodTags: tags,
      gamesAvailable: activities,
      status: "OPEN"
    });

    return ok({ eventSlotId: String(slot._id) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    if (msg.toLowerCase().includes("missing token") || msg.toLowerCase().includes("invalid"))
      return unauthorized();
    return serverError(msg);
  }
}

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["HOST"]);

    const data = await (await import("@/server/services/eventService")).listHostEventsWithBookings(
      ctx.userId
    );
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    if (msg.toLowerCase().includes("missing token") || msg.toLowerCase().includes("invalid"))
      return unauthorized();
    return serverError(msg);
  }
}

