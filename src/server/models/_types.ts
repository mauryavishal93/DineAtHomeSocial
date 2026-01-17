import type { Types } from "mongoose";

export type ObjectId = Types.ObjectId;

export type Role = "ADMIN" | "HOST" | "GUEST";
export type AccountStatus = "PENDING" | "VERIFIED" | "ACTIVE" | "SUSPENDED";

export type GuestType = "BASIC" | "PREMIUM" | "VIP";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type BookingStatus =
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "REFUND_REQUIRED";

export type EventStatus = "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";

