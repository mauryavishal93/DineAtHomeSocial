import { apiFetch } from "@/lib/http";
import { loadRazorpayScript } from "@/lib/razorpay-checkout";

export type GuestCheckoutOutcome = "paid" | "dismissed" | "verify_failed";

/**
 * Opens Razorpay Checkout for a server-created order, verifies on success,
 * and releases seats / add-on on dismiss (per abandonMode).
 */
export async function openGuestCheckoutAndVerify(opts: {
  token: string;
  bookingId: string;
  paymentId: string;
  amountPaise: number;
  razorpayOrderId: string;
  razorpayKeyId: string;
  /** Full booking still unpaid — abandon deletes booking. Add-on — only rolls back extra seats. */
  abandonMode: "full" | "addon";
  prefill?: { name?: string; email?: string; contact?: string };
}): Promise<GuestCheckoutOutcome> {
  await loadRazorpayScript();

  const RazorpayCtor = (window as unknown as { Razorpay?: new (o: Record<string, unknown>) => { open: () => void } })
    .Razorpay;
  if (!RazorpayCtor) {
    return "verify_failed";
  }

  return new Promise((resolve) => {
    const instance = new RazorpayCtor({
      key: opts.razorpayKeyId,
      amount: opts.amountPaise,
      currency: "INR",
      name: "DineAtHome",
      description: "Event booking",
      order_id: opts.razorpayOrderId,
      prefill: opts.prefill ?? {},
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const v = await apiFetch<{ success?: boolean }>("/api/payments/razorpay-verify", {
          method: "POST",
          headers: { authorization: `Bearer ${opts.token}` },
          body: JSON.stringify({
            bookingId: opts.bookingId,
            paymentId: opts.paymentId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        });
        if (v.ok) resolve("paid");
        else {
          const err = !v.ok ? v.error : "Verification failed";
          alert(typeof err === "string" ? err : "Verification failed");
          resolve("verify_failed");
        }
      },
      modal: {
        ondismiss: async () => {
          if (opts.abandonMode === "addon") {
            await apiFetch(`/api/bookings/${opts.bookingId}/abandon-pending`, {
              method: "POST",
              headers: {
                authorization: `Bearer ${opts.token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ paymentId: opts.paymentId })
            });
          } else {
            await apiFetch(`/api/bookings/${opts.bookingId}/abandon-pending`, {
              method: "POST",
              headers: { authorization: `Bearer ${opts.token}` }
            });
          }
          resolve("dismissed");
        }
      },
      theme: { color: "#7c3aed" }
    });
    instance.open();
  });
}
