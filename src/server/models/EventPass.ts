import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const EventPassSchema = new Schema(
  {
    bookingId: { type: Types.ObjectId, ref: "Booking", required: true },
    eventSlotId: { type: Types.ObjectId, ref: "EventSlot", required: true, index: true },
    guestUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    hostUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    
    // Unique event code (e.g., "EVT-ABC123-XYZ789")
    eventCode: { 
      type: String, 
      required: true, 
      uppercase: true
    },
    
    // Guest details for this pass
    guestName: { type: String, required: true },
    guestMobile: { type: String, required: true },
    guestAge: { type: Number, required: true },
    guestGender: { type: String, required: true },
    
    // Pass type: PRIMARY (booking user) or ADDITIONAL (additional guest)
    passType: {
      type: String,
      required: true,
      enum: ["PRIMARY", "ADDITIONAL"],
      default: "PRIMARY"
    },
    
    // Additional guest index (if passType is ADDITIONAL)
    additionalGuestIndex: { type: Number, default: null },
    
    // Validity
    isValid: { type: Boolean, default: true, index: true },
    validatedAt: { type: Date, default: null },
    validatedBy: { type: Types.ObjectId, ref: "User", default: null },
    
    // Email sent status
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Indexes for fast lookups
EventPassSchema.index({ eventSlotId: 1, isValid: 1 });
EventPassSchema.index({ bookingId: 1 });
EventPassSchema.index({ eventCode: 1 }, { unique: true });

export type EventPassDoc = InferSchemaType<typeof EventPassSchema>;
export const EventPass = models.EventPass || model("EventPass", EventPassSchema);
