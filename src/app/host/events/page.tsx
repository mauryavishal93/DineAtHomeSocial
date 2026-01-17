"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

type HostEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  seatsLeft: number;
  maxGuests: number;
  venueName: string;
  venueLocality: string;
  bookingsCount: number;
  guests: Array<{
    bookingId: string;
    userId: string;
    name: string;
    mobile: string;
    interests: string[];
    ratingAvg: number;
    ratingCount: number;
    seats: number;
  }>;
};

export default function HostEventsPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [events, setEvents] = useState<HostEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (role !== "HOST") {
      router.push("/");
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<HostEvent[]>("/api/host/events", {
        method: "GET",
        headers: { authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setEvents(res.data ?? []);
      setLoading(false);
    })();
  }, [role, router, token]);

  return (
    <main className="py-10">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="ink">Host</Badge>
              <Badge>My events</Badge>
            </div>
            <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">
              Your hosted events
            </h1>
            <p className="mt-2 text-sm text-ink-700">
              See bookings and guest details for each event slot.
            </p>
          </div>
          <Button asChild>
            <Link href="/host/events/new">Create event</Link>
          </Button>
        </div>

        <div className="mt-8 space-y-6">
          {loading ? <div className="text-sm text-ink-700">Loading…</div> : null}
          {error ? <div className="text-sm text-red-600">Failed: {error}</div> : null}

          {events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-display text-2xl text-ink-900">{ev.title}</div>
                  <div className="mt-1 text-sm text-ink-700">
                    {ev.venueName}
                    {ev.venueLocality ? ` • ${ev.venueLocality}` : ""}
                  </div>
                  <div className="mt-1 text-sm text-ink-600">
                    Seats left: {ev.seatsLeft} / {ev.maxGuests} • Bookings: {ev.bookingsCount}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/events/${ev.id}`}>View public</Link>
                  </Button>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-medium text-ink-900">Booked guests</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {ev.guests.length === 0 ? (
                    <div className="text-sm text-ink-700">No confirmed bookings yet.</div>
                  ) : (
                    ev.guests.map((g) => (
                      <div
                        key={g.bookingId}
                        className="rounded-2xl border border-sand-200 bg-white/60 p-4 text-sm"
                      >
                        <div className="font-medium text-ink-900">{g.name}</div>
                        <div className="mt-1 text-ink-700">Mobile: {g.mobile}</div>
                        <div className="mt-1 text-ink-700">Seats: {g.seats}</div>
                        <div className="mt-1 text-ink-700">
                          Rating: {g.ratingAvg.toFixed(1)} ({g.ratingCount})
                        </div>
                        <div className="mt-2 text-ink-700">
                          Interests:{" "}
                          {g.interests.length ? g.interests.join(", ") : "—"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}

          {!loading && !error && events.length === 0 ? (
            <div className="rounded-2xl border border-sand-200 bg-white/50 p-5 text-sm text-ink-700 shadow-soft backdrop-blur">
              No events yet. Create your first one.
            </div>
          ) : null}
        </div>
      </Container>
    </main>
  );
}

