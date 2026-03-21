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

    const bookings = await Booking.find({
      $or: [{ guestUserId: ctx.userId }, { hostUserId: ctx.userId }]
    })
      .select("_id eventSlotId amountTotal createdAt")
      .populate({ path: "eventSlotId", select: "eventName startAt" })
      .lean();

    const bookingIds = bookings.map((b) => b._id);
    const bookingById = new Map(
      bookings.map((b) => {
        const doc = b as any;
        return [String(doc._id), doc] as const;
      })
    );

    const paymentDocs = await Payment.find({ bookingId: { $in: bookingIds } })
      .sort({ createdAt: -1 })
      .lean();

    const payments = [];

    for (const payment of paymentDocs) {
      const p = payment as any;
      const bookingDoc = bookingById.get(String(p.bookingId));
      if (!bookingDoc) continue;

      const event = bookingDoc.eventSlotId as any;
      if (!event) continue;

      payments.push({
        paymentId: String(p._id),
        bookingId: String(bookingDoc._id),
        eventId: String(event._id),
        eventName: event.eventName || "Event",
        eventDate: event.startAt,
        amount: typeof p.amount === "number" ? p.amount : Number(bookingDoc.amountTotal || 0),
        status: p.status || "PENDING",
        paymentMethod: p.provider || "RAZORPAY",
        paidAt: p.paidAt || p.createdAt || bookingDoc.createdAt,
        refundedAt: p.refundedAt || null,
        refundAmount: p.refundAmount ?? null,
        isAddon: Boolean(p.addonSeats)
      });
    }

    return createResponse({ payments });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
