import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Building2,
  BadgeCheck,
  FileEdit,
  Star,
  Eye,
  UserPlus,
  IndianRupee,
  Images,
  Share2,
  BarChart3,
  Plus,
  ListChecks,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePropertiesQuery, useLeadsQuery, useViewsQuery } from "@/lib/queries";
import { formatPrice, locationLine, timeAgo, formatNumber } from "@/lib/format";
import {
  FOLLOW_UP_LABEL,
  FOLLOW_UP_TONE,
  followUpState,
  formatFollowUp,
} from "@/lib/followup";
import { labelFor, PROPERTY_TYPES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BrokrSuite" },
      {
        name: "description",
        content:
          "Portfolio overview for Deep Real Estate: listings, leads, views and performance at a glance.",
      },
      { property: "og:title", content: "Dashboard — BrokrSuite" },
      {
        property: "og:description",
        content: "Live inventory, lead and traffic metrics for your agency.",
      },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function DashboardPage() {
  const { data: properties, isLoading } = usePropertiesQuery();
  const { data: leads } = useLeadsQuery();
  const { data: views } = useViewsQuery();

  const stats = useMemo(() => {
    const list = properties ?? [];
    return {
      total: list.length,
      active: list.filter((p) => p.is_published && p.status === "available").length,
      sold: list.filter((p) => p.status === "sold" || p.status === "rented").length,
      drafts: list.filter((p) => p.status === "draft").length,
      featured: list.filter((p) => p.is_featured).length,
      views: list.reduce((sum, p) => sum + (p.views ?? 0), 0),
      newLeads: (leads ?? []).filter((l) => l.status === "new").length,
      portfolio: list.reduce((sum, p) => sum + Number(p.price ?? 0), 0),
    };
  }, [properties, leads]);

  const distribution = useMemo(() => {
    const list = properties ?? [];
    return [
      { name: "Available", value: list.filter((p) => p.status === "available").length },
      { name: "Under Offer", value: list.filter((p) => p.status === "under_offer").length },
      { name: "Sold / Rented", value: stats.sold },
      { name: "Draft", value: stats.drafts },
    ].filter((d) => d.value > 0);
  }, [properties, stats]);

  const typeBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    (properties ?? []).forEach((p) => {
      counts.set(p.property_type, (counts.get(p.property_type) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([type, count]) => ({
      name: labelFor(PROPERTY_TYPES, type),
      count,
    }));
  }, [properties]);

  const viewSeries = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i -= 1) {
      const day = new Date(Date.now() - i * 86400000);
      buckets.set(day.toISOString().slice(0, 10), 0);
    }
    (views ?? []).forEach((v) => {
      const key = v.created_at.slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      views: count,
    }));
  }, [views]);

  const recent = (properties ?? []).slice(0, 5);

  const dueFollowUps = useMemo(
    () =>
      (leads ?? [])
        .filter((l) => ["overdue", "today"].includes(followUpState(l.follow_up_at)))
        .sort(
          (a, b) =>
            new Date(a.follow_up_at ?? 0).getTime() - new Date(b.follow_up_at ?? 0).getTime(),
        )
        .slice(0, 6),
    [leads],
  );

  const quickActions = [
    { label: "Add Property", to: "/properties/new", icon: Plus },
    { label: "Manage Listings", to: "/properties", icon: ListChecks },
    { label: "Upload Media", to: "/media", icon: Images },
    { label: "Share Property", to: "/properties", icon: Share2 },
    { label: "View Analytics", to: "/analytics", icon: BarChart3 },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good to see you again"
        description="Everything happening across the Deep Real Estate portfolio today."
        actions={
          <Button asChild variant="secondary">
            <Link to="/analytics">
              <BarChart3 className="h-4 w-4" /> Full analytics
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard index={0} label="Total properties" value={stats.total} icon={Building2} />
          <StatCard index={1} label="Active listings" value={stats.active} icon={BadgeCheck} tone="success" />
          <StatCard index={2} label="Sold / rented" value={stats.sold} icon={IndianRupee} />
          <StatCard index={3} label="Draft listings" value={stats.drafts} icon={FileEdit} />
          <StatCard index={4} label="Featured" value={stats.featured} icon={Star} tone="brass" />
          <StatCard index={5} label="Total views" value={formatNumber(stats.views)} icon={Eye} />
          <StatCard index={6} label="New leads" value={stats.newLeads} icon={UserPlus} tone="brass" />
          <StatCard
            index={7}
            label="Portfolio value"
            value={formatPrice(stats.portfolio)}
            icon={IndianRupee}
            tone="success"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="surface flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <action.icon className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <p className="display-title text-lg">Views overview</p>
          <p className="mb-4 text-xs text-muted-foreground">Public page views, last 14 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewSeries}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={28} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#viewsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5">
          <p className="display-title text-lg">Property distribution</p>
          <p className="mb-4 text-xs text-muted-foreground">By listing status</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={3}
                >
                  {distribution.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {distribution.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  {entry.name}
                </span>
                <span className="font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5">
          <p className="display-title text-lg">Property type breakdown</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeBreakdown} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={96}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="var(--color-chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="display-title text-lg">Recently added</p>
            <Button asChild variant="ghost" size="sm">
              <Link to="/properties">View all</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recent.map((property) => (
              <Link
                key={property.id}
                to="/properties/$id/edit"
                params={{ id: property.id }}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <img
                  src={property.cover_image ?? ""}
                  alt={property.title}
                  loading="lazy"
                  className="h-14 w-20 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{property.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {locationLine(property.city, property.sector)} · {timeAgo(property.created_at)}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold">{formatPrice(Number(property.price))}</p>
                  <p className="text-xs text-muted-foreground">{formatNumber(property.views)} views</p>
                </div>
                <StatusBadge status={property.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="surface p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="display-title text-lg">Follow-ups due</p>
              <p className="text-xs text-muted-foreground">
                Leads scheduled for contact today or already overdue.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/leads">Open leads</Link>
            </Button>
          </div>
          {dueFollowUps.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nothing due — schedule next contact dates from the Leads page.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {dueFollowUps.map((lead) => (
                <Link
                  key={lead.id}
                  to="/leads"
                  className="rounded-xl border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{lead.name}</p>
                    <span
                      className={`shrink-0 text-[11px] font-medium ${
                        FOLLOW_UP_TONE[followUpState(lead.follow_up_at)]
                      }`}
                    >
                      {FOLLOW_UP_LABEL[followUpState(lead.follow_up_at)]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {lead.property_title ?? "General enquiry"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {formatFollowUp(lead.follow_up_at)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
