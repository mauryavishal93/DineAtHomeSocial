import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { ok, createResponse } from "@/server/http/response";
import {
  releasePendingAddonPayment,
  releaseUnpaidBooking
} from "@/server/services/bookingPaymentSideEffects";

export const runtime = "nodejs";

/** Call when guest closes Razorpay without paying — frees seats. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    const { bookingId } = await params;

    let addonPaymentId: string | undefined;
    try {
      const body = await req.json().catch(() => null) as { paymentId?: string } | null;
      addonPaymentId =
        typeof body?.paymentId === "string" && body.paymentId.length > 0 ? body.paymentId : undefined;
    } catch {
      addonPaymentId = undefined;
    }

    if (addonPaymentId) {
      const addonResult = await releasePendingAddonPayment(bookingId, addonPaymentId, ctx.userId);
      if (!addonResult.ok) {
        return createResponse(
          { error: addonResult.error },
          { status: addonResult.error === "Unauthorized" ? 403 : 400 }
        );
      }
      return ok({ released: true });
    }

    const result = await releaseUnpaidBooking(bookingId, ctx.userId);
    if (!result.ok) {
      return createResponse({ error: result.error }, { status: result.error === "Unauthorized" ? 403 : 400 });
    }
    return ok({ released: true });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
