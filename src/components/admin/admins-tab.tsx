"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

export function AdminsTab() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const res = await apiFetch<{ admins: any[] }>(`/api/admin/admins`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setAdmins(res.data.admins);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-12 text-ink-600">Loading admins...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Username</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Full Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Last Login</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ink-900">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td className="px-4 py-3 text-sm font-medium text-ink-900">{admin.username}</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{admin.fullName}</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{admin.email}</td>
                  <td className="px-4 py-3">
                    <Badge>{admin.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={admin.isActive ? "success" : "warning"}>
                      {admin.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {admin.lastLoginAt
                      ? new Date(admin.lastLoginAt).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    {new Date(admin.createdAt).toLocaleDateString()}
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
