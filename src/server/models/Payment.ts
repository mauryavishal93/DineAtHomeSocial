import { Schema, model, models, type InferSchemaType, Types } from "mongoose";
import type { PaymentStatus } from "@/server/models/_types";

const PaymentSchema = new Schema(
  {
    bookingId: { type: Types.ObjectId, ref: "Booking", required: true, index: true },
    provider: { type: String, required: true, default: "RAZORPAY" },
    amount: { type: Number, required: true }, // in INR paise or smallest unit
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"] satisfies PaymentStatus[]
    },
    razorpayOrderId: { type: String, default: "", index: true },
    razorpayPaymentId: { type: String, default: "", index: true },
    razorpaySignature: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    refundAmount: { type: Number, default: 0 },
    webhookPayload: { type: Schema.Types.Mixed, default: null },
    /** Set for add-on seat payments so checkout dismiss can roll back seats + guests */
    addonSeats: { type: Number, default: null },
    addonGuestMobiles: { type: [String], default: undefined }
  },
  { timestamps: true }
);

export type PaymentDoc = InferSchemaType<typeof PaymentSchema>;
export const Payment = models.Payment || model("Payment", PaymentSchema);

