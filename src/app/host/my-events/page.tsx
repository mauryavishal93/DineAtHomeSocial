"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";
import { ReminderButton } from "@/components/events/reminder-button";
import { RateGuestModal, GuestRatingData } from "@/components/modals/rate-guest-modal";

type GuestInfo = {
  bookingId: string;
  guestUserId: string;
  guestName: string;
  guestMobile: string;
  guestAge: number;
  guestGender: string;
  seats: number;
  bookedAt: string;
  bookingStatus: string;
  isAdditionalGuest?: boolean;
  guestIndex?: number;
};

type HostEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  eventDate: string;
  eventTime: string;
  seatsLeft: number;
  maxGuests: number;
  venueName: string;
  venueAddress: string;
  bookingsCount: number;
  totalSeatsBooked: number;
  isPast: boolean;
  guests: GuestInfo[];
};

export default function HostMyEventsPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [upcoming, setUpcoming] = useState<HostEvent[]>([]);
  const [past, setPast] = useState<HostEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Expanded events state
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  
  // Rating modal state
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    eventId: string;
    bookingId: string;
    guestUserId: string;
    guestName: string;
    guestAge: number;
    guestGender: string;
    existingRating?: GuestRatingData | null;
    isAdditionalGuest?: boolean;
    guestIndex?: number;
  } | null>(null);

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
      const res = await apiFetch<{ upcoming: HostEvent[]; past: HostEvent[] }>(
        "/api/host/my-events",
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

  const toggleEventExpand = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleRateGuestClick = async (
    eventId: string,
    bookingId: string,
    guestUserId: string,
    guestName: string,
    guestAge: number,
    guestGender: string,
    isAdditionalGuest: boolean = false,
    guestIndex?: number
  ) => {
    if (!token) return;

    // Check eligibility and get existing rating
    const queryParams = new URLSearchParams({
      eventSlotId: eventId,
      guestUserId: guestUserId
    });
    
    if (isAdditionalGuest && guestIndex !== undefined) {
      queryParams.append("bookingId", bookingId);
      queryParams.append("guestIndex", String(guestIndex));
    }
    
    const res = await apiFetch<{
      canRate: boolean;
      reason?: string;
      existingRating?: GuestRatingData | null;
    }>(`/api/host/rate-guest?${queryParams.toString()}`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      alert(res.error || "Failed to check rating eligibility");
      return;
    }

    // Open modal (works for both new ratings and viewing existing)
    setRatingModal({
      isOpen: true,
      eventId,
      bookingId,
      guestUserId,
      guestName,
      guestAge,
      guestGender,
      existingRating: res.data.existingRating || null,
      isAdditionalGuest,
      guestIndex
    });
  };

  const handleSubmitRating = async (ratingData: GuestRatingData) => {
    if (!ratingModal || !token) return;

    const body: any = {
      eventSlotId: ratingModal.eventId,
      bookingId: ratingModal.bookingId,
      guestUserId: ratingModal.guestUserId,
      ...ratingData
    };

    if (ratingModal.isAdditionalGuest && ratingModal.guestIndex !== undefined) {
      body.isAdditionalGuest = true;
      body.guestIndex = ratingModal.guestIndex;
    }

    const res = await apiFetch("/api/host/rate-guest", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setRatingModal(null);
      // Reload events to refresh guest list
      const refreshRes = await apiFetch<{ upcoming: HostEvent[]; past: HostEvent[] }>(
        "/api/host/my-events",
        {
          method: "GET",
          headers: { authorization: `Bearer ${token}` }
        }
      );
      if (refreshRes.ok && refreshRes.data) {
        setUpcoming(refreshRes.data.upcoming);
        setPast(refreshRes.data.past);
      }
    } else {
      alert(res.error || "Failed to submit rating");
    }
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading your events...</div>
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
            <h1 className="font-display text-4xl tracking-tight text-ink-900">My Events</h1>
            <p className="mt-2 text-ink-700">View your past hosted events and guest lists</p>
          </div>
          <Button asChild>
            <Link href="/host/events/new">Create Event</Link>
          </Button>
        </div>

        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 font-display text-2xl tracking-tight text-ink-900">
              Upcoming Events ({upcoming.length})
            </h2>
            <div className="space-y-6">
              {upcoming.map((event) => (
                <div
                  key={event.id}
                  className="overflow-hidden rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 shadow-lg backdrop-blur"
                >
                  <div className="bg-gradient-to-r from-violet-100 via-pink-100 to-orange-100 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-display text-2xl text-ink-900">{event.title}</h3>
                        <div className="mt-2 space-y-1 text-sm text-ink-700">
                          <div>📅 {event.eventDate}</div>
                          <div>🕐 {event.eventTime}</div>
                          <div>📍 {event.venueName}</div>
                          <div className="text-xs">{event.venueAddress}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge tone="success">Upcoming</Badge>
                        <div className="mt-3 text-sm">
                          <div className="font-medium text-ink-900">
                            {event.totalSeatsBooked} guests booked
                          </div>
                          <div className="text-ink-600">
                            {event.seatsLeft} seats left
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/events/${event.id}`}>View Event</Link>
                      </Button>
                      <ReminderButton eventId={event.id} isHost={true} />
                    </div>
                  </div>

                  {event.guests.length > 0 && (
                    <div className="border-t border-violet-200 bg-white/80 p-6">
                      <h4 className="mb-4 text-sm font-medium text-ink-900">
                        Confirmed Guests ({event.guests.length})
                      </h4>
                      <div className="space-y-2">
                        {event.guests.slice(0, 5).map((guest, idx) => (
                          <div
                            key={`${guest.bookingId}-${idx}`}
                            className="flex items-center justify-between rounded-xl border border-violet-200 bg-white p-3"
                          >
                            <div>
                              <div className="font-medium text-ink-900">{guest.guestName}</div>
                              <div className="text-xs text-ink-600">{guest.guestMobile}</div>
                            </div>
                            <Badge tone="success">Confirmed</Badge>
                          </div>
                        ))}
                        {event.guests.length > 5 && (
                          <div className="text-center text-sm text-ink-600">
                            +{event.guests.length - 5} more guests
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {past.length === 0 && upcoming.length === 0 ? (
          <div className="rounded-3xl border border-sand-200 bg-sand-50/60 p-8 text-center backdrop-blur">
            <p className="text-ink-700">You haven't hosted any events yet.</p>
            <p className="mt-2 text-sm text-ink-600">Create your first event to get started!</p>
            <Button className="mt-4" asChild>
              <Link href="/host/events/new">Create Your First Event</Link>
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="mb-6 font-display text-2xl tracking-tight text-ink-900">
              Past Events ({past.length})
            </h2>
            <div className="space-y-6">
              {past.map((event) => (
                <div
                  key={event.id}
                  className="overflow-hidden rounded-3xl border border-sand-200 bg-white/60 shadow-card backdrop-blur"
                >
                  <div className="bg-gradient-to-r from-sand-100 to-sand-50 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-display text-2xl text-ink-900">{event.title}</h3>
                        <div className="mt-2 space-y-1 text-sm text-ink-700">
                          <div>📅 {event.eventDate}</div>
                          <div>🕐 {event.eventTime}</div>
                          <div>📍 {event.venueName}</div>
                          <div className="text-xs">{event.venueAddress}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge tone="ink">Completed</Badge>
                        <div className="mt-3 text-sm">
                          <div className="font-medium text-ink-900">
                            {event.totalSeatsBooked} guests attended
                          </div>
                        </div>
                      </div>
                    </div>

                    {event.guests.length > 0 && (
                      <div className="mt-4">
                        <Button
                          onClick={() => toggleEventExpand(event.id)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          {expandedEvents.has(event.id) ? (
                            <>
                              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Hide Guest List
                            </>
                          ) : (
                            <>
                              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              View Guest List ({event.guests.length})
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {expandedEvents.has(event.id) && event.guests.length > 0 && (
                    <div className="border-t border-sand-200 bg-white/80 p-6">
                      <h4 className="mb-4 text-sm font-medium text-ink-900">
                        Guest List & Ratings
                      </h4>
                      <div className="space-y-3">
                        {event.guests.map((guest, idx) => (
                          <div
                            key={`${guest.bookingId}-${guest.isAdditionalGuest ? guest.guestIndex : 'primary'}-${idx}`}
                            className="flex items-center justify-between rounded-2xl border border-sand-200 bg-white p-4"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-ink-900">{guest.guestName}</div>
                                {guest.isAdditionalGuest && (
                                  <div className="text-xs">
                                    <Badge tone="ink">Additional Guest</Badge>
                                  </div>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-3 text-sm text-ink-700">
                                <span>👤 {guest.guestAge} years</span>
                                <span>• {guest.guestGender}</span>
                                {!guest.isAdditionalGuest && (
                                  <span>• 🎫 {guest.seats} seat{guest.seats > 1 ? "s" : ""}</span>
                                )}
                              </div>
                              <div className="mt-1 text-xs text-ink-600">
                                Booked on {new Date(guest.bookedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleRateGuestClick(
                                    event.id,
                                    guest.bookingId,
                                    guest.guestUserId || `booking:${guest.bookingId}:${guest.guestIndex}`,
                                    guest.guestName,
                                    guest.guestAge,
                                    guest.guestGender,
                                    guest.isAdditionalGuest || false,
                                    guest.guestIndex
                                  )
                                }
                              >
                                ⭐ Rate Guest
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {ratingModal && (
          <RateGuestModal
            isOpen={ratingModal.isOpen}
            onClose={() => setRatingModal(null)}
            onSubmit={handleSubmitRating}
            guestName={ratingModal.guestName}
            guestAge={ratingModal.guestAge}
            guestGender={ratingModal.guestGender}
            existingRating={ratingModal.existingRating}
          />
        )}
      </Container>
    </main>
  );
}
