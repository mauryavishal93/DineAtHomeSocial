import { HostRegisterForm } from "@/components/forms/host-register-form";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export default function HostRegisterPage() {
  return (
    <main className="py-10">
      <Container className="max-w-2xl">
        <div className="flex flex-wrap gap-2">
          <Badge tone="ink">Join as Host</Badge>
          <Badge tone="success">Set up venue</Badge>
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">
          Create Host account
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Add your venue details, cuisine, and activities so guests know what to expect.
        </p>
        <div className="mt-6 rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-card backdrop-blur">
          <HostRegisterForm />
        </div>
      </Container>
    </main>
  );
}

