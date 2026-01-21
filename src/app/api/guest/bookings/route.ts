import { z } from "zod";
import { created, badRequest, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { createBooking } from "@/server/services/bookingService";

export const runtime = "nodejs";

const additionalGuestSchema = z.object({
  name: z.string().min(1).max(100),
  mobile: z.string()
    .regex(/^[+]?[1-9]\d{1,14}$/, "Invalid mobile number format")
    .min(10)
    .max(15),
  age: z.coerce.number().int().min(18).max(100),
  gender: z.enum(["Male", "Female", "Other"])
});

const schema = z.object({
  eventSlotId: z.string().min(1),
  seats: z.coerce.number().int().min(1).max(3),
  guestName: z.string().min(1).max(100),
  guestMobile: z.string()
    .regex(/^[+]?[1-9]\d{1,14}$/, "Invalid mobile number format")
    .min(10)
    .max(15),
  guestAge: z.coerce.number().int().min(18).max(100),
  guestGender: z.enum(["Male", "Female", "Other"]),
  additionalGuests: z.array(additionalGuestSchema).default([])
}).refine((data) => {
  // If seats > 1, must have (seats - 1) additional guests
  if (data.seats > 1) {
    return data.additionalGuests.length === data.seats - 1;
  }
  return true;
}, {
  message: "Must provide details for all additional guests",
  path: ["additionalGuests"]
}).refine((data) => {
  // Check for duplicate mobiles in additional guests
  if (data.additionalGuests && data.additionalGuests.length > 0) {
    const mobiles = data.additionalGuests.map(g => g.mobile.toLowerCase().trim());
    const uniqueMobiles = new Set(mobiles);
    if (mobiles.length !== uniqueMobiles.size) {
      return false;
    }
    
    // Check if primary guest mobile matches any additional guest
    if (mobiles.includes(data.guestMobile.toLowerCase().trim())) {
      return false;
    }
  }
  return true;
}, {
  message: "Duplicate guests not allowed. Each guest must have a unique mobile number.",
  path: ["additionalGuests"]
});

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["GUEST"]);

    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) return badRequest(parsed.error.message);

    const result = await createBooking({
      guestUserId: ctx.userId,
      eventSlotId: parsed.data.eventSlotId,
      seats: parsed.data.seats,
      guestName: parsed.data.guestName,
      guestMobile: parsed.data.guestMobile,
      guestAge: parsed.data.guestAge,
      guestGender: parsed.data.guestGender,
      additionalGuests: parsed.data.additionalGuests || []
    });

    return created(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create booking";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    if (msg.toLowerCase().includes("not found")) return badRequest(msg);
    if (msg.toLowerCase().includes("not available")) return badRequest(msg);
    if (msg.toLowerCase().includes("not enough")) return badRequest(msg);
    if (msg.toLowerCase().includes("missing token")) return unauthorized();
    return serverError(msg);
  }
}
