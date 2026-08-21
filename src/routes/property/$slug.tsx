import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Bath,
  BedDouble,
  Building2,
  BadgeCheck,
  Car,
  Compass,
  Crown,
  Download,
  FileText,
  Flame,
  Heart,
  Layers,
  MapPin,
  Printer,
  Ruler,
  Share2,
  Sofa,
  Sparkles,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ContactActions } from "@/components/shared/ContactActions";
import { ShareDialog } from "@/components/shared/ShareDialog";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import {
  getPublicProperty,
  getPublicPropertyCards,
  recordPropertyView,
  submitLead,
} from "@/lib/public-property.functions";
import type { PublicProperty, PublicPropertyCard } from "@/lib/public-property.functions";
import {
  areaUnitLabel,
  formatArea,
  formatDate,
  formatNumber,
  formatPrice,
  formatRupees,
  locationLine,
  pricePerArea,
} from "@/lib/format";
import {
  labelFor,
  PROPERTY_TYPES,
  PROPERTY_AGES,
  FURNISHINGS,
  FACINGS,
  STATUSES,
} from "@/lib/constants";

const FAVOURITES_KEY = "brokrsuite-favourites";

export const Route = createFileRoute("/property/$slug")({
  loader: async ({ params }) => {
    const property = await getPublicProperty({ data: { slug: params.slug } });
    if (!property) throw notFound();
    const cards = await getPublicPropertyCards({
      data: {
        excludeSlug: params.slug,
        city: property.city,
        propertyType: property.property_type,
      },
    }).catch(() => []);
    return { property, cards };
  },
  head: ({ loaderData }) => {
    const property = loaderData?.property;
    const title = property ? `${property.title} — Deep Real Estate` : "Property — BrokrSuite";
    const description = property
      ? [
          labelFor(PROPERTY_TYPES, property.property_type),
          property.city ? `in ${locationLine(property.city, property.sector)}` : null,
          property.price ? formatPrice(Number(property.price)) : "Price on request",
        ]
          .filter(Boolean)
          .join(" · ")
      : "Explore this property listing.";
    const image = property?.cover_image;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image?.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <p className="text-sm text-muted-foreground">This listing couldn&apos;t be loaded.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="display-title text-2xl">Listing not available</h1>
      <p className="text-sm text-muted-foreground">
        This property may have been sold or unpublished.
      </p>
      <Button asChild>
        <Link to="/">Back to BrokrSuite</Link>
      </Button>
    </div>
  ),
  component: PublicPropertyPage,
});

