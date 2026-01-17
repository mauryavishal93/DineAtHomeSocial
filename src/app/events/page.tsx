import { EventsGrid } from "@/components/events/events-grid";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export default function EventsPage() {
  return (
    <main className="py-10">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="text-sm font-medium text-ink-700">Explore</div>
            <h1 className="font-display text-4xl tracking-tight text-ink-900">
              Events near you
            </h1>
            <p className="max-w-2xl text-sm text-ink-700">
              Filter by food type, interest tags, locality and dietary needs. Once the
              API is wired, results will personalize based on your guest profile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Vegan</Badge>
            <Badge>BBQ</Badge>
            <Badge>Board games</Badge>
            <Badge tone="success">ID verified hosts</Badge>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-2xl border border-sand-200 bg-white/50 p-5 shadow-soft backdrop-blur">
            <div className="space-y-3">
              <div className="font-medium text-ink-900">Search</div>
              <div className="rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-sm text-ink-700">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sand-100 text-ink-800">
                    ⌕
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-ink-900">City, locality</div>
                    <div className="text-xs text-ink-600">
                      Example: Bengaluru • Indiranagar
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-4 text-sm text-ink-700">
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                  Food
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Vegan", "Vegetarian", "Halal", "BBQ", "Italian"].map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                  Interests
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Board games", "Karaoke", "Networking", "Music"].map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                  Dietary
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Nut-free", "Dairy-free", "Spice level", "Allergy friendly"].map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                  Safety
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">ID verified</Badge>
                  <Badge>New hosts</Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4 text-xs text-ink-700">
                Matches will prioritize dietary compatibility (allergies + preferences)
                once you complete your guest profile.
              </div>
            </div>
          </aside>

          <section className="space-y-5">
            <EventsGrid />
            <div className="rounded-2xl border border-sand-200 bg-white/50 p-5 text-sm text-ink-700 shadow-soft backdrop-blur">
              This list is powered by the database (EventSlots). Filters & matching are next.
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}

