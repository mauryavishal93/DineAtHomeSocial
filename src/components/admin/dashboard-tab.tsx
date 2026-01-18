"use client";

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

function StatCard({
  title,
  value,
  subtitle,
  tone
}: {
  title: string;
  value: string;
  subtitle?: string;
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
      {subtitle && <div className="mt-1 text-xs text-ink-600">{subtitle}</div>}
    </div>
  );
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function DashboardTab({
  analytics,
  loading
}: {
  analytics: AnalyticsSummary | null;
  loading: boolean;
}) {
  if (loading) {
    return <div className="text-center py-12 text-ink-600">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12 text-ink-600">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-8">
      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analytics.revenue.totalRevenue)}
          subtitle={`This Month: ${formatCurrency(analytics.revenue.thisMonth)}`}
          tone="success"
        />
        <StatCard
          title="Registration Fees"
          value={formatCurrency(analytics.revenue.registrationFees)}
          subtitle={`From ${analytics.users.hosts} hosts`}
        />
        <StatCard
          title="Commissions"
          value={formatCurrency(analytics.revenue.commissions)}
          subtitle="20% of bookings"
        />
        <StatCard
          title="Projected Monthly"
          value={formatCurrency(analytics.revenue.projectedMonthly)}
          subtitle="Based on trends"
        />
      </div>

      {/* User Stats */}
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
        />
        <StatCard
          title="Growth (This Month)"
          value={`+${formatNumber(analytics.users.growth.thisMonth)}`}
          subtitle={`Last month: +${formatNumber(analytics.users.growth.lastMonth)}`}
          tone="success"
        />
        <StatCard
          title="Suspended"
          value={formatNumber(analytics.users.suspended)}
          subtitle="Accounts on hold"
          tone="warning"
        />
      </div>

      {/* Events & Bookings */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Events"
          value={formatNumber(analytics.events.total)}
          subtitle={`${analytics.events.open} open, ${analytics.events.completed} completed`}
        />
        <StatCard
          title="Bookings"
          value={formatNumber(analytics.bookings.confirmed)}
          subtitle={`Revenue: ${formatCurrency(analytics.bookings.revenue)}`}
        />
        <StatCard
          title="Traffic (This Month)"
          value={formatNumber(analytics.traffic.thisMonth)}
          subtitle={`Last month: ${formatNumber(analytics.traffic.lastMonth)}`}
        />
      </div>

      {/* Growth Metrics */}
      <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
        <h3 className="font-display text-xl text-ink-900">Growth Metrics</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
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
    </div>
  );
}
