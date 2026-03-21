import { connectMongo } from "@/server/db/mongoose";
import { Booking } from "@/server/models/Booking";
import { EventSlot } from "@/server/models/EventSlot";
import { User } from "@/server/models/User";
import { Notification } from "@/server/models/Notification";
import { Payment } from "@/server/models/Payment";
import { createEventPasses } from "./eventPassService";
import { sendEventPassesForBooking } from "./emailService";

/**
 * After payment succeeds: passes, guest email, host notification.
 * Safe to call multiple times (passes are idempotent).
 */
export async function finalizeBookingAfterPayment(bookingId: string) {
  await connectMongo();

  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return;

  const b = booking as any;
  const event = await EventSlot.findById(b.eventSlotId).lean();
  const eventDoc = event as any;
  if (!eventDoc) return;

  try {
    await createEventPasses(bookingId);
  } catch (e) {
    console.error("createEventPasses:", e);
  }

  try {
    const guestUser = await User.findById(b.guestUserId).select("email").lean();
    if (guestUser && (guestUser as any).email) {
      await sendEventPassesForBooking(bookingId, (guestUser as any).email);
    }
  } catch (e) {
    console.error("sendEventPassesForBooking:", e);
  }

  try {
    const recent = await Notification.findOne({
      userId: b.hostUserId,
      type: "BOOKING_CONFIRMED",
      "metadata.bookingId": bookingId,
      createdAt: { $gte: new Date(Date.now() - 120000) }
    }).lean();
    if (recent) return;

    await Notification.create({
      userId: b.hostUserId,
      title: "New Booking Received",
      message: `${b.guestName} booked ${b.seats} seat${b.seats > 1 ? "s" : ""} for your event "${eventDoc.eventName}"`,
      type: "BOOKING_CONFIRMED",
      relatedEventId: b.eventSlotId,
      relatedBookingId: b._id,
      metadata: {
        bookingId,
        eventId: String(b.eventSlotId),
        guestName: b.guestName,
        seats: b.seats
      },
      isRead: false
    });
  } catch (e) {
    console.error("host booking notification:", e);
  }
}

/**
 * Guest abandons Razorpay checkout: restore seats and remove unpaid booking + payment.
 */
export async function releaseUnpaidBooking(bookingId: string, guestUserId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await connectMongo();

  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return { ok: false, error: "Booking not found" };

  const b = booking as any;
  if (String(b.guestUserId) !== String(guestUserId)) {
    return { ok: false, error: "Unauthorized" };
  }
  if (b.status !== "PAYMENT_PENDING") {
    return { ok: false, error: "Only unpaid pending bookings can be released" };
  }

  const cur = (await EventSlot.findById(b.eventSlotId).lean()) as any;
  if (!cur) return { ok: false, error: "Event not found" };

  const seats = Number(b.seats || 0);
  const newRem = (cur.seatsRemaining ?? 0) + seats;
  await EventSlot.findByIdAndUpdate(b.eventSlotId, {
    $inc: { seatsRemaining: seats },
    ...(newRem > 0 ? { $set: { status: "OPEN" } } : {})
  });

  if (b.paymentId) {
    await Payment.deleteOne({ _id: b.paymentId });
  }
  await Booking.deleteOne({ _id: bookingId });

  return { ok: true };
}

/**
 * Guest closed Razorpay for an add-on payment on an already-confirmed booking:
 * restore event seats, remove added guests from booking, delete pending payment.
 */
export async function releasePendingAddonPayment(
  bookingId: string,
  paymentId: string,
  guestUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await connectMongo();

  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return { ok: false, error: "Booking not found" };

  const b = booking as any;
  if (String(b.guestUserId) !== String(guestUserId)) {
    return { ok: false, error: "Unauthorized" };
  }
  if (b.status !== "CONFIRMED") {
    return { ok: false, error: "Only add-on payments on confirmed bookings can be released this way" };
  }

  const p = await Payment.findById(paymentId).lean();
  if (!p) return { ok: false, error: "Payment not found" };
  const pd = p as any;
  if (String(pd.bookingId) !== String(bookingId)) {
    return { ok: false, error: "Payment does not belong to this booking" };
  }
  if (pd.status !== "PENDING") {
    return { ok: false, error: "Payment is not pending" };
  }
  if (String(b.paymentId) === String(paymentId)) {
    return { ok: false, error: "Use checkout dismiss without paymentId for unpaid bookings" };
  }

  const seats = Number(pd.addonSeats || 0);
  const mobiles: string[] = Array.isArray(pd.addonGuestMobiles)
    ? pd.addonGuestMobiles.map((m: string) => String(m).toLowerCase().trim())
    : [];
  if (seats <= 0 || mobiles.length === 0) {
    return { ok: false, error: "Invalid add-on payment record" };
  }

  const cur = (await EventSlot.findById(b.eventSlotId).lean()) as any;
  if (!cur) return { ok: false, error: "Event not found" };

  const newRem = (cur.seatsRemaining ?? 0) + seats;
  await EventSlot.findByIdAndUpdate(b.eventSlotId, {
    $inc: { seatsRemaining: seats },
    ...(newRem > 0 ? { $set: { status: "OPEN" } } : {})
  });

  await Booking.findByIdAndUpdate(bookingId, {
    $inc: { seats: -seats, amountTotal: -pd.amount },
    $pull: { additionalGuests: { mobile: { $in: mobiles } } }
  });

  await Payment.deleteOne({ _id: paymentId });

  return { ok: true };
}
