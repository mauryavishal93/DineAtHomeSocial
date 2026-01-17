import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { EventsGrid } from "@/components/events/events-grid";

export default function HomePage() {
  return (
    <main>
      <section className="pt-10 md:pt-16">
        <Container className="grain">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge>Home hosts</Badge>
                <Badge>Small groups</Badge>
                <Badge tone="success">ID verification</Badge>
              </div>
              <h1 className="text-balance font-display text-4xl leading-[1.05] tracking-tight text-ink-900 md:text-6xl">
                Dinners and Lunches that feel like a friend’s home — with the ease of booking.
              </h1>
              <p className="max-w-xl text-lg text-ink-700">
                Home-hosted dining, made social. Book a seat, pay securely, and meet
                guests who share your food preferences and interests.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/events">Explore events</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/host">Become a host</Link>
                </Button>
              </div>
              <div className="grid gap-4 pt-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-sand-200 bg-white/60 p-4 shadow-soft backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                    Verified
                  </div>
                  <div className="mt-2 font-medium text-ink-900">
                    Govt ID review
                  </div>
                  <div className="mt-1 text-sm text-ink-700">
                    Pending → Verified → Active
                  </div>
                </div>
                <div className="rounded-2xl border border-sand-200 bg-white/60 p-4 shadow-soft backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                    Payments
                  </div>
                  <div className="mt-2 font-medium text-ink-900">Razorpay</div>
                  <div className="mt-1 text-sm text-ink-700">
                    Orders + webhook verification
                  </div>
                </div>
                <div className="rounded-2xl border border-sand-200 bg-white/60 p-4 shadow-soft backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                    Matching
                  </div>
                  <div className="mt-2 font-medium text-ink-900">
                    Dietary-safe picks
                  </div>
                  <div className="mt-1 text-sm text-ink-700">
                    Preferences + allergies aware
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="mask-fade-b overflow-hidden rounded-3xl border border-sand-200 bg-white/60 shadow-card backdrop-blur">
                <div className="relative h-64 bg-gradient-to-br from-sand-100 via-white to-sand-50 md:h-80">
                  <svg
                    className="absolute inset-0 h-full w-full opacity-[0.35]"
                    viewBox="0 0 800 500"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#dbc7ad" stopOpacity="0.9" />
                        <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,310 C160,250 250,410 390,360 C520,315 590,180 800,240 L800,500 L0,500 Z"
                      fill="url(#g)"
                    />
                    <path
                      d="M0,260 C120,220 260,300 360,280 C500,250 590,120 800,170"
                      fill="none"
                      stroke="#b78a59"
                      strokeOpacity="0.35"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        Tonight’s table
                      </div>
                      <div className="font-display text-xl text-ink-900">
                        Comfort food + conversation.
                      </div>
                    </div>
                    <div className="rounded-full border border-sand-200 bg-white/70 px-3 py-1 text-xs text-ink-700">
                      from ₹799
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-ink-700">
                    A warm, small-group dinner with clear safety signals and a friendly
                    vibe. (Replace with real photos later.)
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge>Vegan</Badge>
                    <Badge>Board games</Badge>
                    <Badge tone="ink">Bengaluru</Badge>
                  </div>
                  <div className="mt-5 grid gap-3 rounded-2xl border border-sand-200 bg-sand-50/60 p-4 text-sm text-ink-700 sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        Seats
                      </div>
                      <div className="mt-1 font-medium text-ink-900">6 left</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        Host
                      </div>
                      <div className="mt-1 font-medium text-ink-900">Aanya</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        Verified
                      </div>
                      <div className="mt-1 font-medium text-ink-900">Yes</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-6 -left-6 hidden h-28 w-28 rounded-full bg-sand-200/50 blur-2xl md:block" />
              <div className="pointer-events-none absolute -top-8 -right-8 hidden h-36 w-36 rounded-full bg-amber-200/40 blur-2xl md:block" />
            </div>
          </div>
        </Container>
      </section>

      <section className="mt-10 md:mt-14">
        <Container>
          <div className="grid gap-5 rounded-3xl border border-sand-200 bg-white/40 p-6 shadow-soft backdrop-blur md:grid-cols-4">
            <div className="rounded-2xl bg-white/60 p-4">
              <div className="font-display text-3xl text-ink-900">2-way</div>
              <div className="mt-1 text-sm text-ink-700">
                Ratings & feedback for hosts and guests.
              </div>
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              <div className="font-display text-3xl text-ink-900">ID</div>
              <div className="mt-1 text-sm text-ink-700">
                Verification gates booking & hosting.
              </div>
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              <div className="font-display text-3xl text-ink-900">Smart</div>
              <div className="mt-1 text-sm text-ink-700">
                Suggestions based on food + interests + allergies.
              </div>
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              <div className="font-display text-3xl text-ink-900">Secure</div>
              <div className="mt-1 text-sm text-ink-700">
                Razorpay payments with verification webhooks.
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="mt-14 md:mt-20">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-ink-700">Featured</div>
              <h2 className="font-display text-3xl tracking-tight text-ink-900">
                Find your next table
              </h2>
              <p className="mt-2 text-sm text-ink-700">
                This is mock data for now — it will be powered by{" "}
                <span className="font-mono">/api/guest/events</span>.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/events">View all</Link>
            </Button>
          </div>

          <div className="mt-6">
            <EventsGrid />
          </div>
        </Container>
      </section>

      <section className="mt-14 md:mt-20">
        <Container>
          <div className="grid gap-6 rounded-3xl border border-sand-200 bg-white/50 p-8 shadow-soft backdrop-blur md:grid-cols-2 md:items-center">
            <div className="space-y-3">
              <div className="text-sm font-medium text-ink-700">How it works</div>
              <h3 className="font-display text-3xl tracking-tight text-ink-900">
                Simple, safe, and social.
              </h3>
              <p className="text-sm text-ink-700">
                Create an account, verify your ID, then browse events that match your
                preferences. Hosts open seats, guests book and pay — both rate each
                other after the meal.
              </p>
              <div className="flex gap-3 pt-2">
                <Button asChild>
                  <Link href="/how-it-works">Learn more</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/auth/register">Join now</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
                <div className="text-xs font-medium text-ink-600">1</div>
                <div className="mt-2 font-medium text-ink-900">Browse</div>
                <div className="mt-1 text-sm text-ink-700">
                  Food tags, games, locality.
                </div>
              </div>
              <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
                <div className="text-xs font-medium text-ink-600">2</div>
                <div className="mt-2 font-medium text-ink-900">Book</div>
                <div className="mt-1 text-sm text-ink-700">
                  Pricing adapts to guest type.
                </div>
              </div>
              <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
                <div className="text-xs font-medium text-ink-600">3</div>
                <div className="mt-2 font-medium text-ink-900">Rate</div>
                <div className="mt-1 text-sm text-ink-700">
                  Trust builds over time.
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="mt-14 md:mt-20">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 shadow-card backdrop-blur">
              <div className="text-sm font-medium text-ink-700">For guests</div>
              <div className="mt-3 font-display text-3xl tracking-tight text-ink-900">
                Safer socials, better matches.
              </div>
              <p className="mt-2 text-sm text-ink-700">
                Your preferences and allergies guide suggestions — and verification +
                ratings make it easier to trust who you’re meeting.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge>Vegan</Badge>
                <Badge>Halal</Badge>
                <Badge>Nut-free</Badge>
                <Badge tone="success">Verified hosts</Badge>
              </div>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/events">Explore matches</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 shadow-card backdrop-blur">
              <div className="text-sm font-medium text-ink-700">For hosts</div>
              <div className="mt-3 font-display text-3xl tracking-tight text-ink-900">
                Your table, your rules.
              </div>
              <p className="mt-2 text-sm text-ink-700">
                Set min/max seats, open days, themes, and guest-type pricing. Get paid
                securely with clear booking statuses.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge>Seat limits</Badge>
                <Badge>Time slots</Badge>
                <Badge>Guest pricing</Badge>
                <Badge tone="ink">Event themes</Badge>
              </div>
              <div className="mt-6">
                <Button variant="outline" asChild>
                  <Link href="/host">Become a host</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="mt-14 pb-16 md:mt-20 md:pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-sand-200 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 p-10 text-sand-50 shadow-card">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sand-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div>
                <div className="text-sm font-medium text-sand-100/90">
                  DineAtHome Social
                </div>
                <div className="mt-3 font-display text-4xl tracking-tight">
                  Book a seat. Share a table.
                </div>
                <p className="mt-2 text-sm text-sand-100/90">
                  Start exploring events, then personalize your matches once you set
                  preferences and verify your ID.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Button size="lg" asChild>
                  <Link href="/auth/register">Join now</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/events">Explore events</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

