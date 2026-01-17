import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="bg-gradient-to-b from-sand-50 to-white">
      {/* Hero Section */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6">
              <Badge>Our Story</Badge>
            </div>
            <h1 className="font-display text-5xl tracking-tight text-ink-900 sm:text-6xl">
              Bringing People Together,
              <span className="block text-primary">One Meal at a Time</span>
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-ink-700">
              DineAtHome Social reimagines how we connect over food. We're not a restaurant
              platform—we're a community of passionate home hosts and curious food lovers creating
              authentic, memorable dining experiences in real homes.
            </p>
          </div>
        </Container>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h2 className="font-display text-4xl tracking-tight text-ink-900">
                Our Mission
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-700">
                In an era of digital connections, we believe the most meaningful relationships are
                built face-to-face, over shared meals. We're on a mission to transform strangers
                into friends, homes into gathering places, and meals into memories.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-ink-700">
                Every dinner hosted on our platform is more than just food—it's an opportunity to
                experience different cultures, share stories, learn new perspectives, and build
                lasting connections in your local community.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Badge tone="success">Community First</Badge>
                <Badge tone="success">Authentic Experiences</Badge>
                <Badge tone="success">Cultural Exchange</Badge>
              </div>
            </div>
            <div className="grid gap-6">
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 shadow-soft backdrop-blur">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-ink-900">50,000+ Connections</h3>
                <p className="mt-2 text-sm text-ink-700">
                  Thousands of meaningful friendships formed over shared meals
                </p>
              </div>
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 shadow-soft backdrop-blur">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-ink-900">2,500+ Hosts</h3>
                <p className="mt-2 text-sm text-ink-700">
                  Passionate home cooks sharing their culinary heritage
                </p>
              </div>
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 shadow-soft backdrop-blur">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-ink-900">4.8/5.0 Average Rating</h3>
                <p className="mt-2 text-sm text-ink-700">
                  Exceptional experiences validated by our community
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-br from-sand-50 to-white py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-4xl tracking-tight text-ink-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-ink-700">
              Creating memorable dining experiences is simple, safe, and rewarding
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                1
              </div>
              <div className="rounded-3xl border border-sand-200 bg-white p-8 pt-12 shadow-card">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl text-ink-900">Discover</h3>
                <p className="mt-3 text-ink-700">
                  Browse unique dining experiences in real homes. Filter by cuisine, dietary
                  preferences, date, or special themes like cooking classes or cultural nights.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                2
              </div>
              <div className="rounded-3xl border border-sand-200 bg-white p-8 pt-12 shadow-card">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl text-ink-900">Book</h3>
                <p className="mt-3 text-ink-700">
                  Reserve your spot with secure payment. View verified host profiles, read reviews
                  from past guests, and join the pre-event chat to coordinate arrival.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                3
              </div>
              <div className="rounded-3xl border border-sand-200 bg-white p-8 pt-12 shadow-card">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl text-ink-900">Experience</h3>
                <p className="mt-3 text-ink-700">
                  Show up, enjoy incredible food, meet amazing people, and create lasting memories.
                  Rate your experience and stay connected with your new friends.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-4xl tracking-tight text-ink-900">
              Why Choose DineAtHome?
            </h2>
            <p className="mt-4 text-lg text-ink-700">
              We've built trust, safety, and quality into every aspect of our platform
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature Cards */}
            <FeatureCard
              icon="shield"
              title="Verified Hosts"
              description="Every host undergoes identity verification, background checks, and kitchen safety certification before hosting their first event."
            />
            <FeatureCard
              icon="users"
              title="Dietary Matching"
              description="Automatically match with events that accommodate your dietary needs—vegan, kosher, halal, gluten-free, and more."
            />
            <FeatureCard
              icon="star"
              title="Two-Way Reviews"
              description="Hosts and guests rate each other on multiple criteria, ensuring accountability and building a trusted community."
            />
            <FeatureCard
              icon="lock"
              title="Secure Payments"
              description="Your payments are protected with industry-standard encryption. Hosts receive payouts only after successful events."
            />
            <FeatureCard
              icon="chat"
              title="Pre-Event Chat"
              description="Connect with fellow guests before the event. Coordinate transportation, share dietary details, and build excitement."
            />
            <FeatureCard
              icon="calendar"
              title="Flexible Cancellation"
              description="Life happens. Our fair cancellation policy protects both hosts and guests with clear refund timelines."
            />
          </div>
        </Container>
      </section>

      {/* Safety Section */}
      <section className="bg-gradient-to-br from-primary/5 to-sand-50 py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <div className="mb-6">
                <Badge>Your Safety First</Badge>
              </div>
              <h2 className="font-display text-4xl tracking-tight text-ink-900">
                Trust & Safety Built In
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-700">
                We know that dining in someone's home requires trust. That's why we've implemented
                comprehensive safety measures to protect our community.
              </p>
              <div className="mt-8 space-y-4">
                <SafetyFeature
                  title="Identity Verification"
                  description="Government ID verification with Aadhaar/PAN for all users"
                />
                <SafetyFeature
                  title="Background Checks"
                  description="Host background verification and culinary certification options"
                />
                <SafetyFeature
                  title="Emergency Support"
                  description="24/7 support team with SOS button during events"
                />
                <SafetyFeature
                  title="Insurance Coverage"
                  description="Every event is covered by liability insurance"
                />
                <SafetyFeature
                  title="Secure Messaging"
                  description="All communication stays on platform until you're ready to share"
                />
              </div>
            </div>
            <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-sand-100 p-12">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
                  <svg className="h-12 w-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl text-ink-900">Trust Score</h3>
                <p className="mt-3 text-ink-700">
                  Our proprietary algorithm tracks host reliability, guest behavior, and event
                  quality to maintain community standards
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Community Section */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-4xl tracking-tight text-ink-900">
              Join Our Community
            </h2>
            <p className="mt-4 text-lg text-ink-700">
              DineAtHome Social is more than a platform—it's a movement of food lovers, culture
              enthusiasts, and connection seekers
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 text-center shadow-soft backdrop-blur">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl">🍽️</span>
              </div>
              <h3 className="font-display text-xl text-ink-900">For Food Lovers</h3>
              <p className="mt-3 text-sm text-ink-700">
                Explore cuisines from around the world without leaving your city. Taste authentic
                home cooking that restaurants can't replicate.
              </p>
            </div>

            <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 text-center shadow-soft backdrop-blur">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl">🌍</span>
              </div>
              <h3 className="font-display text-xl text-ink-900">For Cultural Explorers</h3>
              <p className="mt-3 text-sm text-ink-700">
                Experience different cultures through their food traditions. Learn family recipes
                and hear stories from around the world.
              </p>
            </div>

            <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 text-center shadow-soft backdrop-blur">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="font-display text-xl text-ink-900">For Connection Seekers</h3>
              <p className="mt-3 text-sm text-ink-700">
                Meet like-minded people in intimate settings. Build genuine friendships over shared
                meals and meaningful conversations.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Values Section */}
      <section className="bg-gradient-to-b from-sand-50 to-white py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-4xl tracking-tight text-ink-900">Our Values</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-sand-200 bg-white p-8 shadow-soft">
              <h3 className="font-display text-2xl text-ink-900">🌟 Authenticity</h3>
              <p className="mt-3 text-ink-700">
                We celebrate real food, real homes, and real connections. No pretense, no
                performance—just genuine hospitality and human warmth.
              </p>
            </div>

            <div className="rounded-3xl border border-sand-200 bg-white p-8 shadow-soft">
              <h3 className="font-display text-2xl text-ink-900">🤲 Inclusivity</h3>
              <p className="mt-3 text-ink-700">
                Everyone deserves a seat at the table. We actively support diverse hosts and dietary
                needs, ensuring no one is left out.
              </p>
            </div>

            <div className="rounded-3xl border border-sand-200 bg-white p-8 shadow-soft">
              <h3 className="font-display text-2xl text-ink-900">🔒 Safety</h3>
              <p className="mt-3 text-ink-700">
                Trust is earned through transparency and accountability. We maintain the highest
                standards of verification and community moderation.
              </p>
            </div>

            <div className="rounded-3xl border border-sand-200 bg-white p-8 shadow-soft">
              <h3 className="font-display text-2xl text-ink-900">💚 Sustainability</h3>
              <p className="mt-3 text-ink-700">
                Supporting local home cooks reduces food waste and carbon footprint while
                strengthening local food systems and communities.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <div className="rounded-3xl border border-sand-200 bg-gradient-to-br from-primary to-primary/80 p-12 text-center text-white shadow-xl md:p-16">
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
              Ready to Experience Something Different?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90">
              Join thousands of food lovers and passionate hosts creating unforgettable dining
              experiences. Your next great meal and new friendship await.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-sand-50"
                asChild
              >
                <Link href="/events">Browse Events</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/host">Become a Host</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

// Helper Components
function FeatureCard({
  icon,
  title,
  description
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const iconMap: Record<string, React.ReactElement> = {
    shield: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
    users: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    ),
    star: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    ),
    lock: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    ),
    chat: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    ),
    calendar: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    )
  };

  return (
    <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur transition-shadow hover:shadow-card">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {iconMap[icon]}
        </svg>
      </div>
      <h3 className="font-display text-lg text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">{description}</p>
    </div>
  );
}

function SafetyFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-ink-900">{title}</h4>
        <p className="mt-1 text-sm text-ink-700">{description}</p>
      </div>
    </div>
  );
}
