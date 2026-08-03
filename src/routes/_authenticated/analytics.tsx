import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Eye, TrendingUp, Users, Building2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { usePropertiesQuery, useLeadsQuery, useViewsQuery } from "@/lib/queries";
import { formatNumber, locationLine } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — BrokrSuite" },
      {
        name: "description",
        content: "Traffic, conversion and city-level performance across your property portfolio.",
      },
      { property: "og:title", content: "Analytics — BrokrSuite" },
      { property: "og:description", content: "Understand what buyers are actually looking at." },
    ],
  }),
  component: AnalyticsPage,
});

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
} as const;

function AnalyticsPage() {
  const { data: properties } = usePropertiesQuery();
  const { data: leads } = useLeadsQuery();
  const { data: views } = useViewsQuery();

  const totalViews = (properties ?? []).reduce((sum, p) => sum + (p.views ?? 0), 0);
  const totalLeads = leads?.length ?? 0;
  const conversion = totalViews ? ((totalLeads / totalViews) * 100).toFixed(1) : "0.0";

  const topProperties = useMemo(
    () =>
      [...(properties ?? [])]
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, 8)
        .map((p) => ({ name: p.title.slice(0, 22), views: p.views ?? 0 })),
    [properties],
  );

  const cityPerformance = useMemo(() => {
    const map = new Map<string, { city: string; listings: number; views: number }>();
    (properties ?? []).forEach((p) => {
      const entry = map.get(p.city) ?? { city: p.city, listings: 0, views: 0 };
      entry.listings += 1;
      entry.views += p.views ?? 0;
      map.set(p.city, entry);
    });
    return Array.from(map.values());
  }, [properties]);

  const leadTrend = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = 29; i >= 0; i -= 1) {
      buckets.set(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), 0);
    }
    (leads ?? []).forEach((l) => {
      const key = l.created_at.slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      leads: count,
    }));
  }, [leads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="How buyers are engaging with the Deep Real Estate portfolio."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Total views" value={formatNumber(totalViews)} icon={Eye} />
        <StatCard index={1} label="Total leads" value={totalLeads} icon={Users} tone="brass" />
        <StatCard
          index={2}
          label="Conversion rate"
          value={`${conversion}%`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          index={3}
          label="Tracked page hits"
          value={formatNumber(views?.length ?? 0)}
          icon={Building2}
        />
      </div>

      <div className="surface p-5">
        <p className="display-title text-lg">Lead trend</p>
        <p className="mb-4 text-xs text-muted-foreground">Enquiries received, last 30 days</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leadTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} interval={4} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={28}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="var(--color-chart-4)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <p className="display-title text-lg">Most viewed properties</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProperties} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  horizontal={false}
                />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  width={130}
                />
                <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="views" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5">
          <p className="display-title text-lg">City performance</p>
          <div className="mt-4 space-y-3">
            {cityPerformance.map((city) => (
              <div key={city.city} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{locationLine(city.city)}</p>
                  <p className="text-sm text-muted-foreground">
                    {city.listings} listings · {formatNumber(city.views)} views
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${totalViews ? Math.round((city.views / totalViews) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
