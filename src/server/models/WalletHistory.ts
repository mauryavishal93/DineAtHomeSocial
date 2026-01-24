import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

export type WalletTransactionType =
  | "EARNED" // Revenue from bookings
  | "WITHDRAWAL_REQUEST" // User requested withdrawal
  | "WITHDRAWAL_APPROVED" // Admin approved withdrawal
  | "WITHDRAWAL_PAID" // Payment processed
  | "WITHDRAWAL_REJECTED" // Admin rejected withdrawal
  | "REFUND_CREDIT" // Refund credited to wallet
  | "ADJUSTMENT" // Manual admin adjustment
  | "COMMISSION_DEDUCTED" // Platform commission
  | "FROZEN" // Wallet frozen
  | "UNFROZEN"; // Wallet unfrozen

const WalletHistorySchema = new Schema(
  {
    walletId: { type: Types.ObjectId, ref: "Wallet", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    transactionType: {
      type: String,
      required: true,
      enum: [
        "EARNED",
        "WITHDRAWAL_REQUEST",
        "WITHDRAWAL_APPROVED",
        "WITHDRAWAL_PAID",
        "WITHDRAWAL_REJECTED",
        "REFUND_CREDIT",
        "ADJUSTMENT",
        "COMMISSION_DEDUCTED",
        "FROZEN",
        "UNFROZEN"
      ]
    },
    amount: { type: Number, required: true }, // in paise (positive for credits, negative for debits)
    balanceBefore: { type: Number, required: true }, // in paise
    balanceAfter: { type: Number, required: true }, // in paise
    description: { type: String, default: "" },
    referenceId: { type: String, default: "" }, // Booking ID, Payment ID, etc.
    referenceType: { type: String, default: "" }, // "BOOKING", "PAYMENT", "WITHDRAWAL", etc.
    adminId: { type: Types.ObjectId, ref: "Admin", default: null }, // Admin who processed (if applicable)
    metadata: { type: Schema.Types.Mixed, default: {} } // Additional data
  },
  { timestamps: true }
);

WalletHistorySchema.index({ walletId: 1, createdAt: -1 });
WalletHistorySchema.index({ userId: 1, createdAt: -1 });
WalletHistorySchema.index({ transactionType: 1, createdAt: -1 });

export type WalletHistoryDoc = InferSchemaType<typeof WalletHistorySchema>;
export const WalletHistory = models.WalletHistory || model("WalletHistory", WalletHistorySchema);
