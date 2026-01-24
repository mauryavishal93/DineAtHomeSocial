import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const WalletSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    role: { type: String, required: true, enum: ["HOST", "GUEST"] },
    balance: { type: Number, required: true, default: 0 }, // in paise
    pendingBalance: { type: Number, required: true, default: 0 }, // in paise (awaiting payout approval)
    totalEarned: { type: Number, required: true, default: 0 }, // in paise (lifetime earnings)
    totalWithdrawn: { type: Number, required: true, default: 0 }, // in paise (lifetime withdrawals)
    currency: { type: String, required: true, default: "INR" },
    isFrozen: { type: Boolean, default: false }, // Freeze wallet during disputes
    freezeReason: { type: String, default: "" },
    frozenAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export type WalletDoc = InferSchemaType<typeof WalletSchema>;
export const Wallet = models.Wallet || model("Wallet", WalletSchema);
