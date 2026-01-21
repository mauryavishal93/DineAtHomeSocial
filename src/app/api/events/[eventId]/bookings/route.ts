import { ok, unauthorized, forbidden, serverError } from "@/server/http/response";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Booking } from "@/server/models/Booking";
import { EventSlot } from "@/server/models/EventSlot";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["HOST", "ADMIN"]);
    
    const { eventId } = await context.params;
    
    await connectMongo();
    
    // Get event to verify ownership
    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return serverError("Event not found");
    }
    
    // Check if user is the host of this event
    const eventDoc = event as any;
    if (ctx.role === "HOST" && String(eventDoc.hostUserId) !== String(ctx.userId)) {
      return forbidden("You can only view bookings for your own events");
    }
    
    // Fetch all bookings for this event
    const bookings = await Booking.find({ 
      eventSlotId: eventId,
      status: { $in: ["CONFIRMED", "PAYMENT_PENDING"] }
    })
      .lean()
      .sort({ createdAt: -1 });
    
    const formattedBookings = bookings.map((booking: any) => ({
      bookingId: booking._id.toString(),
      guestName: booking.guestName,
      guestMobile: booking.guestMobile,
      guestAge: booking.guestAge,
      guestGender: booking.guestGender,
      seats: booking.seats,
      status: booking.status,
      additionalGuests: booking.additionalGuests || []
    }));
    
    return ok({ bookings: formattedBookings });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    if (msg.toLowerCase().includes("missing token")) return unauthorized();
    return serverError(msg);
  }
}
