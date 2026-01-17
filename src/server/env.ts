
import { z } from "zod";

// During `next build`, Next sets NODE_ENV=production, but we still want the build
// to succeed even if runtime secrets are not present on the build machine.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const isProdRuntime = process.env.NODE_ENV === "production" && !isBuild;

const envSchema = z.object({
  // In dev, default to local DB so the app boots without a .env.local.
  // In prod, keep this strictly required.
  MONGODB_URI: isProdRuntime
    ? z.string().min(1)
    : z.string().min(1).default("mongodb://localhost:27017/dineathome_dev"),

  // In dev, provide defaults so local APIs (like /api/db/init) can run.
  // In prod, keep secrets required.
  JWT_ACCESS_SECRET: isProdRuntime
    ? z.string().min(16)
    : z.string().min(16).default("dev_access_secret_change_me_please_12345"),
  JWT_REFRESH_SECRET: isProdRuntime
    ? z.string().min(16)
    : z.string().min(16).default("dev_refresh_secret_change_me_please_12345"),

  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  UPLOAD_DIR: z.string().default("./uploads")
});

export const env = envSchema.parse(process.env);

