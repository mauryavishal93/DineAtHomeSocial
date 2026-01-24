"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";
import { formatCurrency } from "@/lib/currency";

// Chart components - will use recharts if available, fallback to simple display
let LineChart: any, BarChart: any, PieChart: any, Pie: any, XAxis: any, YAxis: any, CartesianGrid: any, Tooltip: any, Legend: any, Line: any, Bar: any, Cell: any, ResponsiveContainer: any;

try {
  const recharts = require("recharts");
  LineChart = recharts.LineChart;
  BarChart = recharts.BarChart;
  PieChart = recharts.PieChart;
  Pie = recharts.Pie;
  XAxis = recharts.XAxis;
  YAxis = recharts.YAxis;
  CartesianGrid = recharts.CartesianGrid;
  Tooltip = recharts.Tooltip;
  Legend = recharts.Legend;
  Line = recharts.Line;
  Bar = recharts.Bar;
  Cell = recharts.Cell;
  ResponsiveContainer = recharts.ResponsiveContainer;
} catch (e) {
  // Recharts not installed - will use fallback
}

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
  charts?: {
    userGrowth: Array<{ date: string; users: number; hosts: number; guests: number }>;
    revenueTrend: Array<{ date: string; revenue: number; commissions: number }>;
    eventStatus: Array<{ name: string; value: number }>;
    bookingStatus: Array<{ name: string; value: number }>;
  };
}

