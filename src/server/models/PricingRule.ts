import { Schema, model, models, type InferSchemaType } from "mongoose";
import type { GuestType } from "@/server/models/_types";

const PricingRuleSchema = new Schema(
  {
    guestType: {
      type: String,
      required: true,
      unique: true,
      enum: ["BASIC", "PREMIUM"] satisfies GuestType[]
    },
    multiplier: { type: Number, required: true, default: 1 },
    flatFee: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export type PricingRuleDoc = InferSchemaType<typeof PricingRuleSchema>;
export const PricingRule =
  models.PricingRule || model("PricingRule", PricingRuleSchema);

