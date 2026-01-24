"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";
import { formatCurrency } from "@/lib/currency";

export function PaymentsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadPayments() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ page: "1", limit: "20" });
    if (statusFilter) params.append("status", statusFilter);

    const res = await apiFetch<{ payments: any[]; total: number }>(
      `/api/admin/payments?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      setPayments(res.data.payments);
    }
    setLoading(false);
  }

  async function processRefund(paymentId: string) {
    const token = getAccessToken();
    if (!token) return;

    const reason = prompt("Enter refund reason (optional):");
    if (reason === null) return;

    const res = await apiFetch(`/api/admin/payments/${paymentId}/refund`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: reason || undefined })
    });
    if (res.ok) {
      loadPayments();
    } else if (!res.ok) {
      alert(`Failed to process refund: ${res.error}`);
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
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink-600">Loading payments...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Event</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Guest</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Payment ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td className="px-4 py-3 text-sm text-ink-900">{payment.eventName}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ink-900">{payment.guestName}</div>
                    <div className="text-xs text-ink-600">{payment.guestEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-ink-900">
                    {formatCurrency(payment.amount, true)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        payment.status === "PAID"
                          ? "success"
                          : payment.status === "FAILED"
                            ? "warning"
                            : undefined
                      }
                    >
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-600 font-mono">
                    {payment.razorpayPaymentId || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {payment.status === "PAID" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => processRefund(payment._id)}
                      >
                        Refund
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
