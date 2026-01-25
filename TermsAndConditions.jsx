import { useEffect } from "react";

const LAST_UPDATED = "January 25, 2025";

export default function TermsAndConditions() {
  useEffect(() => {
    document.title = "Terms & Conditions | DineAtHome Social";
    return () => {
      document.title = "DineAtHome Social";
    };
  }, []);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 pb-20 sm:py-16 sm:pb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Last Updated: {LAST_UPDATED}
        </p>
      </header>

      <p className="mb-10 max-w-none text-ink-700 leading-relaxed">
        Welcome to DineAtHomeSocial. By accessing or using our website, mobile application, or services, you agree to comply with and be bound by these Terms & Conditions. Please read them carefully before using the platform.
      </p>

      <div className="max-w-none space-y-8 text-ink-700">
        <section id="about-dineathomesocial">
          <h2 className="text-xl font-semibold text-ink-900">1. About DineAtHomeSocial</h2>
          <div className="mt-2 space-y-2 leading-relaxed">
            <p>
              DineAtHomeSocial is an online platform that connects Hosts who offer paid meals or social dining experiences at their homes with Guests who wish to book those experiences.
            </p>
            <p>
              We act only as a technology platform and do not prepare, cook, serve, or deliver food.
            </p>
          </div>
        </section>

        <section id="eligibility">
          <h2 className="text-xl font-semibold text-ink-900">2. Eligibility</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>You must be 18 years or older to use the platform.</li>
            <li>You agree to provide accurate and complete information during registration.</li>
            <li>Only one account is permitted per user.</li>
          </ul>
        </section>

        <section id="user-accounts">
          <h2 className="text-xl font-semibold text-ink-900">3. User Accounts</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>Any activity performed through your account is your responsibility.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </section>

        <section id="platform-role-disclaimer">
          <h2 className="text-xl font-semibold text-ink-900">4. Platform Role & Disclaimer</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>DineAtHomeSocial does not own, operate, or control any host kitchens or events.</li>
            <li>Hosts are solely responsible for food quality, hygiene, safety, and compliance with local laws.</li>
            <li>Guests participate in dining experiences at their own discretion and risk.</li>
          </ul>
        </section>

        <section id="bookings-payments">
          <h2 className="text-xl font-semibold text-ink-900">5. Bookings & Payments</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>All bookings must be made through the DineAtHomeSocial platform.</li>
            <li>Payments are processed via secure third-party payment gateways.</li>
            <li>Prices, taxes, and platform service fees (if applicable) are clearly displayed before payment.</li>
            <li>Cash payments outside the platform are not permitted.</li>
          </ul>
        </section>

        <section id="cancellations-refunds">
          <h2 className="text-xl font-semibold text-ink-900">6. Cancellations & Refunds</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Cancellations and refunds are governed by the Cancellation & Refund Policy.</li>
            <li>Refund eligibility depends on the timing of cancellation and the applicable policy.</li>
            <li>DineAtHomeSocial reserves the right to make final decisions in refund disputes.</li>
          </ul>
        </section>

        <section id="host-responsibilities">
          <h2 className="text-xl font-semibold text-ink-900">7. Host Responsibilities</h2>
          <p className="mt-2 leading-relaxed">Hosts agree to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Maintain basic food safety and hygiene standards.</li>
            <li>Provide accurate menu descriptions and disclose allergens.</li>
            <li>Respect guests and provide a safe environment.</li>
            <li>Honor confirmed bookings unless exceptional circumstances arise.</li>
          </ul>
        </section>

        <section id="guest-responsibilities">
          <h2 className="text-xl font-semibold text-ink-900">8. Guest Responsibilities</h2>
          <p className="mt-2 leading-relaxed">Guests agree to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Follow host house rules.</li>
            <li>Respect the host, property, and other guests.</li>
            <li>Inform hosts in advance of allergies or dietary restrictions.</li>
            <li>Avoid any illegal, unsafe, or disruptive behavior.</li>
          </ul>
        </section>

        <section id="reviews-content">
          <h2 className="text-xl font-semibold text-ink-900">9. Reviews & Content</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Users may post reviews only for completed bookings.</li>
            <li>Reviews must be honest, respectful, and non-abusive.</li>
            <li>We reserve the right to remove content that violates platform guidelines.</li>
            <li>By posting content, you grant DineAtHomeSocial a non-exclusive right to use it for platform purposes.</li>
          </ul>
        </section>

        <section id="prohibited-activities">
          <h2 className="text-xl font-semibold text-ink-900">10. Prohibited Activities</h2>
          <p className="mt-2 leading-relaxed">Users must not:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Engage in harassment, discrimination, or abuse</li>
            <li>Post false, misleading, or defamatory content</li>
            <li>Attempt to bypass platform payments</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section id="account-suspension-termination">
          <h2 className="text-xl font-semibold text-ink-900">11. Account Suspension & Termination</h2>
          <p className="mt-2 leading-relaxed">
            We may suspend or terminate accounts without prior notice if users:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Violate these Terms</li>
            <li>Engage in unsafe or illegal behavior</li>
            <li>Repeatedly receive negative reports or complaints</li>
          </ul>
        </section>

        <section id="limitation-of-liability">
          <h2 className="text-xl font-semibold text-ink-900">12. Limitation of Liability</h2>
          <p className="mt-2 leading-relaxed">To the maximum extent permitted by law:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>DineAtHomeSocial is not liable for food-related illnesses, allergies, injuries, or damages.</li>
            <li>We are not responsible for host or guest conduct.</li>
            <li>Our liability is limited to the amount paid for the booking, if applicable.</li>
          </ul>
        </section>

        <section id="indemnification">
          <h2 className="text-xl font-semibold text-ink-900">13. Indemnification</h2>
          <p className="mt-2 leading-relaxed">
            You agree to indemnify and hold harmless DineAtHomeSocial from any claims, damages, losses, or expenses arising from your use of the platform or violation of these Terms.
          </p>
        </section>

        <section id="changes-to-terms">
          <h2 className="text-xl font-semibold text-ink-900">14. Changes to Terms</h2>
          <div className="mt-2 space-y-2 leading-relaxed">
            <p>We may update these Terms & Conditions at any time.</p>
            <p>Continued use of the platform after updates constitutes acceptance of the revised Terms.</p>
          </div>
        </section>

        <section id="governing-law-jurisdiction">
          <h2 className="text-xl font-semibold text-ink-900">15. Governing Law & Jurisdiction</h2>
          <div className="mt-2 space-y-2 leading-relaxed">
            <p>These Terms are governed by and interpreted in accordance with the laws of India.</p>
            <p>All disputes shall be subject to the exclusive jurisdiction of courts in India.</p>
          </div>
        </section>

        <section id="contact-information">
          <h2 className="text-xl font-semibold text-ink-900">16. Contact Information</h2>
          <p className="mt-2 leading-relaxed">
            For questions or concerns regarding these Terms, contact us at:{" "}
            <a
              href="mailto:support@dineathomesocial.com"
              className="text-ink-900 font-medium underline hover:no-underline"
            >
              support@dineathomesocial.com
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}
