import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const VenueSchema = new Schema(
  {
    hostUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String, default: "" },
    foodCategories: { type: [String], default: [] },
    gamesAvailable: { type: [String], default: [] },
    locality: { type: String, default: "", index: true },
    geo: {
      type: new Schema(
        {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: { type: [Number], default: [0, 0] } // [lng,lat]
        },
        { _id: false }
      ),
      default: undefined
    },
    
    // Venue images
    images: {
      type: [{
        filePath: { type: String, required: true },
        fileMime: { type: String, required: true },
        fileName: { type: String, required: true },
        uploadedAt: { type: Date, default: () => new Date() }
      }],
      default: []
    }
  },
  { timestamps: true }
);

VenueSchema.index({ geo: "2dsphere" });

export type VenueDoc = InferSchemaType<typeof VenueSchema>;
export const Venue = models.Venue || model("Venue", VenueSchema);

