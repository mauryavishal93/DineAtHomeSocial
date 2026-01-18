"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

export function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: "", status: "", search: "" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  async function loadUsers() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      console.error("No access token found for loadUsers");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filters.role) params.append("role", filters.role);
    if (filters.status) params.append("status", filters.status);
    if (filters.search) params.append("search", filters.search);

    const res = await apiFetch<{ users: any[]; total: number }>(
      `/api/admin/users?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (res.ok) {
      setUsers(res.data.users);
    } else {
      console.error("Failed to load users:", res.error);
    }
    setLoading(false);
  }

  async function updateStatus(userId: string, status: string) {
    const token = getAccessToken();
    if (!token) {
      console.error("No access token found for updateStatus");
      return;
    }
    const res = await apiFetch(`/api/admin/users`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, status })
    });
    if (res.ok) {
      loadUsers();
    } else {
      console.error("Failed to update user status:", res.error);
    }
  }

  async function verifyUser(userId: string) {
    const token = getAccessToken();
    if (!token) {
      console.error("No access token found for verifyUser");
      return;
    }
    const res = await apiFetch(`/api/admin/users/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId })
    });
    if (res.ok) {
      loadUsers();
    } else {
      console.error("Failed to verify user:", res.error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Roles</option>
          <option value="HOST">Hosts</option>
          <option value="GUEST">Guests</option>
          <option value="ADMIN">Admins</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <input
          type="text"
          placeholder="Search by email or mobile..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 rounded-lg border border-sand-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-ink-600">Loading users...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">User ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">User Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {users.map((user) => {
                const userName = user.profile 
                  ? `${user.profile.firstName || ""} ${user.profile.lastName || ""}`.trim() || "N/A"
                  : "N/A";
                return (
                <tr key={user._id}>
                  <td className="px-4 py-3 text-sm text-ink-600 font-mono">{user._id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-ink-900">{userName}</td>
                  <td className="px-4 py-3 text-sm text-ink-900">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{user.role}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        user.status === "ACTIVE"
                          ? "success"
                          : user.status === "SUSPENDED"
                            ? "warning"
                            : user.status === "PENDING"
                              ? "ink"
                              : undefined
                      }
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {user.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verifyUser(user._id)}
                        >
                          Verify
                        </Button>
                      )}
                      {user.status !== "SUSPENDED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(user._id, "SUSPENDED")}
                        >
                          Suspend
                        </Button>
                      )}
                      {user.status === "SUSPENDED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(user._id, "ACTIVE")}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
