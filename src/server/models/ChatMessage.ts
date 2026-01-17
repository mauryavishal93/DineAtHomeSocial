import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    eventSlotId: { type: Types.ObjectId, ref: "EventSlot", required: true, index: true },
    senderUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true, enum: ["HOST", "GUEST"] },
    message: { type: String, required: true },
    messageType: {
      type: String,
      default: "TEXT",
      enum: ["TEXT", "IMAGE", "LOCATION", "SYSTEM"]
    },
    imageUrl: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
    readBy: { type: [Types.ObjectId], ref: "User", default: [] }
  },
  { timestamps: true }
);

ChatMessageSchema.index({ eventSlotId: 1, createdAt: -1 });
ChatMessageSchema.index({ senderUserId: 1, eventSlotId: 1 });

export type ChatMessageDoc = InferSchemaType<typeof ChatMessageSchema>;
export const ChatMessage = models.ChatMessage || model("ChatMessage", ChatMessageSchema);
