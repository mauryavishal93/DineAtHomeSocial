import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HowItWorksPage() {
  return (
    <main className="py-10">
      <Container>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge>Guests</Badge>
            <Badge>Hosts</Badge>
            <Badge tone="success">Verification</Badge>
          </div>
          <h1 className="font-display text-5xl tracking-tight text-ink-900">
            How it works
          </h1>
          <p className="max-w-2xl text-sm text-ink-700">
            DineAtHome Social is built around small, hosted dining events with clear
            safety signals (ID verification) and two-way ratings.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
              Step 1
            </div>
            <div className="mt-3 font-display text-2xl text-ink-900">Create profile</div>
            <div className="mt-2 text-sm text-ink-700">
              Guests add preferences and allergies. Hosts add venue details and seating
              limits.
            </div>
          </div>
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
              Step 2
            </div>
            <div className="mt-3 font-display text-2xl text-ink-900">Verify ID</div>
            <div className="mt-2 text-sm text-ink-700">
              Upload govt ID documents. Admin approves to move from Pending → Verified.
            </div>
          </div>
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
              Step 3
            </div>
            <div className="mt-3 font-display text-2xl text-ink-900">Book & rate</div>
            <div className="mt-2 text-sm text-ink-700">
              Pay via Razorpay. After the event, both sides leave feedback for trust and
              better matches.
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/events">Explore events</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/register">Join</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}

