import { Schema, model, models, type InferSchemaType, Types } from "mongoose";
import type { GuestType } from "@/server/models/_types";

const UploadedDocSchema = new Schema(
  {
    kind: { type: String, required: true }, // e.g. AADHAR, PASSPORT
    filePath: { type: String, required: true },
    fileMime: { type: String, required: true },
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: () => new Date(), required: true }
  },
  { _id: false }
);

const GuestProfileSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    gender: { type: String, default: "" },
    age: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    govtIdNumber: { type: String, default: "" },
    govtIdDocs: { type: [UploadedDocSchema], default: [] },
    profession: { type: String, default: "" },
    company: { type: String, default: "" },
    interests: { type: [String], default: [] },
    foodPreferences: { type: [String], default: [] }, // veg, vegan, halal, etc.
    allergies: { type: [String], default: [] },
    dietaryRestrictions: { type: [String], default: [] },
    socialLinks: {
      type: new Schema(
        { instagram: String, linkedin: String, twitter: String },
        { _id: false }
      ),
      default: {}
    },
    guestType: {
      type: String,
      default: "BASIC",
      enum: ["BASIC", "PREMIUM", "VIP"] satisfies GuestType[]
    },
    membershipStartDate: { type: Date, default: null },
    membershipEndDate: { type: Date, default: null },
    membershipAutoRenew: { type: Boolean, default: false },
    
    // Credits & rewards
    walletBalance: { type: Number, default: 0 }, // in paise
    referralCode: { type: String, default: "", unique: true, sparse: true },
    totalReferrals: { type: Number, default: 0 },
    
    // Verification
    isIdentityVerified: { type: Boolean, default: false },
    verificationMethod: { type: String, default: "" }, // "AADHAAR", "PAN", "PASSPORT"
    verificationDate: { type: Date, default: null },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    
    // Communities
    communities: { type: [Types.ObjectId], ref: "Community", default: [] },
    
    profileImagePath: { type: String, default: "" },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    
    // Preferences for matching
    preferredAgeRange: { 
      type: new Schema({ min: Number, max: Number }, { _id: false }),
      default: { min: 18, max: 65 }
    },
    preferredEventTypes: { type: [String], default: [] },
    languagesSpoken: { type: [String], default: [] }
  },
  { timestamps: true }
);

export type GuestProfileDoc = InferSchemaType<typeof GuestProfileSchema>;
export const GuestProfile =
  models.GuestProfile || model("GuestProfile", GuestProfileSchema);

