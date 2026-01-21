import { z } from "zod";
import { ok, badRequest, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Booking } from "@/server/models/Booking";
import { EventSlot } from "@/server/models/EventSlot";
import { Payment } from "@/server/models/Payment";
import { GuestProfile } from "@/server/models/GuestProfile";

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
  seats: z.coerce.number().int().min(1).max(2),
  additionalGuests: z.array(additionalGuestSchema).min(1)
}).refine((data) => {
  return data.additionalGuests.length === data.seats;
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
  }
  return true;
}, {
  message: "Duplicate guests not allowed. Each guest must have a unique mobile number.",
  path: ["additionalGuests"]
});

export async function POST(
  req: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["GUEST"]);
    
    const { bookingId } = await context.params;
    await connectMongo();
    
    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) return badRequest(parsed.error.message);
    
    // Get existing booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return badRequest("Booking not found");
    }
    
    const bookingDoc = booking as any;
    
    // Verify ownership
    if (String(bookingDoc.guestUserId) !== String(ctx.userId)) {
      return forbidden("You can only add guests to your own bookings");
    }
    
    // Check if booking is confirmed
    if (bookingDoc.status !== "CONFIRMED" && bookingDoc.status !== "PAYMENT_PENDING") {
      return badRequest("Can only add guests to confirmed bookings");
    }
    
    // Get event to check availability
    const event = await EventSlot.findById(bookingDoc.eventSlotId);
    if (!event) {
      return badRequest("Event not found");
    }
    
    const eventDoc = event as any;
    
    // Check max seats per user (2 total)
    const totalSeatsAfter = bookingDoc.seats + parsed.data.seats;
    if (totalSeatsAfter > 2) {
      return badRequest("Maximum 2 seats per booking (including existing)");
    }
    
    // Calculate additional cost
    const guestProfile = await GuestProfile.findOne({ userId: ctx.userId });
    const guestType = guestProfile?.guestType ?? "BASIC";
    const priceByType = eventDoc.priceByGuestType?.[guestType];
    const pricePerSeat = priceByType ?? eventDoc.basePricePerGuest ?? 0;
    
    if (pricePerSeat < 0) {
      return badRequest("Price cannot be negative");
    }
    
    const additionalAmount = pricePerSeat * parsed.data.seats;

    // Check if enough seats available
    if (eventDoc.seatsRemaining < parsed.data.seats) {
      return badRequest("Not enough seats available");
    }

    // Calculate new seats remaining
    const newSeatsRemaining = eventDoc.seatsRemaining - parsed.data.seats;
    const newStatus = newSeatsRemaining <= 0 ? "FULL" : "OPEN";

    // Atomic check and update event seats
    const updatedEvent = await EventSlot.findOneAndUpdate(
      {
        _id: bookingDoc.eventSlotId,
        seatsRemaining: { $gte: parsed.data.seats },
        status: "OPEN"
      },
      {
        $inc: { seatsRemaining: -parsed.data.seats },
        $set: { status: newStatus }
      },
      { 
        new: true 
      }
    );
    
    if (!updatedEvent) {
      return badRequest("Not enough seats available or event is not open");
    }
    
    try {
      // Update booking atomically
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          $inc: { 
            seats: parsed.data.seats,
            amountTotal: additionalAmount
          },
          $push: {
            additionalGuests: { $each: parsed.data.additionalGuests }
          }
        },
        { new: true }
      );

      if (!updatedBooking) {
        // Rollback event seats if booking update failed
        await EventSlot.findByIdAndUpdate(
          bookingDoc.eventSlotId,
          {
            $inc: { seatsRemaining: parsed.data.seats },
            $set: { status: eventDoc.seatsRemaining > 0 ? "OPEN" : eventDoc.status }
          }
        );
        return badRequest("Failed to update booking");
      }
      
      // Update payment
      if (bookingDoc.paymentId) {
        await Payment.updateOne(
          { _id: bookingDoc.paymentId },
          { $inc: { amount: additionalAmount } }
        );
      }
      
      return ok({
        bookingId: String(updatedBooking._id),
        seats: updatedBooking.seats,
        amountTotal: updatedBooking.amountTotal,
        additionalAmount
      });
    } catch (error) {
      // Rollback event seats if booking update failed
      try {
        await EventSlot.findByIdAndUpdate(
          bookingDoc.eventSlotId,
          {
            $inc: { seatsRemaining: parsed.data.seats },
            $set: { status: eventDoc.seatsRemaining > 0 ? "OPEN" : eventDoc.status }
          }
        );
      } catch (rollbackError) {
        console.error("Failed to rollback event seats:", rollbackError);
      }
      throw error;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to add guests";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    if (msg.toLowerCase().includes("not found")) return badRequest(msg);
    if (msg.toLowerCase().includes("not available")) return badRequest(msg);
    if (msg.toLowerCase().includes("not enough")) return badRequest(msg);
    if (msg.toLowerCase().includes("missing token")) return unauthorized();
    return serverError(msg);
  }
}
