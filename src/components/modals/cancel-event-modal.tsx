"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type CancelEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  bookingsCount: number;
  onSuccess?: () => void;
};

export function CancelEventModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  bookingsCount,
  onSuccess
}: CancelEventModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (!reason.trim()) {
      setErrorMessage("Please provide a reason for cancellation");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setErrorMessage("Please log in to cancel event");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch(`/api/host/events/${eventId}/cancel`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason: reason.trim() })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setReason("");
          setSuccess(false);
        }, 2000);
      } else {
        setErrorMessage(res.error || "Failed to cancel event. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling event:", error);
      setErrorMessage("Failed to cancel event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting && !success) {
      setReason("");
      setErrorMessage(null);
      onClose();
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-3xl border-2 border-green-200 bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="font-display text-2xl text-green-700 mb-2">Event Cancelled</h2>
            <p className="text-ink-700 mb-4">
              The event has been cancelled successfully. All {bookingsCount} guest{bookingsCount !== 1 ? "s" : ""} have been notified.
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border-2 border-orange-200 bg-white p-8 shadow-xl">
        <button
          onClick={handleClose}
          disabled={submitting}
          className="absolute right-4 top-4 text-ink-400 hover:text-ink-600 disabled:opacity-50"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">Cancel Event</h2>
            <p className="text-sm text-ink-700">
              Are you sure you want to cancel <strong>"{eventName}"</strong>?
            </p>
            {bookingsCount > 0 && (
              <p className="mt-2 text-sm text-orange-700 font-medium">
                ⚠️ This will cancel {bookingsCount} booking{bookingsCount !== 1 ? "s" : ""} and notify all guests.
              </p>
            )}
          </div>

          <div>
            <Input
              type="text"
              label="Reason for Cancellation *"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="e.g., Unforeseen circumstances, venue unavailable..."
              className="w-full"
              disabled={submitting}
              maxLength={500}
              error={errorMessage && !reason.trim() ? errorMessage : undefined}
            />
            <p className="mt-1 text-xs text-ink-600">
              This reason will be shared with all guests who have booked this event.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancel}
              disabled={submitting || !reason.trim()}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
