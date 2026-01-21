import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        "BOOKING_CONFIRMED",
        "BOOKING_CANCELLED",
        "EVENT_REMINDER",
        "NEW_MESSAGE",
        "EVENT_APPROVED",
        "EVENT_REJECTED",
        "PAYMENT_RECEIVED",
        "GUEST_RATED",
        "HOST_RATED",
        "EVENT_FULL",
        "SEAT_AVAILABLE",
        "EVENT_CANCELLED"
      ]
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEventId: { type: Types.ObjectId, ref: "EventSlot", index: true },
    relatedBookingId: { type: Types.ObjectId, ref: "Booking", index: true },
    relatedUserId: { type: Types.ObjectId, ref: "User", index: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof NotificationSchema>;
export const Notification = models.Notification || model("Notification", NotificationSchema);
