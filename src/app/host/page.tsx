"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BecomeHostModal } from "@/components/modals/become-host-modal";
import { getRole } from "@/lib/session";

export default function HostMarketingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setRole(getRole());
  }, []);

  const handleBecomeHostClick = () => {
    if (role === "GUEST") {
      setIsModalOpen(true);
    } else if (role === "HOST") {
      router.push("/host/events/new");
    } else {
      router.push("/auth/register/host");
    }
  };

  return (
    <main className="py-10">
      <Container>
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone="ink">For hosts</Badge>
              <Badge>Set your pricing</Badge>
              <Badge>Open seats when you want</Badge>
            </div>
            <h1 className="text-balance font-display text-5xl tracking-tight text-ink-900">
              Host dinners you'd be proud to invite friends to.
            </h1>
            <p className="text-sm text-ink-700">
              Create a venue profile, choose open days and time slots, publish themed
              events, and accept bookings with secure payments. Verification and ratings
              help build trust for both sides.
            </p>
            <div className="flex flex-wrap gap-3">
              {role !== "HOST" && (
                <Button size="lg" onClick={handleBecomeHostClick}>
                  Become a host
                </Button>
              )}
              {role === "HOST" && (
                <>
                  <Button size="lg" variant="ghost" asChild>
                    <Link href="/host/events/new">Create event</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/host/events">My events</Link>
                  </Button>
                </>
              )}
              <Button size="lg" variant="outline" asChild>
                <Link href="/how-it-works">How it works</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 shadow-card backdrop-blur">
            <div className="font-medium text-ink-900">Host toolkit</div>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              <li>• Venue setup: address, description, categories, games</li>
              <li>• Event slots: min/max seats, themes, food tags</li>
              <li>• Guest types: dynamic pricing (Basic/Premium)</li>
              <li>• Verification: govt ID docs + admin approval</li>
              <li>• Ratings: guest feedback improves discoverability</li>
            </ul>
          </div>
        </div>
      </Container>

      <BecomeHostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  );
}
