import { NextRequest } from "next/server";
import { ok, notFound, serverError, unauthorized } from "@/server/http/response";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Booking } from "@/server/models/Booking";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const ctx = await requireAuth(req as any);
    const { eventId } = await params;
    
    await connectMongo();
    
    // Find user's booking for this specific event
    const bookingDoc = await Booking.findOne({
      eventSlotId: eventId,
      guestUserId: ctx.userId,
      status: { $in: ["CONFIRMED", "PAYMENT_PENDING"] }
    }).lean();
    
    if (!bookingDoc) {
      return notFound("No booking found for this event");
    }
    
    const booking = bookingDoc as any;
    
    return ok({
      bookingId: String(booking._id),
      seats: Number(booking.seats || 0),
      guestName: String(booking.guestName || ""),
      guestMobile: String(booking.guestMobile || ""),
      additionalGuests: Array.isArray(booking.additionalGuests) ? booking.additionalGuests : [],
      amountTotal: Number(booking.amountTotal || 0),
      status: String(booking.status || "PAYMENT_PENDING")
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("token")) {
      return unauthorized();
    }
    return serverError(msg);
  }
}
