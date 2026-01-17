"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type GuestRatingData = {
  punctualityRating: number;
  appearanceRating: number;
  communicationRating: number;
  behaviorRating: number;
  engagementRating: number;
  overallPresenceRating: number;
  comment?: string;
};

type RateGuestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GuestRatingData) => void;
  guestName: string;
  guestAge: number;
  guestGender: string;
  existingRating?: GuestRatingData | null;
};

export function RateGuestModal({
  isOpen,
  onClose,
  onSubmit,
  guestName,
  guestAge,
  guestGender,
  existingRating
}: RateGuestModalProps) {
  const [punctuality, setPunctuality] = useState(existingRating?.punctualityRating || 0);
  const [appearance, setAppearance] = useState(existingRating?.appearanceRating || 0);
  const [communication, setCommunication] = useState(existingRating?.communicationRating || 0);
  const [behavior, setBehavior] = useState(existingRating?.behaviorRating || 0);
  const [engagement, setEngagement] = useState(existingRating?.engagementRating || 0);
  const [overallPresence, setOverallPresence] = useState(existingRating?.overallPresenceRating || 0);
  const [comment, setComment] = useState(existingRating?.comment || "");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    setError("");

    if (punctuality === 0 || appearance === 0 || communication === 0 || 
        behavior === 0 || engagement === 0 || overallPresence === 0) {
      setError("Please rate all categories");
      return;
    }

    onSubmit({
      punctualityRating: punctuality,
      appearanceRating: appearance,
      communicationRating: communication,
      behaviorRating: behavior,
      engagementRating: engagement,
      overallPresenceRating: overallPresence,
      comment
    });
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string; }) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-ink-900">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition-colors ${
              star <= value ? "text-amber-500" : "text-sand-300"
            } hover:text-amber-400`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-sand-200 bg-white shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-primary to-amber-500 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl">Rate Guest</h2>
              <p className="mt-1 text-sm opacity-90">
                {guestName} • {guestAge} years • {guestGender}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {existingRating ? (
            <div className="rounded-2xl border border-sand-200 bg-sand-50/50 p-4">
              <p className="text-sm font-medium text-ink-900">✓ You have already rated this guest</p>
              <p className="text-xs text-ink-600 mt-1">Viewing your previous rating</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-sm font-medium text-ink-900">📝 Rate this guest</p>
              <p className="text-xs text-ink-600 mt-1">Your feedback helps build a trusted community</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <StarRating
              value={punctuality}
              onChange={setPunctuality}
              label="⏰ Punctuality"
            />

            <StarRating
              value={appearance}
              onChange={setAppearance}
              label="👔 Appearance"
            />

            <StarRating
              value={communication}
              onChange={setCommunication}
              label="💬 Communication / Interaction"
            />

            <StarRating
              value={behavior}
              onChange={setBehavior}
              label="🤝 Behavior / Manners"
            />

            <StarRating
              value={engagement}
              onChange={setEngagement}
              label="🎯 Engagement in Activities"
            />

            <StarRating
              value={overallPresence}
              onChange={setOverallPresence}
              label="✨ Overall Presence"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-900">
                💭 Additional Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this guest..."
                rows={4}
                disabled={!!existingRating}
                className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-sand-50 disabled:text-ink-600"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {existingRating ? (
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            ) : (
              <>
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  Submit Rating
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
