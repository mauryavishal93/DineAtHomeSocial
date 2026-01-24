import { Schema, model, models, type InferSchemaType } from "mongoose";

const SystemConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    category: { type: String, default: "GENERAL" }, // GENERAL, FINANCIAL, VERIFICATION, BOOKING, etc.
    description: { type: String, default: "" },
    updatedBy: { type: String, default: "" }, // Admin username
    updatedAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true }
);

export type SystemConfigDoc = InferSchemaType<typeof SystemConfigSchema>;
export const SystemConfig = models.SystemConfig || model("SystemConfig", SystemConfigSchema);

// Default system configuration values
export const DEFAULT_CONFIG = {
  COMMISSION_RATE: 0.20, // 20%
  HOST_REGISTRATION_FEE: 50000, // 500 INR in paise
  BOOKING_TIMEOUT_MINUTES: 15,
  REFUND_POLICY_HOURS: 24,
  MIN_WITHDRAWAL_AMOUNT: 10000, // 100 INR in paise
  MAX_WITHDRAWAL_AMOUNT: 10000000, // 100,000 INR in paise
  DISPUTE_SLA_HOURS: 48,
  VERIFICATION_REQUIRED: true,
  AUTO_APPROVE_EVENTS: false
};
