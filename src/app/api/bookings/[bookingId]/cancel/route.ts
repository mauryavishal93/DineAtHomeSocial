import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Booking } from "@/server/models/Booking";
import { EventSlot } from "@/server/models/EventSlot";
import { Payment } from "@/server/models/Payment";
import { Notification } from "@/server/models/Notification";
import { createResponse } from "@/server/http/response";

export const runtime = "nodejs";

// Cancel booking with refund policy
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { bookingId } = await params;

    const body = await req.json();
    const { reason } = body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return createResponse({ error: "Booking not found" }, { status: 404 });
    }

    const bookingDoc = booking as any;

    // Verify ownership
    if (String(bookingDoc.guestUserId) !== String(ctx.userId)) {
      return createResponse({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if already cancelled
    if (bookingDoc.status === "CANCELLED") {
      return createResponse({ error: "Booking already cancelled" }, { status: 400 });
    }

    // Get event to check timing
    const event = await EventSlot.findById(bookingDoc.eventSlotId);
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const eventStart = new Date(eventDoc.startAt);
    const now = new Date();

    // Check if event has already started
    if (eventStart <= now) {
      return createResponse(
        { error: "Cannot cancel booking after event has started" },
        { status: 400 }
      );
    }

    // Calculate hours until event (using UTC to avoid timezone issues)
    const eventStartUTC = eventStart.getTime();
    const nowUTC = now.getTime();
    const hoursUntilEvent = Math.floor((eventStartUTC - nowUTC) / (1000 * 60 * 60));
    
    // More precise refund calculation
    const is24HoursBefore = hoursUntilEvent >= 24;
    const refundPercentage = is24HoursBefore ? 100 : 0;
    const refundAmount = is24HoursBefore ? bookingDoc.amountTotal : 0;

    // Calculate new seats remaining
    const newSeatsRemaining = eventDoc.seatsRemaining + bookingDoc.seats;
    const newStatus = newSeatsRemaining > 0 ? "OPEN" : "FULL";

    // Atomic update event seats first
    const updatedEvent = await EventSlot.findByIdAndUpdate(
      bookingDoc.eventSlotId,
      {
        $inc: { seatsRemaining: bookingDoc.seats },
        $set: { status: newStatus }
      },
      { 
        new: true 
      }
    );
    
    if (!updatedEvent) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    // Update booking status atomically - only if not already cancelled
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        status: { $ne: "CANCELLED" } // Only update if not already cancelled
      },
      {
        $set: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason || "",
          refundAmount: refundAmount,
          refundPercentage: refundPercentage
        }
      },
      { new: true }
    );

    if (!updatedBooking) {
      // Rollback event seats if booking update failed
      await EventSlot.findByIdAndUpdate(
        bookingDoc.eventSlotId,
        {
          $inc: { seatsRemaining: -bookingDoc.seats },
          $set: { status: eventDoc.seatsRemaining > 0 ? "OPEN" : eventDoc.status }
        }
      );
      return createResponse({ error: "Failed to cancel booking" }, { status: 500 });
    }
    
    // Update payment if refund
    if (refundAmount > 0 && bookingDoc.paymentId) {
      await Payment.updateOne(
        { _id: bookingDoc.paymentId },
        {
          $set: {
            status: "REFUNDED",
            refundAmount: refundAmount,
            refundedAt: new Date()
          }
        }
      );
    }

    // Notify host (best effort)
    try {
      await Notification.create({
        userId: bookingDoc.hostUserId,
        title: "Booking Cancelled",
        message: `Guest cancelled ${bookingDoc.seats} seat${bookingDoc.seats > 1 ? 's' : ''} for "${eventDoc.eventName}". ${refundAmount > 0 ? `Refund: ₹${(refundAmount / 100).toFixed(0)}` : 'No refund (less than 24h before event)'}`,
        type: "BOOKING_CANCELLED",
        relatedEventId: bookingDoc.eventSlotId,
        relatedBookingId: bookingDoc._id,
        metadata: {
          bookingId: String(bookingDoc._id),
          eventId: String(bookingDoc.eventSlotId),
          refundAmount: refundAmount,
          seats: bookingDoc.seats
        },
        isRead: false
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    return createResponse({
      success: true,
      cancelled: true,
      refundAmount,
      refundPercentage,
      message: refundAmount > 0 
        ? `Booking cancelled. ₹${(refundAmount / 100).toFixed(0)} will be refunded.`
        : "Booking cancelled. No refund (cancelled less than 24 hours before event)."
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Get cancellation info (refund policy)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { bookingId } = await params;

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return createResponse({ error: "Booking not found" }, { status: 404 });
    }

    const bookingDoc = booking as any;

    // Verify access
    if (String(bookingDoc.guestUserId) !== String(ctx.userId)) {
      return createResponse({ error: "Unauthorized" }, { status: 403 });
    }

    // Get event timing
    const event = await EventSlot.findById(bookingDoc.eventSlotId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const eventStart = new Date(eventDoc.startAt);
    const now = new Date();

    // Check if event has already started
    if (eventStart <= now) {
      return createResponse(
        { error: "Cannot cancel booking after event has started" },
        { status: 400 }
      );
    }

    // Calculate hours until event (using UTC to avoid timezone issues)
    const eventStartUTC = eventStart.getTime();
    const nowUTC = now.getTime();
    const hoursUntilEvent = Math.floor((eventStartUTC - nowUTC) / (1000 * 60 * 60));
    
    const is24HoursBefore = hoursUntilEvent >= 24;
    const refundPercentage = is24HoursBefore ? 100 : 0;
    const refundAmount = is24HoursBefore ? bookingDoc.amountTotal : 0;
    const canCancel = hoursUntilEvent > 0; // Can cancel until event starts

    return createResponse({
      canCancel,
      hoursUntilEvent: Math.max(0, hoursUntilEvent),
      refundPercentage,
      refundAmount,
      totalAmount: bookingDoc.amountTotal,
      is24HoursBefore,
      eventStartTime: eventDoc.startAt
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
