"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadUserDetail() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const res = await apiFetch<any>(`/api/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      setUserDetail(res.data);
    } else {
      console.error("Failed to load user details:", res.error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center py-12 text-ink-600">Loading user details...</div>
        </Container>
      </main>
    );
  }

  if (!userDetail) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center py-12 text-ink-600">User not found</div>
          <Link href="/admin" className="text-sm text-ink-600 hover:text-ink-900">
            ← Back to Admin Panel
          </Link>
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
            {userDetail.profile
              ? `${userDetail.profile.firstName} ${userDetail.profile.lastName}`.trim()
              : "User"}
          </h1>
          <div className="mt-2 flex gap-2">
            <Badge>{userDetail.user.role}</Badge>
            <Badge
              tone={
                userDetail.user.status === "ACTIVE"
                  ? "success"
                  : userDetail.user.status === "SUSPENDED"
                    ? "warning"
                    : undefined
              }
            >
              {userDetail.user.status}
            </Badge>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* User Info */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
              <h2 className="font-display text-xl text-ink-900 mb-4">User Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-ink-700">Email:</span>{" "}
                  <span className="text-ink-900">{userDetail.user.email}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Mobile:</span>{" "}
                  <span className="text-ink-900">{userDetail.user.mobile}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">User ID:</span>{" "}
                  <span className="text-ink-900 font-mono text-xs">{userDetail.user._id}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-700">Joined:</span>{" "}
                  <span className="text-ink-900">
                    {new Date(userDetail.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {userDetail.profile && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Profile</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-ink-700">Name:</span>{" "}
                    <span className="text-ink-900">
                      {userDetail.profile.firstName} {userDetail.profile.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-ink-700">Age:</span>{" "}
                    <span className="text-ink-900">{userDetail.profile.age}</span>
                  </div>
                  <div>
                    <span className="font-medium text-ink-700">Rating:</span>{" "}
                    <span className="text-ink-900">
                      {userDetail.profile.ratingAvg.toFixed(1)} ⭐ ({userDetail.profile.ratingCount}{" "}
                      reviews)
                    </span>
                  </div>
                  {userDetail.profile.bio && (
                    <div>
                      <span className="font-medium text-ink-700">Bio:</span>{" "}
                      <span className="text-ink-900">{userDetail.profile.bio}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {userDetail.hostProfile && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Host Statistics</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-ink-700">Tier:</span>{" "}
                    <Badge>{userDetail.hostProfile.hostTier}</Badge>
                  </div>
                  <div>
                    <span className="font-medium text-ink-700">Events Hosted:</span>{" "}
                    <span className="text-ink-900">{userDetail.hostProfile.totalEventsHosted}</span>
                  </div>
                  <div>
                    <span className="font-medium text-ink-700">Guests Served:</span>{" "}
                    <span className="text-ink-900">{userDetail.hostProfile.totalGuestsServed}</span>
                  </div>
                  <div>
                    <span className="font-medium text-ink-700">Total Revenue:</span>{" "}
                    <span className="text-ink-900">
                      {formatCurrency(userDetail.hostProfile.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {userDetail.hostProfile.isIdentityVerified && (
                      <Badge tone="success">Identity Verified</Badge>
                    )}
                    {userDetail.hostProfile.isCulinaryCertified && (
                      <Badge tone="success">Culinary Certified</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {userDetail.guestProfile && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Guest Statistics</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-ink-700">Type:</span>{" "}
                    <Badge>{userDetail.guestProfile.guestType}</Badge>
                  </div>
                  <div>
                    <span className="font-medium text-ink-700">Total Bookings:</span>{" "}
                    <span className="text-ink-900">{userDetail.guestProfile.totalBookings}</span>
                  </div>
                  <div>
                    <span className="font-medium text-ink-700">Total Spent:</span>{" "}
                    <span className="text-ink-900">
                      {formatCurrency(userDetail.guestProfile.totalSpent)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bookings & Events */}
          <div className="space-y-6">
            {userDetail.user.role === "HOST" && userDetail.events && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Events ({userDetail.events.length})</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {userDetail.events.map((event: any) => (
                    <div key={event._id} className="border-b border-sand-200 pb-2">
                      <div className="text-sm font-medium text-ink-900">{event.eventName}</div>
                      <div className="text-xs text-ink-600">
                        {new Date(event.startAt).toLocaleDateString()} | {event.bookingsCount}{" "}
                        bookings | {formatCurrency(event.revenue)} revenue
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
              <h2 className="font-display text-xl text-ink-900 mb-4">
                Bookings ({userDetail.bookings.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userDetail.bookings.map((booking: any) => (
                  <div key={booking._id} className="border-b border-sand-200 pb-2">
                    <div className="text-sm font-medium text-ink-900">{booking.eventName}</div>
                    <div className="text-xs text-ink-600">
                      {new Date(booking.eventDate).toLocaleDateString()} | {booking.seats} seats |{" "}
                      {formatCurrency(booking.amountTotal)} |{" "}
                      <Badge>{booking.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
              <h2 className="font-display text-xl text-ink-900 mb-4">
                Reviews ({userDetail.reviews.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userDetail.reviews.map((review: any) => (
                  <div key={review._id} className="border-b border-sand-200 pb-2">
                    <div className="text-sm font-medium text-ink-900">
                      {review.eventName} - {review.rating} ⭐
                    </div>
                    <div className="text-xs text-ink-600">
                      {review.feedbackType} | {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                    {review.comment && (
                      <div className="text-xs text-ink-700 mt-1">{review.comment}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
