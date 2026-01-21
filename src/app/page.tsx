"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EventsGrid } from "@/components/events/events-grid";

export default function HomePage() {
  const [cityFilter, setCityFilter] = useState("");
  const [localityFilter, setLocalityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  
  const filters = {
    city: cityFilter || undefined,
    locality: localityFilter || undefined,
    state: stateFilter || undefined
  };
  return (
    <main>
      <section className="pt-10 md:pt-16">
        <Container className="grain">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 animate-fade-in">
                <Badge tone="violet">🏠 Home hosts</Badge>
                <Badge tone="pink">👥 Small groups</Badge>
                <Badge tone="success">✓ ID verified</Badge>
              </div>
              <h1 className="text-balance font-display text-4xl leading-[1.05] tracking-tight md:text-6xl bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent animate-gradient">
                Dinners and Lunches that feel like a friend's home — with the ease of booking.
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
                <div className="group rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-5 shadow-lg backdrop-blur transition-all duration-300 hover:scale-105 hover:shadow-colorful hover:border-violet-300">
                  <div className="text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                    ✓ Verified
                  </div>
                  <div className="mt-2 font-bold text-lg text-ink-900">
                    Govt ID review
                  </div>
                  <div className="mt-1 text-sm text-ink-700 font-medium">
                    Pending → Verified → Active
                  </div>
                </div>
                <div className="group rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-5 shadow-lg backdrop-blur transition-all duration-300 hover:scale-105 hover:shadow-colorful hover:border-orange-300">
                  <div className="text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                    💳 Payments
                  </div>
                  <div className="mt-2 font-bold text-lg text-ink-900">Razorpay</div>
                  <div className="mt-1 text-sm text-ink-700 font-medium">
                    Orders + webhook verification
                  </div>
                </div>
                <div className="group rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-white to-mint-50 p-5 shadow-lg backdrop-blur transition-all duration-300 hover:scale-105 hover:shadow-colorful hover:border-sky-300">
                  <div className="text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-sky-600 to-mint-600 bg-clip-text text-transparent">
                    🎯 Matching
                  </div>
                  <div className="mt-2 font-bold text-lg text-ink-900">
                    Dietary-safe picks
                  </div>
                  <div className="mt-1 text-sm text-ink-700 font-medium">
                    Preferences + allergies aware
                  </div>
                </div>
              </div>
            </div>

            <div className="relative animate-floaty">
              <div className="mask-fade-b overflow-hidden rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/50 to-violet-50/50 shadow-colorful backdrop-blur">
                <div className="relative h-64 bg-gradient-to-br from-violet-100 via-pink-100 via-orange-100 to-yellow-100 md:h-80">
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
                    <div className="rounded-full border-2 border-violet-300 bg-gradient-to-r from-violet-100 to-pink-100 px-4 py-1.5 text-xs font-bold text-violet-800 shadow-md">
                      from ₹799
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-ink-700">
                    A warm, small-group dinner with clear safety signals and a friendly
                    vibe. (Replace with real photos later.)
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="mint">🌱 Vegan</Badge>
                    <Badge tone="violet">🎲 Board games</Badge>
                    <Badge tone="sky">📍 Bengaluru</Badge>
                  </div>
                  <div className="mt-5 grid gap-3 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50/80 via-pink-50/80 to-orange-50/80 p-4 text-sm text-ink-700 sm:grid-cols-3 shadow-md">
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
              <div className="pointer-events-none absolute -bottom-6 -left-6 hidden h-28 w-28 rounded-full bg-violet-300/40 blur-2xl md:block animate-pulse" />
              <div className="pointer-events-none absolute -top-8 -right-8 hidden h-36 w-36 rounded-full bg-pink-300/40 blur-2xl md:block animate-pulse" style={{ animationDelay: "1s" }} />
              <div className="pointer-events-none absolute top-1/2 right-1/4 hidden h-24 w-24 rounded-full bg-orange-300/30 blur-2xl md:block animate-pulse" style={{ animationDelay: "2s" }} />
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
                Filter events by location to find dining experiences near you.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/events">View all</Link>
            </Button>
          </div>

          {/* Location Filters */}
          <div className="mt-6 grid gap-4 rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/40 to-violet-50/40 p-5 shadow-colorful backdrop-blur sm:grid-cols-3">
            <Input
              label="City"
              placeholder="e.g., Bengaluru"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
            <Input
              label="Locality"
              placeholder="e.g., Indiranagar"
              value={localityFilter}
              onChange={(e) => setLocalityFilter(e.target.value)}
            />
            <Input
              label="State"
              placeholder="e.g., Karnataka"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            />
          </div>

          <div className="mt-6">
            <EventsGrid filters={filters} />
          </div>
        </Container>
      </section>

      <section className="mt-14 md:mt-20">
        <Container>
          <div className="grid gap-6 rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-8 shadow-colorful backdrop-blur md:grid-cols-2 md:items-center">
            <div className="space-y-3">
              <div className="text-sm font-bold uppercase tracking-wide bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">How it works</div>
              <h3 className="font-display text-3xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                Simple, safe, and social.
              </h3>
              <p className="text-sm text-ink-700 font-medium">
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
              <div className="group rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="text-lg font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">1</div>
                <div className="mt-2 font-bold text-lg text-ink-900">Browse</div>
                <div className="mt-1 text-sm text-ink-700 font-medium">
                  Food tags, games, locality.
                </div>
              </div>
              <div className="group rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="text-lg font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">2</div>
                <div className="mt-2 font-bold text-lg text-ink-900">Book</div>
                <div className="mt-1 text-sm text-ink-700 font-medium">
                  Pricing adapts to guest type.
                </div>
              </div>
              <div className="group rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-mint-50 p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="text-lg font-bold bg-gradient-to-r from-sky-600 to-mint-600 bg-clip-text text-transparent">3</div>
                <div className="mt-2 font-bold text-lg text-ink-900">Rate</div>
                <div className="mt-1 text-sm text-ink-700 font-medium">
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
            <div className="group rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-8 shadow-colorful backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:shadow-glow">
              <div className="text-sm font-bold uppercase tracking-wide bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">For guests</div>
              <div className="mt-3 font-display text-3xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                Safer socials, better matches.
              </div>
              <p className="mt-2 text-sm text-ink-700 font-medium">
                Your preferences and allergies guide suggestions — and verification +
                ratings make it easier to trust who you're meeting.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone="mint">🌱 Vegan</Badge>
                <Badge tone="sky">🕌 Halal</Badge>
                <Badge tone="orange">🥜 Nut-free</Badge>
                <Badge tone="success">✓ Verified hosts</Badge>
              </div>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/events">Explore matches</Link>
                </Button>
              </div>
            </div>
            <div className="group rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-8 shadow-colorful backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:shadow-glow">
              <div className="text-sm font-bold uppercase tracking-wide bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">For hosts</div>
              <div className="mt-3 font-display text-3xl tracking-tight bg-gradient-to-r from-orange-600 via-pink-600 to-violet-500 bg-clip-text text-transparent">
                Your table, your rules.
              </div>
              <p className="mt-2 text-sm text-ink-700 font-medium">
                Set min/max seats, open days, themes, and guest-type pricing. Get paid
                securely with clear booking statuses.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone="violet">👥 Seat limits</Badge>
                <Badge tone="pink">⏰ Time slots</Badge>
                <Badge tone="sky">💰 Guest pricing</Badge>
                <Badge tone="orange">🎨 Event themes</Badge>
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
          <div className="relative overflow-hidden rounded-3xl border-2 border-violet-300 bg-gradient-to-br from-violet-600 via-pink-600 via-orange-500 to-yellow-500 p-10 text-white shadow-glow">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pink-300/30 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
            <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div>
                <div className="text-sm font-bold uppercase tracking-wide text-white/90">
                  DineAtHome Social
                </div>
                <div className="mt-3 font-display text-4xl tracking-tight text-white font-bold">
                  Book a seat. Share a table.
                </div>
                <p className="mt-2 text-sm text-white/90 font-medium">
                  Start exploring events, then personalize your matches once you set
                  preferences and verify your ID.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Button size="lg" asChild className="bg-white text-violet-600 hover:bg-white/90 font-bold shadow-xl border-0">
                  <Link href="/auth/register">Join now</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-2 border-white text-white hover:bg-white/10 font-bold bg-transparent">
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