function StatCard({
  title,
  value,
  subtitle,
  tone,
  trend
}: {
  title: string;
  value: string;
  subtitle?: string;
  tone?: "success" | "warning" | "danger" | "info";
  trend?: { value: number; label: string };
}) {
  const toneClasses = {
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    danger: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50"
  };

  return (
    <div
      className={`rounded-3xl border p-6 shadow-soft ${
        tone ? toneClasses[tone] : "border-sand-200 bg-white/60 backdrop-blur"
      }`}
    >
      <div className="text-sm font-medium text-ink-600">{title}</div>
      <div className="mt-2 text-3xl font-bold text-ink-900">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-ink-600">{subtitle}</div>}
      {trend && (
        <div className={`mt-2 text-xs font-medium ${trend.value >= 0 ? "text-green-600" : "text-red-600"}`}>
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function EnhancedDashboardTab() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const res = await apiFetch<AnalyticsSummary>(`/api/admin/analytics?range=${timeRange}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok && res.data) {
      setAnalytics(res.data);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-ink-600">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12 text-ink-600">Failed to load analytics</div>;
  }

  const hasCharts = !!ResponsiveContainer && analytics.charts;

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-end gap-2">
        {(["7d", "30d", "90d", "1y"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 text-sm rounded-lg border transition ${
              timeRange === range
                ? "bg-ink-900 text-white border-ink-900"
                : "bg-white text-ink-700 border-sand-200 hover:bg-sand-50"
            }`}
          >
            {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
          </button>
        ))}
      </div>

      {/* Revenue Overview */}
      <div>
        <h2 className="text-xl font-semibold text-ink-900 mb-4">Revenue Overview</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(analytics.revenue.totalRevenue, true)}
            subtitle={`This Month: ${formatCurrency(analytics.revenue.thisMonth, true)}`}
            tone="success"
            trend={
              analytics.revenue.lastMonth > 0
                ? {
                    value: ((analytics.revenue.thisMonth - analytics.revenue.lastMonth) / analytics.revenue.lastMonth) * 100,
                    label: "vs last month"
                  }
                : undefined
            }
          />
          <StatCard
            title="Registration Fees"
            value={formatCurrency(analytics.revenue.registrationFees, true)}
            subtitle={`From ${analytics.users.hosts} hosts`}
            tone="info"
          />
          <StatCard
            title="Commissions"
            value={formatCurrency(analytics.revenue.commissions, true)}
            subtitle="20% of bookings"
            tone="success"
          />
          <StatCard
            title="Projected Monthly"
            value={formatCurrency(analytics.revenue.projectedMonthly, true)}
            subtitle="Based on trends"
            tone="info"
          />
        </div>
      </div>

      {/* Charts Row */}
      {hasCharts && analytics.charts && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Growth Chart */}
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <h3 className="font-display text-lg text-ink-900 mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#8884d8" name="Total Users" />
                <Line type="monotone" dataKey="hosts" stroke="#82ca9d" name="Hosts" />
                <Line type="monotone" dataKey="guests" stroke="#ffc658" name="Guests" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend Chart */}
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <h3 className="font-display text-lg text-ink-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.charts.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value, true)} />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Total Revenue" />
                <Bar dataKey="commissions" fill="#82ca9d" name="Commissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* User Stats */}
      <div>
        <h2 className="text-xl font-semibold text-ink-900 mb-4">User Statistics</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Users"
            value={formatNumber(analytics.users.total)}
            subtitle={`${analytics.users.hosts} hosts, ${analytics.users.guests} guests`}
          />
          <StatCard
            title="Active Users"
            value={formatNumber(analytics.users.active)}
            subtitle={`${analytics.users.verified} verified, ${analytics.users.pending} pending`}
            tone="success"
          />
          <StatCard
            title="Growth (This Month)"
            value={`+${formatNumber(analytics.users.growth.thisMonth)}`}
            subtitle={`Last month: +${formatNumber(analytics.users.growth.lastMonth)}`}
            tone="success"
            trend={
              analytics.users.growth.lastMonth > 0
                ? {
                    value: ((analytics.users.growth.thisMonth - analytics.users.growth.lastMonth) / analytics.users.growth.lastMonth) * 100,
                    label: "vs last month"
                  }
                : undefined
            }
          />
          <StatCard
            title="Suspended"
            value={formatNumber(analytics.users.suspended)}
            subtitle="Accounts on hold"
            tone="warning"
          />
        </div>
      </div>

      {/* Events & Bookings */}
      <div>
        <h2 className="text-xl font-semibold text-ink-900 mb-4">Events & Bookings</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Events"
            value={formatNumber(analytics.events.total)}
            subtitle={`${analytics.events.open} open, ${analytics.events.completed} completed`}
          />
          <StatCard
            title="Confirmed Bookings"
            value={formatNumber(analytics.bookings.confirmed)}
            subtitle={`Revenue: ${formatCurrency(analytics.bookings.revenue, true)}`}
            tone="success"
          />
          <StatCard
            title="Cancelled Bookings"
            value={formatNumber(analytics.bookings.cancelled)}
            subtitle={`${analytics.bookings.total > 0 ? ((analytics.bookings.cancelled / analytics.bookings.total) * 100).toFixed(1) : 0}% cancellation rate`}
            tone="warning"
          />
        </div>
      </div>

      {/* Status Distribution Charts */}
      {hasCharts && analytics.charts && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <h3 className="font-display text-lg text-ink-900 mb-4">Event Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.charts.eventStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ""} ${(((percent ?? 0) * 100)).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.charts.eventStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={["#8884d8", "#82ca9d", "#ffc658", "#ff7300"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <h3 className="font-display text-lg text-ink-900 mb-4">Booking Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.charts.bookingStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ""} ${(((percent ?? 0) * 100)).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.charts.bookingStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={["#8884d8", "#82ca9d", "#ffc658", "#ff7300"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Growth Metrics */}
      <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
        <h3 className="font-display text-xl text-ink-900 mb-4">Growth Metrics</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-sm text-ink-600">Today</div>
            <div className="text-2xl font-semibold text-ink-900">
              {formatNumber(analytics.users.growth.today)}
            </div>
          </div>
          <div>
            <div className="text-sm text-ink-600">This Week</div>
            <div className="text-2xl font-semibold text-ink-900">
              {formatNumber(analytics.users.growth.thisWeek)}
            </div>
          </div>
          <div>
            <div className="text-sm text-ink-600">This Month</div>
            <div className="text-2xl font-semibold text-ink-900">
              {formatNumber(analytics.users.growth.thisMonth)}
            </div>
          </div>
          <div>
            <div className="text-sm text-ink-600">Last Month</div>
            <div className="text-2xl font-semibold text-ink-900">
              {formatNumber(analytics.users.growth.lastMonth)}
            </div>
          </div>
        </div>
      </div>

      {!hasCharts && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>Note:</strong> Install recharts for chart visualizations: <code className="bg-yellow-100 px-2 py-1 rounded">npm install recharts</code>
        </div>
      )}
    </div>
  );
}
