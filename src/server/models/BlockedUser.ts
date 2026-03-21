import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const BlockedUserSchema = new Schema(
  {
    blockerUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    blockedUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    blockedAt: { type: Date, default: () => new Date(), required: true }
  },
  { timestamps: true }
);

BlockedUserSchema.index({ blockerUserId: 1, blockedUserId: 1 }, { unique: true });
BlockedUserSchema.index({ blockerUserId: 1, blockedAt: -1 });

export type BlockedUserDoc = InferSchemaType<typeof BlockedUserSchema>;
export const BlockedUser = models.BlockedUser || model("BlockedUser", BlockedUserSchema);

