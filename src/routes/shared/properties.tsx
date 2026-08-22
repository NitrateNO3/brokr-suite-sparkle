import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Bath, BedDouble, Building2, Car, MapPin, Phone, Ruler, Sofa } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSharedProperties, type SharedPublicProperty } from "@/lib/share.functions";
import { formatArea, formatPrice, locationLine } from "@/lib/format";
import { PROPERTY_TYPES, labelFor } from "@/lib/constants";
import { mailtoUrl, openWithSystemApp, telUrl, whatsappUrl } from "@/lib/native";

type Search = { id?: string | undefined };

export const Route = createFileRoute("/shared/properties")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    id: typeof search["id"] === "string" ? search["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shortlisted Properties | BrokrSuite" },
      {
        name: "description",
        content:
          "A curated selection of residential and commercial properties shared with you by your property advisor.",
      },
      { property: "og:title", content: "Shortlisted Properties" },
      {
        property: "og:description",
        content: "A curated selection of properties shared with you by your property advisor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedPropertiesPage,
});

function SpecChip({ icon: Icon, value }: { icon: typeof BedDouble; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
      <Icon className="h-3 w-3" aria-hidden="true" /> {value}
    </span>
  );
}

function PropertyItem({ property }: { property: SharedPublicProperty }) {
  const image = property.cover_image ?? property.images?.[0] ?? null;
  const area = property.super_area ?? property.builtup_area ?? property.carpet_area;
  const specs: { icon: typeof BedDouble; value: string }[] = [];
  if (property.bedrooms) specs.push({ icon: BedDouble, value: `${property.bedrooms} BHK` });
  if (property.bathrooms) specs.push({ icon: Bath, value: `${property.bathrooms} Bath` });
  if (property.parking) specs.push({ icon: Car, value: `${property.parking} Parking` });
  if (property.furnishing)
    specs.push({ icon: Sofa, value: property.furnishing.replace(/_/g, " ") });
  const areaLabel = formatArea(area ? Number(area) : null, property.area_unit);
  if (areaLabel) specs.push({ icon: Ruler, value: areaLabel });

  return (
    <article className="surface overflow-hidden rounded-xl border border-border/70 sm:flex">
      {image ? (
        <img
          src={image}
          alt={`${property.title} photo`}
          loading="lazy"
          className="h-48 w-full object-cover sm:h-auto sm:w-64 sm:shrink-0"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-muted sm:h-auto sm:w-64 sm:shrink-0">
          <Building2 className="h-7 w-7 text-muted-foreground/50" aria-hidden="true" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">{property.title}</h2>
          <p className="text-base font-bold text-primary">
            {property.price != null ? formatPrice(Number(property.price)) : "Price on request"}
          </p>
        </div>
        {(property.city || property.sector || property.address) && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {property.address ?? locationLine(property.city, property.sector)}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <SpecChip
            icon={Building2}
            value={`${labelFor(PROPERTY_TYPES, property.property_type)} · For ${property.purpose}`}
          />
          {specs.map((s) => (
            <SpecChip key={s.value} icon={s.icon} value={s.value} />
          ))}
        </div>
        {property.description && (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {property.description.replace(/<[^>]*>/g, "")}
          </p>
        )}
        {property.amenities?.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Amenities: {property.amenities.slice(0, 8).join(", ")}
          </p>
        )}
      </div>
    </article>
  );
}

function SharedPropertiesPage() {
  const { id } = Route.useSearch();
  const ids = Array.from(
    new Set(
      (id ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  );
  const fetchShared = useServerFn(getSharedProperties);
  const { data, isLoading } = useQuery({
    queryKey: ["shared-properties", ids],
    queryFn: () => fetchShared({ data: { ids } }),
    enabled: ids.length > 0,
  });

  const properties = data ?? [];
  const contact = properties.find((p) => p.agent_phone || p.agent_whatsapp || p.agent_email);
  const enquiryText = `Hi, I am interested in the properties you shared with me: ${
    typeof window !== "undefined" ? window.location.href : ""
  }`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">BrokrSuite</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Shortlisted Properties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading
            ? "Loading your shortlist…"
            : `${properties.length} ${properties.length === 1 ? "property" : "properties"} shared with you.`}
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: Math.min(ids.length || 2, 4) }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="surface rounded-xl border border-border/70 p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold">These properties are no longer available</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The link may have expired or the listings were removed. Please contact your advisor for
            an updated shortlist.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => (
            <PropertyItem key={p.id} property={p} />
          ))}
        </div>
      )}

      {properties.length > 0 && (
        <section className="surface mt-8 rounded-xl border border-border/70 p-5 text-center">
          <h2 className="text-base font-semibold">Interested in any of these?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get in touch and we will arrange a site visit at your convenience.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {contact?.agent_phone && (
              <Button size="sm" onClick={() => openWithSystemApp(telUrl(contact.agent_phone!))}>
                <Phone className="h-4 w-4" /> Contact Agent
              </Button>
            )}
            <Button
              size="sm"
              variant={contact?.agent_phone ? "outline" : "default"}
              onClick={() =>
                openWithSystemApp(
                  contact?.agent_whatsapp || contact?.agent_phone
                    ? whatsappUrl(enquiryText, contact.agent_whatsapp ?? contact.agent_phone)
                    : contact?.agent_email
                      ? mailtoUrl(contact.agent_email, "Property enquiry", enquiryText)
                      : whatsappUrl(enquiryText),
                )
              }
            >
              Enquire Now
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
