"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

export function AuditLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ actionType: "", targetType: "" });

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function loadLogs() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ page: "1", limit: "50" });
    if (filters.actionType) params.append("actionType", filters.actionType);
    if (filters.targetType) params.append("targetType", filters.targetType);

    const res = await apiFetch<{ logs: any[]; total: number }>(
      `/api/admin/audit-logs?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      setLogs(res.data.logs);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          value={filters.actionType}
          onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Actions</option>
          <option value="VERIFY_USER">Verify User</option>
          <option value="SUSPEND_USER">Suspend User</option>
          <option value="APPROVE_EVENT">Approve Event</option>
          <option value="CANCEL_EVENT">Cancel Event</option>
          <option value="CANCEL_BOOKING">Cancel Booking</option>
          <option value="PROCESS_REFUND">Process Refund</option>
          <option value="HIDE_REVIEW">Hide Review</option>
          <option value="UPDATE_SETTINGS">Update Settings</option>
        </select>
        <select
          value={filters.targetType}
          onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="USER">User</option>
          <option value="EVENT">Event</option>
          <option value="BOOKING">Booking</option>
          <option value="PAYMENT">Payment</option>
          <option value="REVIEW">Review</option>
          <option value="SETTINGS">Settings</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink-600">Loading audit logs...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Admin</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Target</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="px-4 py-3 text-sm text-ink-900">{log.adminUsername}</td>
                  <td className="px-4 py-3">
                    <Badge>{log.actionType}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ink-700">{log.targetType}</div>
                    {log.targetId && (
                      <div className="text-xs text-ink-600 font-mono">{log.targetId.slice(0, 8)}...</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-700">{log.description}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {new Date(log.createdAt).toLocaleString()}
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
