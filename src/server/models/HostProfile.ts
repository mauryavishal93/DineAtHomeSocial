import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const HostProfileSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    venueId: { type: Types.ObjectId, ref: "Venue", default: null },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    age: { type: Number, default: 0 },
    interests: { type: [String], default: [] },
    bio: { type: String, default: "" },
    
    // Verification
    isIdentityVerified: { type: Boolean, default: false },
    isCulinaryCertified: { type: Boolean, default: false },
    certificationDetails: { type: String, default: "" },
    verificationDate: { type: Date, default: null },
    isBackgroundVerified: { type: Boolean, default: false },
    
    // Host tier based on performance
    hostTier: {
      type: String,
      default: "STANDARD",
      enum: ["STANDARD", "VERIFIED_CHEF", "TOP_RATED", "CELEBRITY"]
    },
    commissionRate: { type: Number, default: 15 }, // percentage
    
    // Stats
    totalEventsHosted: { type: Number, default: 0 },
    totalGuestsServed: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    repeatGuestRate: { type: Number, default: 0 },
    cancellationRate: { type: Number, default: 0 },
    
    // Referrals
    referralCode: { type: String, default: "", unique: true, sparse: true },
    totalHostsReferred: { type: Number, default: 0 },
    
    // Communities
    communities: { type: [Types.ObjectId], ref: "Community", default: [] },
    
    // Settings
    autoAcceptBookings: { type: Boolean, default: true },
    requiresDeposit: { type: Boolean, default: false },
    depositAmount: { type: Number, default: 0 },
    cancellationPolicy: { type: String, default: "FLEXIBLE" }, // FLEXIBLE, MODERATE, STRICT
    
    profileImagePath: { type: String, default: "" },
    coverImagePath: { type: String, default: "" },
    
    // Analytics preferences
    sendWeeklyReport: { type: Boolean, default: true },
    sendMonthlyReport: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export type HostProfileDoc = InferSchemaType<typeof HostProfileSchema>;
export const HostProfile = models.HostProfile || model("HostProfile", HostProfileSchema);
