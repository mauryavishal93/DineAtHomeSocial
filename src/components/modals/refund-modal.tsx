"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type RefundModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  amount: number;
  eventName: string;
  onSuccess?: () => void;
};

const refundReasons = [
  "Change of plans",
  "Event cancelled by host",
  "Emergency/unforeseen circumstances",
  "Not satisfied with event details",
  "Double booking",
  "Other"
];

export function RefundModal({
  isOpen,
  onClose,
  bookingId,
  amount,
  eventName,
  onSuccess
}: RefundModalProps) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellationInfo, setCancellationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && bookingId) {
      // Reset state when modal opens
      setReason("");
      setCustomReason("");
      setErrorMessage("");
      setShowSuccess(false);
      setSubmitting(false);
      loadCancellationInfo();
    } else {
      // Reset state when modal closes
      setReason("");
      setCustomReason("");
      setErrorMessage("");
      setShowSuccess(false);
      setSubmitting(false);
      setCancellationInfo(null);
    }
  }, [isOpen, bookingId]);

  const loadCancellationInfo = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const token = getAccessToken();
      if (!token) {
        setErrorMessage("Please log in to cancel booking");
        setLoading(false);
        return;
      }

      const res = await apiFetch(`/api/bookings/${bookingId}/cancel`, {
        method: "GET",
        headers: { authorization: `Bearer ${token}` }
      });
      
      if (res.ok && res.data) {
        setCancellationInfo(res.data);
      } else {
        setErrorMessage(res.error || "Failed to load cancellation information");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
      console.error("Error loading cancellation info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!reason) {
      setErrorMessage("Please select a reason for cancellation");
      return;
    }

    if (reason === "Other" && !customReason.trim()) {
      setErrorMessage("Please specify your reason");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);
    
    try {
      const token = getAccessToken();
      if (!token) {
        setErrorMessage("Please log in to cancel booking");
        setSubmitting(false);
        return;
      }

      const res = await apiFetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: reason === "Other" ? customReason : reason
        })
      });

      if (res.ok) {
        setShowSuccess(true);
        setErrorMessage("");
        onSuccess?.();
        // Auto close after 5 seconds
        setTimeout(() => {
          onClose();
          setReason("");
          setCustomReason("");
          setShowSuccess(false);
        }, 5000);
      } else {
        setErrorMessage(res.error || "Failed to cancel booking. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  if (showSuccess) {
    const refundAmount = cancellationInfo?.refundAmount || 0;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
        <div className="w-full max-w-md max-h-[90vh] rounded-3xl border-2 border-green-200 bg-white shadow-glow flex flex-col">
          <div className="p-6 pb-4 border-b border-green-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-green-700">🎉 Booking Cancelled</h2>
              <button
                onClick={onClose}
                className="text-ink-600 hover:text-ink-900 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="font-display text-xl text-ink-900 mb-4">Cancellation Confirmed Successfully!</h3>
              
              {refundAmount > 0 ? (
                <div className="mb-6 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="text-4xl font-bold text-green-700 mb-3">
                    ₹{(refundAmount / 100).toFixed(0)}
                  </div>
                  <p className="text-base font-semibold text-green-800 mb-4">
                    💰 Refund Initiated Successfully
                  </p>
                  <div className="bg-white/90 rounded-lg p-5 border-2 border-green-200 shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">⏱️</span>
                      <div className="text-left flex-1">
                        <p className="text-sm font-semibold text-ink-900 mb-2">
                          Refund Processing Timeline
                        </p>
                        <p className="text-sm text-ink-700 leading-relaxed">
                          Your refund of <span className="font-bold text-green-700">₹{(refundAmount / 100).toFixed(0)}</span> has been initiated and will be processed within <span className="font-bold text-green-700">2-3 working days</span>.
                        </p>
                        <p className="text-xs text-ink-600 mt-2 pt-2 border-t border-green-200">
                          💳 The amount will be credited back to your original payment method automatically. You'll receive a confirmation email once the refund is processed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 rounded-xl border-2 border-orange-200 bg-orange-50/50 p-6">
                  <div className="text-3xl mb-3">⚠️</div>
                  <p className="text-sm text-ink-700 leading-relaxed">
                    Your booking has been cancelled successfully. As per our cancellation policy, no refund will be issued for cancellations made less than 24 hours before the event.
                  </p>
                </div>
              )}
              
              <div className="rounded-xl border-2 border-violet-100 bg-violet-50/50 p-4 text-left">
                <p className="text-sm text-ink-700 mb-1">
                  <span className="font-semibold">📅 Event:</span> {eventName}
                </p>
                <p className="text-xs text-ink-500 mt-2 italic">
                  This window will close automatically in a few seconds...
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 pt-4 border-t border-green-100 flex-shrink-0">
            <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
        <div className="w-full max-w-md max-h-[90vh] rounded-3xl border-2 border-violet-200 bg-white p-8 shadow-glow">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!cancellationInfo?.canCancel) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
        <div className="w-full max-w-md max-h-[90vh] rounded-3xl border-2 border-violet-200 bg-white shadow-glow flex flex-col">
          <div className="p-6 pb-4 border-b border-violet-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink-900">Cannot Cancel</h2>
              <button
                onClick={onClose}
                className="text-ink-600 hover:text-ink-900 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⏰</div>
              <p className="text-ink-700">
                This event has already started or ended. Cancellation is no longer available.
              </p>
            </div>
          </div>
          <div className="p-6 pt-4 border-t border-violet-100 flex-shrink-0">
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-md max-h-[90vh] my-auto rounded-3xl border-2 border-violet-200 bg-white shadow-glow flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-violet-100 flex-shrink-0">
          <h2 className="font-display text-2xl text-ink-900">Cancel Booking</h2>
          <button
            onClick={onClose}
            className="text-ink-600 hover:text-ink-900 text-2xl"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="mb-6 rounded-xl border-2 border-violet-100 bg-violet-50/50 p-4">
            <p className="text-sm text-ink-700 mb-2">Event: <span className="font-semibold">{eventName}</span></p>
            <p className="text-sm text-ink-700 mb-2">Total Amount: <span className="font-semibold">{formatCurrency(amount)}</span></p>
            
            {/* Refund Policy Info */}
            {cancellationInfo && (
              <div className={`mt-4 p-4 rounded-xl border-2 ${
                cancellationInfo.refundAmount > 0 
                  ? "border-green-200 bg-green-50/50" 
                  : "border-orange-200 bg-orange-50/50"
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl">{cancellationInfo.refundAmount > 0 ? "✅" : "⚠️"}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-ink-900 mb-1">
                      {cancellationInfo.refundAmount > 0 ? "100% Refund Available" : "No Refund"}
                    </p>
                    <p className="text-sm text-ink-700 mb-2">
                      {cancellationInfo.is24HoursBefore 
                        ? `Cancelled 24+ hours before event: Full refund of ₹${(cancellationInfo.refundAmount / 100).toFixed(0)}`
                        : `Cancelled less than 24 hours before event: No refund (₹0)`
                      }
                    </p>
                    <p className="text-xs text-ink-600">
                      Time until event: {Math.floor(cancellationInfo.hoursUntilEvent)} hours
                    </p>
                  </div>
                </div>
                {cancellationInfo.refundAmount > 0 && (
                  <p className="text-sm font-semibold text-green-700 mt-2">
                    Refund Amount: ₹{(cancellationInfo.refundAmount / 100).toFixed(0)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-ink-800 mb-2 block">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {refundReasons.map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-3 rounded-xl border-2 border-violet-200 p-3 cursor-pointer hover:bg-violet-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4 text-violet-600"
                    />
                    <span className="text-ink-900">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {reason === "Other" && (
              <div>
                <label className="text-sm font-semibold text-ink-800 mb-2 block">
                  Please specify
                </label>
                <Input
                  placeholder="Enter reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="rounded-xl border-2 border-orange-200 bg-orange-50/50 p-4">
              <p className="text-sm text-ink-700 mb-2">
                <strong>📋 Cancellation Policy:</strong>
              </p>
              <ul className="text-sm text-ink-700 space-y-1 list-disc list-inside mb-3">
                <li>24+ hours before event: 100% refund</li>
                <li>Less than 24 hours: Cancellation allowed but no refund</li>
              </ul>
              {cancellationInfo?.refundAmount > 0 && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-xs text-ink-600">
                    <span className="font-semibold">⏱️ Refund Timeline:</span> Refunds are processed within <span className="font-semibold text-green-700">2-3 working days</span> and will be credited to your original payment method.
                  </p>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with buttons - Fixed */}
        <div className="border-t border-violet-100 p-6 pt-4 flex-shrink-0">
          <div className="flex gap-3">
            <Button 
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting || !reason || (reason === "Other" && !customReason.trim())}
              className={`flex-1 ${cancellationInfo?.refundAmount === 0 ? "bg-orange-600 hover:bg-orange-700" : ""}`}
            >
              {submitting ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
              Keep Booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
