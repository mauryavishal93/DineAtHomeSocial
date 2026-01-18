"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

export function ReviewsTab() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ feedbackType: "", toUserId: "" });

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function loadReviews() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ page: "1", limit: "20" });
    if (filters.feedbackType) params.append("feedbackType", filters.feedbackType);
    if (filters.toUserId) params.append("toUserId", filters.toUserId);

    const res = await apiFetch<{ reviews: any[]; total: number }>(
      `/api/admin/reviews?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      setReviews(res.data.reviews);
    }
    setLoading(false);
  }

  async function hideReview(reviewId: string) {
    const token = getAccessToken();
    if (!token) return;

    const reason = prompt("Enter reason for hiding (optional):");
    if (reason === null) return;

    const res = await apiFetch(`/api/admin/reviews/${reviewId}/hide`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: reason || undefined })
    });
    if (res.ok) {
      loadReviews();
    }
  }

  async function showReview(reviewId: string) {
    const token = getAccessToken();
    if (!token) return;

    const res = await apiFetch(`/api/admin/reviews/${reviewId}/show`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      loadReviews();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          value={filters.feedbackType}
          onChange={(e) => setFilters({ ...filters, feedbackType: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="HOST">Host Reviews</option>
          <option value="GUEST">Guest Reviews</option>
          <option value="HOST_TO_GUEST">Host to Guest</option>
        </select>
        <input
          type="text"
          placeholder="To User ID..."
          value={filters.toUserId}
          onChange={(e) => setFilters({ ...filters, toUserId: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink-600">Loading reviews...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Event</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">From</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">To</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Comment</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td className="px-4 py-3 text-sm text-ink-900">{review.eventName}</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{review.fromUserName}</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{review.toUserName}</td>
                  <td className="px-4 py-3">
                    <Badge>{review.feedbackType}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-900">
                    {review.rating.toFixed(1)} ⭐
                    {review.eventRating && (
                      <div className="text-xs text-ink-600">
                        Event: {review.eventRating} | Venue: {review.venueRating} | Food: {review.foodRating} | Hospitality: {review.hospitalityRating}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-700 max-w-xs truncate">
                    {review.comment || "No comment"}
                  </td>
                  <td className="px-4 py-3">
                    {review.isHidden ? (
                      <Badge tone="warning">Hidden</Badge>
                    ) : (
                      <Badge tone="success">Visible</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {review.isHidden ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => showReview(review._id)}
                        >
                          Show
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => hideReview(review._id)}
                        >
                          Hide
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
