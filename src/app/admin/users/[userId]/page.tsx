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

    if (res.ok && res.data) {
      setUserDetail(res.data);
      // Debug: Log host profile data to verify governmentIdPath is present
      if (res.data.hostProfile) {
        console.log("Host Profile Data:", {
          hasGovernmentIdPath: !!res.data.hostProfile.governmentIdPath,
          governmentIdPath: res.data.hostProfile.governmentIdPath,
          isIdentityVerified: res.data.hostProfile.isIdentityVerified
        });
      }
    } else if (!res.ok) {
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
                  <div className="flex gap-2 flex-wrap">
                    {userDetail.hostProfile.isIdentityVerified ? (
                      <Badge tone="success">✓ Identity Verified</Badge>
                    ) : userDetail.hostProfile.governmentIdPath ? (
                      <Badge tone="warning">⏳ Pending Verification</Badge>
                    ) : (
                      <Badge tone="ink">No ID Uploaded</Badge>
                    )}
                    {userDetail.hostProfile.isCulinaryCertified && (
                      <Badge tone="success">Culinary Certified</Badge>
                    )}
                  </div>
                  
                  {/* Government ID Document Section - Always visible when document exists */}
                  {userDetail.hostProfile?.governmentIdPath && userDetail.hostProfile.governmentIdPath.trim() !== "" && (
                    <div className={`mt-4 p-4 rounded-2xl border-2 ${
                      userDetail.hostProfile.isIdentityVerified 
                        ? "border-green-200 bg-green-50/50" 
                        : "border-orange-200 bg-orange-50/50"
                    }`}>
                      <div className="mb-3">
                        <h3 className="font-semibold text-ink-900">Government ID Document</h3>
                        <p className="text-sm text-ink-600 mt-1">
                          {userDetail.hostProfile.isIdentityVerified
                            ? "This host's identity has been verified. You can view or download the document below."
                            : "Review and verify the host's government ID document"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <a
                          href={`/api/upload/serve?path=${encodeURIComponent(userDetail.hostProfile.governmentIdPath)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-900 bg-white hover:bg-sand-50 border border-sand-200 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Document
                        </a>
                        <a
                          href={`/api/upload/serve?path=${encodeURIComponent(userDetail.hostProfile.governmentIdPath)}&download=true`}
                          download
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-900 bg-white hover:bg-sand-50 border border-sand-200 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Document
                        </a>
                      </div>
                      {!userDetail.hostProfile.isIdentityVerified && (
                        <button
                          onClick={async () => {
                            const token = getAccessToken();
                            if (!token) return;
                            
                            if (!confirm("Are you sure you want to verify this host's identity?")) {
                              return;
                            }
                            
                            const res = await apiFetch(`/api/admin/hosts/verify`, {
                              method: "POST",
                              headers: { Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ userId: userDetail.user._id })
                            });
                            
                            if (res.ok) {
                              alert("Host verified successfully!");
                              loadUserDetail();
                            } else {
                              alert(res.error || "Failed to verify host");
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✓ Verify Host Identity
                        </button>
                      )}
                    </div>
                  )}
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
