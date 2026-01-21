"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

interface AdminEventDetail {
  event: {
    _id: string;
    eventName: string;
    theme: string;
    eventFormat: string;
    eventCategory: string;
    startAt: string;
    endAt: string;
    minGuests: number;
    maxGuests: number;
    seatsRemaining: number;
    status: string;
    basePricePerGuest: number;
    earlyBirdPrice: number;
    lastMinutePrice: number;
    groupDiscountPercent: number;
    foodType: string;
    cuisines: string[];
    foodTags: string[];
    gamesAvailable: string[];
    menuCourses: {
      starter: string;
      main: string;
      dessert: string;
      beverages: string;
      specialNotes: string;
    };
    images: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: string }>;
    videos: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: string }>;
    createdAt: string;
  };
  host: {
    userId: string;
    email: string;
    mobile: string;
    firstName: string;
    lastName: string;
    age: number;
    hostTier: string;
    totalEventsHosted: number;
    totalGuestsServed: number;
    ratingAvg: number;
    ratingCount: number;
    isIdentityVerified: boolean;
    isCulinaryCertified: boolean;
  };
  venue: {
    _id: string;
    name: string;
    address: string;
    locality: string;
    description: string;
    foodCategories: string[];
    gamesAvailable: string[];
    images: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: string }>;
  };
  bookings: Array<{
    _id: string;
    guestUserId: string;
    guestEmail: string;
    guestMobile: string;
    guestName: string;
    guestAge: number;
    guestGender: string;
    seats: number;
    pricePerSeat: number;
    amountTotal: number;
    status: string;
    guestTypeAtBooking: string;
    additionalGuests: Array<{
      name: string;
      mobile: string;
      age: number;
      gender: string;
    }>;
    payment: {
      _id: string;
      amount: number;
      currency: string;
      status: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      createdAt: string;
    } | null;
    createdAt: string;
  }>;
  summary: {
    totalBookings: number;
    totalSeatsBooked: number;
    totalRevenue: number;
    platformCommission: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
  };
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short"
  });
}

