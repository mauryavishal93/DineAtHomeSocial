"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";
import { convertToCSV, downloadCSV, formatCurrencyForCSV, formatDateForCSV } from "@/lib/csv-export";
import { formatCurrency } from "@/lib/currency";

interface Wallet {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  isFrozen: boolean;
  freezeReason: string;
  createdAt: Date;
}

interface Withdrawal {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  status: string;
  bankAccount?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  upiId?: string;
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  paidAt?: Date;
  paidBy?: string;
  paymentReference?: string;
}

export function WalletsTab() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"wallets" | "withdrawals">("wallets");
  const [filters, setFilters] = useState({ role: "", status: "", search: "" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [activeView, filters, page]);

  async function loadData() {
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
      if (filters.role) params.append("role", filters.role);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const endpoint = activeView === "wallets" ? "/api/admin/wallets" : "/api/admin/withdrawals";
      const res = await apiFetch<{ wallets?: Wallet[]; withdrawals?: Withdrawal[]; total: number }>(
        `${endpoint}?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok && res.data) {
        if (activeView === "wallets") {
          setWallets(res.data.wallets || []);
        } else {
          setWithdrawals(res.data.withdrawals || []);
        }
      } else if (!res.ok) {
        const errorMsg = res.error || "Failed to load data";
        setError(errorMsg);
        console.error("Failed to load data:", errorMsg);
        if (activeView === "wallets") {
          setWallets([]);
        } else {
          setWithdrawals([]);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMsg);
      console.error("Error loading data:", err);
      if (activeView === "wallets") {
        setWallets([]);
      } else {
        setWithdrawals([]);
      }
    }
    setLoading(false);
  }

  async function handleWithdrawalAction(withdrawalId: string, action: "approve" | "reject" | "mark-paid", reason?: string) {
    const token = getAccessToken();
    if (!token) {
      setError("No access token found. Please log in again.");
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/withdrawals/${withdrawalId}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        setError(null);
        loadData();
      } else {
        const errorMsg = res.error || "Failed to process withdrawal";
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
    if (activeView === "wallets") {
      const headers = ["Email", "Name", "Role", "Balance (₹)", "Pending (₹)", "Total Earned (₹)", "Total Withdrawn (₹)", "Status", "Created At"];
      const data = wallets.map(w => ({
        "Email": w.userEmail,
        "Name": w.userName,
        "Role": w.role,
        "Balance (₹)": formatCurrencyForCSV(w.balance),
        "Pending (₹)": formatCurrencyForCSV(w.pendingBalance),
        "Total Earned (₹)": formatCurrencyForCSV(w.totalEarned),
        "Total Withdrawn (₹)": formatCurrencyForCSV(w.totalWithdrawn),
        "Status": w.isFrozen ? "Frozen" : "Active",
        "Created At": formatDateForCSV(w.createdAt)
      }));
      const csv = convertToCSV(data, headers);
      downloadCSV(csv, `wallets-${new Date().toISOString().split("T")[0]}.csv`);
    } else {
      const headers = ["ID", "User", "Email", "Amount (₹)", "Status", "Account/UPI", "Requested At", "Approved At", "Paid At", "Payment Reference"];
      const data = withdrawals.map(w => ({
        "ID": w._id,
        "User": w.userName,
        "Email": w.userEmail,
        "Amount (₹)": formatCurrencyForCSV(w.amount),
        "Status": w.status,
        "Account/UPI": w.bankAccount ? `${w.bankAccount.accountNumber} (${w.bankAccount.ifscCode})` : w.upiId || "",
        "Requested At": formatDateForCSV(w.requestedAt),
        "Approved At": w.approvedAt ? formatDateForCSV(w.approvedAt) : "",
        "Paid At": w.paidAt ? formatDateForCSV(w.paidAt) : "",
        "Payment Reference": w.paymentReference || ""
      }));
      const csv = convertToCSV(data, headers);
      downloadCSV(csv, `withdrawals-${new Date().toISOString().split("T")[0]}.csv`);
    }
  }

  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveView("wallets");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg border transition ${
              activeView === "wallets"
                ? "bg-ink-900 text-white border-ink-900"
                : "bg-white text-ink-700 border-sand-200 hover:bg-sand-50"
            }`}
          >
            Wallets
          </button>
          <button
            onClick={() => {
              setActiveView("withdrawals");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg border transition ${
              activeView === "withdrawals"
                ? "bg-ink-900 text-white border-ink-900"
                : "bg-white text-ink-700 border-sand-200 hover:bg-sand-50"
            }`}
          >
            Withdrawals
          </button>
        </div>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filters.role}
          onChange={(e) => {
            setFilters({ ...filters, role: e.target.value });
            setPage(1);
          }}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Roles</option>
          <option value="HOST">Hosts</option>
          <option value="GUEST">Guests</option>
        </select>
        {activeView === "withdrawals" && (
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
          </select>
        )}
        <input
          type="text"
          placeholder="Search by email or name..."
          value={filters.search}
          onChange={(e) => {
            setFilters({ ...filters, search: e.target.value });
            setPage(1);
          }}
          className="flex-1 rounded-lg border border-sand-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Wallets Table */}
      {activeView === "wallets" && (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Balance</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Pending</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Total Earned</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Total Withdrawn</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-600">
                    Loading wallets...
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-600">
                    No wallets found
                  </td>
                </tr>
              ) : (
                wallets.map((wallet) => (
                  <tr key={wallet._id}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-ink-900">{wallet.userName}</div>
                      <div className="text-xs text-ink-600">{wallet.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-700">{wallet.role}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink-900">
                      {formatCurrency(wallet.balance)}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-700">
                      {formatCurrency(wallet.pendingBalance)}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-700">
                      {formatCurrency(wallet.totalEarned)}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-700">
                      {formatCurrency(wallet.totalWithdrawn)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={wallet.isFrozen ? "warning" : "success"}>
                        {wallet.isFrozen ? "Frozen" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          href={`/admin/users/${wallet.userId}`}
                          className="text-sm text-ink-600 hover:text-ink-900 hover:underline"
                        >
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Withdrawals Table */}
      {activeView === "withdrawals" && (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Payment Method</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Requested</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-600">
                    Loading withdrawals...
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-600">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-ink-900">{withdrawal.userName}</div>
                      <div className="text-xs text-ink-600">{withdrawal.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-ink-900">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-700">
                      {withdrawal.bankAccount
                        ? `${withdrawal.bankAccount.accountNumber.slice(-4)} (${withdrawal.bankAccount.ifscCode})`
                        : withdrawal.upiId || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          withdrawal.status === "PAID"
                            ? "success"
                            : withdrawal.status === "REJECTED" || withdrawal.status === "FAILED"
                              ? "warning"
                              : withdrawal.status === "APPROVED"
                                ? "violet"
                                : "ink"
                        }
                      >
                        {withdrawal.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">
                      {new Date(withdrawal.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {withdrawal.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWithdrawalAction(withdrawal._id, "approve")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt("Rejection reason:");
                                if (reason) handleWithdrawalAction(withdrawal._id, "reject", reason);
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {withdrawal.status === "APPROVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const ref = prompt("Payment reference (UTR/Transaction ID):");
                              if (ref) handleWithdrawalAction(withdrawal._id, "mark-paid", ref);
                            }}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-ink-600">
          Page {page}
        </div>
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
            disabled={wallets.length < 20 && withdrawals.length < 20}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
