import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const AdminActionSchema = new Schema(
  {
    adminUserId: { type: Types.ObjectId, ref: "Admin", required: true, index: true },
    adminUsername: { type: String, required: true },
    actionType: { type: String, required: true }, // VERIFY_USER, SUSPEND_USER, APPROVE_EVENT, CANCEL_BOOKING, PROCESS_REFUND, etc.
    targetType: { type: String, default: "USER" }, // USER, EVENT, BOOKING, PAYMENT, VENUE, REVIEW
    targetId: { type: Types.ObjectId, required: false, index: true },
    targetUserId: { type: Types.ObjectId, ref: "User", required: false, index: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

export type AdminActionDoc = InferSchemaType<typeof AdminActionSchema>;
export const AdminAction =
  models.AdminAction || model("AdminAction", AdminActionSchema);