export default function AdminEventDetailPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventDetail, setEventDetail] = useState<AdminEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.eventId);
    })();
  }, [params]);

  useEffect(() => {
    if (eventId) {
      loadEventDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function loadEventDetail() {
    if (!eventId) return;

    setLoading(true);
    setError(null);
    const token = getAccessToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const res = await apiFetch<AdminEventDetail>(`/api/admin/events/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok && res.data) {
      setEventDetail(res.data);
    } else if (!res.ok) {
      setError(res.error || "Failed to load event details");
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center py-12 text-ink-600">Loading event details...</div>
        </Container>
      </main>
    );
  }

  if (error || !eventDetail) {
    return (
      <main className="py-10">
        <Container>
          <div className="rounded-lg bg-red-50 p-4 text-red-600">{error || "Event not found"}</div>
          <Button onClick={() => router.push("/admin")} className="mt-4">
            Back to Admin Panel
          </Button>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-ink-600 hover:text-ink-900">
            ← Back to Admin Panel
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="font-display text-4xl tracking-tight text-ink-900">
            {eventDetail.event.eventName}
          </h1>
          <div className="mt-2 flex gap-2">
            <Badge tone={eventDetail.event.status === "OPEN" ? "success" : undefined}>
              {eventDetail.event.status}
            </Badge>
            <Badge>{eventDetail.event.eventCategory}</Badge>
            <Badge>{eventDetail.event.eventFormat}</Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="text-sm font-medium text-ink-600">Total Bookings</div>
            <div className="mt-2 text-3xl font-bold text-ink-900">
              {eventDetail.summary.totalBookings}
            </div>
            <div className="mt-1 text-xs text-ink-600">
              {eventDetail.summary.confirmedBookings} confirmed, {eventDetail.summary.pendingBookings}{" "}
              pending
            </div>
          </div>
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="text-sm font-medium text-ink-600">Total Seats</div>
            <div className="mt-2 text-3xl font-bold text-ink-900">
              {eventDetail.summary.totalSeatsBooked} / {eventDetail.event.maxGuests}
            </div>
            <div className="mt-1 text-xs text-ink-600">
              {eventDetail.event.seatsRemaining} remaining
            </div>
          </div>
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="text-sm font-medium text-ink-600">Total Revenue</div>
            <div className="mt-2 text-3xl font-bold text-ink-900">
              {formatCurrency(eventDetail.summary.totalRevenue)}
            </div>
            <div className="mt-1 text-xs text-ink-600">
              Commission: {formatCurrency(eventDetail.summary.platformCommission)}
            </div>
          </div>
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="text-sm font-medium text-ink-600">Base Price</div>
            <div className="mt-2 text-3xl font-bold text-ink-900">
              {formatCurrency(eventDetail.event.basePricePerGuest)}
            </div>
            <div className="mt-1 text-xs text-ink-600">per guest</div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Event Details */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
              <h2 className="font-display text-xl text-ink-900 mb-4">Event Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-ink-700">Start:</span>{" "}
                  <span className="text-ink-900">{formatDate(eventDetail.event.startAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">End:</span>{" "}
                  <span className="text-ink-900">{formatDate(eventDetail.event.endAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Theme:</span>{" "}
                  <span className="text-ink-900">{eventDetail.event.theme || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Food Type:</span>{" "}
                  <span className="text-ink-900">{eventDetail.event.foodType || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Cuisines:</span>{" "}
                  <span className="text-ink-900">
                    {eventDetail.event.cuisines.join(", ") || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Activities:</span>{" "}
                  <span className="text-ink-900">
                    {eventDetail.event.gamesAvailable.join(", ") || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu */}
            {eventDetail.event.menuCourses && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Menu</h2>
                <div className="space-y-2 text-sm">
                  {eventDetail.event.menuCourses.starter && (
                    <div>
                      <span className="font-medium text-ink-700">Starter:</span>{" "}
                      <span className="text-ink-900">{eventDetail.event.menuCourses.starter}</span>
                    </div>
                  )}
                  {eventDetail.event.menuCourses.main && (
                    <div>
                      <span className="font-medium text-ink-700">Main:</span>{" "}
                      <span className="text-ink-900">{eventDetail.event.menuCourses.main}</span>
                    </div>
                  )}
                  {eventDetail.event.menuCourses.dessert && (
                    <div>
                      <span className="font-medium text-ink-700">Dessert:</span>{" "}
                      <span className="text-ink-900">{eventDetail.event.menuCourses.dessert}</span>
                    </div>
                  )}
                  {eventDetail.event.menuCourses.beverages && (
                    <div>
                      <span className="font-medium text-ink-700">Beverages:</span>{" "}
                      <span className="text-ink-900">
                        {eventDetail.event.menuCourses.beverages}
                      </span>
                    </div>
                  )}
                  {eventDetail.event.menuCourses.specialNotes && (
                    <div>
                      <span className="font-medium text-ink-700">Special Notes:</span>{" "}
                      <span className="text-ink-900">
                        {eventDetail.event.menuCourses.specialNotes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Host & Venue */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
              <h2 className="font-display text-xl text-ink-900 mb-4">Host Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-ink-700">Name:</span>{" "}
                  <Link
                    href={`/hosts/${eventDetail.host.userId}`}
                    className="font-medium text-ink-900 hover:text-ink-600 hover:underline"
                  >
                    {eventDetail.host.firstName} {eventDetail.host.lastName}
                  </Link>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Email:</span>{" "}
                  <span className="text-ink-900">{eventDetail.host.email}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Mobile:</span>{" "}
                  <span className="text-ink-900">{eventDetail.host.mobile}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Age:</span>{" "}
                  <span className="text-ink-900">{eventDetail.host.age}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Tier:</span>{" "}
                  <Badge>{eventDetail.host.hostTier}</Badge>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Rating:</span>{" "}
                  <span className="text-ink-900">
                    {eventDetail.host.ratingAvg.toFixed(1)} ({eventDetail.host.ratingCount} reviews)
                  </span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Events Hosted:</span>{" "}
                  <span className="text-ink-900">{eventDetail.host.totalEventsHosted}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Guests Served:</span>{" "}
                  <span className="text-ink-900">{eventDetail.host.totalGuestsServed}</span>
                </div>
                <div className="flex gap-2">
                  {eventDetail.host.isIdentityVerified && (
                    <Badge tone="success">Identity Verified</Badge>
                  )}
                  {eventDetail.host.isCulinaryCertified && (
                    <Badge tone="success">Culinary Certified</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
              <h2 className="font-display text-xl text-ink-900 mb-4">Venue Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-ink-700">Name:</span>{" "}
                  <span className="text-ink-900">{eventDetail.venue.name}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Address:</span>{" "}
                  <span className="text-ink-900">{eventDetail.venue.address}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Locality:</span>{" "}
                  <span className="text-ink-900">{eventDetail.venue.locality}</span>
                </div>
                {eventDetail.venue.description && (
                  <div>
                    <span className="font-medium text-ink-700">Description:</span>{" "}
                    <span className="text-ink-900">{eventDetail.venue.description}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-ink-700">Food Categories:</span>{" "}
                  <span className="text-ink-900">
                    {eventDetail.venue.foodCategories.join(", ") || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Games Available:</span>{" "}
                  <span className="text-ink-900">
                    {eventDetail.venue.gamesAvailable.join(", ") || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="mt-8 rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
          <h2 className="font-display text-xl text-ink-900 mb-4">Guest Bookings</h2>
          {eventDetail.bookings.length === 0 ? (
            <div className="text-center py-8 text-ink-600">No bookings yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sand-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Guest</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Seats</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Payment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Booked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {eventDetail.bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-ink-900">{booking.guestName}</div>
                        <div className="text-xs text-ink-600">
                          {booking.guestAge} years, {booking.guestGender}
                        </div>
                        {booking.additionalGuests.length > 0 && (
                          <div className="text-xs text-ink-500 mt-1">
                            +{booking.additionalGuests.length} additional guest(s)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-700">
                        <div>{booking.guestEmail}</div>
                        <div>{booking.guestMobile}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-900">{booking.seats}</td>
                      <td className="px-4 py-3 text-sm text-ink-900">
                        {formatCurrency(booking.amountTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            booking.status === "CONFIRMED"
                              ? "success"
                              : booking.status === "CANCELLED"
                                ? "warning"
                                : undefined
                          }
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.payment ? (
                          <div>
                            <div className="font-medium text-ink-900">
                              {formatCurrency(booking.payment.amount)}
                            </div>
                            <Badge
                              tone={
                                booking.payment.status === "PAID"
                                  ? "success"
                                  : booking.payment.status === "FAILED"
                                    ? "warning"
                                    : undefined
                              }
                            >
                              {booking.payment.status}
                            </Badge>
                            {booking.payment.razorpayPaymentId && (
                              <div className="text-xs text-ink-500 mt-1">
                                ID: {booking.payment.razorpayPaymentId.slice(0, 12)}...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-ink-500">No payment</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-600">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
