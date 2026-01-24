"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";
import { convertToCSV, downloadCSV, formatCurrencyForCSV, formatDateForCSV } from "@/lib/csv-export";
import { formatCurrency } from "@/lib/currency";

interface Dispute {
  _id: string;
  bookingId: string;
  eventSlotId: string;
  hostUserId: string;
  hostName: string;
  guestUserId: string;
  guestName: string;
  disputeType: string;
  status: string;
  title: string;
  description: string;
  evidence: Array<{ filePath: string; fileName: string }>;
  requestedRefund: number;
  resolvedRefund: number;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  slaDeadline?: Date;
  priority: string;
  createdAt: Date;
}

export function DisputesTab() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [filters, setFilters] = useState({ status: "", type: "", priority: "", search: "" });
  const [page, setPage] = useState(1);
  const [resolution, setResolution] = useState({ refund: 0, notes: "" });

  useEffect(() => {
    loadDisputes();
  }, [filters, page]);

  async function loadDisputes() {
    setLoading(true);
    setError(null);
    const token = getAccessToken();
    if (!token) {
      setError("No access token found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filters.status) params.append("status", filters.status);
      if (filters.type) params.append("type", filters.type);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.search) params.append("search", filters.search);

      const res = await apiFetch<{ disputes: Dispute[]; total: number }>(
        `/api/admin/disputes?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok && res.data) {
        setDisputes(res.data.disputes || []);
      } else if (!res.ok) {
        const errorMsg = res.error || "Failed to load disputes";
        setError(errorMsg);
        console.error("Failed to load disputes:", errorMsg);
        setDisputes([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMsg);
      console.error("Error loading disputes:", err);
      setDisputes([]);
    }
    setLoading(false);
  }

  async function resolveDispute(disputeId: string, action: "resolve" | "escalate" | "close") {
    const token = getAccessToken();
    if (!token) {
      setError("No access token found. Please log in again.");
      return;
    }

    try {
      const body: any = { action };
      if (action === "resolve") {
        if (!resolution.notes || resolution.notes.trim() === "") {
          setError("Resolution notes are required");
          return;
        }
        body.refund = resolution.refund || 0;
        body.notes = resolution.notes;
      }

      const res = await apiFetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setSelectedDispute(null);
        setResolution({ refund: 0, notes: "" });
        setError(null);
        loadDisputes();
      } else {
        const errorMsg = res.error || "Failed to process dispute";
        setError(errorMsg);
        alert(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMsg);
      alert(errorMsg);
    }
  }

  function exportToCSV() {
    const headers = [
      "ID",
      "Type",
      "Status",
      "Priority",
      "Host",
      "Guest",
      "Requested Refund (₹)",
      "Resolved Refund (₹)",
      "Created At",
      "Resolved At",
      "SLA Deadline"
    ];
    const data = disputes.map(d => ({
      "ID": d._id,
      "Type": d.disputeType,
      "Status": d.status,
      "Priority": d.priority,
      "Host": d.hostName,
      "Guest": d.guestName,
      "Requested Refund (₹)": formatCurrencyForCSV(d.requestedRefund),
      "Resolved Refund (₹)": formatCurrencyForCSV(d.resolvedRefund),
      "Created At": formatDateForCSV(d.createdAt),
      "Resolved At": d.resolvedAt ? formatDateForCSV(d.resolvedAt) : "",
      "SLA Deadline": d.slaDeadline ? formatDateForCSV(d.slaDeadline) : ""
    }));
    const csv = convertToCSV(data, headers);
    downloadCSV(csv, `disputes-${new Date().toISOString().split("T")[0]}.csv`);
  }

  // NOTE: `Badge` tones must match `src/components/ui/badge.tsx`
  function getStatusColor(status: string): "success" | "warning" | "ink" | "orange" {
    if (status === "RESOLVED") return "success";
    if (status === "IN_REVIEW") return "ink";
    if (status === "ESCALATED") return "orange";
    if (status === "CLOSED") return "ink";
    return "warning";
  }

  function getPriorityColor(priority: string): "success" | "warning" | "orange" {
    if (priority === "URGENT") return "orange";
    if (priority === "HIGH") return "warning";
    return "success";
  }

  function isSLAOverdue(deadline?: Date): boolean {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-900">Dispute Resolution Center</h2>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          Export CSV
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value });
            setPage(1);
          }}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="ESCALATED">Escalated</option>
        </select>
        <select
          value={filters.type}
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value });
            setPage(1);
          }}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="HOST_NO_SHOW">Host No Show</option>
          <option value="EVENT_CANCELLED">Event Cancelled</option>
          <option value="VENUE_ISSUE">Venue Issue</option>
          <option value="FRAUD">Fraud</option>
          <option value="PAYMENT_ISSUE">Payment Issue</option>
          <option value="SERVICE_QUALITY">Service Quality</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => {
            setFilters({ ...filters, priority: e.target.value });
            setPage(1);
          }}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <input
          type="text"
          placeholder="Search by host/guest name..."
          value={filters.search}
          onChange={(e) => {
            setFilters({ ...filters, search: e.target.value });
            setPage(1);
          }}
          className="flex-1 rounded-lg border border-sand-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Disputes Table */}
      <div className="overflow-x-auto rounded-lg border border-sand-200">
        <table className="w-full">
          <thead className="bg-sand-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Host</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Guest</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Requested Refund</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Priority</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">SLA</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-ink-600">
                  Loading disputes...
                </td>
              </tr>
            ) : disputes.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-ink-600">
                  No disputes found
                </td>
              </tr>
            ) : (
              disputes.map((dispute) => (
                <tr key={dispute._id} className={isSLAOverdue(dispute.slaDeadline) ? "bg-red-50" : ""}>
                  <td className="px-4 py-3 text-sm font-mono text-ink-600">{dispute._id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{dispute.disputeType.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{dispute.hostName}</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{dispute.guestName}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ink-900">
                    {formatCurrency(dispute.requestedRefund)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={getStatusColor(dispute.status)}>{dispute.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={getPriorityColor(dispute.priority)}>{dispute.priority}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {dispute.slaDeadline ? (
                      <span className={isSLAOverdue(dispute.slaDeadline) ? "text-red-600 font-medium" : ""}>
                        {new Date(dispute.slaDeadline).toLocaleDateString()}
                        {isSLAOverdue(dispute.slaDeadline) && " ⚠️"}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDispute(dispute)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-ink-900">Dispute Details</h3>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-ink-600 hover:text-ink-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-ink-600">Type</div>
                  <div className="font-medium">{selectedDispute.disputeType.replace(/_/g, " ")}</div>
                </div>
                <div>
                  <div className="text-sm text-ink-600">Status</div>
                  <Badge tone={getStatusColor(selectedDispute.status)}>{selectedDispute.status}</Badge>
                </div>
                <div>
                  <div className="text-sm text-ink-600">Host</div>
                  <div className="font-medium">{selectedDispute.hostName}</div>
                </div>
                <div>
                  <div className="text-sm text-ink-600">Guest</div>
                  <div className="font-medium">{selectedDispute.guestName}</div>
                </div>
                <div>
                  <div className="text-sm text-ink-600">Requested Refund</div>
                  <div className="font-medium">{formatCurrency(selectedDispute.requestedRefund)}</div>
                </div>
                <div>
                  <div className="text-sm text-ink-600">Priority</div>
                  <Badge tone={getPriorityColor(selectedDispute.priority)}>{selectedDispute.priority}</Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-ink-600 mb-1">Title</div>
                <div className="font-medium">{selectedDispute.title}</div>
              </div>

              <div>
                <div className="text-sm text-ink-600 mb-1">Description</div>
                <div className="text-ink-700 whitespace-pre-wrap">{selectedDispute.description}</div>
              </div>

              {selectedDispute.evidence.length > 0 && (
                <div>
                  <div className="text-sm text-ink-600 mb-2">Evidence</div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDispute.evidence.map((ev, idx) => (
                      <a
                        key={idx}
                        href={`/api/upload/serve?path=${encodeURIComponent(ev.filePath)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {ev.fileName}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedDispute.status !== "RESOLVED" && selectedDispute.status !== "CLOSED" && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold text-ink-900">Resolution</h4>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1">Refund Amount (₹)</label>
                    <input
                      type="number"
                      value={resolution.refund}
                      onChange={(e) => setResolution({ ...resolution, refund: Number(e.target.value) * 100 })}
                      className="w-full rounded-lg border border-sand-200 px-3 py-2"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1">Resolution Notes</label>
                    <textarea
                      value={resolution.notes}
                      onChange={(e) => setResolution({ ...resolution, notes: e.target.value })}
                      className="w-full rounded-lg border border-sand-200 px-3 py-2"
                      rows={4}
                      placeholder="Enter resolution details..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => resolveDispute(selectedDispute._id, "resolve")}
                      disabled={!resolution.notes}
                    >
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => resolveDispute(selectedDispute._id, "escalate")}
                    >
                      Escalate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => resolveDispute(selectedDispute._id, "close")}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}

              {selectedDispute.resolution && (
                <div className="border-t pt-4">
                  <div className="text-sm text-ink-600 mb-1">Resolution</div>
                  <div className="text-ink-700 whitespace-pre-wrap">{selectedDispute.resolution}</div>
                  {selectedDispute.resolvedRefund > 0 && (
                    <div className="mt-2 font-medium text-green-600">
                      Refund: {formatCurrency(selectedDispute.resolvedRefund)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-ink-600">Page {page}</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={disputes.length < 20}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
