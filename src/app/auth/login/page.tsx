import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <div className="flex flex-wrap gap-2">
          <Badge>Welcome back</Badge>
          <Badge tone="success">Secure session</Badge>
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">
          Login
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Access your dashboard as a Host, Guest, or Admin.
        </p>
        <div className="mt-6 rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-card backdrop-blur">
          <LoginForm />
          <div className="mt-6 pt-4 border-t border-sand-200 flex flex-col items-center">
            <p className="text-center text-sm text-ink-600 mb-3">
              Don&apos;t have an account?
            </p>
            <Button className="w-full" asChild>
              <Link href="/auth/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}

