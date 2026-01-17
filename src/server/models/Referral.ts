import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const ReferralSchema = new Schema(
  {
    referrerUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    referredUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    referralCode: { type: String, required: true, unique: true, index: true },
    referralType: {
      type: String,
      required: true,
      enum: ["GUEST_TO_GUEST", "GUEST_TO_HOST", "HOST_TO_HOST"]
    },
    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "COMPLETED", "REWARDED", "EXPIRED"]
    },
    // Rewards
    referrerReward: { type: Number, default: 20000 }, // ₹200 in paise
    referredReward: { type: Number, default: 20000 },
    rewardCredited: { type: Boolean, default: false },
    creditedAt: { type: Date, default: null },
    
    // For host referrals - percentage of revenue
    revenueSharePercent: { type: Number, default: 5 },
    revenueShareMonths: { type: Number, default: 3 },
    revenueSharePaid: { type: Number, default: 0 },
    
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

ReferralSchema.index({ referrerUserId: 1, status: 1 });
ReferralSchema.index({ referralCode: 1 });

export type ReferralDoc = InferSchemaType<typeof ReferralSchema>;
export const Referral = models.Referral || model("Referral", ReferralSchema);
