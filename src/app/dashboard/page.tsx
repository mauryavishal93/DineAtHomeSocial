import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <main className="py-10">
      <Container>
        <div className="flex flex-wrap gap-2">
          <Badge tone="ink">Dashboard</Badge>
          <Badge>Role-based soon</Badge>
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">
          Your space
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          This will route by role (Host/Guest/Admin) once session handling is fully
          wired into the UI.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="font-medium text-ink-900">Guest</div>
            <div className="mt-2 text-sm text-ink-700">
              Profile, matching suggestions, bookings, feedback.
            </div>
          </div>
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="font-medium text-ink-900">Host</div>
            <div className="mt-2 text-sm text-ink-700">
              Venue setup, event slots, bookings, reviews.
            </div>
          </div>
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="font-medium text-ink-900">Admin</div>
            <div className="mt-2 text-sm text-ink-700">
              Verification queues, suspensions, pricing rules.
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

