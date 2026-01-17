import { Schema, model, models, type InferSchemaType, Types } from "mongoose";
import type { BookingStatus, GuestType } from "@/server/models/_types";

const BookingSchema = new Schema(
  {
    eventSlotId: { type: Types.ObjectId, ref: "EventSlot", required: true, index: true },
    venueId: { type: Types.ObjectId, ref: "Venue", required: true, index: true },
    hostUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    guestUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    guestTypeAtBooking: {
      type: String,
      required: true,
      enum: ["BASIC", "PREMIUM"] satisfies GuestType[]
    },
    seats: { type: Number, required: true, default: 1 },
    pricePerSeat: { type: Number, required: true },
    amountTotal: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      default: "PAYMENT_PENDING",
      enum: ["PAYMENT_PENDING", "CONFIRMED", "CANCELLED", "REFUND_REQUIRED"] satisfies BookingStatus[]
    },
    paymentId: { type: Types.ObjectId, ref: "Payment", default: null },
  // Primary guest details (booking user)
  guestName: { type: String, required: true },
  guestMobile: { type: String, required: true },
  guestAge: { type: Number, required: true },
  guestGender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
  
  // Additional guests (for bookings with multiple seats)
  additionalGuests: {
    type: [{
      name: { type: String, required: true },
      mobile: { type: String, required: true },
      age: { type: Number, required: true },
      gender: { type: String, required: true, enum: ["Male", "Female", "Other"] }
    }],
    default: []
  },
  
  // Ratings for additional guests (stored in booking since they don't have userIds)
  additionalGuestRatings: {
    type: [{
      guestIndex: { type: Number, required: true },
      punctualityRating: { type: Number, min: 1, max: 5 },
      appearanceRating: { type: Number, min: 1, max: 5 },
      communicationRating: { type: Number, min: 1, max: 5 },
      behaviorRating: { type: Number, min: 1, max: 5 },
      engagementRating: { type: Number, min: 1, max: 5 },
      overallPresenceRating: { type: Number, min: 1, max: 5 },
      comment: { type: String, default: "" },
      ratedBy: { type: Types.ObjectId, ref: "User" },
      ratedAt: { type: Date, default: () => new Date() }
    }],
    default: []
  }
  },
  { timestamps: true }
);

BookingSchema.index({ guestUserId: 1, createdAt: -1 });

export type BookingDoc = InferSchemaType<typeof BookingSchema>;
export const Booking = models.Booking || model("Booking", BookingSchema);

