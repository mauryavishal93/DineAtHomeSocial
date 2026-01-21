"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

export function VenuesTab() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ hostUserId: "", locality: "" });

  useEffect(() => {
    loadVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function loadVenues() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ page: "1", limit: "20" });
    if (filters.hostUserId) params.append("hostUserId", filters.hostUserId);
    if (filters.locality) params.append("locality", filters.locality);

    const res = await apiFetch<{ venues: any[]; total: number }>(
      `/api/admin/venues?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      setVenues(res.data.venues);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Host User ID..."
          value={filters.hostUserId}
          onChange={(e) => setFilters({ ...filters, hostUserId: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Locality..."
          value={filters.locality}
          onChange={(e) => setFilters({ ...filters, locality: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink-600">Loading venues...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Address</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Locality</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Host</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Food Categories</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Games</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {venues.map((venue) => (
                <tr key={venue._id}>
                  <td className="px-4 py-3 text-sm font-medium text-ink-900">{venue.name}</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{venue.address}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">{venue.locality}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/hosts/${venue.hostUserId}`}
                      className="text-sm font-medium text-ink-900 hover:text-ink-600 hover:underline"
                    >
                      {venue.hostName}
                    </Link>
                    <div className="text-xs text-ink-600">{venue.hostEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-700">
                    {venue.foodCategories.join(", ") || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-700">
                    {venue.gamesAvailable.join(", ") || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {new Date(venue.createdAt).toLocaleDateString()}
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
