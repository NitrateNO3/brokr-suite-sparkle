import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useAmenitiesQuery, usePropertiesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/amenities")({
  head: () => ({
    meta: [
      { title: "Amenities — BrokrSuite" },
      {
        name: "description",
        content: "The amenity catalogue available when describing listings, with usage counts.",
      },
      { property: "og:title", content: "Amenities — BrokrSuite" },
      { property: "og:description", content: "Standardised amenity tags across your inventory." },
    ],
  }),
  component: AmenitiesPage,
});

function AmenitiesPage() {
  const { data, isLoading } = useAmenitiesQuery();
  const { data: properties } = usePropertiesQuery();

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    (properties ?? []).forEach((p) => {
      (p.amenities ?? []).forEach((a: string) => map.set(a, (map.get(a) ?? 0) + 1));
    });
    return map;
  }, [properties]);

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Amenities"
        description="Standard amenity tags used across your listings."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(data ?? []).map((amenity) => (
          <div key={amenity.id} className="surface flex items-center justify-between gap-3 p-4">
            <span className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-brass" />
              {amenity.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {usage.get(amenity.name) ?? 0} listings
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
