import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const CommunitySchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      required: true,
      enum: ["CUISINE", "LIFESTYLE", "DIETARY", "ACTIVITY", "DEMOGRAPHIC", "OTHER"]
    },
    tags: { type: [String], default: [] }, // ["vegan", "delhi", "weekend"]
    creatorUserId: { type: Types.ObjectId, ref: "User", required: true },
    moderators: { type: [Types.ObjectId], ref: "User", default: [] },
    members: { type: [Types.ObjectId], ref: "User", default: [] },
    memberCount: { type: Number, default: 0 },
    isPrivate: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" },
    rules: { type: String, default: "" },
    // Exclusive events for community members
    exclusiveEvents: { type: [Types.ObjectId], ref: "EventSlot", default: [] },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

CommunitySchema.index({ category: 1, isActive: 1 });
CommunitySchema.index({ tags: 1 });

export type CommunityDoc = InferSchemaType<typeof CommunitySchema>;
export const Community = models.Community || model("Community", CommunitySchema);