function Badge({
  icon: Icon,
  label,
  tone = "default",
}: {
  icon: typeof BadgeCheck;
  label: string;
  tone?: "default" | "brand";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        tone === "brand"
          ? "bg-primary/10 text-primary"
          : "bg-secondary text-secondary-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="surface mt-6 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="display-title text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function youtubeEmbed(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function PublicPropertyPage() {
  const { property, cards } = Route.useLoaderData() as {
    property: PublicProperty;
    cards: PublicPropertyCard[];
  };
  const track = useServerFn(recordPropertyView);
  const sendLead = useServerFn(submitLead);
  const [share, setShare] = useState(false);
  const [favourite, setFavourite] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void track({ data: { propertyId: property.id } }).catch(() => undefined);
  }, [property.id, track]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVOURITES_KEY) ?? "[]") as string[];
      setFavourite(saved.includes(property.slug));
    } catch {
      /* ignore */
    }
  }, [property.slug]);

  const toggleFavourite = () => {
    let saved: string[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(FAVOURITES_KEY) ?? "[]") as string[];
    } catch {
      saved = [];
    }
    const next = saved.includes(property.slug)
      ? saved.filter((s) => s !== property.slug)
      : [...saved, property.slug];
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));
    setFavourite(next.includes(property.slug));
    toast.success(next.includes(property.slug) ? "Saved to favourites" : "Removed from favourites");
  };

  const images = useMemo(
    () => [...(property.property_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [property.property_images],
  );
  const photos = images.filter((i) => (i.media_kind ?? "photo") !== "floor_plan");
  const floorPlans = images.filter((i) => i.media_kind === "floor_plan");
  const videos = property.property_videos ?? [];
  const documents = property.property_documents ?? [];

  const area = property.super_area ?? property.builtup_area ?? property.carpet_area;
  const rate = pricePerArea(Number(property.price), area ? Number(area) : null, property.area_unit);
  const locality = [property.address, property.sector, property.city].filter(Boolean).join(", ");
  const mapQuery =
    property.latitude && property.longitude
      ? `${property.latitude},${property.longitude}`
      : locality || null;

  const specs = [
    { icon: BedDouble, label: "Bedrooms", value: property.bedrooms ? `${property.bedrooms}` : null },
    { icon: Bath, label: "Bathrooms", value: property.bathrooms ? `${property.bathrooms}` : null },
    { icon: Layers, label: "Balconies", value: property.balconies ? `${property.balconies}` : null },
    { icon: Car, label: "Parking", value: property.parking ? `${property.parking}` : null },
    {
      icon: Ruler,
      label: "Super area",
      value: formatArea(property.super_area ? Number(property.super_area) : null, property.area_unit),
    },
    {
      icon: Ruler,
      label: "Carpet area",
      value: formatArea(
        property.carpet_area ? Number(property.carpet_area) : null,
        property.area_unit,
      ),
    },
    {
      icon: Layers,
      label: "Floor",
      value: property.floor_no
        ? `${property.floor_no}${property.total_floors ? ` of ${property.total_floors}` : ""}`
        : null,
    },
    {
      icon: Compass,
      label: "Facing",
      value: property.facing ? labelFor(FACINGS, property.facing) : null,
    },
    {
      icon: Sofa,
      label: "Furnishing",
      value: property.furnishing ? labelFor(FURNISHINGS, property.furnishing) : null,
    },
    {
      icon: Building2,
      label: "Availability",
      value: property.age ? labelFor(PROPERTY_AGES, property.age) : labelFor(STATUSES, property.status),
    },
    { icon: Building2, label: "Builder", value: property.builder ?? null },
    {
      icon: Building2,
      label: "Property type",
      value: labelFor(PROPERTY_TYPES, property.property_type),
    },
  ].filter((s) => Boolean(s.value)) as {
    icon: typeof BedDouble;
    label: string;
    value: string;
  }[];

  const nearby = ["Schools", "Hospitals", "Metro station", "Restaurants", "Shopping mall"];
  const embed = youtubeEmbed(property.youtube_url);

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-20 border-b print:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="display-title truncate">Deep Real Estate</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Save to favourites"
              onClick={toggleFavourite}
            >
              <Heart className={`h-4 w-4 ${favourite ? "fill-primary text-primary" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Print listing"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShare(true)}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <PropertyGallery images={photos} cover={property.cover_image} title={property.title} />
        </motion.div>

        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              {property.is_verified && <Badge icon={BadgeCheck} label="Verified" tone="brand" />}
              {property.is_featured && <Badge icon={Sparkles} label="Featured" />}
              {property.is_premium && <Badge icon={Crown} label="Premium" />}
              {property.is_hot && <Badge icon={Flame} label="Hot" />}
              {property.is_exclusive && <Badge icon={Sparkles} label="Exclusive" />}
            </div>

            <p className="eyebrow mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              {property.property_code} · For {property.purpose} ·{" "}
              {labelFor(PROPERTY_TYPES, property.property_type)}
            </p>
            <h1 className="display-title mt-1.5 text-2xl">{property.title}</h1>
            {locality && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {locality}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
              <p className="display-title text-2xl text-primary">
                {property.price ? formatRupees(Number(property.price)) : "Price on request"}
              </p>
              {rate && <p className="text-sm text-muted-foreground">{rate}</p>}
              {property.negotiable && (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold">
                  Negotiable
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Posted {formatDate(property.created_at)} · {formatNumber(property.views)} views
            </p>

            {specs.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {specs.map((spec) => (
                  <div key={spec.label} className="surface rounded-xl p-2.5">
                    <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <spec.icon className="h-3.5 w-3.5" /> {spec.label}
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold">{spec.value}</p>
                  </div>
                ))}
              </div>
            )}

            {property.description && (
              <Section title="About this property">
                <div
                  className="prose-brokr text-sm/relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: property.description }}
                />
              </Section>
            )}

            {(property.amenities ?? []).length > 0 && (
              <Section title="Amenities">
                <div className="flex flex-wrap gap-2">
                  {(property.amenities ?? []).map((amenity: string) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-border px-3 py-1.5 text-xs"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {floorPlans.length > 0 && (
              <Section title="Floor plans">
                <div className="grid gap-3 sm:grid-cols-2">
                  {floorPlans.map((plan) => (
                    <a key={plan.id} href={plan.url} target="_blank" rel="noreferrer">
                      <img
                        src={plan.url}
                        alt={plan.alt ?? `${property.title} floor plan`}
                        loading="lazy"
                        className="w-full rounded-xl border border-border bg-muted object-contain"
                      />
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {(embed || videos.length > 0 || property.virtual_tour_url) && (
              <Section title="Video & virtual tour">
                <div className="space-y-3">
                  {embed && (
                    <iframe
                      src={embed}
                      title={`${property.title} video tour`}
                      loading="lazy"
                      allowFullScreen
                      className="aspect-video w-full rounded-xl border border-border"
                    />
                  )}
                  {videos.map((video) => (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/50"
                    >
                      <Video className="h-4 w-4 text-primary" />
                      {video.title ?? "Property walkthrough"}
                    </a>
                  ))}
                  {property.virtual_tour_url && (
                    <a
                      href={property.virtual_tour_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/50"
                    >
                      <Sparkles className="h-4 w-4 text-primary" /> Open 360° virtual tour
                    </a>
                  )}
                </div>
              </Section>
            )}

            {documents.length > 0 && (
              <Section title="Documents">
                <div className="grid gap-2 sm:grid-cols-2">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/50"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="truncate">{doc.name}</span>
                      <Download className="ml-auto h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {mapQuery && (
              <Section title="Location & neighbourhood">
                <iframe
                  title={`Map of ${property.title}`}
                  loading="lazy"
                  className="aspect-video w-full rounded-xl border border-border"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {nearby.map((place) => (
                    <a
                      key={place}
                      href={`https://www.google.com/maps/search/${encodeURIComponent(
                        `${place} near ${mapQuery}`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted/60"
                    >
                      {place} nearby
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit print:hidden">
            <div className="surface space-y-3 p-5">
              <p className="display-title text-lg">Enquire about this property</p>
              <p className="text-xs text-muted-foreground">
                Our team responds within one business day.
              </p>
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSending(true);
                  try {
                    await sendLead({
                      data: {
                        name: form.name,
                        phone: form.phone,
                        email: form.email,
                        message: form.message,
                        propertyId: property.id,
                        propertyTitle: property.title,
                      },
                    });
                    setForm({ name: "", phone: "", email: "", message: "" });
                    toast.success("Thanks — we'll be in touch shortly.");
                  } catch {
                    toast.error("Could not send your enquiry. Please try again.");
                  } finally {
                    setSending(false);
                  }
                }}
              >
                <Input
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  required
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Email (optional)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Textarea
                  rows={3}
                  placeholder="Message (optional)"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
                <Button type="submit" className="w-full" disabled={sending}>
                  Send enquiry
                </Button>
              </form>
              {property.agent_name && (
                <p className="text-xs text-muted-foreground">
                  Listed by <span className="font-medium text-foreground">{property.agent_name}</span>
                  {property.agent_office ? ` · ${property.agent_office}` : ""}
                </p>
              )}
              <ContactActions
                phone={property.agent_phone}
                whatsapp={property.agent_whatsapp}
                email={property.agent_email}
                title={property.title}
                latitude={property.latitude}
                longitude={property.longitude}
                address={property.address}
                mapsLink={property.maps_url}
              />
            </div>
          </aside>
        </div>

        {cards.length > 0 && (
          <section className="mt-10 print:hidden">
            <h2 className="display-title text-xl">Similar & recent properties</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.slice(0, 8).map((card) => (
                <Link
                  key={card.slug}
                  to="/property/$slug"
                  params={{ slug: card.slug }}
                  className="surface surface-hover overflow-hidden"
                >
                  {card.cover_image ? (
                    <img
                      src={card.cover_image}
                      alt={card.title}
                      loading="lazy"
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-36 w-full place-items-center bg-muted text-muted-foreground">
                      <Building2 className="h-7 w-7 opacity-40" />
                    </div>
                  )}
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-medium">{card.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {locationLine(card.city, card.sector)}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {card.price ? formatPrice(Number(card.price)) : "Price on request"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {[
                        card.bedrooms ? `${card.bedrooms} BHK` : null,
                        card.super_area
                          ? `${formatNumber(Number(card.super_area))} ${areaUnitLabel(card.area_unit)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <ShareDialog
        open={share}
        onOpenChange={setShare}
        slug={property.slug}
        title={property.title}
        coverImage={property.cover_image ?? photos[0]?.url ?? null}
        subtitle={locality || null}
        price={property.price ? formatPrice(Number(property.price)) : null}
      />
    </div>
  );
}
