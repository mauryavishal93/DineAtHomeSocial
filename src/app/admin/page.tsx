import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  return (
    <main className="py-10">
      <Container>
        <div className="flex flex-wrap gap-2">
          <Badge tone="warning">Admin</Badge>
          <Badge>Moderation</Badge>
          <Badge tone="success">Verification</Badge>
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">
          Admin console
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Verification queues, suspensions, and pricing rules will live here.
        </p>

        <div className="mt-8 rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
          <div className="font-medium text-ink-900">Admin APIs</div>
          <div className="mt-2 text-sm text-ink-700">
            <span className="font-mono">/api/admin/verifications</span>,{" "}
            <span className="font-mono">/api/admin/users</span>,{" "}
            <span className="font-mono">/api/admin/pricing-rules</span>
          </div>
        </div>
      </Container>
    </main>
  );
}

