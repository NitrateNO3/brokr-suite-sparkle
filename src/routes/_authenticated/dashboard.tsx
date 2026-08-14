import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  BadgeCheck,
  Eye,
  UserPlus,
  IndianRupee,
  Images,
  BarChart3,
  Plus,
  ListChecks,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Activity,
  Users,
  ArrowRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "motion/react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePropertiesQuery, useLeadsQuery, useViewsQuery, useActivityQuery } from "@/lib/queries";
import { useTasksQuery } from "@/lib/tasks";
import { useTeamQuery } from "@/lib/roles";
import { formatPrice, locationLine, timeAgo, formatNumber } from "@/lib/format";
import { FOLLOW_UP_LABEL, FOLLOW_UP_TONE, followUpState, formatFollowUp } from "@/lib/followup";
import { LEAD_STATUSES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BrokrSuite" },
      {
        name: "description",
        content:
          "Portfolio command centre for Deep Real Estate: listings, leads, revenue, follow-ups and agent performance at a glance.",
      },
      { property: "og:title", content: "Dashboard — BrokrSuite" },
      {
        property: "og:description",
        content: "Live inventory, lead and traffic metrics for your agency.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const chartTooltip = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "var(--shadow-lift)",
} as const;

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface p-5 sm:p-6 ${className}`}>
      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="display-title text-base sm:text-lg">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { data: properties, isLoading } = usePropertiesQuery();
  const { data: leads } = useLeadsQuery();
  const { data: views } = useViewsQuery();
  const { data: tasks } = useTasksQuery();
  const { data: team } = useTeamQuery();
  const { data: activity } = useActivityQuery();

  const stats = useMemo(() => {
    const list = properties ?? [];
    const leadList = leads ?? [];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return {
      total: list.length,
      active: list.filter((p) => p.is_published && p.status === "available").length,
      sold: list.filter((p) => p.status === "sold" || p.status === "rented").length,
      views: list.reduce((sum, p) => sum + (p.views ?? 0), 0),
      newLeads: leadList.filter((l) => l.status === "new").length,
      leadsToday: leadList.filter((l) => new Date(l.created_at) >= startOfToday).length,
      portfolio: list.reduce((sum, p) => sum + Number(p.price ?? 0), 0),
      revenue: list
        .filter((p) => p.status === "sold" || p.status === "rented")
        .reduce((sum, p) => sum + Number(p.price ?? 0), 0),
      openTasks: (tasks ?? []).filter((t) => t.status !== "done").length,
      dueToday: (tasks ?? []).filter(
        (t) => t.due_at && new Date(t.due_at).toDateString() === new Date().toDateString(),
      ).length,
    };
  }, [properties, leads, tasks]);

  const viewSeries = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = 29; i >= 0; i -= 1) {
      const day = new Date(Date.now() - i * 86400000);
      buckets.set(day.toISOString().slice(0, 10), 0);
    }
    (views ?? []).forEach((v) => {
      const key = v.created_at.slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    const leadBuckets = new Map<string, number>();
    (leads ?? []).forEach((l) => {
      const key = l.created_at.slice(0, 10);
      if (buckets.has(key)) leadBuckets.set(key, (leadBuckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      views: count,
      leads: leadBuckets.get(date) ?? 0,
    }));
  }, [views, leads]);

  const funnel = useMemo(() => {
    const list = leads ?? [];
    return LEAD_STATUSES.filter((s) => s.value !== "lost").map((s) => ({
      stage: s.label,
      count: list.filter((l) => l.status === s.value).length,
    }));
  }, [leads]);

  const revenueSeries = useMemo(() => {
    const months = new Map<string, { closed: number; pipeline: number }>();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      months.set(d.toLocaleDateString("en-IN", { month: "short" }), { closed: 0, pipeline: 0 });
    }
    (properties ?? []).forEach((p) => {
      const key = new Date(p.updated_at ?? p.created_at).toLocaleDateString("en-IN", {
        month: "short",
      });
      const bucket = months.get(key);
      if (!bucket) return;
      const amount = Number(p.price ?? 0) / 10000000; // in Cr
      if (p.status === "sold" || p.status === "rented") bucket.closed += amount;
      else bucket.pipeline += amount;
    });
    return Array.from(months.entries()).map(([month, v]) => ({
      month,
      closed: Number(v.closed.toFixed(2)),
      pipeline: Number(v.pipeline.toFixed(2)),
    }));
  }, [properties]);

  const agents = useMemo(() => {
    const list = team ?? [];
    return list
      .map((member) => {
        const owned = (properties ?? []).filter((p) => p.assigned_to === member.id);
        const assignedLeads = (leads ?? []).filter((l) => l.assigned_to === member.id);
        return {
          id: member.id,
          name: member.full_name ?? member.email ?? "Teammate",
          listings: owned.length,
          leads: assignedLeads.length,
          won: assignedLeads.filter((l) => l.status === "won").length,
          views: owned.reduce((sum, p) => sum + (p.views ?? 0), 0),
        };
      })
      .sort((a, b) => b.leads + b.listings - (a.leads + a.listings))
      .slice(0, 5);
  }, [team, properties, leads]);

  const topProperties = useMemo(
    () =>
      [...(properties ?? [])].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5),
    [properties],
  );

  const dueFollowUps = useMemo(
    () =>
      (leads ?? [])
        .filter((l) => ["overdue", "today"].includes(followUpState(l.follow_up_at)))
        .sort(
          (a, b) =>
            new Date(a.follow_up_at ?? 0).getTime() - new Date(b.follow_up_at ?? 0).getTime(),
        )
        .slice(0, 5),
    [leads],
  );

  const openTasks = useMemo(
    () =>
      (tasks ?? [])
        .filter((t) => t.status !== "done")
        .sort((a, b) => new Date(a.due_at ?? 0).getTime() - new Date(b.due_at ?? 0).getTime())
        .slice(0, 5),
    [tasks],
  );

  const quickActions = [
    { label: "Add property", to: "/properties/new", icon: Plus },
    { label: "Listings", to: "/properties", icon: ListChecks },
    { label: "Leads", to: "/leads", icon: Users },
    { label: "Media", to: "/media", icon: Images },
    { label: "Analytics", to: "/analytics", icon: BarChart3 },
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Deep Real Estate"
        gradient
        title={`${greeting()} — here's your portfolio`}
        description="Live inventory, pipeline and performance across every agent and listing."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/analytics">
                <BarChart3 className="h-4 w-4" /> Full analytics
              </Link>
            </Button>
            <Button
              asChild
              className="brand-gradient rounded-xl shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90"
            >
              <Link to="/properties/new">
                <Plus className="h-4 w-4" /> Add property
              </Link>
            </Button>
          </>
        }
      />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="surface surface-hover group flex items-center gap-3 p-4 sm:p-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-primary/12 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
              <action.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{action.label}</span>
              <span className="block truncate text-[11px] text-muted-foreground">Open</span>
            </span>
          </Link>
        ))}
      </div>


      {/* KPIs */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            index={0}
            label="Active listings"
            value={stats.active}
            hint={`${stats.total} total in inventory`}
            icon={BadgeCheck}
            tone="success"
          />
          <StatCard
            index={1}
            label="New leads"
            value={stats.newLeads}
            hint={`${stats.leadsToday} came in today`}
            icon={UserPlus}
            tone="brass"
          />
          <StatCard
            index={2}
            label="Follow-ups due"
            value={dueFollowUps.length}
            hint="Today and overdue"
            icon={CalendarClock}
            tone={dueFollowUps.length ? "destructive" : "default"}
          />
          <StatCard
            index={3}
            label="Open tasks"
            value={stats.openTasks}
            hint={`${stats.dueToday} due today`}
            icon={ListChecks}
          />
          <StatCard
            index={4}
            label="Revenue closed"
            value={formatPrice(stats.revenue)}
            hint={`${stats.sold} sold / rented`}
            icon={IndianRupee}
            tone="success"
          />
          <StatCard
            index={5}
            label="Pipeline value"
            value={formatPrice(stats.portfolio)}
            icon={Building2}
          />
          <StatCard
            index={6}
            label="Total views"
            value={formatNumber(stats.views)}
            hint="Public listing pages"
            icon={Eye}
          />
          <StatCard
            index={7}
            label="Team members"
            value={(team ?? []).length}
            hint="Active agents"
            icon={Users}
            tone="brass"
          />
        </div>
      )}

      {/* Traffic + funnel */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Traffic & enquiries"
          subtitle="Public page views vs. new leads, last 30 days"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewSeries}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={28} />
                <Tooltip contentStyle={chartTooltip} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#viewsFill)"
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  fill="url(#leadsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Lead conversion funnel" subtitle="Pipeline by stage">
          <div className="space-y-3.5">
            {funnel.map((stage, i) => {
              const max = Math.max(...funnel.map((f) => f.count), 1);
              const pct = Math.round((stage.count / max) * 100);
              return (
                <div key={stage.stage}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <span className="font-semibold tabular-nums">
                      {stage.count}
                      <span className="ml-1.5 text-muted-foreground">{pct}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-chart-5"
                      style={{ opacity: 1 - i * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
            <Link to="/leads">
              Open CRM <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Panel>
      </div>

      {/* Revenue + calendar */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Sales & pipeline"
          subtitle="Value in ₹ crore, last 6 months"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries} barGap={6}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={32} />
                <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={chartTooltip} />
                <Bar dataKey="closed" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pipeline" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <CalendarWidget
          events={[
            ...(leads ?? [])
              .filter((l) => l.follow_up_at)
              .map((l) => ({ date: l.follow_up_at as string, kind: "lead" as const })),
            ...(tasks ?? [])
              .filter((t) => t.due_at && t.status !== "done")
              .map((t) => ({ date: t.due_at as string, kind: "task" as const })),
          ]}
        />
      </div>

      {/* Follow-ups + tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Follow-ups due"
          subtitle="Scheduled for today or overdue"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/leads">Open leads</Link>
            </Button>
          }
        >
          {dueFollowUps.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              All clear — no follow-ups pending right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {dueFollowUps.map((lead) => (
                <li key={lead.id}>
                  <Link
                    to="/leads"
                    className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brass/15 text-brass">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{lead.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {lead.property_title ?? "General enquiry"} ·{" "}
                        {formatFollowUp(lead.follow_up_at)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-[11px] font-semibold ${FOLLOW_UP_TONE[followUpState(lead.follow_up_at)]}`}
                    >
                      {FOLLOW_UP_LABEL[followUpState(lead.follow_up_at)]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Tasks"
          subtitle="Next actions across the team"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/tasks">All tasks</Link>
            </Button>
          }
        >
          {openTasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No open tasks — create one from the Tasks page.
            </p>
          ) : (
            <ul className="space-y-2">
              {openTasks.map((task) => (
                <li key={task.id}>
                  <Link
                    to="/tasks"
                    className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{task.title}</span>
                      <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {task.due_at ? formatFollowUp(task.due_at) : "No due date"}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize">
                      {task.priority}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Performance + activity */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Property performance"
          subtitle="Most-viewed listings"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/properties">View all</Link>
            </Button>
          }
        >
          <ul className="space-y-2">
            {topProperties.map((property) => (
              <li key={property.id}>
                <Link
                  to="/properties/$id/edit"
                  params={{ id: property.id }}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/60"
                >
                  {property.cover_image ? (
                    <img
                      src={property.cover_image}
                      alt={property.title}
                      loading="lazy"
                      className="h-14 w-20 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Building2 className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{property.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {locationLine(property.city, property.sector)} ·{" "}
                      {timeAgo(property.created_at)}
                    </span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="block text-sm font-semibold">
                      {formatPrice(Number(property.price))}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatNumber(property.views)} views
                    </span>
                  </span>
                  <StatusBadge status={property.status} />
                </Link>
              </li>
            ))}
            {topProperties.length === 0 && (
              <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No listings yet — add your first property.
              </li>
            )}
          </ul>
        </Panel>

        <Panel title="Agent performance" subtitle="Listings, leads and wins">
          <ul className="space-y-3">
            {agents.map((agent) => (
              <li key={agent.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {agent.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{agent.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {agent.listings} listings · {agent.leads} leads · {agent.won} won
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                  {formatNumber(agent.views)}
                </span>
              </li>
            ))}
            {agents.length === 0 && (
              <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Invite teammates to see performance here.
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Recent activity"
        subtitle="Everything happening across the workspace"
        action={
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Activity className="h-4 w-4" />
          </span>
        }
      >
        {(activity ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-5">
            {(activity ?? []).slice(0, 8).map((row) => (
              <li key={row.id} className="relative">
                <span className="absolute -left-[1.6rem] top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                <p className="text-sm font-medium capitalize">{row.action.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">
                  {row.actor_email ?? "System"} · {timeAgo(row.created_at)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}

function CalendarWidget({ events }: { events: { date: string; kind: "lead" | "task" }[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const marks = useMemo(() => {
    const map = new Map<string, Set<"lead" | "task">>();
    events.forEach((e) => {
      const key = new Date(e.date).toDateString();
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(e.kind);
    });
    return map;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  const today = new Date().toDateString();

  return (
    <Panel
      title="Schedule"
      subtitle="Follow-ups and task due dates"
      action={
        <span className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </span>
      }
    >
      <p className="mb-3 text-sm font-semibold">
        {cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={`${d}-${i}`} className="py-1 font-semibold">
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`empty-${i}`} />;
          const kinds = marks.get(date.toDateString());
          const isToday = date.toDateString() === today;
          return (
            <span
              key={date.toISOString()}
              className={`relative flex h-9 flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                isToday
                  ? "bg-primary font-semibold text-primary-foreground"
                  : kinds
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {date.getDate()}
              {kinds && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {kinds.has("lead") && <span className="h-1 w-1 rounded-full bg-brass" />}
                  {kinds.has("task") && <span className="h-1 w-1 rounded-full bg-chart-3" />}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brass" /> Follow-ups
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-chart-3" /> Tasks
        </span>
      </div>
    </Panel>
  );
}
