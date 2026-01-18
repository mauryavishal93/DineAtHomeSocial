"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

export function EventsTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadEvents() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      console.error("No access token found for loadEvents");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ page: "1", limit: "20" });
    if (statusFilter) params.append("status", statusFilter);

    const res = await apiFetch<{ events: any[]; total: number }>(
      `/api/admin/events?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (res.ok) {
      setEvents(res.data.events);
    } else {
      console.error("Failed to load events:", res.error);
    }
    setLoading(false);
  }

  async function approveEvent(eventId: string) {
    const token = getAccessToken();
    if (!token) return;

    const res = await apiFetch(`/api/admin/events/${eventId}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      loadEvents();
    } else {
      alert(`Failed to approve event: ${res.error}`);
    }
  }

  async function rejectEvent(eventId: string) {
    const token = getAccessToken();
    if (!token) return;

    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return;

    const res = await apiFetch(`/api/admin/events/${eventId}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: reason || undefined })
    });
    if (res.ok) {
      loadEvents();
    } else {
      alert(`Failed to reject event: ${res.error}`);
    }
  }

  async function cancelEvent(eventId: string) {
    const token = getAccessToken();
    if (!token) return;

    if (!confirm("Are you sure you want to cancel this event? All bookings will be cancelled.")) return;

    const reason = prompt("Enter cancellation reason (optional):");
    if (reason === null) return;

    const res = await apiFetch(`/api/admin/events/${eventId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: reason || undefined })
    });
    if (res.ok) {
      loadEvents();
    } else {
      alert(`Failed to cancel event: ${res.error}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink-600">Loading events...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Event</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Event ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Host Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Host Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Bookings</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Revenue</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {events.map((event) => (
                <tr key={event._id}>
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/events/${event._id}`}
                      className="text-sm font-medium text-ink-900 hover:text-ink-600 hover:underline"
                    >
                      {event.eventName}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600 font-mono">{event._id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-ink-900">{event.hostName || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{event.hostEmail || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {new Date(event.startAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={event.status === "OPEN" ? "success" : undefined}>
                      {event.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-900">{event.bookingsCount}</td>
                  <td className="px-4 py-3 text-sm text-ink-900">
                    ₹{(event.revenue / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {event.status !== "OPEN" && event.status !== "CANCELLED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveEvent(event._id)}
                        >
                          Approve
                        </Button>
                      )}
                      {event.status !== "CANCELLED" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectEvent(event._id)}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelEvent(event._id)}
                          >
                            Cancel
                          </Button>
                        </>
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
