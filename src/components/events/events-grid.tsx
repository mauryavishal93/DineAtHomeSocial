"use client";

import { useEffect, useState } from "react";
import { EventCard, type UIEvent } from "@/components/events/event-card";
import { apiFetch } from "@/lib/http";

export function EventsGrid() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<UIEvent[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<any[]>("/api/events", { method: "GET" });
      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setEvents(
        (res.data ?? []).map((e) => ({
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
          hostRating: e.hostRating ?? 0,
          verified: Boolean(e.verified),
          foodTags: e.foodTags ?? [],
          cuisines: e.cuisines ?? [],
          foodType: e.foodType ?? "",
          activities: e.activities ?? [],
          eventImages: e.eventImages ?? [],
          eventVideos: e.eventVideos ?? []
        }))
      );
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-sm text-ink-700">Loading events…</div>;
  if (error) return <div className="text-sm text-red-600">Failed to load: {error}</div>;
  if (events.length === 0)
    return <div className="text-sm text-ink-700">No events posted yet.</div>;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {events.map((ev) => (
        <EventCard key={ev.id} ev={ev} />
      ))}
    </div>
  );
}

