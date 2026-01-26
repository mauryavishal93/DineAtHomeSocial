import { useEffect } from "react";

const LAST_UPDATED = "January 26, 2026";

export default function RefundCancellationPolicy() {
  useEffect(() => {
    document.title = "Refuns&Cancellation Policy | DineAtHome Social";
    return () => {
      document.title = "DineAtHome Social";
    };
  }, []);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 pb-20 sm:py-16 sm:pb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Refuns&amp;Cancellation Policy
        </h1>
        <p className="mt-2 text-sm text-ink-600">Last Updated: {LAST_UPDATED}</p>
      </header>

      <p className="mb-10 max-w-none text-ink-700 leading-relaxed">
        This Refund &amp; Cancellation Policy explains the rules for cancellations,
        refunds, and no-shows for bookings made on DineAtHomeSocial. By booking or
        hosting a meal or event on our platform, you agree to this policy.
      </p>

      <div className="max-w-none space-y-8 text-ink-700">
        <section id="general-policy-overview">
          <h2 className="text-xl font-semibold text-ink-900">
            1. General Policy Overview
          </h2>
          <div className="mt-2 space-y-2 leading-relaxed">
            <p>
              DineAtHomeSocial connects Hosts and Guests for paid home-dining
              experiences. Refunds and cancellations are handled based on the
              timing of the cancellation and the applicable policy.
            </p>
            <p>All refunds are processed through the original payment method.</p>
          </div>
        </section>

        <section id="guest-cancellation-policy">
          <h2 className="text-xl font-semibold text-ink-900">
            2. Guest Cancellation Policy
          </h2>
          <h3 className="mt-2 font-semibold text-ink-900">
            a. Cancellation by Guests
          </h3>
          <p className="mt-2 leading-relaxed">
            Guests may cancel their booking according to the following timelines:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>
              48 hours or more before the event: ✔ Full refund (excluding platform
              service fees, if any)
            </li>
            <li>24 to 48 hours before the event: ✔ 50% refund</li>
            <li>Less than 24 hours before the event: ✖ No refund</li>
          </ul>
        </section>

        <section id="host-cancellation-policy">
          <h2 className="text-xl font-semibold text-ink-900">
            3. Host Cancellation Policy
          </h2>
          <h3 className="mt-2 font-semibold text-ink-900">
            a. Cancellation by Hosts
          </h3>
          <div className="mt-2 space-y-2 leading-relaxed">
            <p>If a host cancels a confirmed booking:</p>
            <p>Guests will receive a full refund</p>
            <p>Host may face penalties such as:</p>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Reduced listing visibility</li>
            <li>Temporary suspension</li>
            <li>Account review for repeated cancellations</li>
          </ul>
        </section>

        <section id="no-show-policy">
          <h2 className="text-xl font-semibold text-ink-900">4. No-Show Policy</h2>

          <h3 className="mt-2 font-semibold text-ink-900">a. Guest No-Show</h3>
          <p className="mt-2 leading-relaxed">
            If a guest does not arrive at the event without prior cancellation:
          </p>
          <p className="mt-2 leading-relaxed">No refund will be issued</p>

          <h3 className="mt-4 font-semibold text-ink-900">b. Host No-Show</h3>
          <p className="mt-2 leading-relaxed">
            If a host fails to conduct the event:
          </p>
          <p className="mt-2 leading-relaxed">Guest will receive a full refund</p>
          <p className="mt-2 leading-relaxed">Host may face account action</p>
        </section>

        <section id="exceptional-circumstances">
          <h2 className="text-xl font-semibold text-ink-900">
            5. Exceptional Circumstances
          </h2>
          <p className="mt-2 leading-relaxed">In rare cases such as:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Medical emergencies</li>
            <li>Natural disasters</li>
            <li>Government restrictions</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            DineAtHomeSocial may review the situation and decide on partial or full
            refunds at its discretion.
          </p>
        </section>

        <section id="refund-processing-timeline">
          <h2 className="text-xl font-semibold text-ink-900">
            6. Refund Processing Timeline
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Approved refunds are processed within 5–7 business days</li>
            <li>Refund time may vary depending on payment provider or bank</li>
          </ul>
        </section>

        <section id="platform-fees-taxes">
          <h2 className="text-xl font-semibold text-ink-900">
            7. Platform Fees &amp; Taxes
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Platform service fees may be non-refundable unless stated otherwise</li>
            <li>Taxes (if applicable) will be refunded as per legal requirements</li>
          </ul>
        </section>

        <section id="dispute-resolution">
          <h2 className="text-xl font-semibold text-ink-900">
            8. Dispute Resolution
          </h2>
          <p className="mt-2 leading-relaxed">
            If there is a disagreement regarding a refund:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Users can contact customer support</li>
            <li>DineAtHomeSocial reserves the right to make the final decision</li>
          </ul>
        </section>

        <section id="changes-to-this-policy">
          <h2 className="text-xl font-semibold text-ink-900">
            9. Changes to This Policy
          </h2>
          <div className="mt-2 space-y-2 leading-relaxed">
            <p>We may update this policy from time to time.</p>
            <p>Changes will be effective once posted on this page.</p>
          </div>
        </section>

        <section id="contact-us">
          <h2 className="text-xl font-semibold text-ink-900">10. Contact Us</h2>
          <p className="mt-2 leading-relaxed">
            For cancellation or refund questions, please contact:
          </p>
          <p className="mt-2 leading-relaxed">
            Email:{" "}
            <a
              href="mailto:support@dineathomesocial.com"
              className="font-medium text-ink-900 underline hover:no-underline"
            >
              support@dineathomesocial.com
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}

