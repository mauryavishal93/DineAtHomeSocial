import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "FAILED";

const WithdrawalSchema = new Schema(
  {
    walletId: { type: Types.ObjectId, ref: "Wallet", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true }, // in paise
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "APPROVED", "REJECTED", "PAID", "FAILED"]
    },
    bankAccount: {
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      accountHolderName: { type: String, required: true },
      bankName: { type: String, default: "" }
    },
    upiId: { type: String, default: "" }, // Alternative to bank account
    requestedAt: { type: Date, default: () => new Date() },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: Types.ObjectId, ref: "Admin", default: null },
    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: Types.ObjectId, ref: "Admin", default: null },
    rejectionReason: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    paidBy: { type: Types.ObjectId, ref: "Admin", default: null },
    paymentReference: { type: String, default: "" }, // UTR, Transaction ID, etc.
    failureReason: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

WithdrawalSchema.index({ userId: 1, status: 1, createdAt: -1 });
WithdrawalSchema.index({ status: 1, createdAt: -1 });

export type WithdrawalDoc = InferSchemaType<typeof WithdrawalSchema>;
export const Withdrawal = models.Withdrawal || model("Withdrawal", WithdrawalSchema);
