import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const FeedbackSchema = new Schema(
  {
    eventSlotId: { type: Types.ObjectId, ref: "EventSlot", required: true, index: true },
    bookingId: { type: Types.ObjectId, ref: "Booking", required: true, index: true },
    fromUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    toUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    
    // Type of feedback: HOST or GUEST
  feedbackType: {
    type: String,
    required: true,
    enum: ["HOST", "GUEST", "HOST_TO_GUEST"]
  },
    
    // Overall rating (required for both types)
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    
    // Host ratings (guest->host) - 4 criteria
    eventRating: { type: Number, default: 0, min: 0, max: 5 },      // Event quality
    venueRating: { type: Number, default: 0, min: 0, max: 5 },      // Venue ambiance
    foodRating: { type: Number, default: 0, min: 0, max: 5 },       // Food quality
    hospitalityRating: { type: Number, default: 0, min: 0, max: 5 }, // Host hospitality
    
    // Co-guest rating (guest->guest) - simple star rating
    guestRating: { type: Number, default: 0, min: 0, max: 5 },      // Co-guest rating
    
    // Legacy fields (keeping for backward compatibility)
    foodQuality: { type: Number, default: 0, min: 0, max: 5 },
    ambiance: { type: Number, default: 0, min: 0, max: 5 },
    hostFriendliness: { type: Number, default: 0, min: 0, max: 5 },
    valueForMoney: { type: Number, default: 0, min: 0, max: 5 },
    wouldAttendAgain: { type: Boolean, default: null },
    
    // Detailed reviews
    foodReview: { type: String, default: "" },
    experienceReview: { type: String, default: "" },
    
    // host->guest
    behavior: { type: String, default: "" },
    punctuality: { type: String, default: "" },
    
    // Photo reviews
    photos: { type: [String], default: [] },
    
    // Host response to review
    hostResponse: { type: String, default: "" },
    hostResponseAt: { type: Date, default: null },
    
    // Review helpfulness
    helpfulCount: { type: Number, default: 0 },
    helpfulUsers: { type: [Types.ObjectId], ref: "User", default: [] },
    
    // Verification
    isVerifiedAttendance: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    reportedCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false }
  },
  { timestamps: true }
);

FeedbackSchema.index({ toUserId: 1, createdAt: -1 });
// Allow rating multiple people for the same event (e.g. host + co-guests),
// while still preventing duplicate ratings for the same target.
FeedbackSchema.index({ eventSlotId: 1, fromUserId: 1, toUserId: 1 }, { unique: true });

export type FeedbackDoc = InferSchemaType<typeof FeedbackSchema>;
export const Feedback = models.Feedback || model("Feedback", FeedbackSchema);

