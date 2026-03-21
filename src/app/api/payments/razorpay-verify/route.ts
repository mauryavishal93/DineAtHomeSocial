import { z } from "zod";
import { ok, badRequest, forbidden, serverError, unauthorized } from "@/server/http/response";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { verifyRazorpayPaymentSignature } from "@/server/payments/razorpay";
import { finalizeBookingAfterPayment } from "@/server/services/bookingPaymentSideEffects";

export const runtime = "nodejs";

const schema = z.object({
  bookingId: z.string().min(1),
  paymentId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["GUEST"]);

    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) return badRequest(parsed.error.message);

    await connectMongo();
    const { bookingId, paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      parsed.data;

    const booking = await Booking.findById(bookingId)
      .select({ guestUserId: 1, status: 1, eventSlotId: 1 })
      .lean();
    if (!booking) return badRequest("Booking not found");
    const b = booking as any;
    if (String(b.guestUserId) !== String(ctx.userId)) return forbidden();

    if (b.status !== "CONFIRMED" && b.status !== "PAYMENT_PENDING") {
      return badRequest("Booking cannot accept payment in its current state");
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      bookingId
    }).lean();

    if (!payment) return badRequest("Payment not found");
    const p = payment as any;

    if (p.status === "PAID") {
      if (b.status !== "CONFIRMED") {
        await Booking.updateOne({ _id: bookingId }, { $set: { status: "CONFIRMED" } });
        await finalizeBookingAfterPayment(bookingId);
      }
      return ok({ success: true, alreadyPaid: true, bookingId });
    }

    if (String(p.razorpayOrderId || "") !== String(razorpay_order_id)) {
      return badRequest("Order mismatch — refresh and try again.");
    }

    if (!verifyRazorpayPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return badRequest("Invalid payment signature");
    }

    const wasAlreadyConfirmed = b.status === "CONFIRMED";

    await Payment.updateOne(
      { _id: paymentId },
      {
        $set: {
          status: "PAID",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: new Date()
        }
      }
    );

    if (!wasAlreadyConfirmed) {
      await Booking.updateOne({ _id: bookingId }, { $set: { status: "CONFIRMED" } });
      await finalizeBookingAfterPayment(bookingId);
    }

    return ok({ success: true, bookingId, addonOnly: wasAlreadyConfirmed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verification failed";
    if (msg.toLowerCase().includes("missing token")) return unauthorized();
    return serverError(msg);
  }
}
