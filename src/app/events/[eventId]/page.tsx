"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/events/verification-badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";
import { AddGuestModal, type AdditionalGuest } from "@/components/modals/add-guest-modal";
import { ShareButton } from "@/components/events/share-button";
import { CheckInButton } from "@/components/check-in/check-in-button";
import { CheckInInterface } from "@/components/check-in/check-in-interface";
import { ReminderButton } from "@/components/events/reminder-button";
import { RefundModal } from "@/components/modals/refund-modal";
import { CancelEventModal } from "@/components/modals/cancel-event-modal";
import { EventPass } from "@/components/events/event-pass";
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

type EventDetail = {
  id: string;
  title: string;
  theme: string;
  startAt: string;
  endAt: string;
  seatsLeft: number;
  priceFrom: number;
  locality: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  venueName: string;
  venueAddress: string;
  venueLatitude?: number | null;
  venueLongitude?: number | null;
  foodTags: string[];
  cuisines: string[];
  foodType: string;
  activities: string[];
  hostName: string;
  hostRating: number;
  hostUserId: string;
  verified: boolean;
  governmentIdPath?: string;
  hostStatus?: string;
  status?: string;
  cancelledAt?: string | null;
  cancellationReason?: string;
  eventImages?: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>;
  eventVideos?: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>;
  venueImages?: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>;
};

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  // Use 'en-US' locale to ensure consistent formatting between server and client
  return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "2-digit", month: "short" }).format(d);
}
function formatTimeLabel(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  // Use 'en-US' locale to ensure consistent formatting between server and client
  const tf = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  return `${tf.format(s)} – ${tf.format(e)}`;
}

