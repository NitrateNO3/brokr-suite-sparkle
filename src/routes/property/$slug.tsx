import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Building2, MapPin, BedDouble, Bath, Ruler, Compass, Share2, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShareDialog } from "@/components/shared/ShareDialog";
import { getPublicProperty, recordPropertyView, submitLead } from "@/lib/public-property.functions";
import { formatPrice, formatNumber, locationLine } from "@/lib/format";
import { labelFor, PROPERTY_TYPES, FURNISHINGS, FACINGS } from "@/lib/constants";

export const Route = createFileRoute("/property/$slug")({
  loader: async ({ params }) => {
    const property = await getPublicProperty({ data: { slug: params.slug } });
    if (!property) throw notFound();
    return property;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — Deep Real Estate` : "Property — BrokrSuite";
    const description = loaderData
      ? [
          labelFor(PROPERTY_TYPES, loaderData.property_type),
          loaderData.city ? `in ${locationLine(loaderData.city, loaderData.sector)}` : null,
          loaderData.price ? formatPrice(Number(loaderData.price)) : "Price on request",
        ]
          .filter(Boolean)
          .join(" · ")
      : "Explore this property listing.";
    const image = loaderData?.cover_image;
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

function PublicPropertyPage() {
  const property = Route.useLoaderData();
  const track = useServerFn(recordPropertyView);
  const sendLead = useServerFn(submitLead);
  const [share, setShare] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void track({ data: { propertyId: property.id } }).catch(() => undefined);
  }, [property.id, track]);

  const images = [...(property.property_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const gallery = images.length
    ? images.map((i) => i.url)
    : property.cover_image
      ? [property.cover_image]
      : [];

  const facts = [
    property.bedrooms ? { icon: BedDouble, label: `${property.bedrooms} Beds` } : null,
    property.bathrooms ? { icon: Bath, label: `${property.bathrooms} Baths` } : null,
    property.area ? { icon: Ruler, label: `${formatNumber(property.area)} ${property.area_unit}` } : null,
    property.facing ? { icon: Compass, label: labelFor(FACINGS, property.facing) } : null,
    property.furnishing
      ? { icon: Building2, label: labelFor(FURNISHINGS, property.furnishing) }
      : null,
  ].filter(Boolean) as { icon: typeof BedDouble; label: string }[];

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="display-title">Deep Real Estate</span>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => setShare(true)}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-3 md:grid-cols-4"
        >
          {gallery.slice(0, 5).map((url, index) => (
            <img
              key={url}
              src={url}
              alt={`${property.title} photo ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              className={`w-full rounded-xl object-cover ${
                index === 0 ? "h-72 md:col-span-4 md:h-[26rem]" : "h-32"
              }`}
            />
          ))}
        </motion.div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {property.property_code} · For {property.purpose}
            </p>
            <h1 className="display-title mt-2 text-3xl">{property.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {[property.address, property.sector, property.city].filter(Boolean).join(", ")}
            </p>
            <p className="display-title mt-4 text-3xl text-primary">
              {formatPrice(Number(property.price))}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {facts.map((fact) => (
                <span
                  key={fact.label}
                  className="surface flex items-center gap-2 px-4 py-2 text-sm"
                >
                  <fact.icon className="h-4 w-4 text-brass" />
                  {fact.label}
                </span>
              ))}
            </div>

            {property.description && (
              <section className="mt-8">
                <h2 className="display-title text-xl">About this property</h2>
                <div
                  className="prose-brokr mt-3 text-sm/relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: property.description }}
                />
              </section>
            )}

            {(property.amenities ?? []).length > 0 && (
              <section className="mt-8">
                <h2 className="display-title text-xl">Amenities</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(property.amenities ?? []).map((amenity: string) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-border px-3 py-1.5 text-xs"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-20 lg:h-fit">
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
              {property.agent_phone && (
                <a
                  href={`tel:${property.agent_phone}`}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm"
                >
                  <Phone className="h-4 w-4" /> {property.agent_phone}
                </a>
              )}
            </div>
          </aside>
        </div>
      </main>

      <ShareDialog open={share} onOpenChange={setShare} slug={property.slug} title={property.title} />
    </div>
  );
}
