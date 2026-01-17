import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const AdminActionSchema = new Schema(
  {
    adminUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    actionType: { type: String, required: true }, // VERIFY_USER, SUSPEND_USER, REJECT_DOC, SET_PRICING_RULE
    targetUserId: { type: Types.ObjectId, ref: "User", required: false, index: true },
    metadata: { type: Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

export type AdminActionDoc = InferSchemaType<typeof AdminActionSchema>;
export const AdminAction =
  models.AdminAction || model("AdminAction", AdminActionSchema);

