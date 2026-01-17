import { Schema, model, models, type InferSchemaType, Types } from "mongoose";
import type { EventStatus, GuestType } from "@/server/models/_types";

const EventSlotSchema = new Schema(
  {
    hostUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    venueId: { type: Types.ObjectId, ref: "Venue", required: true, index: true },
    eventName: { type: String, required: true },
    theme: { type: String, default: "" },
    eventFormat: { 
      type: String, 
      default: "STANDARD",
      enum: ["STANDARD", "SPEED_DINING", "CULTURAL_NIGHT", "COOKING_TOGETHER", "MYSTERY_MENU", "DEBATE_DINNER", "TALENT_SHOWCASE", "SKILLS_AND_MEALS", "BLIND_DATE", "GENERATIONAL_MIX"]
    },
    eventCategory: {
      type: String,
      default: "SOCIAL",
      enum: ["SOCIAL", "CORPORATE", "SPECIAL_OCCASION", "VIRTUAL", "FESTIVAL", "NETWORKING"]
    },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    minGuests: { type: Number, default: 10 },
    maxGuests: { type: Number, required: true },
    seatsRemaining: { type: Number, required: true },
    foodType: { type: String, default: "" },
    cuisines: { type: [String], default: [] },
    foodTags: { type: [String], default: [] },
    gamesAvailable: { type: [String], default: [] },
    
    // Multi-course menu tracking
    menuCourses: {
      type: new Schema({
        starter: { type: String, default: "" },
        main: { type: String, default: "" },
        dessert: { type: String, default: "" },
        beverages: { type: String, default: "" },
        specialNotes: { type: String, default: "" }
      }, { _id: false }),
      default: {}
    },
    
    // Dietary & allergen info
    allergenFreeKitchen: { type: [String], default: [] }, // ["nuts", "gluten", "dairy"]
    certifiedLabels: { type: [String], default: [] }, // ["jain", "kosher", "halal", "vegan"]
    
    // Pricing
    basePricePerGuest: { type: Number, required: true },
    earlyBirdPrice: { type: Number, default: 0 }, // for bookings 2+ weeks ahead
    earlyBirdDeadline: { type: Date, default: null },
    lastMinutePrice: { type: Number, default: 0 }, // for bookings <48hrs
    groupDiscountThreshold: { type: Number, default: 4 }, // minimum guests for discount
    groupDiscountPercent: { type: Number, default: 0 },
    priceByGuestType: {
      type: new Schema(
        {
          BASIC: Number,
          PREMIUM: Number,
          VIP: Number
        },
        { _id: false }
      ),
      default: {}
    },
    
    // Waitlist
    waitlistEnabled: { type: Boolean, default: true },
    waitlistCount: { type: Number, default: 0 },
    
    // Event features
    photoGalleryEnabled: { type: Boolean, default: true },
    chatEnabled: { type: Boolean, default: true },
    isRecurring: { type: Boolean, default: false },
    recurringPattern: { type: String, default: "" }, // "WEEKLY_SATURDAY", "MONTHLY_FIRST_SUNDAY"
    templateId: { type: Types.ObjectId, ref: "EventTemplate", default: null },
    
    // Status
    status: {
      type: String,
      required: true,
      default: "OPEN",
      enum: ["OPEN", "FULL", "COMPLETED", "CANCELLED"] satisfies EventStatus[]
    },
    guestList: { type: [Types.ObjectId], ref: "User", default: [] },
    allowedGuestTypes: {
      type: [String],
      default: ["BASIC", "PREMIUM", "VIP"],
      enum: ["BASIC", "PREMIUM", "VIP"] satisfies GuestType[]
    },
    
    // Special features
    isVirtualEvent: { type: Boolean, default: false },
    virtualEventLink: { type: String, default: "" },
    isFestivalSpecial: { type: Boolean, default: false },
    festivalName: { type: String, default: "" },
    
    // Event media (images and videos)
    images: {
      type: [{
        filePath: { type: String, required: true },
        fileMime: { type: String, required: true },
        fileName: { type: String, required: true },
        uploadedAt: { type: Date, default: () => new Date() }
      }],
      default: []
    },
    videos: {
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

EventSlotSchema.index({ venueId: 1, startAt: 1 });
EventSlotSchema.index({ status: 1, startAt: 1 });

export type EventSlotDoc = InferSchemaType<typeof EventSlotSchema>;
export const EventSlot = models.EventSlot || model("EventSlot", EventSlotSchema);

