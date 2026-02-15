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
import { CancelEventModal } from "@/components/modals/cancel-event-modal";

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
  status?: string;
  guests: GuestInfo[];
};

type TabId = "upcoming" | "past" | "cancelled";

function categorize(upcoming: HostEvent[], past: HostEvent[]) {
  const upcomingActive = upcoming.filter((e) => e.status !== "CANCELLED");
  const pastCompleted = past.filter((e) => e.status !== "CANCELLED");
  const cancelled = [
    ...upcoming.filter((e) => e.status === "CANCELLED"),
    ...past.filter((e) => e.status === "CANCELLED")
  ];
  return { upcomingActive, pastCompleted, cancelled };
}

export default function HostMyEventsPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [upcoming, setUpcoming] = useState<HostEvent[]>([]);
  const [past, setPast] = useState<HostEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("upcoming");

  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
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
  const [cancelModal, setCancelModal] = useState<{
    eventId: string;
    eventName: string;
    bookingsCount: number;
  } | null>(null);

  const loadEvents = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const res = await apiFetch<{ upcoming: HostEvent[]; past: HostEvent[] }>(
      "/api/host/my-events",
      { method: "GET", headers: { authorization: `Bearer ${token}` } }
    );
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setUpcoming(res.data.upcoming);
    setPast(res.data.past);
  };

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (role !== "HOST") {
      router.push("/");
      return;
    }
    loadEvents();
  }, [token, role, router]);

  const { upcomingActive, pastCompleted, cancelled } = categorize(upcoming, past);
  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: upcomingActive.length },
    { id: "past", label: "Past", count: pastCompleted.length },
    { id: "cancelled", label: "Cancelled", count: cancelled.length }
  ];

  const toggleEventExpand = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
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
    const queryParams = new URLSearchParams({ eventSlotId: eventId, guestUserId });
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
    setRatingModal({
      isOpen: true,
      eventId,
      bookingId,
      guestUserId,
      guestName,
      guestAge,
      guestGender,
      existingRating: res.data.existingRating ?? null,
      isAdditionalGuest,
      guestIndex
    });
  };

  const handleSubmitRating = async (ratingData: GuestRatingData) => {
    if (!ratingModal || !token) return;
    const body: Record<string, unknown> = {
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
      headers: { authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      setRatingModal(null);
      const refreshRes = await apiFetch<{ upcoming: HostEvent[]; past: HostEvent[] }>(
        "/api/host/my-events",
        { method: "GET", headers: { authorization: `Bearer ${token}` } }
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
      <main className="min-h-[60vh] flex items-center justify-center py-16">
        <Container>
          <div className="flex flex-col items-center gap-4 text-ink-600">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
            <p className="text-sm font-medium">Loading your events...</p>
          </div>
        </Container>
      </main>
    );
  }

  if (error) {
    return (
      <main className="py-16">
        <Container>
          <div className="rounded-2xl border-2 border-red-200 bg-red-50/80 p-6 text-center text-red-700">
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1 text-sm">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadEvents}>
              Try again
            </Button>
          </div>
        </Container>
      </main>
    );
  }

  const hasAnyEvents = upcomingActive.length + pastCompleted.length + cancelled.length > 0;

  return (
    <main className="pb-16 pt-6 sm:pt-10">
      <Container>
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              My Events
            </h1>
            <p className="mt-1.5 text-ink-600">
              Manage your upcoming, past, and cancelled events
            </p>
          </div>
          <Button asChild className="shrink-0 rounded-xl">
            <Link href="/host/events/new" className="inline-flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-sand-200">
          <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Event categories">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-t-xl border-b-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${
                  activeTab === tab.id
                    ? "border-violet-500 text-violet-700 bg-violet-50/60"
                    : "border-transparent text-ink-600 hover:border-sand-300 hover:text-ink-800"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 py-0.5 text-xs ${
                    activeTab === tab.id ? "bg-violet-200/80 text-violet-800" : "bg-sand-200 text-ink-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Empty state when no events at all */}
        {!hasAnyEvents && (
          <div className="rounded-3xl border-2 border-dashed border-sand-300 bg-sand-50/80 p-10 sm:p-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink-900">No events yet</h2>
            <p className="mt-2 max-w-sm mx-auto text-ink-600">
              Create your first event and start hosting dinners.
            </p>
            <Button asChild className="mt-6">
              <Link href="/host/events/new">Create your first event</Link>
            </Button>
          </div>
        )}

        {/* Upcoming */}
        {hasAnyEvents && activeTab === "upcoming" && (
          <section>
            {upcomingActive.length === 0 ? (
              <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-8 text-center">
                <p className="text-ink-600">No upcoming events.</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/host/events/new">Create an event</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
                {upcomingActive.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="upcoming"
                    expanded={expandedEvents.has(event.id)}
                    onToggleExpand={() => toggleEventExpand(event.id)}
                    onCancel={() =>
                      setCancelModal({
                        eventId: event.id,
                        eventName: event.title,
                        bookingsCount: event.bookingsCount
                      })
                    }
                    onRateGuest={handleRateGuestClick}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Past */}
        {hasAnyEvents && activeTab === "past" && (
          <section>
            {pastCompleted.length === 0 ? (
              <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-8 text-center">
                <p className="text-ink-600">No past events yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
                {pastCompleted.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="past"
                    expanded={expandedEvents.has(event.id)}
                    onToggleExpand={() => toggleEventExpand(event.id)}
                    onRateGuest={handleRateGuestClick}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Cancelled */}
        {hasAnyEvents && activeTab === "cancelled" && (
          <section>
            {cancelled.length === 0 ? (
              <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-8 text-center">
                <p className="text-ink-600">No cancelled events.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
                {cancelled.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="cancelled"
                    expanded={expandedEvents.has(event.id)}
                    onToggleExpand={() => toggleEventExpand(event.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

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
        {cancelModal && (
          <CancelEventModal
            isOpen
            onClose={() => setCancelModal(null)}
            eventId={cancelModal.eventId}
            eventName={cancelModal.eventName}
            bookingsCount={cancelModal.bookingsCount}
            onSuccess={loadEvents}
          />
        )}
      </Container>
    </main>
  );
}

type EventCardProps = {
  event: HostEvent;
  variant: "upcoming" | "past" | "cancelled";
  expanded?: boolean;
  onToggleExpand?: () => void;
  onCancel?: () => void;
  onRateGuest?: (
    eventId: string,
    bookingId: string,
    guestUserId: string,
    guestName: string,
    guestAge: number,
    guestGender: string,
    isAdditionalGuest: boolean,
    guestIndex?: number
  ) => void;
};

function EventCard({
  event,
  variant,
  expanded = false,
  onToggleExpand,
  onCancel,
  onRateGuest
}: EventCardProps) {
  const isUpcoming = variant === "upcoming";
  const isPast = variant === "past";
  const isCancelled = variant === "cancelled";

  const cardBg =
    isCancelled
      ? "bg-sand-100/80 border-sand-300"
      : isPast
        ? "bg-white border-sand-200"
        : "bg-white border-violet-200";

  const headerBg = isCancelled
    ? "bg-sand-200/80"
    : isPast
      ? "from-sand-100 to-sand-50"
      : "from-violet-100 via-pink-50 to-orange-50";

  return (
    <article
      className={`overflow-hidden rounded-2xl border-2 shadow-sm transition-shadow hover:shadow-md ${cardBg}`}
    >
      <div className={`bg-gradient-to-r ${headerBg} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">
                {event.title}
              </h3>
              {isUpcoming && <Badge tone="success">Upcoming</Badge>}
              {isPast && <Badge tone="ink">Completed</Badge>}
              {isCancelled && <Badge tone="orange">Cancelled</Badge>}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
              <li className="flex items-center gap-2">
                <span className="text-ink-500">📅</span>
                {event.eventDate}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-ink-500">🕐</span>
                {event.eventTime}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-ink-500">📍</span>
                {event.venueName}
              </li>
              {event.venueAddress && (
                <li className="text-xs text-ink-600 pl-6">{event.venueAddress}</li>
              )}
            </ul>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-medium text-ink-900">
              {event.totalSeatsBooked} guest{event.totalSeatsBooked !== 1 ? "s" : ""}{" "}
              {isPast ? "attended" : "booked"}
            </p>
            {!isCancelled && !isPast && (
              <p className="text-xs text-ink-600">{event.seatsLeft} seats left</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild className="rounded-xl">
            <Link href={`/events/${event.id}`}>View event</Link>
          </Button>
          {isUpcoming && (
            <>
              <ReminderButton eventId={event.id} isHost />
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                className="rounded-xl border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Cancel event
              </Button>
            </>
          )}
          {event.guests.length > 0 && onToggleExpand && (
            <Button size="sm" variant="outline" onClick={onToggleExpand} className="rounded-xl">
              {expanded ? "Hide guests" : `Guests (${event.guests.length})`}
            </Button>
          )}
        </div>
      </div>

      {/* Guest list: only visible when user clicks "Guests" */}
      {event.guests.length > 0 && expanded && (
        <div className="border-t border-sand-200/80 bg-white/90 p-5 sm:p-6">
          <h4 className="mb-3 text-sm font-semibold text-ink-800">
            Guests ({event.guests.length})
          </h4>
          <div className="space-y-2">
            {event.guests.map((guest, idx) => (
              <div
                key={`${guest.bookingId}-${guest.isAdditionalGuest ? guest.guestIndex : "p"}-${idx}`}
                className="flex flex-col gap-2 rounded-xl border border-sand-200 bg-sand-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-900">{guest.guestName}</span>
                    {guest.isAdditionalGuest && (
                      <Badge tone="sand" className="text-[10px]">+1</Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-600">
                    {guest.guestMobile && <span>{guest.guestMobile}</span>}
                    {guest.guestMobile && (guest.guestAge || guest.guestGender) && " · "}
                    {guest.guestAge ? `${guest.guestAge} yrs` : ""}
                    {guest.guestAge && guest.guestGender ? " · " : ""}
                    {guest.guestGender}
                    {!guest.isAdditionalGuest && guest.seats ? ` · ${guest.seats} seat(s)` : ""}
                  </div>
                  {isPast && (
                    <p className="mt-1 text-[11px] text-ink-500">
                      Booked {new Date(guest.bookedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {isPast && onRateGuest && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-xl"
                    onClick={() =>
                      onRateGuest(
                        event.id,
                        guest.bookingId,
                        guest.guestUserId || `booking:${guest.bookingId}:${guest.guestIndex}`,
                        guest.guestName,
                        guest.guestAge,
                        guest.guestGender,
                        guest.isAdditionalGuest ?? false,
                        guest.guestIndex
                      )
                    }
                  >
                    Rate
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
