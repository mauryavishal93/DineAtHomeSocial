import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

const SupportTicketSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: "OPEN",
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] satisfies SupportTicketStatus[]
    },
    createdAt: { type: Date, default: () => new Date(), required: true }
  },
  { timestamps: true }
);

SupportTicketSchema.index({ status: 1, createdAt: -1 });

export type SupportTicketDoc = InferSchemaType<typeof SupportTicketSchema>;
export const SupportTicket = models.SupportTicket || model("SupportTicket", SupportTicketSchema);

