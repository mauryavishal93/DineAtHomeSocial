"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";
import { EventCard, type UIEvent } from "@/components/events/event-card";

export default function RecommendationsPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [recommendations, setRecommendations] = useState<UIEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (role !== "GUEST") {
      router.push("/");
      return;
    }

    loadRecommendations();
  }, [token, role, router]);

  const loadRecommendations = async () => {
    if (!token) return;
    
    const res = await apiFetch<{ recommendations: UIEvent[] }>("/api/recommendations", {
      headers: { authorization: `Bearer ${token}` }
    });
    
    if (res.ok && res.data) {
      setRecommendations(res.data.recommendations);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading recommendations...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Recommended For You
          </h1>
          <p className="mt-2 text-ink-700">
            Personalized event suggestions based on your preferences and past bookings
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-12 text-center shadow-colorful">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">No recommendations yet</h2>
            <p className="text-ink-700 mb-6">
              Complete your profile and book some events to get personalized recommendations!
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/profile">Complete Profile</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Badge tone="violet">🎯 {recommendations.length} events matched your preferences</Badge>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((event) => (
                <EventCard key={event.id} ev={event} />
              ))}
            </div>
          </>
        )}
      </Container>
    </main>
  );
}
