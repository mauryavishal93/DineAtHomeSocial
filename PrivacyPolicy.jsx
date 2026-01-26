import { useEffect } from "react";

const LAST_UPDATED = "January 26, 2026";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | DineAtHome Social";
    return () => {
      document.title = "DineAtHome Social";
    };
  }, []);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 pb-20 sm:py-16 sm:pb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Last Updated: {LAST_UPDATED}
        </p>
      </header>

      <p className="mb-10 max-w-none text-ink-700 leading-relaxed">
        At DineAtHomeSocial, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our website or services.
      </p>

      <p className="mb-10 max-w-none text-ink-700 leading-relaxed">
        By accessing or using DineAtHomeSocial, you agree to the practices described in this Privacy Policy.
      </p>

      <div className="max-w-none space-y-8 text-ink-700">
        <section id="information-we-collect">
          <h2 className="text-xl font-semibold text-ink-900">1. Information We Collect</h2>
          <p className="mt-2 leading-relaxed">
            We may collect the following types of information:
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <h3 className="mt-4 font-semibold text-ink-900">a. Personal Information</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Profile photo</li>
                <li>Location details</li>
                <li>Account login details</li>
              </ul>
            </div>

            <div>
              <h3 className="mt-4 font-semibold text-ink-900">b. Booking & Payment Information</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>Meal bookings and history</li>
                <li>Payment status and transaction details</li>
                <li>Payment information (processed securely by third-party payment gateways; we do not store card details)</li>
              </ul>
            </div>

            <div>
              <h3 className="mt-4 font-semibold text-ink-900">c. Communication Data</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>Messages between hosts and guests</li>
                <li>Support requests and feedback</li>
              </ul>
            </div>

            <div>
              <h3 className="mt-4 font-semibold text-ink-900">d. Usage & Technical Data</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device information</li>
                <li>Pages visited and interactions</li>
                <li>Cookies and analytics data</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="how-we-use-information">
          <h2 className="text-xl font-semibold text-ink-900">2. How We Use Your Information</h2>
          <p className="mt-2 leading-relaxed">We use your information to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Create and manage user accounts</li>
            <li>Facilitate meal bookings and payments</li>
            <li>Connect hosts and guests</li>
            <li>Provide customer support</li>
            <li>Improve website functionality and user experience</li>
            <li>Send important updates and notifications</li>
            <li>Ensure platform safety and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section id="cookies-tracking">
          <h2 className="text-xl font-semibold text-ink-900">3. Cookies & Tracking Technologies</h2>
          <p className="mt-2 leading-relaxed">DineAtHomeSocial uses cookies and similar technologies to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Remember user preferences</li>
            <li>Improve performance and analytics</li>
            <li>Enhance user experience</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            You can manage or disable cookies through your browser settings, but some features may not function properly.
          </p>
        </section>

        <section id="sharing-information">
          <h2 className="text-xl font-semibold text-ink-900">4. Sharing of Information</h2>
          <p className="mt-2 leading-relaxed">We may share your information only with:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Trusted payment service providers</li>
            <li>Analytics and technology partners</li>
            <li>Legal or regulatory authorities (when required by law)</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            We do not sell or rent your personal data to third parties.
          </p>
        </section>

        <section id="data-security">
          <h2 className="text-xl font-semibold text-ink-900">5. Data Security</h2>
          <p className="mt-2 leading-relaxed">We take reasonable security measures to protect your information, including:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Secure servers and encrypted connections</li>
            <li>Limited access to personal data</li>
            <li>Trusted third-party security tools</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            However, no system is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section id="data-retention">
          <h2 className="text-xl font-semibold text-ink-900">6. Data Retention</h2>
          <p className="mt-2 leading-relaxed">We retain your personal information only as long as:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Your account is active</li>
            <li>Required to provide services</li>
            <li>Necessary to meet legal or regulatory obligations</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            You may request deletion of your account and data at any time.
          </p>
        </section>

        <section id="user-rights">
          <h2 className="text-xl font-semibold text-ink-900">7. User Rights</h2>
          <p className="mt-2 leading-relaxed">You have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Access your personal data</li>
            <li>Update or correct information</li>
            <li>Request account or data deletion</li>
            <li>Withdraw consent for marketing communications</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            Requests can be made by contacting us at the email below.
          </p>
        </section>

        <section id="third-party-links">
          <h2 className="text-xl font-semibold text-ink-900">8. Third-Party Links</h2>
          <p className="mt-2 leading-relaxed">
            Our website may contain links to third-party websites.
          </p>
          <p className="mt-2 leading-relaxed">
            We are not responsible for the privacy practices of those websites and encourage you to review their policies separately.
          </p>
        </section>

        <section id="childrens-privacy">
          <h2 className="text-xl font-semibold text-ink-900">9. Children's Privacy</h2>
          <p className="mt-2 leading-relaxed">
            DineAtHomeSocial is not intended for users under the age of 18.
          </p>
          <p className="mt-2 leading-relaxed">
            We do not knowingly collect data from minors.
          </p>
        </section>

        <section id="contact-information">
          <h2 className="text-xl font-semibold text-ink-900">10. Contact Information</h2>
          <p className="mt-2 leading-relaxed">
            For questions or concerns regarding this Privacy Policy, contact us at:{" "}
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
