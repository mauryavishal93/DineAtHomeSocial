import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "@/server/env";

let client: Razorpay | null = null;

/** True when both Key ID and Key Secret are set (server can create orders / verify). */
export function isRazorpayConfigured(): boolean {
  return Boolean(
    env.RAZORPAY_KEY_ID?.trim() && env.RAZORPAY_KEY_SECRET?.trim()
  );
}

/**
 * Razorpay server client. Never import this in client components.
 * @throws if keys are missing
 */
export function getRazorpay(): Razorpay {
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local (see docs/env.example)."
    );
  }
  if (!client) {
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return client;
}

/** Key ID is safe to expose to the browser (used by Razorpay Checkout). */
export function getRazorpayKeyIdPublic(): string | null {
  const id = env.RAZORPAY_KEY_ID?.trim();
  return id || null;
}

/**
 * Create a Razorpay order (amount in paise, currency INR).
 * Call from an authenticated API route after you validate the booking.
 */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const rz = getRazorpay();
  const order = await rz.orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.receipt.slice(0, 40),
    notes: params.notes
  });
  return order as { id: string; amount: number; currency: string; receipt: string };
}

/** Verify payment signature from Razorpay Checkout `handler` response. */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
