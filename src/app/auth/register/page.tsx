import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <div className="flex flex-wrap gap-2">
          <Badge>Join the table</Badge>
          <Badge tone="success">ID verification</Badge>
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">
          Create account
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Choose Guest or Host. Admin users are created manually.
        </p>
        <div className="mt-6 grid gap-4 rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-card backdrop-blur">
          <Button size="lg" asChild>
            <Link href="/auth/register/guest">Create Guest account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/register/host">Create Host account</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}

