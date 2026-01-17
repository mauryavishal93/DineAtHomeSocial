import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const EventPhotoSchema = new Schema(
  {
    eventSlotId: { type: Types.ObjectId, ref: "EventSlot", required: true, index: true },
    uploadedBy: { type: Types.ObjectId, ref: "User", required: true },
    uploaderRole: { type: String, required: true, enum: ["HOST", "GUEST"] },
    imageUrl: { type: String, required: true },
    caption: { type: String, default: "" },
    tags: { type: [Types.ObjectId], ref: "User", default: [] }, // tagged users
    likes: { type: [Types.ObjectId], ref: "User", default: [] },
    likeCount: { type: Number, default: 0 },
    isContestEntry: { type: Boolean, default: false },
    contestMonth: { type: String, default: "" }, // "2026-01"
    isApproved: { type: Boolean, default: true }, // host approval for guest photos
    isPublic: { type: Boolean, default: true }
  },
  { timestamps: true }
);

EventPhotoSchema.index({ eventSlotId: 1, createdAt: -1 });
EventPhotoSchema.index({ isContestEntry: 1, contestMonth: 1, likeCount: -1 });

export type EventPhotoDoc = InferSchemaType<typeof EventPhotoSchema>;
export const EventPhoto = models.EventPhoto || model("EventPhoto", EventPhotoSchema);
