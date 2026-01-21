"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reportType: "USER" | "EVENT" | "REVIEW" | "MESSAGE";
  reportedUserId?: string;
  reportedEventId?: string;
  reportedReviewId?: string;
  reportedUserName?: string;
};

const reportReasons = {
  USER: [
    "Inappropriate behavior",
    "Harassment or bullying",
    "Spam or fake profile",
    "Scam or fraud",
    "Other"
  ],
  EVENT: [
    "Misleading information",
    "Inappropriate content",
    "Safety concerns",
    "Spam or fake event",
    "Other"
  ],
  REVIEW: [
    "Spam or fake review",
    "Inappropriate language",
    "Harassment",
    "False information",
    "Other"
  ],
  MESSAGE: [
    "Harassment",
    "Spam",
    "Inappropriate content",
    "Threats",
    "Other"
  ]
};

export function ReportModal({
  isOpen,
  onClose,
  reportType,
  reportedUserId,
  reportedEventId,
  reportedReviewId,
  reportedUserName
}: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      alert("Please select a reason");
      return;
    }

    setSubmitting(true);
    const token = getAccessToken();

    const res = await apiFetch("/api/report", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reportType,
        reportedUserId,
        reportedEventId,
        reportedReviewId,
        reason,
        description,
        evidence: evidence ? evidence.split(",").map((url) => url.trim()) : []
      })
    });

    setSubmitting(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason("");
        setDescription("");
        setEvidence("");
      }, 2000);
    } else if (!res.ok) {
      alert(res.error || "Failed to submit report");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-3xl border-2 border-violet-200 bg-white p-8 shadow-glow">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink-900">Report {reportType}</h2>
          <button
            onClick={onClose}
            className="text-ink-600 hover:text-ink-900 text-2xl"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="font-display text-xl text-ink-900 mb-2">Report Submitted</h3>
            <p className="text-ink-700">Thank you for your report. Our team will review it within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {reportedUserName && (
              <div className="rounded-xl border-2 border-violet-100 bg-violet-50/50 p-4">
                <p className="text-sm text-ink-700">
                  Reporting: <span className="font-semibold">{reportedUserName}</span>
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-ink-800 mb-2 block">
                Reason for Report <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {reportReasons[reportType].map((r) => (
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

            <div>
              <label className="text-sm font-semibold text-ink-800 mb-2 block">
                Additional Details
              </label>
              <textarea
                className="w-full rounded-xl border-2 border-violet-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                rows={4}
                placeholder="Please provide more details about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-ink-800 mb-2 block">
                Evidence (Screenshot URLs, comma-separated)
              </label>
              <Input
                label="Evidence"
                placeholder="https://example.com/screenshot1.png, https://example.com/screenshot2.png"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting || !reason}>
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
