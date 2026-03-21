import { ok } from "@/server/http/response";
import { getRazorpayKeyIdPublic, isRazorpayConfigured } from "@/server/payments/razorpay";

export const runtime = "nodejs";

/**
 * Public Key ID for Razorpay Checkout on the client.
 * The Key ID is not secret; the Key Secret must stay server-only.
 */
export async function GET() {
  const keyId = getRazorpayKeyIdPublic();
  return ok({
    keyId,
    configured: isRazorpayConfigured()
  });
}