export default function EventDetailPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const [mounted, setMounted] = useState(false);
  const [ev, setEv] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Current user details (fetched automatically)
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    mobile: string;
    age: number;
    gender: string;
  } | null>(null);
  
  // Existing booking for this event
  const [existingBooking, setExistingBooking] = useState<{
    bookingId: string;
    seats: number;
    guestName: string;
    guestMobile: string;
    additionalGuests: AdditionalGuest[];
    amountTotal: number;
    status: string;
  } | null>(null);
  
  // Event pass data
  const [eventPass, setEventPass] = useState<any>(null);
  const [loadingPass, setLoadingPass] = useState(false);
  
  // Additional guests
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuest[]>([]);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [currentGuestNumber, setCurrentGuestNumber] = useState(0);
  
  const token = getAccessToken();
  const role = getRole();
  const [uploadingEventImages, setUploadingEventImages] = useState(false);
  const [eventImages, setEventImages] = useState<Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>>([]);
  const [eventVideos, setEventVideos] = useState<Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEventOwner, setIsEventOwner] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ bookingId: string; amount: number; eventName: string } | null>(null);
  const [cancelEventModal, setCancelEventModal] = useState<{
    eventId: string;
    eventName: string;
    bookingsCount: number;
  } | null>(null);
  const [eventBookings, setEventBookings] = useState<Array<{
    bookingId: string;
    guestName: string;
    guestMobile: string;
    guestAge: number;
    guestGender: string;
    seats: number;
    status: string;
    additionalGuests: Array<{
      name: string;
      age: number;
      gender: string;
      mobile: string;
    }>;
  }>>([]);
  
  // Calculate max seats user can book (2 total: 1 guest + 1 additional guest minus already booked)
  const maxSeatsAllowed = 2;
  const alreadyBookedSeats = existingBooking?.seats || 0;
  const remainingSeatsAllowed = maxSeatsAllowed - alreadyBookedSeats;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (async () => {
      const { eventId } = await params;
      setError(null);
      const res = await apiFetch<EventDetail>(`/api/events/${eventId}`, { method: "GET" });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEv(res.data);
      setEventImages(res.data.eventImages || []);
      setEventVideos(res.data.eventVideos || []);
      setCurrentSlideIndex(0); // Reset slide index when event changes
    })();
  }, [params]);

  // Check if current user is event owner
  useEffect(() => {
    if (!token || !ev) return;

    (async () => {
      const res = await apiFetch<{
        userId: string;
        role: string;
      }>("/api/me", {
        method: "GET",
        headers: { authorization: `Bearer ${token}` }
      });

      if (res.ok && res.data) {
        setCurrentUserId(res.data.userId);
        setUserRole(res.data.role);
        // Check if user owns the event (regardless of role - they might be logged in as Guest but own the event)
        if (res.data.userId && ev.hostUserId) {
          setIsEventOwner(res.data.userId === ev.hostUserId);
        } else {
          setIsEventOwner(false);
        }
      } else {
        setIsEventOwner(false);
        setUserRole(null);
      }
    })();
  }, [token, ev]);

  // Fetch bookings if user is event owner (regardless of role - Guest can own events too)
  useEffect(() => {
    if (!isEventOwner || !token || !ev) return;

    (async () => {
      const { eventId } = await params;
      const res = await apiFetch<{
        bookings: Array<{
          bookingId: string;
          guestName: string;
          guestMobile: string;
          guestAge: number;
          guestGender: string;
          seats: number;
          status: string;
          additionalGuests: Array<{
            name: string;
            age: number;
            gender: string;
            mobile: string;
          }>;
        }>;
      }>(`/api/events/${eventId}/bookings`, {
        method: "GET",
        headers: { authorization: `Bearer ${token}` }
      });

      if (res.ok && res.data.bookings) {
        setEventBookings(res.data.bookings);
      }
    })();
  }, [isEventOwner, token, ev, params]);

  // Auto-advance slideshow for images (videos handle their own transitions)
  useEffect(() => {
    const total = eventImages.length + eventVideos.length;
    if (total === 0 || total === 1) return; // No need to auto-advance if 0 or 1 item

    // Only auto-advance if current slide is an image (videos auto-advance on end)
    const isImage = currentSlideIndex < eventImages.length;
    if (!isImage) return; // Videos handle their own transitions

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % total);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [currentSlideIndex, eventImages.length, eventVideos.length]);

  // Fetch current user details
  useEffect(() => {
    if (!token || role !== "GUEST") return;
    
    (async () => {
      const res = await apiFetch<{
        userId: string;
        email: string;
        displayName: string;
        role: string;
        profile?: {
          firstName?: string;
          lastName?: string;
          age?: number;
          gender?: string;
          mobile?: string;
        };
      }>("/api/me", {
        method: "GET",
        headers: { authorization: `Bearer ${token}` }
      });
      
      if (res.ok && res.data.profile) {
        const fullName = `${res.data.profile.firstName || ""} ${res.data.profile.lastName || ""}`.trim();
        setCurrentUser({
          name: fullName || res.data.displayName,
          mobile: res.data.profile.mobile || "",
          age: res.data.profile.age || 25,
          gender: res.data.profile.gender || "Male"
        });
      }
    })();
  }, [token, role]);

  // Fetch existing booking for this event
  useEffect(() => {
    if (!token || role !== "GUEST") return;
    
    (async () => {
      const { eventId } = await params;
      const res = await apiFetch<{
        bookingId: string;
        seats: number;
        guestName: string;
        guestMobile: string;
        additionalGuests: AdditionalGuest[];
        amountTotal: number;
        status: string;
      }>(`/api/events/${eventId}/my-booking`, {
        method: "GET",
        headers: { authorization: `Bearer ${token}` }
      });
      
      if (res.ok && res.data) {
        setExistingBooking(res.data);
      }
    })();
  }, [params, token, role]);

  async function handleBook() {
    if (!ev || !token || !currentUser) {
      setBookingError("Please log in to book this event");
      return;
    }
    
    // Validation based on booking type
    if (existingBooking) {
      // If existing booking: ALL seats are additional guests
      if (additionalGuests.length < bookingSeats) {
        setBookingError("Please add details for all guests");
        return;
      }
    } else {
      // If new booking: need additional guests for seats > 1
      if (bookingSeats > 1 && additionalGuests.length < bookingSeats - 1) {
        setBookingError("Please add details for all additional guests");
        return;
      }
    }
    
    setBookingError(null);
    setBookingSuccess(null);
    setBookingInProgress(true);

    const { eventId } = await params;
    
    // If existing booking: Use add-guests endpoint
    if (existingBooking) {
      const res = await apiFetch<{ bookingId: string; amountTotal: number; additionalAmount: number }>(
        `/api/bookings/${existingBooking.bookingId}/add-guests`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: JSON.stringify({
            seats: bookingSeats,
            additionalGuests
          })
        }
      );
      
      setBookingInProgress(false);
      if (!res.ok) {
        setBookingError(res.error);
        return;
      }
      
      setBookingSuccess(`${bookingSeats} guest${bookingSeats > 1 ? 's' : ''} added! Additional amount: ₹${(res.data.additionalAmount / 100).toFixed(0)}. Total booking: ${alreadyBookedSeats + bookingSeats} seats.`);
      
      // Refresh booking status
      const bookingRefresh = await apiFetch<any>(`/api/events/${eventId}/my-booking`, {
        method: "GET",
        headers: { authorization: `Bearer ${token}` }
      });
      if (bookingRefresh.ok && bookingRefresh.data) {
        setExistingBooking(bookingRefresh.data);
        setAdditionalGuests([]);
        setBookingSeats(1);
      }
      return;
    }
    
    // New booking: Use current user as primary
    const bookingData = {
      eventSlotId: eventId, 
      seats: bookingSeats,
      guestName: currentUser.name,
      guestMobile: currentUser.mobile,
      guestAge: currentUser.age,
      guestGender: currentUser.gender,
      additionalGuests
    };
    
    const res = await apiFetch<{ bookingId: string; amountTotal: number }>(
      "/api/guest/bookings",
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify(bookingData)
      }
    );
    setBookingInProgress(false);
    if (!res.ok) {
      setBookingError(res.error);
      return;
    }
    
    const successMessage = `Booking confirmed! Amount: ₹${(res.data.amountTotal / 100).toFixed(0)}. You can view all your bookings in My Bookings page.`;
    
    setBookingSuccess(successMessage);
    setAdditionalGuests([]);
    setBookingSeats(1);
    
    // Refresh booking status
    const bookingRefresh = await apiFetch<any>(`/api/events/${eventId}/my-booking`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` }
    });
    if (bookingRefresh.ok && bookingRefresh.data) {
      setExistingBooking(bookingRefresh.data);
      
      // Fetch event passes for the new booking
      setLoadingPass(true);
      const passesRes = await apiFetch<{ passes: Array<{ passId: string }> }>(
        `/api/bookings/${res.data.bookingId}/passes`,
        {
          method: "GET",
          headers: { authorization: `Bearer ${token}` }
        }
      );
      
      if (passesRes.ok && passesRes.data.passes.length > 0) {
        // Fetch the first pass (primary guest)
        const passRes = await apiFetch<any>(
          `/api/passes/${passesRes.data.passes[0].passId}`,
          {
            method: "GET",
            headers: { authorization: `Bearer ${token}` }
          }
        );
        
        if (passRes.ok && passRes.data.pass) {
          setEventPass(passRes.data.pass);
        }
      }
      setLoadingPass(false);
    }
    
    // Refresh event to see updated seats
    const refreshRes = await apiFetch<EventDetail>(`/api/events/${eventId}`, {
      method: "GET"
    });
    if (refreshRes.ok) setEv(refreshRes.data);
    
    // Reset form
    setBookingSeats(1);
    setAdditionalGuests([]);
  }

  if (error) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-sm text-red-600">Failed to load event: {error}</div>
        </Container>
      </main>
    );
  }
  if (!ev) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-sm text-ink-700">Loading…</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-6">
          <Link href="/events" className="text-sm text-ink-700 hover:text-ink-900">
            ← Back to events
          </Link>
        </div>

        <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6 min-w-0">
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-sand-200 bg-white/60 shadow-card backdrop-blur">
              {/* Media Slideshow */}
              {(eventImages.length > 0 || eventVideos.length > 0) ? (
                <div className="relative h-56 sm:h-72 w-full overflow-hidden">
                  {/* Slides */}
                  <div className="relative h-full w-full">
                    {[...eventImages, ...eventVideos].map((media, idx) => (
                      <div
                        key={idx}
                        className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${
                          idx === currentSlideIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                      >
                        {media.filePath.startsWith("event-images/") ? (
                          <img
                            src={`/api/upload/serve?path=${encodeURIComponent(media.filePath)}`}
                            alt={media.fileName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            src={`/api/upload/serve?path=${encodeURIComponent(media.filePath)}`}
                            className="h-full w-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                            onEnded={() => {
                              // Move to next slide when video ends
                              const total = eventImages.length + eventVideos.length;
                              setCurrentSlideIndex((prev) => (prev + 1) % total);
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Navigation Dots */}
                  {eventImages.length + eventVideos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                      {[...eventImages, ...eventVideos].map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentSlideIndex
                              ? "w-6 bg-white"
                              : "w-2 bg-white/50 hover:bg-white/75"
                          }`}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Previous/Next Buttons */}
                  {eventImages.length + eventVideos.length > 1 && (
                    <>
                      <button
                        onClick={() => {
                          const total = eventImages.length + eventVideos.length;
                          setCurrentSlideIndex((prev) => (prev - 1 + total) % total);
                        }}
                        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50"
                        aria-label="Previous slide"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          const total = eventImages.length + eventVideos.length;
                          setCurrentSlideIndex((prev) => (prev + 1) % total);
                        }}
                        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50"
                        aria-label="Next slide"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-72 bg-gradient-to-br from-sand-100 via-white to-sand-50" />
              )}
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">Hosted</Badge>
                  <Badge tone="ink">{ev.locality}</Badge>
                  {ev.hostStatus === "SUSPENDED" && (
                    <Badge tone="warning" className="bg-red-100 text-red-800 border-red-300">
                      ⚠️ Host Suspended
                    </Badge>
                  )}
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="font-display text-4xl tracking-tight text-ink-900">
                      {ev.title}
                    </h1>
                    <p className="mt-2 text-ink-700">{ev.theme}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEventOwner && ev && ev.status !== "CANCELLED" && new Date(ev.startAt) > new Date() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancelEventModal({
                          eventId: ev.id,
                          eventName: ev.title,
                          bookingsCount: eventBookings.filter(b => b.status === "CONFIRMED" || b.status === "PAYMENT_PENDING").length
                        })}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        Cancel Event
                      </Button>
                    )}
                    <ShareButton eventId={ev.id} />
                  </div>
                </div>

                <div className="mt-5 grid gap-2 text-sm text-ink-700 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                      When
                    </div>
                    <div className="mt-1">
                      {mounted && ev ? (
                        <>
                          {formatDateLabel(ev.startAt)} • {formatTimeLabel(ev.startAt, ev.endAt)}
                        </>
                      ) : (
                        <span className="invisible">Loading...</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                      Seats
                    </div>
                    <div className="mt-1">{ev.seatsLeft} available</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {ev.foodType && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        Food served
                      </div>
                      <div className="mt-2 text-sm text-ink-900">
                        {ev.foodType}
                      </div>
                    </div>
                  )}
                  {ev.cuisines && ev.cuisines.length > 0 && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        Cuisine
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ev.cuisines.map((c) => (
                          <Badge key={c}>{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {ev.foodTags && ev.foodTags.length > 0 && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        Food tags
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ev.foodTags.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {ev.activities && ev.activities.length > 0 && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                        Activities
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ev.activities.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Images and Videos */}
            {(eventImages.length > 0 || eventVideos.length > 0 || isEventOwner) && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 shadow-card backdrop-blur p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-ink-900">Event Media</h3>
                  {isEventOwner && (
                    <label className="text-sm text-primary hover:text-primary/80 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0 || !token) return;

                          const { eventId } = await params;
                          setUploadingEventImages(true);

                          try {
                            const formData = new FormData();
                            formData.append("eventId", eventId);
                            const imageFiles: File[] = [];
                            const videoFiles: File[] = [];

                            files.forEach((file) => {
                              if (file.type.startsWith("image/")) {
                                imageFiles.push(file);
                              } else if (file.type.startsWith("video/")) {
                                videoFiles.push(file);
                              }
                            });

                            imageFiles.forEach((file) => formData.append("images", file));
                            videoFiles.forEach((file) => formData.append("videos", file));

                            const res = await fetch("/api/upload/event-media", {
                              method: "POST",
                              headers: { authorization: `Bearer ${token}` },
                              body: formData
                            });

                            const json = await res.json();

                            if (!res.ok) {
                              alert(json.error || "Failed to upload media");
                              return;
                            }

                            if (json.data?.images) {
                              const newImages = [...eventImages, ...json.data.images];
                              setEventImages(newImages);
                              setEv({ ...ev, eventImages: newImages });
                            }
                            if (json.data?.videos) {
                              const newVideos = [...eventVideos, ...json.data.videos];
                              setEventVideos(newVideos);
                              setEv({ ...ev, eventVideos: newVideos });
                            }
                            
                            const totalUploaded = (json.data?.images?.length || 0) + (json.data?.videos?.length || 0);
                            if (totalUploaded > 0) {
                              alert(`${totalUploaded} file(s) uploaded successfully`);
                            }
                          } catch (err) {
                            alert("Failed to upload media");
                          } finally {
                            setUploadingEventImages(false);
                            e.target.value = "";
                          }
                        }}
                        disabled={uploadingEventImages}
                        className="hidden"
                      />
                      {uploadingEventImages ? "Uploading..." : "+ Add Media"}
                    </label>
                  )}
                </div>

                {/* Images */}
                {eventImages.length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-medium text-ink-900">Photos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {eventImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={`/api/upload/serve?path=${encodeURIComponent(img.filePath)}`}
                            alt={img.fileName}
                            className="w-full h-48 object-cover rounded-2xl border border-sand-200"
                          />
                        {isEventOwner && (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!token) return;
                              const { eventId } = await params;
                              try {
                                const res = await fetch(
                                  `/api/upload/event-media?eventId=${eventId}&mediaPath=${encodeURIComponent(img.filePath)}&mediaType=image`,
                                  {
                                    method: "DELETE",
                                    headers: { authorization: `Bearer ${token}` }
                                  }
                                );
                                if (res.ok) {
                                  const newImages = eventImages.filter((_, i) => i !== idx);
                                  setEventImages(newImages);
                                  setEv({ ...ev, eventImages: newImages });
                                }
                              } catch (err) {
                                alert("Failed to remove image");
                              }
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {eventVideos.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-ink-900">Videos</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {eventVideos.map((vid, idx) => (
                        <div key={idx} className="relative group">
                          <video
                            src={`/api/upload/serve?path=${encodeURIComponent(vid.filePath)}`}
                            className="w-full h-64 object-cover rounded-2xl border border-sand-200"
                            controls
                          />
                          {isEventOwner && (
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!token) return;
                                const { eventId } = await params;
                                try {
                                  const res = await fetch(
                                    `/api/upload/event-media?eventId=${eventId}&mediaPath=${encodeURIComponent(vid.filePath)}&mediaType=video`,
                                    {
                                      method: "DELETE",
                                      headers: { authorization: `Bearer ${token}` }
                                    }
                                  );
                                  if (res.ok) {
                                    const newVideos = eventVideos.filter((_, i) => i !== idx);
                                    setEventVideos(newVideos);
                                    setEv({ ...ev, eventVideos: newVideos });
                                  }
                                } catch (err) {
                                  alert("Failed to remove video");
                                }
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove video"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {eventImages.length === 0 && eventVideos.length === 0 && (
                  <p className="text-sm text-ink-600">No media uploaded yet.</p>
                )}
              </div>
            )}

            {/* Venue Address and Location */}
            {ev.venueAddress && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 shadow-card backdrop-blur p-6">
                <h3 className="mb-4 text-lg font-semibold text-ink-900">Venue Location</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-ink-700 mb-1">Address</div>
                    <div className="text-sm text-ink-900">{ev.venueAddress}</div>
                    {(ev.locality || ev.city || ev.state) && (
                      <div className="text-sm text-ink-600 mt-1">
                        {[ev.locality, ev.city, ev.state].filter(Boolean).join(", ")}
                        {ev.postalCode && ` - ${ev.postalCode}`}
                      </div>
                    )}
                  </div>
                  
                  {/* Map */}
                  {ev.venueLatitude !== null && ev.venueLatitude !== undefined && 
                   ev.venueLongitude !== null && ev.venueLongitude !== undefined && (
                    <div className="mt-4">
                      <AddressMap
                        address={ev.venueAddress}
                        latitude={ev.venueLatitude}
                        longitude={ev.venueLongitude}
                        editable={false}
                        onLocationSelect={() => {
                          // No-op in view mode
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Venue Images */}
            {ev.venueImages && ev.venueImages.length > 0 && (
              <div className="rounded-3xl border border-sand-200 bg-white/60 shadow-card backdrop-blur p-6">
                <h3 className="mb-4 text-lg font-semibold text-ink-900">Venue Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {ev.venueImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={`/api/upload/serve?path=${encodeURIComponent(img.filePath)}`}
                      alt={img.fileName}
                      className="w-full h-48 object-cover rounded-2xl border border-sand-200"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-sand-200 bg-white/50 p-6 shadow-soft backdrop-blur">
                <div className="font-medium text-ink-900">What’s included</div>
                <ul className="mt-3 space-y-2 text-sm text-ink-700">
                  <li>• Hosted social meal (small group)</li>
                  <li>• Food tags clearly listed (veg/vegan/halal etc.)</li>
                  <li>• Games/activities (if listed)</li>
                  <li>• Two-way ratings after the event</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-sand-200 bg-sand-50/60 p-6 shadow-soft backdrop-blur">
                <div className="font-medium text-ink-900">Dietary & allergies</div>
                <p className="mt-2 text-sm text-ink-700">
                  DineAtHome Social matching prioritizes compatibility. Hosts see
                  allergies/restrictions (with consent) to help keep the table safe.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>Nut-free</Badge>
                  <Badge>Dairy-free</Badge>
                  <Badge>Spice levels</Badge>
                </div>
              </div>
            </div>

            {/* Event Cancellation Notice */}
            {ev.status === "CANCELLED" && (
              <div className="rounded-3xl border-2 border-orange-300 bg-orange-50/80 p-6 shadow-soft backdrop-blur mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900 mb-2">Event Cancelled</h3>
                    <p className="text-sm text-orange-800 mb-2">
                      This event has been cancelled by the host.
                    </p>
                    {ev.cancellationReason && (
                      <div className="mt-3 p-3 bg-white/60 rounded-lg border border-orange-200">
                        <p className="text-xs font-medium text-orange-900 mb-1">Cancellation Reason:</p>
                        <p className="text-sm text-orange-800">{ev.cancellationReason}</p>
                      </div>
                    )}
                    {ev.cancelledAt && (
                      <p className="text-xs text-orange-700 mt-2">
                        Cancelled on: {mounted ? new Intl.DateTimeFormat("en-US", { 
                          month: "long", 
                          day: "numeric", 
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        }).format(new Date(ev.cancelledAt)) : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-sand-200 bg-white/50 p-6 shadow-soft backdrop-blur">
              <div className="font-medium text-ink-900">About the host</div>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <Link
                  href={`/hosts/${ev.hostUserId}`}
                  className="font-medium text-ink-900 hover:text-ink-600 hover:underline"
                >
                  {ev.hostName}
                </Link>
                <span className="text-ink-600">•</span>
                <span className="text-sm text-ink-700">{ev.hostRating.toFixed(1)} ⭐ rating</span>
              </div>
              <div className="mt-3">
                <VerificationBadge 
                  isIdentityVerified={ev.verified} 
                  governmentIdPath={ev.governmentIdPath} 
                />
              </div>
              <p className="mt-3 text-sm text-ink-700">
                Host bios, house rules, venue photos, and verification details will
                come from the backend profiles model.
              </p>
              
              {/* Check-in and Reminders */}
              <div className="mt-4 pt-4 border-t border-sand-200 space-y-3">
                {existingBooking && role === "GUEST" && (
                  <CheckInButton
                    eventId={ev.id}
                    bookingId={existingBooking.bookingId}
                    onCheckIn={() => {
                      // Refresh booking status
                      (async () => {
                        const { eventId } = await params;
                        const res = await apiFetch<{
                          bookingId: string;
                          seats: number;
                          guestName: string;
                          guestMobile: string;
                          additionalGuests: AdditionalGuest[];
                          amountTotal: number;
                          status: string;
                        }>(`/api/events/${eventId}/my-booking`, {
                          headers: { authorization: `Bearer ${token}` }
                        });
                        if (res.ok && res.data) {
                          setExistingBooking(res.data);
                        }
                      })();
                    }}
                  />
                )}
                {isEventOwner && (
                  <>
                    <ReminderButton eventId={ev.id} isHost={true} />
                    <div className="text-xs text-ink-600">
                      Send reminders to all confirmed guests
                    </div>
                    {ev && ev.status !== "CANCELLED" && new Date(ev.startAt) > new Date() && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancelEventModal({
                            eventId: ev.id,
                            eventName: ev.title,
                            bookingsCount: eventBookings.filter(b => b.status === "CONFIRMED" || b.status === "PAYMENT_PENDING").length
                          })}
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                          Cancel Event
                        </Button>
                        <div className="text-xs text-ink-600">
                          Cancel this event and notify all guests
                        </div>
                      </>
                    )}
                  </>
                )}
                {/* Guest Chat Button - Only show if guest has booked, booking is not cancelled, and event hasn't ended */}
                {role === "GUEST" && existingBooking && 
                 existingBooking.status !== "CANCELLED" &&
                 ev.endAt && new Date(ev.endAt) > new Date() && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link href={`/messages/${ev.id}`}>
                        💬 Chat with Host
                      </Link>
                    </Button>
                    <div className="text-xs text-ink-600">
                      Chat available until event ends
                    </div>
                  </>
                )}
                {/* Show message if booking is cancelled */}
                {role === "GUEST" && existingBooking && existingBooking.status === "CANCELLED" && (
                  <div className="text-xs text-ink-600">
                    ⚠️ Chat closed - Your booking has been cancelled
                  </div>
                )}
                {/* Show if event has ended */}
                {ev.endAt && new Date(ev.endAt) <= new Date() && (
                  <div className="text-xs text-ink-600">
                    ⏰ Event has ended - Chat is now closed
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-sand-200 bg-white/50 p-6 shadow-soft backdrop-blur">
              <div className="font-medium text-ink-900">Reviews</div>
              <p className="mt-2 text-sm text-ink-700">
                Guest → Host feedback will appear here after events complete.
              </p>
            </div>

          </div>

          <div className="space-y-6">
          <aside className="h-fit rounded-3xl border border-sand-200 bg-white/70 p-6 shadow-card backdrop-blur">
            <div className="text-sm font-medium text-ink-700">From</div>
            <div className="mt-1 font-display text-3xl text-ink-900">
              ₹{Math.round(ev.priceFrom)}
              <span className="ml-2 align-middle text-sm font-sans text-ink-600">
                / guest
              </span>
            </div>
            <div className="mt-3 text-sm text-ink-700">
              Pricing will adjust by your guest type (Basic/Premium) after login.
            </div>

            {bookingError ? (
              <div className="mb-4">
                <Alert title="Booking failed" desc={bookingError} />
              </div>
            ) : null}
            {bookingSuccess ? (
              <div className="mb-4">
                <Alert title="Success" desc={bookingSuccess} />
              </div>
            ) : null}

            {/* Priority 1: Show booking form if Guest is logged in and doesn't own the event */}
            {token && role === "GUEST" && currentUser && !isEventOwner ? (
              <>
                {/* Priority 2: Show booking form if Guest is logged in and doesn't own the event */}
                {/* Existing Booking (if any) */}
                {existingBooking && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                    {ev.hostStatus === "SUSPENDED" && (
                      <div className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-900 mb-1">Host Suspended</h4>
                            <p className="text-sm text-red-800 mb-3">
                              The host for this event has been suspended. Your booking may be affected.
                            </p>
                            <a
                              href="/support"
                              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              Contact Support for Refund
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✓</span>
                      <div className="text-sm font-medium text-amber-900">
                        You've already booked this event
                      </div>
                    </div>
                    <div className="text-sm text-amber-800 space-y-1">
                      <p><strong>Seats booked:</strong> {existingBooking.seats}</p>
                      <p><strong>Primary guest:</strong> {existingBooking.guestName} • {existingBooking.guestMobile}</p>
                      {existingBooking.additionalGuests.length > 0 && (
                        <div>
                          <strong>Additional guests:</strong>
                          {existingBooking.additionalGuests.map((guest, idx) => (
                            <div key={idx} className="ml-4 text-xs">
                              • {guest.name} • {guest.mobile}
                            </div>
                          ))}
                        </div>
                      )}
                      <p><strong>Amount paid:</strong> ₹{(existingBooking.amountTotal / 100).toFixed(0)}</p>
                      <p><strong>Status:</strong> {existingBooking.status}</p>
                    </div>
                    {remainingSeatsAllowed > 0 && (
                      <div className="mt-3 text-xs text-amber-700 bg-amber-100/50 rounded-lg p-2">
                        💡 You can book {remainingSeatsAllowed} more seat{remainingSeatsAllowed > 1 ? 's' : ''} for this event (2 seats max per person)
                      </div>
                    )}
                    {remainingSeatsAllowed === 0 && (
                      <div className="mt-3 text-xs text-amber-700 bg-amber-100/50 rounded-lg p-2">
                        🔒 You've reached the maximum limit of 2 seats for this event
                      </div>
                    )}
                    {/* Event Pass Button - Show for CONFIRMED and PAYMENT_PENDING bookings */}
                    {role === "GUEST" && existingBooking && 
                     (existingBooking.status === "CONFIRMED" || existingBooking.status === "PAYMENT_PENDING") && (
                      <div className="mt-4 pt-4 border-t border-amber-300 space-y-2">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                          onClick={async () => {
                            if (!token) return;
                            setLoadingPass(true);
                            const passesRes = await apiFetch<{ passes: Array<{ passId: string }> }>(
                              `/api/bookings/${existingBooking.bookingId}/passes`,
                              {
                                method: "GET",
                                headers: { authorization: `Bearer ${token}` }
                              }
                            );
                            
                            if (passesRes.ok && passesRes.data.passes.length > 0) {
                              const passRes = await apiFetch<any>(
                                `/api/passes/${passesRes.data.passes[0].passId}`,
                                {
                                  method: "GET",
                                  headers: { authorization: `Bearer ${token}` }
                                }
                              );
                              
                              if (passRes.ok && passRes.data.pass) {
                                setEventPass(passRes.data.pass);
                              }
                            }
                            setLoadingPass(false);
                          }}
                          disabled={loadingPass}
                        >
                          {loadingPass ? "Loading..." : "🎫 View Event Pass"}
                        </Button>
                        {ev.startAt && new Date(ev.startAt) > new Date() && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
                              onClick={() => setCancelModal({
                                bookingId: existingBooking.bookingId,
                                amount: existingBooking.amountTotal,
                                eventName: ev.title
                              })}
                            >
                              ❌ Cancel Booking
                            </Button>
                            <p className="text-xs text-ink-600 text-center">
                              Cancellation policy: 24+ hours = Full refund • Less than 24h = No refund
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Show current user info - Only show if NO existing booking */}
                {remainingSeatsAllowed > 0 && !existingBooking && (
                  <div className="mt-5 rounded-2xl border border-sand-200 bg-sand-50/50 p-4">
                    <div className="text-sm font-medium text-ink-900 mb-2">
                      Booking as:
                    </div>
                    <div className="text-sm text-ink-700">
                      <p className="font-medium text-ink-900">{currentUser.name}</p>
                      <p>{currentUser.mobile} • {currentUser.age}y • {currentUser.gender}</p>
                    </div>
                  </div>
                )}

                {/* Number of Seats Selector - Only if can still book */}
                {remainingSeatsAllowed > 0 && ev.hostStatus !== "SUSPENDED" && (
                  <div className="mt-5">
                    <label className="block text-sm font-medium text-ink-900 mb-2">
                      {existingBooking 
                        ? 'Number of Additional Guests' 
                        : 'Number of Seats'
                      }
                    </label>
                    <select
                      value={bookingSeats}
                      onChange={(e) => {
                        const newSeats = parseInt(e.target.value);
                        setBookingSeats(newSeats);
                        // Reset additional guests if reducing seats
                        const guestsNeeded = existingBooking ? newSeats : newSeats - 1;
                        if (additionalGuests.length > guestsNeeded) {
                          setAdditionalGuests(additionalGuests.slice(0, guestsNeeded));
                        }
                      }}
                      className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-ink-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {Array.from(
                        { length: Math.min(ev.seatsLeft, remainingSeatsAllowed) }, 
                        (_, i) => i + 1
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n} {existingBooking ? 'guest' : 'seat'}{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-ink-600">
                      {existingBooking 
                        ? `Add up to ${remainingSeatsAllowed} more guest${remainingSeatsAllowed > 1 ? 's' : ''} to your booking`
                        : 'Maximum 2 seats per booking (yourself + 1 guest)'
                      }
                    </p>
                  </div>
                )}

                {/* Additional Guests Section */}
                {remainingSeatsAllowed > 0 && (
                  <>
                    {/* If NO existing booking: Show additional guests when seats > 1 */}
                    {!existingBooking && bookingSeats > 1 && (
                      <div className="mt-5 rounded-2xl border border-sand-200 bg-sand-50/50 p-4">
                        <h4 className="mb-3 text-sm font-medium text-ink-900">
                          Additional Guests ({additionalGuests.length} of {bookingSeats - 1} added)
                        </h4>

                        <div className="space-y-3">
                          {Array.from({ length: bookingSeats - 1 }, (_, index) => {
                            const guest = additionalGuests[index];
                            
                            return (
                              <div key={index} className="flex items-center justify-between rounded-xl border border-sand-200 bg-white p-3">
                                <div className="flex-1">
                                  {guest ? (
                                    <div>
                                      <p className="text-sm font-medium text-ink-900">
                                        {guest.name}
                                      </p>
                                      <p className="text-xs text-ink-600">
                                        {guest.mobile} • {guest.age}y • {guest.gender}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-ink-600">
                                      Guest #{index + 2} - Not added yet
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant={guest ? "outline" : undefined}
                                  onClick={() => {
                                    setCurrentGuestNumber(index + 2);
                                    setIsAddGuestModalOpen(true);
                                  }}
                                >
                                  {guest ? "Edit" : "Add Guest"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        
                        {additionalGuests.length < bookingSeats - 1 && (
                          <p className="mt-2 text-xs text-amber-700">
                            Please add details for all guests before booking
                          </p>
                        )}
                      </div>
                    )}

                    {/* If HAS existing booking: ALL seats are additional guests */}
                    {existingBooking && bookingSeats > 0 && (
                      <div className="mt-5 rounded-2xl border border-sand-200 bg-sand-50/50 p-4">
                        <h4 className="mb-3 text-sm font-medium text-ink-900">
                          Guest Details ({additionalGuests.length} of {bookingSeats} added)
                        </h4>
                        <p className="mb-3 text-xs text-ink-600">
                          Add details for each additional guest joining your booking
                        </p>
                        
                        <div className="space-y-3">
                          {Array.from({ length: bookingSeats }, (_, index) => {
                            const guest = additionalGuests[index];
                            
                            return (
                              <div key={index} className="flex items-center justify-between rounded-xl border border-sand-200 bg-white p-3">
                                <div className="flex-1">
                                  {guest ? (
                                    <div>
                                      <p className="text-sm font-medium text-ink-900">
                                        {guest.name}
                                      </p>
                                      <p className="text-xs text-ink-600">
                                        {guest.mobile} • {guest.age}y • {guest.gender}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-ink-600">
                                      Guest #{index + 1} - Not added yet
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant={guest ? "outline" : undefined}
                                  onClick={() => {
                                    setCurrentGuestNumber(index + 1);
                                    setIsAddGuestModalOpen(true);
                                  }}
                                >
                                  {guest ? "Edit" : "Add Guest"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        
                        {additionalGuests.length < bookingSeats && (
                          <p className="mt-2 text-xs text-amber-700">
                            Please add details for all guests before booking
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {remainingSeatsAllowed > 0 && (
                  <>
                    <div className="mt-5 space-y-2 text-sm text-ink-700">
                      <div className="flex items-center justify-between">
                        <span>Price per seat</span>
                        <span className="font-medium text-ink-900">₹{Math.round(ev.priceFrom)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{existingBooking ? 'Additional guests' : 'Seats'}</span>
                        <span className="font-medium text-ink-900">{bookingSeats}</span>
                      </div>
                      {existingBooking && (
                        <div className="flex items-center justify-between text-xs">
                          <span>Already booked</span>
                          <span className="font-medium">{alreadyBookedSeats} seat{alreadyBookedSeats > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-sand-200 pt-3">
                        <span>Total {existingBooking ? '(New guests)' : ''}</span>
                        <span className="font-medium text-ink-900">
                          ₹{Math.round(ev.priceFrom * bookingSeats)}
                        </span>
                      </div>
                    </div>

                    {/* Book Button */}
                    <div className="mt-6 space-y-3">
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={handleBook}
                        disabled={
                          bookingInProgress || 
                          ev.hostStatus === "SUSPENDED" ||
                          ev.status === "CANCELLED" ||
                          ev.seatsLeft < 1 ||
                          !currentUser ||
                          remainingSeatsAllowed === 0 ||
                          // If no existing booking: need all additional guests (seats - 1)
                          (!existingBooking && bookingSeats > 1 && additionalGuests.length < bookingSeats - 1) ||
                          // If existing booking: need ALL guests details (all seats are additional)
                          (!!existingBooking && additionalGuests.length < bookingSeats)
                        }
                      >
                        {bookingInProgress ? "Booking..." : existingBooking ? "Add Guests to Booking" : "Book"}
                      </Button>
                      
                      {ev.hostStatus === "SUSPENDED" && (
                        <p className="text-sm text-red-600 mt-2 font-medium text-center">
                          ⚠️ Booking is disabled because the host has been suspended.
                        </p>
                      )}
                      {ev.hostStatus !== "SUSPENDED" && !existingBooking && bookingSeats > 1 && additionalGuests.length < bookingSeats - 1 && (
                        <p className="text-center text-xs text-ink-600">
                          Add all guest details to proceed
                        </p>
                      )}
                      {ev.hostStatus !== "SUSPENDED" && existingBooking && additionalGuests.length < bookingSeats && (
                        <p className="text-center text-xs text-ink-600">
                          Add details for all {bookingSeats} guest{bookingSeats > 1 ? 's' : ''} to proceed
                        </p>
                      )}
                      
                      {bookingError && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                          {bookingError}
                        </div>
                      )}
                      {bookingSuccess && (
                        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                          {bookingSuccess}
                        </div>
                      )}
                      
                      <div className="text-xs text-ink-600">
                        {existingBooking 
                          ? 'Guest details will be shared with the host.'
                          : 'Your details will be shared with the host for coordination.'
                        }
                      </div>
                    </div>
                  </>
                )}
                
                {/* Max booking reached - disable booking */}
                {remainingSeatsAllowed === 0 && (
                  <div className="mt-6 space-y-3">
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={true}
                    >
                      Maximum Seats Booked
                    </Button>
                    <div className="text-center text-xs text-ink-600">
                      You've reached the 2-seat limit for this event
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Priority 3: Show "Login as Guest to Book" for non-logged-in users or non-Guest users */}
                {/* Only show if user is NOT the event owner (to prevent showing for Guest owners) */}
                {!isEventOwner && (
                  <>
                    <div className="mt-5 space-y-2 text-sm text-ink-700">
                      <div className="flex items-center justify-between">
                        <span>Seats</span>
                        <span className="font-medium text-ink-900">1</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-sand-200 pt-3">
                        <span>Total</span>
                        <span className="font-medium text-ink-900">₹{Math.round(ev.priceFrom)}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <Button size="lg" variant="outline" className="w-full" asChild>
                        <Link href="/auth/login">Login as Guest to Book</Link>
                      </Button>
                      <div className="text-xs text-ink-600">
                        Payments handled via Razorpay (order + webhook verification).
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </aside>

          {/* Event Owner View: Check-in Interface for Hosts */}
          {isEventOwner && (userRole === "HOST" || role === "HOST") && (
            <aside className="mt-6 h-fit rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/50 to-pink-50/50 p-6 shadow-soft backdrop-blur">
              <div className="font-medium text-ink-900 mb-4">Check-In Guests</div>
              <CheckInInterface eventId={ev.id} />
            </aside>
          )}

          {/* Event Owner View: Show bookings list as separate section in right sidebar (for both HOST and GUEST roles if they own the event) */}
          {isEventOwner && (
            <aside className="mt-6 h-fit rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/50 to-pink-50/50 p-6 shadow-soft backdrop-blur">
              <div className="font-medium text-ink-900 mb-4">
                {role === "GUEST" ? "Guests Booked for Your Event" : "Event Bookings"} ({eventBookings.length})
              </div>
              {/* Show seats remaining */}
              <div className="mb-4 p-3 rounded-xl bg-white/80 border border-sand-200">
                <div className="text-sm font-medium text-ink-900 mb-1">
                  Seats Available: <span className="text-violet-600">{ev.seatsLeft}</span>
                </div>
                <div className="text-xs text-ink-600">
                  Total Seats: {ev.seatsLeft + eventBookings.reduce((sum, b) => sum + b.seats, 0)}
                </div>
              </div>
              {eventBookings.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {eventBookings.map((booking, idx) => (
                  <div key={booking.bookingId} className="rounded-2xl border border-sand-200 bg-white/80 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-ink-900">
                          Booking #{idx + 1}
                        </div>
                        <Badge tone={booking.status === "CONFIRMED" ? "success" : "warning"} className="mt-1">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-ink-600">
                        {booking.seats} seat{booking.seats > 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    {/* Primary Guest */}
                    <div className="text-sm">
                      <div className="font-medium text-ink-900 mb-1">Primary Guest:</div>
                      <div className="pl-3 text-ink-700 space-y-1">
                        <div>👤 {booking.guestName}</div>
                        <div>📱 {booking.guestMobile}</div>
                        <div>🎂 {booking.guestAge} years • {booking.guestGender}</div>
                      </div>
                    </div>

                    {/* Additional Guests */}
                    {booking.additionalGuests && booking.additionalGuests.length > 0 && (
                      <div className="mt-3 text-sm">
                        <div className="font-medium text-ink-900 mb-1">
                          Additional Guest{booking.additionalGuests.length > 1 ? 's' : ''}:
                        </div>
                        {booking.additionalGuests.map((guest, gIdx) => (
                          <div key={gIdx} className="pl-3 text-ink-700 space-y-1 mt-2 pt-2 border-t border-sand-100">
                            <div>👤 {guest.name}</div>
                            <div>📱 {guest.mobile}</div>
                            <div>🎂 {guest.age} years • {guest.gender}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              ) : (
                <div className="text-sm text-ink-600 text-center py-4">
                  No bookings yet. Waiting for guests to book seats.
                </div>
              )}
            </aside>
          )}
          </div>
        </div>
      </Container>

      <AddGuestModal
        isOpen={isAddGuestModalOpen}
        onClose={() => setIsAddGuestModalOpen(false)}
        guestNumber={currentGuestNumber}
        onSave={(guest: AdditionalGuest) => {
          const guestIndex = currentGuestNumber - 2;
          const newGuests = [...additionalGuests];
          newGuests[guestIndex] = guest;
          setAdditionalGuests(newGuests);
        }}
      />

      {eventPass && (
        <EventPass
          pass={eventPass}
          onClose={() => setEventPass(null)}
        />
      )}

      {cancelModal && (
        <RefundModal
          isOpen={!!cancelModal}
          onClose={() => {
            setCancelModal(null);
            // Refresh booking status and event details
            (async () => {
              const { eventId } = await params;
              
              // Refresh booking status
              const bookingRes = await apiFetch<{
                bookingId: string;
                seats: number;
                guestName: string;
                guestMobile: string;
                additionalGuests: AdditionalGuest[];
                amountTotal: number;
                status: string;
              }>(`/api/events/${eventId}/my-booking`, {
                headers: { authorization: `Bearer ${token}` }
              });
              
              if (bookingRes.ok && bookingRes.data) {
                setExistingBooking(bookingRes.data);
              } else {
                // Booking was cancelled, clear it
                setExistingBooking(null);
              }
              
              // Refresh event details to update seat availability
              const eventRes = await apiFetch<EventDetail>(`/api/events/${eventId}`, {
                method: "GET"
              });
              if (eventRes.ok && eventRes.data) {
                setEv(eventRes.data);
              }
            })();
          }}
          bookingId={cancelModal.bookingId}
          amount={cancelModal.amount}
          eventName={cancelModal.eventName}
          onSuccess={() => {
            // Refresh everything after successful cancellation
            (async () => {
              const { eventId } = await params;
              
              // Clear booking
              setExistingBooking(null);
              setCancelModal(null);
              
              // Refresh event details to show updated seat availability
              const eventRes = await apiFetch<EventDetail>(`/api/events/${eventId}`, {
                method: "GET"
              });
              if (eventRes.ok && eventRes.data) {
                setEv(eventRes.data);
              }
            })();
          }}
        />
      )}

      {cancelEventModal && (
        <CancelEventModal
          isOpen={!!cancelEventModal}
          onClose={() => setCancelEventModal(null)}
          eventId={cancelEventModal.eventId}
          eventName={cancelEventModal.eventName}
          bookingsCount={cancelEventModal.bookingsCount}
          onSuccess={() => {
            // Refresh event data after successful cancellation
            (async () => {
              const { eventId } = await params;
              const eventRes = await apiFetch<EventDetail>(`/api/events/${eventId}`, { method: "GET" });
              if (eventRes.ok && eventRes.data) {
                setEv(eventRes.data);
              }
              // Refresh bookings
              if (isEventOwner && token) {
                const bookingsRes = await apiFetch<{
                  bookings: Array<{
                    bookingId: string;
                    guestName: string;
                    guestMobile: string;
                    guestAge: number;
                    guestGender: string;
                    seats: number;
                    status: string;
                    additionalGuests: Array<{
                      name: string;
                      age: number;
                      gender: string;
                      mobile: string;
                    }>;
                  }>;
                }>(`/api/events/${eventId}/bookings`, {
                  method: "GET",
                  headers: { authorization: `Bearer ${token}` }
                });
                if (bookingsRes.ok && bookingsRes.data) {
                  setEventBookings(bookingsRes.data.bookings);
                }
              }
            })();
            setCancelEventModal(null);
          }}
        />
      )}
    </main>
  );
}

