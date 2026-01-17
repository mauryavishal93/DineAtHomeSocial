import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const EventTemplateSchema = new Schema(
  {
    hostUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    templateName: { type: String, required: true },
    description: { type: String, default: "" },
    
    // Saved event details
    eventName: { type: String, required: true },
    theme: { type: String, default: "" },
    eventFormat: { type: String, default: "STANDARD" },
    eventCategory: { type: String, default: "SOCIAL" },
    durationHours: { type: Number, required: true },
    maxGuests: { type: Number, required: true },
    cuisines: { type: [String], default: [] },
    foodTags: { type: [String], default: [] },
    gamesAvailable: { type: [String], default: [] },
    menuCourses: { type: Schema.Types.Mixed, default: {} },
    allergenFreeKitchen: { type: [String], default: [] },
    certifiedLabels: { type: [String], default: [] },
    basePricePerGuest: { type: Number, required: true },
    
    // Usage stats
    usageCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

EventTemplateSchema.index({ hostUserId: 1, isActive: 1 });

export type EventTemplateDoc = InferSchemaType<typeof EventTemplateSchema>;
export const EventTemplate = models.EventTemplate || model("EventTemplate", EventTemplateSchema);
