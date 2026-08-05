import { createFileRoute, Link } from "@tanstack/react-router";
import { isNativeApp, openExternal } from "@/lib/native";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePropertyQuery, useSettingsQuery } from "@/lib/queries";
import { formatPrice, formatNumber, locationLine } from "@/lib/format";
import { labelFor, PROPERTY_TYPES, FURNISHINGS, FACINGS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/properties/$id/brochure")({
  head: () => ({
    meta: [
      { title: "Property brochure — BrokrSuite" },
      {
        name: "description",
        content: "Print-ready, branded PDF brochure for any listing in your inventory.",
      },
      { property: "og:title", content: "Property brochure — BrokrSuite" },
      { property: "og:description", content: "Download a branded brochure for this property." },
    ],
  }),
  component: BrochurePage,
});

function BrochurePage() {
  const { id } = Route.useParams();
  const { data: property, isLoading } = usePropertyQuery(id);
  const { data: settings } = useSettingsQuery();

  if (isLoading) return <Skeleton className="h-[60vh] rounded-xl" />;
  if (!property) return <p className="text-sm text-muted-foreground">Listing not found.</p>;

  const gallery = [...(property.property_images ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, 4);
  const cover = property.cover_image ?? gallery[0]?.url ?? "";

  const specs: [string, string][] = [
    ["Property ID", property.property_code],
    ["Type", labelFor(PROPERTY_TYPES, property.property_type)],
    ["Bedrooms", property.bedrooms ? String(property.bedrooms) : "—"],
    ["Bathrooms", property.bathrooms ? String(property.bathrooms) : "—"],
    ["Balconies", property.balconies ? String(property.balconies) : "—"],
    ["Parking", property.parking ? String(property.parking) : "—"],
    ["Floor", property.floor_no ? `${property.floor_no} of ${property.total_floors ?? "—"}` : "—"],
    ["Facing", property.facing ? labelFor(FACINGS, property.facing) : "—"],
    [
      "Carpet area",
      property.carpet_area ? `${formatNumber(property.carpet_area)} ${property.area_unit}` : "—",
    ],
    [
      "Super area",
      property.super_area ? `${formatNumber(property.super_area)} ${property.area_unit}` : "—",
    ],
    ["Furnishing", property.furnishing ? labelFor(FURNISHINGS, property.furnishing) : "—"],
    ["Maintenance", property.maintenance_charges ? formatPrice(property.maintenance_charges) : "—"],
  ];

  return (
    <div className="space-y-6">
      <div className="print-hide flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild>
          <Link to="/properties/$id/edit" params={{ id }}>
            <ArrowLeft className="h-4 w-4" /> Back to listing
          </Link>
        </Button>
        <Button
          onClick={() => {
            // The Android webview has no print dialog — hand the page to Chrome,
            // which can print or save it as a PDF.
            if (isNativeApp()) void openExternal(window.location.href);
            else window.print();
          }}
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      <article className="print-sheet mx-auto w-full max-w-[820px] space-y-6 rounded-xl border border-border bg-card p-8 text-card-foreground">
        <header className="flex items-start justify-between gap-6 border-b border-border pb-5">
          <div>
            <p className="display-title text-2xl">{settings?.agency_name ?? "Deep Real Estate"}</p>
            <p className="text-xs text-muted-foreground">
              {settings?.phone ?? property.agent_phone ?? ""}
              {settings?.email ? ` · ${settings.email}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Listing</p>
            <p className="font-medium">{property.property_code}</p>
          </div>
        </header>

        {cover && (
          <img
            src={cover}
            alt={property.title}
            className="aspect-16/9 w-full rounded-lg object-cover"
          />
        )}

        <section className="space-y-2">
          <h1 className="display-title text-2xl">{property.title}</h1>
          <p className="text-sm text-muted-foreground">
            {locationLine(property.city, property.sector)}
            {property.address ? ` · ${property.address}` : ""}
          </p>
          <p className="display-title text-3xl text-brass">
            {formatPrice(Number(property.price))}
            {property.negotiable ? (
              <span className="ml-2 text-sm text-muted-foreground">negotiable</span>
            ) : null}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-x-8 gap-y-2 border-y border-border py-4 text-sm sm:grid-cols-3">
          {specs.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </section>

        {property.description && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide">About this property</h2>
            <div
              className="prose-sm text-sm leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: property.description }}
            />
          </section>
        )}

        {property.amenities?.length ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Amenities</h2>
            <p className="text-sm text-muted-foreground">{property.amenities.join(" · ")}</p>
          </section>
        ) : null}

        {gallery.length > 1 && (
          <section className="grid grid-cols-3 gap-3">
            {gallery.slice(1).map((image) => (
              <img
                key={image.id}
                src={image.url}
                alt={image.alt ?? property.title}
                className="aspect-4/3 w-full rounded-lg object-cover"
              />
            ))}
          </section>
        )}

        <footer className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your advisor</p>
            <p className="font-medium">{property.agent_name ?? "—"}</p>
            <p className="text-muted-foreground">
              {property.agent_phone ?? ""}
              {property.agent_email ? ` · ${property.agent_email}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">{property.agent_office ?? ""}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Prices and availability are indicative and subject to change.
          </p>
        </footer>
      </article>
    </div>
  );
}
