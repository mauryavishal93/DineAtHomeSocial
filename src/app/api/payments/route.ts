import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Payment } from "@/server/models/Payment";
import { Booking } from "@/server/models/Booking";
import { EventSlot } from "@/server/models/EventSlot";
import { createResponse } from "@/server/http/response";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    // Get all bookings for user
    const bookings = await Booking.find({
      $or: [
        { guestUserId: ctx.userId },
        { hostUserId: ctx.userId }
      ]
    })
      .populate({ path: "paymentId" })
      .populate({ path: "eventSlotId", select: "eventName startAt" })
      .sort({ createdAt: -1 })
      .lean();

    const payments = [];

    for (const booking of bookings) {
      const bookingDoc = booking as any;
      const payment = bookingDoc.paymentId;
      const event = bookingDoc.eventSlotId;

      if (payment && event) {
        payments.push({
          paymentId: String(payment._id),
          bookingId: String(bookingDoc._id),
          eventId: String(event._id),
          eventName: event.eventName || "Event",
          eventDate: event.startAt,
          amount: payment.amount || bookingDoc.amountTotal,
          status: payment.status || "PENDING",
          paymentMethod: payment.provider || "RAZORPAY",
          paidAt: payment.paidAt || bookingDoc.createdAt,
          refundedAt: payment.refundedAt || null,
          refundAmount: payment.refundAmount || null
        });
      }
    }

    return createResponse({ payments });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
