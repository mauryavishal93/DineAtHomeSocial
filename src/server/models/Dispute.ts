import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

export type DisputeType =
  | "HOST_NO_SHOW"
  | "EVENT_CANCELLED"
  | "VENUE_ISSUE"
  | "FRAUD"
  | "PAYMENT_ISSUE"
  | "SERVICE_QUALITY"
  | "OTHER";

export type DisputeStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED" | "ESCALATED";

const EvidenceSchema = new Schema(
  {
    filePath: { type: String, required: true },
    fileMime: { type: String, required: true },
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: () => new Date() },
    uploadedBy: { type: Types.ObjectId, ref: "User", required: true }
  },
  { _id: false }
);

const DisputeSchema = new Schema(
  {
    bookingId: { type: Types.ObjectId, ref: "Booking", required: true, index: true },
    eventSlotId: { type: Types.ObjectId, ref: "EventSlot", required: true, index: true },
    hostUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    guestUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    disputeType: {
      type: String,
      required: true,
      enum: ["HOST_NO_SHOW", "EVENT_CANCELLED", "VENUE_ISSUE", "FRAUD", "PAYMENT_ISSUE", "SERVICE_QUALITY", "OTHER"]
    },
    status: {
      type: String,
      required: true,
      default: "OPEN",
      enum: ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED", "ESCALATED"]
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    evidence: { type: [EvidenceSchema], default: [] },
    requestedRefund: { type: Number, default: 0 }, // in paise
    resolvedRefund: { type: Number, default: 0 }, // in paise (admin decision)
    resolution: { type: String, default: "" }, // Admin resolution notes
    resolvedBy: { type: Types.ObjectId, ref: "Admin", default: null },
    resolvedAt: { type: Date, default: null },
    slaDeadline: { type: Date, default: null }, // Time-based SLA
    priority: { type: String, default: "MEDIUM", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
    tags: { type: [String], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

DisputeSchema.index({ status: 1, createdAt: -1 });
DisputeSchema.index({ guestUserId: 1, status: 1 });
DisputeSchema.index({ hostUserId: 1, status: 1 });
DisputeSchema.index({ disputeType: 1, status: 1 });

export type DisputeDoc = InferSchemaType<typeof DisputeSchema>;
export const Dispute = models.Dispute || model("Dispute", DisputeSchema);
