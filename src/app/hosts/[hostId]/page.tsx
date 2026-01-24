"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/events/verification-badge";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Dynamically import AddressMap to avoid SSR issues with Leaflet
const AddressMap = dynamic(() => import("@/components/map/address-map").then((mod) => mod.AddressMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
      Loading map...
    </div>
  )
});
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";
import { UserActionsMenu } from "@/components/user-actions-menu";
import { formatCurrency } from "@/lib/currency";

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={i} className="text-yellow-400">★</span>
      ))}
      {hasHalfStar && <span className="text-yellow-400">☆</span>}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={i} className="text-sand-300">★</span>
      ))}
      <span className="ml-2 text-sm text-ink-600">({rating.toFixed(1)})</span>
    </div>
  );
}

export default function HostProfilePage() {
  const params = useParams();
  const router = useRouter();
  const hostId = params?.hostId as string;
  const [hostData, setHostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "reviews">("events");
  const [mounted, setMounted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hostId && mounted) {
      loadHostProfile();
      checkOwnership();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostId, mounted]);

  async function checkOwnership() {
    const token = getAccessToken();
    const role = getRole();
    
    if (!token || role !== "HOST") {
      setIsOwner(false);
      return;
    }

    try {
      const res = await apiFetch<{ userId: string; role: string }>("/api/me", {
        headers: { authorization: `Bearer ${token}` }
      });
      if (res.ok && res.data.userId) {
        setCurrentUserId(res.data.userId);
        setIsOwner(res.data.userId === hostId && res.data.role === "HOST");
      } else {
        setIsOwner(false);
      }
    } catch (error) {
      setIsOwner(false);
    }
  }

  async function loadHostProfile() {
    setLoading(true);
    setError(null);

    const res = await apiFetch<any>(`/api/hosts/${hostId}`);
    if (res.ok && res.data) {
      setHostData(res.data);
    } else if (!res.ok) {
      setError(res.error || "Failed to load host profile");
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center py-12 text-ink-600">Loading host profile...</div>
        </Container>
      </main>
    );
  }

  if (error || !hostData) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center py-12 text-red-600">{error || "Host not found"}</div>
        </Container>
      </main>
    );
  }

  const { host, venue, stats, ratings, upcomingEvents, pastEvents, reviews } = hostData;

  return (
    <main className="py-10">
      <Container>
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="font-display text-4xl tracking-tight text-ink-900">
                {host.firstName} {host.lastName}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {host.hostTier && (
                  <Badge>{host.hostTier.replace("_", " ")}</Badge>
                )}
                <VerificationBadge 
                  isIdentityVerified={host.isIdentityVerified || false} 
                  governmentIdPath={host.governmentIdPath || ""} 
                />
                {host.userStatus && (
                  <Badge
                    tone={
                      host.userStatus === "VERIFIED" || host.userStatus === "ACTIVE"
                        ? "success"
                        : host.userStatus === "SUSPENDED"
                          ? "warning"
                          : undefined
                    }
                  >
                    {host.userStatus === "VERIFIED" ? "✓ Verified" : host.userStatus}
                  </Badge>
                )}
                {host.isCulinaryCertified && (
                  <Badge tone="success">
                    Culinary Certified
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {host.hostUserId && !isOwner && (
                <UserActionsMenu
                  userId={host.hostUserId}
                  userName={`${host.firstName} ${host.lastName}`}
                  currentUserId={currentUserId || undefined}
                />
              )}
              {isOwner && (
                <Link href={`/hosts/${hostId}/edit`}>
                  <Button variant="outline" size="sm">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Overall Rating */}
          <div className="mt-4">
            <StarRating rating={ratings.overall} />
            <div className="text-sm text-ink-600 mt-1">
              {stats.ratingCount} reviews • {stats.totalEventsHosted} events hosted •{" "}
              {stats.totalGuestsServed} guests served
            </div>
          </div>
        </div>

        {/* Host Details Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Bio */}
            {host.bio && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">About</h2>
                <p className="text-sm text-ink-700">{host.bio}</p>
              </div>
            )}

            {/* Venue Information */}
            {venue && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Venue Details</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-ink-700">Name:</span>{" "}
                    <span className="text-ink-900">{venue.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-ink-700">Address:</span>{" "}
                    <span className="text-ink-900">{venue.address}</span>
                  </div>
                  {venue.locality && (
                    <div>
                      <span className="font-medium text-ink-700">Locality:</span>{" "}
                      <span className="text-ink-900">{venue.locality}</span>
                    </div>
                  )}
                  {venue.description && (
                    <div>
                      <span className="font-medium text-ink-700">Description:</span>{" "}
                      <span className="text-ink-900">{venue.description}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map Location */}
            {venue && venue.latitude && venue.longitude && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Location</h2>
                <AddressMap
                  address={venue.address || ""}
                  latitude={venue.latitude}
                  longitude={venue.longitude}
                  editable={false}
                  onLocationSelect={() => {
                    // No-op in view mode
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Cuisines */}
            {venue && venue.foodCategories && venue.foodCategories.length > 0 && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Cuisine Types</h2>
                <div className="flex flex-wrap gap-2">
                  {venue.foodCategories.map((cuisine: string, idx: number) => (
                    <Badge key={idx}>{cuisine}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {venue && venue.gamesAvailable && venue.gamesAvailable.length > 0 && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Activities</h2>
                <div className="flex flex-wrap gap-2">
                  {venue.gamesAvailable.map((activity: string, idx: number) => (
                    <Badge key={idx}>{activity}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Government ID Document (if uploaded) */}
            {host.governmentIdPath && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Government ID Verification</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <VerificationBadge 
                      isIdentityVerified={host.isIdentityVerified || false} 
                      governmentIdPath={host.governmentIdPath || ""} 
                    />
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={`/api/upload/serve?path=${encodeURIComponent(host.governmentIdPath)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-900 bg-sand-100 hover:bg-sand-200 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Document
                    </a>
                    <a
                      href={`/api/upload/serve?path=${encodeURIComponent(host.governmentIdPath)}&download=true`}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-900 bg-sand-100 hover:bg-sand-200 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Document
                    </a>
                  </div>
                  <p className="text-xs text-ink-600">
                    {host.isIdentityVerified 
                      ? "This host's identity has been verified by our administration."
                      : host.governmentIdPath 
                        ? "Government ID document uploaded. Verification pending."
                        : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Detailed Ratings */}
            <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
              <h2 className="font-display text-xl text-ink-900 mb-4">Ratings Breakdown</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-700">Overall</span>
                  <StarRating rating={ratings.overall} />
                </div>
                {ratings.event > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink-700">Event Quality</span>
                    <StarRating rating={ratings.event} />
                  </div>
                )}
                {ratings.venue > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink-700">Venue Ambiance</span>
                    <StarRating rating={ratings.venue} />
                  </div>
                )}
                {ratings.food > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink-700">Food Quality</span>
                    <StarRating rating={ratings.food} />
                  </div>
                )}
                {ratings.hospitality > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink-700">Host Hospitality</span>
                    <StarRating rating={ratings.hospitality} />
                  </div>
                )}
              </div>
            </div>

            {/* Venue Images */}
            {venue && venue.images && venue.images.length > 0 && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
                <h2 className="font-display text-xl text-ink-900 mb-4">Gallery</h2>
                <div className="grid grid-cols-2 gap-2">
                  {venue.images.slice(0, 4).map((img: any, idx: number) => (
                    <img
                      key={idx}
                      src={img.filePath}
                      alt={`Venue image ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-sand-200">
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "events"
                ? "border-b-2 border-ink-900 text-ink-900"
                : "text-ink-600 hover:text-ink-900"
            }`}
          >
            Events ({upcomingEvents.length + pastEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "reviews"
                ? "border-b-2 border-ink-900 text-ink-900"
                : "text-ink-600 hover:text-ink-900"
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "events" && (
          <div className="space-y-6">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="font-display text-2xl text-ink-900 mb-4">Upcoming Events</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((event: any) => (
                    <Link
                      key={event._id}
                      href={`/events/${event._id}`}
                      className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur hover:shadow-md transition"
                    >
                      <div className="text-sm font-medium text-ink-900 mb-2">{event.eventName}</div>
                      <div className="text-xs text-ink-600 mb-2">
                        {mounted ? (
                          <>
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            }).format(new Date(event.startAt))} •{" "}
                            {new Intl.DateTimeFormat("en-US", {
                              hour: "2-digit",
                              minute: "2-digit"
                            }).format(new Date(event.startAt))}
                          </>
                        ) : (
                          "Loading..."
                        )}
                      </div>
                      <div className="text-xs text-ink-600">
                        {event.bookingsCount} bookings • {formatCurrency(event.basePricePerGuest)} per
                        guest
                      </div>
                      {event.images && event.images.length > 0 && (
                        <img
                          src={event.images[0].filePath}
                          alt={event.eventName}
                          className="w-full h-32 object-cover rounded-lg mt-3"
                        />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="font-display text-2xl text-ink-900 mb-4">Past Events</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pastEvents.map((event: any) => (
                    <Link
                      key={event._id}
                      href={`/events/${event._id}`}
                      className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur hover:shadow-md transition"
                    >
                      <div className="text-sm font-medium text-ink-900 mb-2">{event.eventName}</div>
                      <div className="text-xs text-ink-600 mb-2">
                        {mounted ? new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        }).format(new Date(event.startAt)) : "Loading..."}
                      </div>
                      <div className="text-xs text-ink-600">
                        {event.bookingsCount} bookings • {formatCurrency(event.basePricePerGuest)} per
                        guest
                      </div>
                      {event.images && event.images.length > 0 && (
                        <img
                          src={event.images[0].filePath}
                          alt={event.eventName}
                          className="w-full h-32 object-cover rounded-lg mt-3"
                        />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {upcomingEvents.length === 0 && pastEvents.length === 0 && (
              <div className="text-center py-12 text-ink-600">No events yet</div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-ink-600">No reviews yet</div>
            ) : (
              reviews.map((review: any) => (
                <div
                  key={review._id}
                  className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-ink-900">{review.eventName}</div>
                      <div className="text-xs text-ink-600">
                        {mounted ? new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        }).format(new Date(review.eventDate)) : "Loading..."}
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  {(review.eventRating > 0 ||
                    review.venueRating > 0 ||
                    review.foodRating > 0 ||
                    review.hospitalityRating > 0) && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-ink-600 mb-3">
                      {review.eventRating > 0 && (
                        <div>
                          Event: <span className="font-medium">{review.eventRating.toFixed(1)}</span>
                        </div>
                      )}
                      {review.venueRating > 0 && (
                        <div>
                          Venue: <span className="font-medium">{review.venueRating.toFixed(1)}</span>
                        </div>
                      )}
                      {review.foodRating > 0 && (
                        <div>
                          Food: <span className="font-medium">{review.foodRating.toFixed(1)}</span>
                        </div>
                      )}
                      {review.hospitalityRating > 0 && (
                        <div>
                          Hospitality:{" "}
                          <span className="font-medium">{review.hospitalityRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {review.comment && (
                    <p className="text-sm text-ink-700">{review.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </Container>
    </main>
  );
}
