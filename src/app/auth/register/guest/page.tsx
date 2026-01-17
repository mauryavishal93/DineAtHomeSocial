import { GuestRegisterForm } from "@/components/forms/guest-register-form";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export default function GuestRegisterPage() {
  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <div className="flex flex-wrap gap-2">
          <Badge>Join as Guest</Badge>
          <Badge tone="success">Create profile</Badge>
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">
          Create Guest account
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Tell us a bit about you to personalize matches.
        </p>
        <div className="mt-6 rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-card backdrop-blur">
          <GuestRegisterForm />
        </div>
      </Container>
    </main>
  );
}

