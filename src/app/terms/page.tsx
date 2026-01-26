import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export default function TermsPage() {
  return (
    <main className="bg-gradient-to-b from-sand-50 to-white py-10">
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <Badge>Legal</Badge>
            <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900 sm:text-5xl">
              Terms & Conditions
            </h1>
            <p className="mt-4 text-lg text-ink-700">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="space-y-8 rounded-3xl border border-sand-200 bg-white/60 p-8 shadow-soft backdrop-blur">
            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-ink-700 leading-relaxed">
                Welcome to DineAtHome Social. By accessing or using our website, mobile application, or services, you agree to comply with and be bound by these Terms & Conditions. Please read them carefully before using the platform.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">2. Definitions</h2>
              <ul className="list-disc list-inside space-y-2 text-ink-700">
                <li><strong>Platform:</strong> Refers to DineAtHome Social website, mobile application, and all related services.</li>
                <li><strong>Host:</strong> A user who creates and hosts dining events.</li>
                <li><strong>Guest:</strong> A user who books and attends dining events.</li>
                <li><strong>Event:</strong> A dining experience hosted by a Host and attended by Guests.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">3. User Accounts</h2>
              <div className="space-y-3 text-ink-700">
                <p>To use certain features of the platform, you must create an account. You agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your account information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">4. Host Responsibilities</h2>
              <div className="space-y-3 text-ink-700">
                <p>Hosts are responsible for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Providing accurate event information (date, time, location, menu, pricing)</li>
                  <li>Maintaining a safe and clean environment for guests</li>
                  <li>Complying with all local health and safety regulations</li>
                  <li>Honoring confirmed bookings and cancellations</li>
                  <li>Verifying their identity as required by the platform</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">5. Guest Responsibilities</h2>
              <div className="space-y-3 text-ink-700">
                <p>Guests are responsible for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Arriving on time for events</li>
                  <li>Respecting the host&apos;s home and property</li>
                  <li>Communicating dietary restrictions and allergies in advance</li>
                  <li>Following the host&apos;s house rules</li>
                  <li>Making timely payments for bookings</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">6. Booking and Payments</h2>
              <div className="space-y-3 text-ink-700">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All bookings are subject to availability and host approval</li>
                  <li>Payment must be made through our secure payment gateway</li>
                  <li>Refund policies are outlined in our Cancellation Policy</li>
                  <li>Prices are set by hosts and may vary based on guest type (Basic/Premium)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">7. Cancellation Policy</h2>
              <div className="space-y-3 text-ink-700">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Hosts may cancel events with appropriate notice to guests</li>
                  <li>Guests may cancel bookings according to the cancellation timeline</li>
                  <li>Refunds are processed according to our refund policy</li>
                  <li>Platform fees are non-refundable</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">8. Identity Verification</h2>
              <div className="space-y-3 text-ink-700">
                <p>All users must verify their identity using government-issued ID documents. This includes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Hosts must verify identity before hosting events</li>
                  <li>Guests must verify identity before booking events</li>
                  <li>Verification documents are securely stored and only accessible to authorized personnel</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">9. Ratings and Reviews</h2>
              <div className="space-y-3 text-ink-700">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Users may rate and review hosts and guests after events</li>
                  <li>Reviews must be honest, accurate, and respectful</li>
                  <li>False or defamatory reviews may result in account suspension</li>
                  <li>Ratings help maintain community trust and safety</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">10. Prohibited Activities</h2>
              <div className="space-y-3 text-ink-700">
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the platform for any illegal purposes</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Post false or misleading information</li>
                  <li>Circumvent payment systems or fees</li>
                  <li>Violate these Terms</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">11. Intellectual Property</h2>
              <div className="space-y-3 text-ink-700">
                <p>All content on the platform, including text, graphics, logos, and software, is the property of DineAtHome Social or its licensors and is protected by copyright and trademark laws.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">12. Limitation of Liability</h2>
              <div className="space-y-3 text-ink-700">
                <p>DineAtHome Social acts as a platform connecting hosts and guests. We are not responsible for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The quality, safety, or legality of events</li>
                  <li>The accuracy of host-provided information</li>
                  <li>Disputes between hosts and guests</li>
                  <li>Any injuries or damages occurring during events</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">13. Indemnification</h2>
              <div className="space-y-3 text-ink-700">
                <p>You agree to indemnify and hold harmless DineAtHome Social from any claims, damages, losses, or expenses arising from your use of the platform or violation of these Terms.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">14. Changes to Terms</h2>
              <div className="space-y-3 text-ink-700">
                <p>We may update these Terms & Conditions at any time. Continued use of the platform after updates constitutes acceptance of the revised Terms.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">15. Governing Law</h2>
              <div className="space-y-3 text-ink-700">
                <p>These Terms are governed by and interpreted in accordance with the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts in India.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink-900 mb-4">16. Contact Information</h2>
              <div className="space-y-3 text-ink-700">
                <p>For questions or concerns regarding these Terms, contact us at:</p>
                <p className="ml-4">
                  <strong>Email:</strong> support@dineathomesocial.com<br />
                  <strong>Support:</strong> <a href="/support" className="text-violet-600 hover:underline">Visit Support Page</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
