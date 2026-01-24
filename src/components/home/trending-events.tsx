"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { EventCard, type UIEvent } from "@/components/events/event-card";
import { apiFetch } from "@/lib/http";

export function TrendingEvents() {
  const [trending, setTrending] = useState<UIEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<any[]>("/api/events/trending");
        if (res.ok && res.data) {
          setTrending(
            res.data.map((e) => ({
              id: e.id,
              title: e.title,
              startAt: e.startAt,
              endAt: e.endAt,
              seatsLeft: e.seatsLeft ?? 0,
              maxGuests: e.maxGuests ?? 0,
              priceFrom: e.priceFrom ?? 0,
              locality: e.locality ?? "",
              city: e.city ?? "",
              venueName: e.venueName ?? "",
              hostName: e.hostName ?? "Host",
              hostUserId: e.hostUserId ?? "",
              hostRating: e.rating ?? 0,
              verified: Boolean(e.verified),
              foodTags: [],
              cuisines: e.cuisines ?? [],
              foodType: "",
              activities: e.activities ?? [],
              eventImages: e.eventImages ?? [],
              eventVideos: []
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load trending events:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="mt-14 md:mt-20">
        <Container>
          <div className="text-center py-12">
            <div className="text-sm text-ink-600">Loading trending events...</div>
          </div>
        </Container>
      </section>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <section className="mt-14 md:mt-20">
      <Container>
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-medium text-ink-700">Trending</div>
              <Badge tone="orange">🔥 Popular</Badge>
            </div>
            <h2 className="font-display text-3xl tracking-tight text-ink-900">
              Most popular events
            </h2>
            <p className="mt-2 text-sm text-ink-700">
              Events with the most bookings and highest ratings
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/events">View all</Link>
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {trending.map((ev) => (
            <EventCard key={ev.id} ev={ev} />
          ))}
        </div>
      </Container>
    </section>
  );
}
