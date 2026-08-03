import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocationsQuery, usePropertiesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/locations")({
  head: () => ({
    meta: [
      { title: "Locations — BrokrSuite" },
      {
        name: "description",
        content: "Micro-markets across Gurgaon, Sohna and Manesar with live listing counts.",
      },
      { property: "og:title", content: "Locations — BrokrSuite" },
      { property: "og:description", content: "Coverage map for your operating micro-markets." },
    ],
  }),
  component: LocationsPage,
});

function LocationsPage() {
  const { data, isLoading } = useLocationsQuery();
  const { data: properties } = usePropertiesQuery();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    (properties ?? []).forEach((p) => {
      if (!p.sector) return;
      map.set(p.sector, (map.get(p.sector) ?? 0) + 1);
    });
    return map;
  }, [properties]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof data>();
    (data ?? []).forEach((row) => {
      map.set(row.city, [...(map.get(row.city) ?? []), row]);
    });
    return Array.from(map.entries());
  }, [data]);

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Every micro-market you operate in, with the number of live listings."
      />

      <div className="space-y-4">
        {grouped.map(([city, rows]) => (
          <div key={city} className="surface p-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="display-title text-lg">{city}</p>
              <span className="text-xs text-muted-foreground">{rows?.length ?? 0} sectors</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(rows ?? []).map((row) => (
                <span
                  key={row.id}
                  className="rounded-full border border-border px-3 py-1.5 text-xs"
                >
                  {row.sector}
                  <span className="ml-2 text-muted-foreground">
                    {counts.get(row.sector ?? "") ?? 0}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
