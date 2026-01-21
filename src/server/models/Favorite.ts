import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const FavoriteSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    favoriteType: {
      type: String,
      required: true,
      enum: ["EVENT", "HOST"]
    },
    eventId: { 
      type: Types.ObjectId, 
      ref: "EventSlot",
      required: function(this: any) { return this.favoriteType === "EVENT"; }
    },
    hostUserId: { 
      type: Types.ObjectId, 
      ref: "User",
      required: function(this: any) { return this.favoriteType === "HOST"; }
    }
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, favoriteType: 1 });
FavoriteSchema.index({ userId: 1, eventId: 1 });
FavoriteSchema.index({ userId: 1, hostUserId: 1 });
FavoriteSchema.index({ userId: 1, favoriteType: 1, createdAt: -1 });

// Prevent duplicates
FavoriteSchema.index({ userId: 1, eventId: 1 }, { unique: true, sparse: true });
FavoriteSchema.index({ userId: 1, hostUserId: 1 }, { unique: true, sparse: true });

export type FavoriteDoc = InferSchemaType<typeof FavoriteSchema>;
export const Favorite = models.Favorite || model("Favorite", FavoriteSchema);
