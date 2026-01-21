import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { createResponse } from "@/server/http/response";

// Check in to an event
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { eventId } = await params;

    const body = await req.json();
    const { bookingId, qrCode } = body;

    // Verify event exists
    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const isHost = String(eventDoc.hostUserId) === String(ctx.userId);

    if (isHost) {
      // Host checking in a guest
      if (!bookingId) {
        return createResponse({ error: "bookingId is required for host check-in" }, { status: 400 });
      }

      const booking = await Booking.findById(bookingId).lean();
      if (!booking || String((booking as any).eventSlotId) !== eventId) {
        return createResponse({ error: "Invalid booking" }, { status: 400 });
      }

      // Mark as checked in
      await Booking.updateOne(
        { _id: bookingId },
        { 
          $set: { 
            checkedInAt: new Date(),
            checkedInBy: ctx.userId
          } 
        }
      );

      return createResponse({
        success: true,
        message: "Guest checked in successfully"
      });
    } else {
      // Guest checking themselves in
      const booking = await Booking.findOne({
        eventSlotId: eventId,
        guestUserId: ctx.userId,
        status: { $in: ["CONFIRMED", "PAYMENT_PENDING"] }
      }).lean();

      if (!booking) {
        return createResponse({ error: "No booking found for this event" }, { status: 404 });
      }

      // Verify QR code if provided
      if (qrCode) {
        const expectedQR = `${eventId}-${(booking as any)._id}`;
        if (qrCode !== expectedQR) {
          return createResponse({ error: "Invalid QR code" }, { status: 400 });
        }
      }

      // Check if event has started (within 30 minutes before start)
      const eventStart = new Date(eventDoc.startAt);
      const now = new Date();
      const timeDiff = eventStart.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      if (minutesDiff > 30) {
        return createResponse({ 
          error: "Check-in opens 30 minutes before event start",
          eventStartTime: eventDoc.startAt
        }, { status: 400 });
      }

      // Mark as checked in
      await Booking.updateOne(
        { _id: (booking as any)._id },
        { 
          $set: { 
            checkedInAt: new Date()
          } 
        }
      );

      return createResponse({
        success: true,
        message: "Checked in successfully! Welcome to the event."
      });
    }
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Get check-in status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { eventId } = await params;

    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const isHost = String(eventDoc.hostUserId) === String(ctx.userId);

    if (isHost) {
      // Get all bookings with check-in status
      const bookings = await Booking.find({
        eventSlotId: eventId,
        status: { $in: ["CONFIRMED", "PAYMENT_PENDING"] }
      })
        .populate({ path: "guestUserId", select: "name" })
        .lean();

      return createResponse({
        bookings: bookings.map((b: any) => ({
          bookingId: String(b._id),
          guestName: b.guestName,
          guestUserId: String(b.guestUserId),
          seats: b.seats,
          checkedInAt: b.checkedInAt || null,
          isCheckedIn: !!b.checkedInAt
        }))
      });
    } else {
      // Get guest's booking check-in status
      const booking = await Booking.findOne({
        eventSlotId: eventId,
        guestUserId: ctx.userId
      }).lean();

      if (!booking) {
        return createResponse({ error: "No booking found" }, { status: 404 });
      }

      // Generate QR code for guest
      const qrCode = `${eventId}-${(booking as any)._id}`;

      return createResponse({
        checkedIn: !!(booking as any).checkedInAt,
        checkedInAt: (booking as any).checkedInAt || null,
        qrCode
      });
    }
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
