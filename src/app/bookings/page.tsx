"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

type BookingItem = {
  bookingId: string;
  eventSlotId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  startAt: string;
  endAt: string;
  venueName: string;
  venueAddress: string;
  hostName: string;
  hostMobile: string;
  seats: number;
  amountPaid: number;
  bookingStatus: string;
  bookedAt: string;
  isPast: boolean;
};

export default function GuestBookingsPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [upcoming, setUpcoming] = useState<BookingItem[]>([]);
  const [past, setPast] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (role !== "GUEST") {
      router.push("/");
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<{ upcoming: BookingItem[]; past: BookingItem[] }>(
        "/api/guest/my-bookings",
        {
          method: "GET",
          headers: { authorization: `Bearer ${token}` }
        }
      );
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setUpcoming(res.data.upcoming);
      setPast(res.data.past);
    })();
  }, [token, role, router]);

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toFixed(0)}`;
  };

  const getStatusBadge = (status: string) => {
    if (status === "CONFIRMED") return <Badge tone="success">Confirmed</Badge>;
    if (status === "PAYMENT_PENDING") return <Badge tone="warning">Payment Pending</Badge>;
    if (status === "COMPLETED") return <Badge tone="ink">Completed</Badge>;
    if (status === "CANCELLED") return <Badge>Cancelled</Badge>;
    return <Badge>{status}</Badge>;
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading your bookings...</div>
        </Container>
      </main>
    );
  }

  if (error) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-red-600">Error: {error}</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl tracking-tight text-ink-900">My Bookings</h1>
            <p className="mt-2 text-ink-700">View your past event bookings</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>

        {past.length === 0 ? (
          <div className="rounded-3xl border border-sand-200 bg-sand-50/60 p-8 text-center backdrop-blur">
            <p className="text-ink-700">You haven't attended any completed events yet.</p>
            <p className="mt-2 text-sm text-ink-600">Events will appear here after they're completed.</p>
            <Button className="mt-4" asChild>
              <Link href="/events">Explore Upcoming Events</Link>
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="mb-6 font-display text-2xl tracking-tight text-ink-900">
              Past Events ({past.length})
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {past.map((booking) => (
                <div
                  key={booking.bookingId}
                  className="overflow-hidden rounded-3xl border border-sand-200 bg-white/50 shadow-soft backdrop-blur"
                >
                  <div className="h-24 bg-gradient-to-br from-sand-50 via-white to-sand-100" />
                  <div className="p-5">
                    <div className="mb-2">
                      <h3 className="font-display text-lg text-ink-900">{booking.eventName}</h3>
                      <Badge tone="ink">Completed</Badge>
                    </div>

                    <div className="space-y-2 text-sm text-ink-700">
                      <div>
                        <div className="text-xs text-ink-600">Date</div>
                        <div>{booking.eventDate}</div>
                      </div>

                      <div>
                        <div className="text-xs text-ink-600">Venue</div>
                        <div>{booking.venueName}</div>
                      </div>

                      <div className="flex items-center justify-between border-t border-sand-200 pt-2">
                        <div>
                          <div className="text-xs text-ink-600">Guests</div>
                          <div className="font-medium">{booking.seats}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-ink-600">Paid</div>
                          <div className="font-medium">{formatCurrency(booking.amountPaid)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link href={`/events/${booking.eventSlotId}/rate`}>⭐ Rate Event</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
