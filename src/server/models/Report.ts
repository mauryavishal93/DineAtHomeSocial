import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

export type ReportType = "USER" | "EVENT" | "REVIEW" | "MESSAGE";
export type ReportStatus = "PENDING" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";

const ReportSchema = new Schema(
  {
    reporterUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    reportType: {
      type: String,
      required: true,
      enum: ["USER", "EVENT", "REVIEW", "MESSAGE"] satisfies ReportType[]
    },

    reportedUserId: { type: Types.ObjectId, ref: "User", default: null, index: true },
    reportedEventId: { type: Types.ObjectId, ref: "EventSlot", default: null, index: true },
    reportedReviewId: { type: Types.ObjectId, default: null, index: true },
    reportedMessageId: { type: Types.ObjectId, ref: "ChatMessage", default: null, index: true },

    reason: { type: String, required: true },
    description: { type: String, default: "" },
    evidence: { type: [String], default: [] },

    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "IN_REVIEW", "RESOLVED", "DISMISSED"] satisfies ReportStatus[]
    },
    resolvedAt: { type: Date, default: null },
    resolutionNote: { type: String, default: "" }
  },
  { timestamps: true }
);

ReportSchema.index({ reporterUserId: 1, createdAt: -1 });
ReportSchema.index({ reportType: 1, status: 1, createdAt: -1 });

export type ReportDoc = InferSchemaType<typeof ReportSchema>;
export const Report = models.Report || model("Report", ReportSchema);

