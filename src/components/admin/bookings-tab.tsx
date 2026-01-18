"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

export function BookingsTab() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", eventId: "", hostUserId: "", guestUserId: "" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  async function loadBookings() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      console.error("No access token found");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filters.status) params.append("status", filters.status);
    if (filters.eventId) params.append("eventId", filters.eventId);
    if (filters.hostUserId) params.append("hostUserId", filters.hostUserId);
    if (filters.guestUserId) params.append("guestUserId", filters.guestUserId);

    const res = await apiFetch<{ bookings: any[]; total: number }>(
      `/api/admin/bookings?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      setBookings(res.data.bookings);
    } else {
      console.error("Failed to load bookings:", res.error);
    }
    setLoading(false);
  }

  async function cancelBooking(bookingId: string) {
    const token = getAccessToken();
    if (!token) return;

    if (!confirm("Are you sure you want to cancel this booking?")) return;

    const res = await apiFetch(`/api/admin/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      loadBookings();
    } else {
      alert(`Failed to cancel booking: ${res.error}`);
    }
  }

  function formatCurrency(paise: number): string {
    return `₹${(paise / 100).toFixed(2)}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="PAYMENT_PENDING">Payment Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUND_REQUIRED">Refund Required</option>
        </select>
        <input
          type="text"
          placeholder="Event ID..."
          value={filters.eventId}
          onChange={(e) => setFilters({ ...filters, eventId: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Host User ID..."
          value={filters.hostUserId}
          onChange={(e) => setFilters({ ...filters, hostUserId: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Guest User ID..."
          value={filters.guestUserId}
          onChange={(e) => setFilters({ ...filters, guestUserId: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink-600">Loading bookings...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Event</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Host</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Guest</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Seats</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-ink-900">{booking.eventName}</div>
                    <div className="text-xs text-ink-600">{booking.eventSlotId.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ink-900">{booking.hostName}</div>
                    <div className="text-xs text-ink-600">{booking.hostEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ink-900">{booking.guestName}</div>
                    <div className="text-xs text-ink-600">{booking.guestEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-900">{booking.seats}</td>
                  <td className="px-4 py-3 text-sm text-ink-900">{formatCurrency(booking.amountTotal)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        booking.status === "CONFIRMED"
                          ? "success"
                          : booking.status === "CANCELLED"
                            ? "warning"
                            : undefined
                      }
                    >
                      {booking.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {new Date(booking.eventStartAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {booking.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelBooking(booking._id)}
                      >
                        Cancel
                      </Button>
                    )}
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
