"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";
import { DashboardTab } from "@/components/admin/dashboard-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { EventsTab } from "@/components/admin/events-tab";
import { RevenueTab } from "@/components/admin/revenue-tab";

interface AnalyticsSummary {
  users: {
    total: number;
    hosts: number;
    guests: number;
    admins: number;
    pending: number;
    verified: number;
    active: number;
    suspended: number;
    growth: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      lastMonth: number;
    };
  };
  events: {
    total: number;
    open: number;
    completed: number;
    cancelled: number;
    thisMonth: number;
    lastMonth: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    thisMonth: number;
    lastMonth: number;
    revenue: number;
  };
  revenue: {
    totalRevenue: number;
    registrationFees: number;
    commissions: number;
    thisMonth: number;
    lastMonth: number;
    projectedMonthly: number;
  };
  traffic: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
}

type Tab = "dashboard" | "users" | "events" | "revenue";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<{ username: string; role: string; fullName: string } | null>(null);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "dashboard" && adminInfo) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, adminInfo]);

  async function checkAuth() {
    const token = getAccessToken();
    if (!token) {
      console.warn("No access token found, redirecting to login");
      router.push("/admin/login");
      return;
    }

    const res = await apiFetch<{
      id: string;
      username: string;
      role: string;
      fullName: string;
      email: string;
    }>("/api/admin/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      setAdminInfo({
        username: res.data.username,
        role: res.data.role,
        fullName: res.data.fullName
      });
    } else {
      console.error("Auth check failed:", res.error);
      // Clear invalid token
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("dah_access_token");
        window.localStorage.removeItem("dah_role");
      }
      router.push("/admin/login");
    }
  }

  async function loadAnalytics() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      console.error("No access token found");
      router.push("/admin/login");
      setLoading(false);
      return;
    }

    const res = await apiFetch<AnalyticsSummary>("/api/admin/analytics", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      setAnalytics(res.data);
    } else {
      console.error("Failed to load analytics:", res.error);
      // If unauthorized, redirect to login
      if (res.error?.toLowerCase().includes("unauthorized") || res.error?.toLowerCase().includes("invalid")) {
        router.push("/admin/login");
      }
    }
    setLoading(false);
  }

  return (
    <main className="py-10">
      <Container>
        <div className="flex flex-wrap gap-2">
          <Badge tone="warning">Admin</Badge>
          <Badge>Control Panel</Badge>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-ink-700">
              Manage users, events, revenue, and platform analytics.
            </p>
          </div>
          {adminInfo && (
            <div className="text-right">
              <div className="text-sm text-ink-600">Logged in as</div>
              <div className="font-medium text-ink-900">{adminInfo.fullName}</div>
              <div className="text-xs text-ink-500">{adminInfo.role}</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-sand-200">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "dashboard"
                ? "border-b-2 border-ink-900 text-ink-900"
                : "text-ink-600 hover:text-ink-900"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "users"
                ? "border-b-2 border-ink-900 text-ink-900"
                : "text-ink-600 hover:text-ink-900"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "events"
                ? "border-b-2 border-ink-900 text-ink-900"
                : "text-ink-600 hover:text-ink-900"
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "revenue"
                ? "border-b-2 border-ink-900 text-ink-900"
                : "text-ink-600 hover:text-ink-900"
            }`}
          >
            Revenue
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === "dashboard" && <DashboardTab analytics={analytics} loading={loading} />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "events" && <EventsTab />}
          {activeTab === "revenue" && <RevenueTab />}
        </div>
      </Container>
    </main>
  );
}
