"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

type AnalyticsData = {
  totalRevenue: number;
  totalBookings: number;
  totalGuests: number;
  averageRating: number;
  totalReviews: number;
  upcomingEvents: number;
  pastEvents: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  bookingsByMonth: Array<{ month: string; count: number }>;
  topEvents: Array<{
    eventId: string;
    eventName: string;
    bookings: number;
    revenue: number;
  }>;
};

export default function HostAnalyticsPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"30" | "90" | "365">("30");

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (role !== "HOST") {
      router.push("/");
      return;
    }

    loadAnalytics();
  }, [token, role, router, timeRange]);

  const loadAnalytics = async () => {
    if (!token) return;
    
    const res = await apiFetch<AnalyticsData>(`/api/host/analytics?days=${timeRange}`, {
      headers: { authorization: `Bearer ${token}` }
    });
    
    if (res.ok && res.data) {
      setAnalytics(res.data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading analytics...</div>
        </Container>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-red-600">Unable to load analytics</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-ink-700">Track your hosting performance and revenue</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === "30" ? "primary" : "outline"}
              size="sm"
              onClick={() => setTimeRange("30")}
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === "90" ? "primary" : "outline"}
              size="sm"
              onClick={() => setTimeRange("90")}
            >
              90 Days
            </Button>
            <Button
              variant={timeRange === "365" ? "primary" : "outline"}
              size="sm"
              onClick={() => setTimeRange("365")}
            >
              1 Year
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-6 shadow-colorful">
            <div className="text-sm font-semibold text-ink-600 mb-2">Total Revenue</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              ₹{((analytics.totalRevenue || 0) / 100).toFixed(0)}
            </div>
          </div>
          <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-6 shadow-colorful">
            <div className="text-sm font-semibold text-ink-600 mb-2">Total Bookings</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
              {analytics.totalBookings || 0}
            </div>
          </div>
          <div className="rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-white to-mint-50 p-6 shadow-colorful">
            <div className="text-sm font-semibold text-ink-600 mb-2">Total Guests</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-mint-600 bg-clip-text text-transparent">
              {analytics.totalGuests || 0}
            </div>
          </div>
          <div className="rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 shadow-colorful">
            <div className="text-sm font-semibold text-ink-600 mb-2">Average Rating</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              {analytics.averageRating?.toFixed(1) || "N/A"} ⭐
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-colorful mb-8">
          <h2 className="font-display text-2xl text-ink-900 mb-4">Revenue Trend</h2>
          <div className="space-y-2">
            {analytics.revenueByMonth && analytics.revenueByMonth.length > 0 ? (
              analytics.revenueByMonth.map((item, idx) => {
                const maxRevenue = Math.max(...analytics.revenueByMonth.map(r => r.revenue));
                const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-ink-700">{item.month}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-violet-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm font-semibold text-ink-900">
                      ₹{((item.revenue || 0) / 100).toFixed(0)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-ink-600 text-center py-8">No revenue data for this period</p>
            )}
          </div>
        </div>

        {/* Top Events */}
        {analytics.topEvents && analytics.topEvents.length > 0 && (
          <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 p-6 shadow-colorful">
            <h2 className="font-display text-2xl text-ink-900 mb-4">Top Performing Events</h2>
            <div className="space-y-3">
              {analytics.topEvents.map((event, idx) => (
                <div
                  key={event.eventId}
                  className="flex items-center justify-between p-4 rounded-2xl border-2 border-orange-200 bg-white/60"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Badge tone="orange">#{idx + 1}</Badge>
                      <h3 className="font-display text-lg text-ink-900">{event.eventName}</h3>
                    </div>
                    <div className="text-sm text-ink-600">
                      {event.bookings} bookings • ₹{((event.revenue || 0) / 100).toFixed(0)} revenue
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/events/${event.eventId}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link href="/host/my-events">Back to My Events</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
