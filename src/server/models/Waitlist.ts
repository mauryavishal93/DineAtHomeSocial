import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const WaitlistSchema = new Schema(
  {
    eventSlotId: { type: Types.ObjectId, ref: "EventSlot", required: true, index: true },
    guestUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    seatsRequested: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      required: true,
      default: "WAITING",
      enum: ["WAITING", "NOTIFIED", "EXPIRED", "CONVERTED"]
    },
    priority: { type: Number, default: 0 }, // returning guests get higher priority
    notifiedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null }, // notification expires after 24hrs
    isReturningGuest: { type: Boolean, default: false }
  },
  { timestamps: true }
);

WaitlistSchema.index({ eventSlotId: 1, status: 1, priority: -1, createdAt: 1 });
WaitlistSchema.index({ guestUserId: 1, status: 1 });

export type WaitlistDoc = InferSchemaType<typeof WaitlistSchema>;
export const Waitlist = models.Waitlist || model("Waitlist", WaitlistSchema);
