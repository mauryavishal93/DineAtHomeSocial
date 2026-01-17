"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type CoGuest = {
  userId: string;
  guestName: string;
  alreadyRated: boolean;
};

type Host = {
  userId: string;
  hostName: string;
  venueName: string;
  alreadyRated: boolean;
};

type EligibilityResponse = {
  canRate: boolean;
  reason?: string;
  bookingId?: string;
  host?: Host;
  coGuests?: CoGuest[];
};

export default function RateEventPage(props: { params: Promise<{ eventId: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Host ratings
  const [eventRating, setEventRating] = useState(0);
  const [venueRating, setVenueRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [hospitalityRating, setHospitalityRating] = useState(0);
  const [hostComment, setHostComment] = useState("");

  // Guest ratings (userId -> rating)
  const [guestRatings, setGuestRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    checkEligibility();
  }, [params.eventId]);

  const checkEligibility = async () => {
    try {
      // Get token for authorization
      const token = getAccessToken();
      
      if (!token) {
        setError("Please log in to rate this event");
        setLoading(false);
        return;
      }
      
      console.log("Checking eligibility for event:", params.eventId);
      console.log("Token exists:", !!token);
      
      const res = await apiFetch<EligibilityResponse>(
        `/api/feedback/check-eligibility?eventSlotId=${params.eventId}`,
        {
          headers: {
            authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log("Eligibility response:", res);
      
      if (!res.ok) {
        console.error("Eligibility check failed:", res.error);
        setError(res.error || "Failed to check eligibility");
        setLoading(false);
        return;
      }
      
      setEligibility(res.data);
      
      if (!res.data.canRate) {
        setError(res.data.reason || "You cannot rate this event");
      }
    } catch (err) {
      console.error("Exception in checkEligibility:", err);
      setError(`Failed to load rating eligibility: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const submitHostRating = async () => {
    if (!eligibility?.host || eligibility.host.alreadyRated) return;
    
    if (!eventRating || !venueRating || !foodRating || !hospitalityRating) {
      setError("Please provide all host ratings");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = getAccessToken();
      
      if (!token) {
        setError("Please log in to submit rating");
        setSubmitting(false);
        return;
      }
      
      const res = await apiFetch<{ success: boolean; message: string }>("/api/feedback/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "HOST",
          eventSlotId: params.eventId,
          bookingId: eligibility.bookingId,
          hostUserId: eligibility.host.userId,
          eventRating,
          venueRating,
          foodRating,
          hospitalityRating,
          comment: hostComment
        })
      });

      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }

      setSuccess("Host rating submitted successfully!");
      
      // Refresh eligibility to show updated status
      setTimeout(() => checkEligibility(), 1000);
    } catch (err: any) {
      setError(err.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const submitGuestRating = async (guestUserId: string) => {
    const rating = guestRatings[guestUserId];
    
    if (!rating) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = getAccessToken();
      
      if (!token) {
        setError("Please log in to submit rating");
        setSubmitting(false);
        return;
      }
      
      const res = await apiFetch<{ success: boolean; message: string }>("/api/feedback/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "GUEST",
          eventSlotId: params.eventId,
          bookingId: eligibility?.bookingId,
          toGuestUserId: guestUserId,
          rating
        })
      });

      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }

      setSuccess("Guest rating submitted successfully!");
      
      // Refresh eligibility
      setTimeout(() => checkEligibility(), 1000);
    } catch (err: any) {
      setError(err.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    readonly = false 
  }: { 
    value: number; 
    onChange?: (val: number) => void;
    readonly?: boolean;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={`text-2xl transition-colors ${
              star <= value ? "text-amber-500" : "text-sand-300"
            } ${readonly ? "cursor-default" : "cursor-pointer hover:text-amber-400"}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center">Loading...</div>
        </Container>
      </main>
    );
  }

  if (!eligibility?.canRate) {
    return (
      <main className="py-10">
        <Container>
          <Alert title="Cannot Rate Event" desc={error || "You cannot rate this event"} />
          <Button className="mt-4" onClick={() => router.push("/bookings")}>
            Back to My Bookings
          </Button>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight text-ink-900">
            Rate Event Experience
          </h1>
          <p className="mt-2 text-ink-700">
            Share your feedback to help improve future events
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
            {success}
          </div>
        )}

        {/* Host Rating Section */}
        {eligibility.host && (
          <div className="mb-8 rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-card backdrop-blur">
            <h2 className="mb-4 font-display text-2xl text-ink-900">
              Rate Host & Experience
            </h2>
            
            {eligibility.host.alreadyRated ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
                You have already rated this host ✓
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-sm font-medium text-ink-900">
                    Host: {eligibility.host.hostName}
                  </p>
                  <p className="mb-4 text-sm text-ink-700">
                    Venue: {eligibility.host.venueName}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-900">
                    Event Quality
                  </label>
                  <StarRating value={eventRating} onChange={setEventRating} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-900">
                    Venue Rating
                  </label>
                  <StarRating value={venueRating} onChange={setVenueRating} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-900">
                    Food Quality
                  </label>
                  <StarRating value={foodRating} onChange={setFoodRating} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-900">
                    Hospitality
                  </label>
                  <StarRating value={hospitalityRating} onChange={setHospitalityRating} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-900">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    value={hostComment}
                    onChange={(e) => setHostComment(e.target.value)}
                    className="w-full rounded-2xl border border-sand-200 bg-white/60 px-4 py-3 text-ink-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={3}
                    placeholder="Share your experience..."
                  />
                </div>

                <Button
                  onClick={submitHostRating}
                  disabled={submitting || !eventRating || !venueRating || !foodRating || !hospitalityRating}
                >
                  {submitting ? "Submitting..." : "Submit Host Rating"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Co-Guests Rating Section */}
        {eligibility.coGuests && eligibility.coGuests.length > 0 && (
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-card backdrop-blur">
            <h2 className="mb-4 font-display text-2xl text-ink-900">
              Rate Co-Guests
            </h2>
            
            <div className="space-y-4">
              {eligibility.coGuests.map((guest) => (
                <div
                  key={guest.userId}
                  className="flex items-center justify-between rounded-2xl border border-sand-200 bg-sand-50/50 p-4"
                >
                  <div>
                    <p className="font-medium text-ink-900">{guest.guestName}</p>
                    {guest.alreadyRated && (
                      <p className="text-sm text-success">Already rated ✓</p>
                    )}
                  </div>

                  {guest.alreadyRated ? (
                    <div className="text-sm text-ink-700">Rating submitted</div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <StarRating
                        value={guestRatings[guest.userId] || 0}
                        onChange={(val) =>
                          setGuestRatings({ ...guestRatings, [guest.userId]: val })
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => submitGuestRating(guest.userId)}
                        disabled={submitting || !guestRatings[guest.userId]}
                      >
                        Submit
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <Button variant="outline" onClick={() => router.push("/bookings")}>
            Back to My Bookings
          </Button>
        </div>
      </Container>
    </main>
  );
}
