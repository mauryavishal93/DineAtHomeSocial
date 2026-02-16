import { Schema, model, models, type InferSchemaType } from "mongoose";
import type { AccountStatus, Role } from "@/server/models/_types";

const RefreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date(), required: true },
    lastUsedAt: { type: Date, default: () => new Date(), required: true }
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    mobile: { type: String, required: false, index: true },
    passwordHash: { type: String, required: false },
    googleId: { type: String, required: false, unique: true, sparse: true, index: true },
    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "HOST", "GUEST"] satisfies Role[]
    },
    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "VERIFIED", "ACTIVE", "SUSPENDED"] satisfies AccountStatus[]
    },
    refreshTokens: { type: [RefreshTokenSchema], default: [] }
  },
  { timestamps: true }
);

UserSchema.pre("save", function normalizeEmail(next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const doc = this as InferSchemaType<typeof UserSchema>;
  doc.email = doc.email.trim().toLowerCase();
  next();
});

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User = models.User || model("User", UserSchema);

