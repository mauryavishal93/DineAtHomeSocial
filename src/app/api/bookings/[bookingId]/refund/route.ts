import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { EventSlot } from "@/server/models/EventSlot";
import { createResponse } from "@/server/http/response";

// Request refund
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

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return createResponse({ error: "Booking not found" }, { status: 404 });
    }

    const bookingDoc = booking as any;

    // Verify ownership
    if (String(bookingDoc.guestUserId) !== String(ctx.userId)) {
      return createResponse({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if already refunded or cancelled
    if (bookingDoc.status === "CANCELLED" || bookingDoc.status === "REFUND_REQUIRED") {
      return createResponse({ error: "Refund already requested or booking cancelled" }, { status: 400 });
    }

    // Check if event has started
    const event = await EventSlot.findById(bookingDoc.eventSlotId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const eventStart = new Date(eventDoc.startAt);
    const now = new Date();
    
    if (now >= eventStart) {
      return createResponse({ error: "Cannot request refund after event has started" }, { status: 400 });
    }

    // Update booking status
    await Booking.updateOne(
      { _id: bookingId },
      {
        $set: {
          status: "REFUND_REQUIRED",
          refundRequestedAt: new Date(),
          refundReason: reason || ""
        }
      }
    );

    // TODO: Notify host about refund request
    // await Notification.create({
    //   userId: bookingDoc.hostUserId,
    //   type: "REFUND_REQUESTED",
    //   title: "Refund Request",
    //   message: `Guest has requested refund for booking ${bookingId}`,
    //   relatedBookingId: bookingId
    // });

    return createResponse({
      success: true,
      message: "Refund request submitted. The host will review it."
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Get refund status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { bookingId } = await params;

    const booking = await Booking.findById(bookingId)
      .populate({ path: "paymentId" })
      .lean();

    if (!booking) {
      return createResponse({ error: "Booking not found" }, { status: 404 });
    }

    const bookingDoc = booking as any;
    const payment = bookingDoc.paymentId as any;

    // Verify access (guest or host)
    const isGuest = String(bookingDoc.guestUserId) === String(ctx.userId);
    const isHost = String(bookingDoc.hostUserId) === String(ctx.userId);

    if (!isGuest && !isHost) {
      return createResponse({ error: "Unauthorized" }, { status: 403 });
    }

    return createResponse({
      bookingId,
      status: bookingDoc.status,
      refundRequested: bookingDoc.status === "REFUND_REQUIRED",
      refundRequestedAt: bookingDoc.refundRequestedAt || null,
      refundReason: bookingDoc.refundReason || null,
      refundProcessed: payment?.status === "REFUNDED",
      refundProcessedAt: payment?.refundedAt || null,
      refundAmount: payment?.refundAmount || bookingDoc.amountTotal,
      canRequestRefund: isGuest && bookingDoc.status === "CONFIRMED" && !bookingDoc.refundRequestedAt
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
