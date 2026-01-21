import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Booking } from "@/server/models/Booking";
import { getEventPassesByBooking, getEventPassById } from "@/server/services/eventPassService";
import { createResponse } from "@/server/http/response";

export const runtime = "nodejs";

// Get all passes for a booking
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { bookingId } = await params;

    // Verify booking ownership
    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return createResponse({ error: "Booking not found" }, { status: 404 });
    }

    const bookingDoc = booking as any;
    if (String(bookingDoc.guestUserId) !== String(ctx.userId)) {
      return createResponse({ error: "Unauthorized" }, { status: 403 });
    }

    const passes = await getEventPassesByBooking(bookingId);
    
    return createResponse({ passes });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
