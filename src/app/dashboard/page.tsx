"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

type DashboardStats = {
  role: string;
  upcomingBookings?: number;
  pastBookings?: number;
  totalSpent?: number;
  favoriteHosts?: number;
  upcomingEvents?: number;
  pastEvents?: number;
  totalRevenue?: number;
  totalGuests?: number;
  averageRating?: number;
  totalReviews?: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    (async () => {
      setLoading(true);
      const res = await apiFetch<DashboardStats>("/api/me", {
        headers: { authorization: `Bearer ${token}` }
      });
      
      if (res.ok && res.data) {
        // Fetch additional stats based on role
        if (res.data.role === "GUEST") {
          const bookingsRes = await apiFetch<{ upcoming: any[]; past: any[] }>(
            "/api/guest/my-bookings",
            { headers: { authorization: `Bearer ${token}` } }
          );
          if (bookingsRes.ok && bookingsRes.data) {
            setStats({
              role: "GUEST",
              upcomingBookings: bookingsRes.data.upcoming.length,
              pastBookings: bookingsRes.data.past.length,
              totalSpent: bookingsRes.data.past.reduce((sum, b) => sum + (b.amountPaid || 0), 0)
            });
          }
        } else if (res.data.role === "HOST") {
          const eventsRes = await apiFetch<{ upcoming: any[]; past: any[] }>(
            "/api/host/my-events",
            { headers: { authorization: `Bearer ${token}` } }
          );
          if (eventsRes.ok && eventsRes.data) {
            const totalRevenue = eventsRes.data.past.reduce((sum, e) => {
              return sum + (e.guests?.reduce((gSum: number, g: any) => gSum + (g.amountPaid || 0), 0) || 0);
            }, 0);
            const totalGuests = eventsRes.data.past.reduce((sum, e) => sum + (e.totalSeatsBooked || 0), 0);
            
            setStats({
              role: "HOST",
              upcomingEvents: eventsRes.data.upcoming.length,
              pastEvents: eventsRes.data.past.length,
              totalRevenue,
              totalGuests
            });
          }
        }
      }
      setLoading(false);
    })();
  }, [token, router]);

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading dashboard...</div>
        </Container>
      </main>
    );
  }

  if (!role || !stats) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-red-600">Unable to load dashboard</div>
        </Container>
      </main>
    );
  }

  if (role === "GUEST") {
    return (
      <main className="py-10">
        <Container>
          <div className="mb-8">
            <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Guest Dashboard
            </h1>
            <p className="mt-2 text-ink-700">Welcome back! Here's your activity overview</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-6 shadow-colorful">
              <div className="text-sm font-semibold text-ink-600 mb-2">Upcoming Bookings</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                {stats.upcomingBookings || 0}
              </div>
            </div>
            <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-6 shadow-colorful">
              <div className="text-sm font-semibold text-ink-600 mb-2">Past Events</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                {stats.pastBookings || 0}
              </div>
            </div>
            <div className="rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-white to-mint-50 p-6 shadow-colorful">
              <div className="text-sm font-semibold text-ink-600 mb-2">Total Spent</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-mint-600 bg-clip-text text-transparent">
                ₹{((stats.totalSpent || 0) / 100).toFixed(0)}
              </div>
            </div>
            <div className="rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 shadow-colorful">
              <div className="text-sm font-semibold text-ink-600 mb-2">Favorite Hosts</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {stats.favoriteHosts || 0}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-colorful">
              <h2 className="font-display text-xl text-ink-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/events">Browse Events</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/bookings">My Bookings</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/profile">Edit Profile</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 p-6 shadow-colorful">
              <h2 className="font-display text-xl text-ink-900 mb-4">Recommendations</h2>
              <p className="text-sm text-ink-700 mb-4">
                Based on your preferences and past bookings, we think you'll love these events!
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/events">View Recommendations</Link>
              </Button>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  if (role === "HOST") {
    return (
      <main className="py-10">
        <Container>
          <div className="mb-8">
            <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Host Dashboard
            </h1>
            <p className="mt-2 text-ink-700">Manage your events and track your performance</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-6 shadow-colorful">
              <div className="text-sm font-semibold text-ink-600 mb-2">Upcoming Events</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                {stats.upcomingEvents || 0}
              </div>
            </div>
            <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-6 shadow-colorful">
              <div className="text-sm font-semibold text-ink-600 mb-2">Past Events</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                {stats.pastEvents || 0}
              </div>
            </div>
            <div className="rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-white to-mint-50 p-6 shadow-colorful">
              <div className="text-sm font-semibold text-ink-600 mb-2">Total Revenue</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-mint-600 bg-clip-text text-transparent">
                ₹{((stats.totalRevenue || 0) / 100).toFixed(0)}
              </div>
            </div>
            <div className="rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 shadow-colorful">
              <div className="text-sm font-semibold text-ink-600 mb-2">Total Guests</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {stats.totalGuests || 0}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-colorful">
              <h2 className="font-display text-xl text-ink-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/host/events/new">Create Event</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/host/my-events">My Events</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/profile">Edit Profile</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 p-6 shadow-colorful">
              <h2 className="font-display text-xl text-ink-900 mb-4">Performance</h2>
              <div className="space-y-3 text-sm text-ink-700">
                <div className="flex justify-between">
                  <span>Average Rating</span>
                  <span className="font-semibold">{stats.averageRating?.toFixed(1) || "N/A"} ⭐</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Reviews</span>
                  <span className="font-semibold">{stats.totalReviews || 0}</span>
                </div>
                <div className="pt-3 border-t border-sand-200">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/host/analytics">View Analytics</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-8 shadow-colorful">
          <h1 className="font-display text-4xl tracking-tight text-ink-900">Dashboard</h1>
          <p className="mt-2 text-ink-700">Please log in to view your dashboard</p>
          <Button className="mt-4" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
