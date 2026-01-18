"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

function StatCard({
  title,
  value,
  tone
}: {
  title: string;
  value: string;
  tone?: "success" | "warning" | "danger";
}) {
  const toneClasses = {
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    danger: "border-red-200 bg-red-50"
  };

  return (
    <div
      className={`rounded-3xl border p-6 shadow-soft ${
        tone ? toneClasses[tone] : "border-sand-200 bg-white/60 backdrop-blur"
      }`}
    >
      <div className="text-sm font-medium text-ink-600">{title}</div>
      <div className="mt-2 text-3xl font-bold text-ink-900">{value}</div>
    </div>
  );
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

type RevenueItem = {
  date: string;
  type: "REGISTRATION_FEE" | "COMMISSION";
  amount: number;
  hostId?: string;
  hostName?: string;
  eventId?: string;
  eventName?: string;
  eventDate?: string;
};

type RevenueData = {
  items: RevenueItem[];
  summary: {
    totalRegistrationFees: number;
    totalCommissions: number;
    total: number;
  };
};

export function RevenueTab() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  async function loadRevenue() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      console.error("No access token found for loadRevenue");
      setLoading(false);
      return;
    }

    const res = await apiFetch<RevenueData>(`/api/admin/revenue?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setRevenueData(res.data);
    } else {
      console.error("Failed to load revenue:", res.error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Summary */}
      {revenueData && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Registration Fees"
            value={formatCurrency(revenueData.summary.totalRegistrationFees)}
          />
          <StatCard
            title="Total Commissions"
            value={formatCurrency(revenueData.summary.totalCommissions)}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(revenueData.summary.total)}
            tone="success"
          />
        </div>
      )}

      {/* Detailed Breakdown Table */}
      {loading ? (
        <div className="text-center py-12 text-ink-600">Loading revenue data...</div>
      ) : revenueData ? (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Host Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Host ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Event Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Event ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Event Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {revenueData.items.map((item, idx) => (
                <tr key={`${item.date}-${item.type}-${idx}`}>
                  <td className="px-4 py-3 text-sm text-ink-900">{item.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        item.type === "REGISTRATION_FEE"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.type === "REGISTRATION_FEE" ? "Registration" : "Commission"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-ink-900">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-700">
                    {item.hostName || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600 font-mono">
                    {item.hostId ? `${item.hostId.slice(0, 8)}...` : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-700">
                    {item.eventName || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600 font-mono">
                    {item.eventId ? `${item.eventId.slice(0, 8)}...` : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {item.eventDate
                      ? new Date(item.eventDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
