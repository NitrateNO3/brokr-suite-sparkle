import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Save, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelectChips } from "@/components/shared/MultiSelectChips";
import { RichTextEditor } from "@/components/property/RichTextEditor";
import { MediaManager } from "@/components/property/MediaManager";
import { PendingMediaPicker } from "@/components/property/PendingMediaPicker";
import { supabase } from "@/integrations/supabase/client";
import { uploadToStorage } from "@/lib/storage";
import {
  AMENITY_LIST,
  AREA_UNITS,
  CITIES,
  FACINGS,
  FURNISHINGS,
  GURGAON_SECTORS,
  PROPERTY_AGES,
  PROPERTY_FLAGS,
  PROPERTY_TYPES,
  PURPOSES,
  STATUSES,
} from "@/lib/constants";
import { generatePropertyCode, slugify } from "@/lib/format";
import { useCreateProperty, useUpdateProperty, type Property } from "@/lib/queries";


const schema = z.object({
  title: z.string().min(4, "Give the listing a descriptive title"),
  property_code: z.string().min(3),
  slug: z.string().min(3),
  property_type: z.string(),
  purpose: z.string(),
  status: z.string(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0),
  negotiable: z.boolean(),
  maintenance_charges: z.coerce.number().optional().nullable(),
  booking_amount: z.coerce.number().optional().nullable(),
  security_deposit: z.coerce.number().optional().nullable(),
  city: z.string(),
  sector: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  pin_code: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  maps_url: z.string().optional().nullable(),
  bedrooms: z.coerce.number().optional().nullable(),
  bathrooms: z.coerce.number().optional().nullable(),
  balconies: z.coerce.number().optional().nullable(),
  parking: z.coerce.number().optional().nullable(),
  floor_no: z.coerce.number().optional().nullable(),
  total_floors: z.coerce.number().optional().nullable(),
  facing: z.string().optional().nullable(),
  area_unit: z.string(),
  carpet_area: z.coerce.number().optional().nullable(),
  builtup_area: z.coerce.number().optional().nullable(),
  super_area: z.coerce.number().optional().nullable(),
  age: z.string().optional().nullable(),
  furnishing: z.string().optional().nullable(),
  amenities: z.array(z.string()),
  cover_image: z.string().optional().nullable(),
  youtube_url: z.string().optional().nullable(),
  virtual_tour_url: z.string().optional().nullable(),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  is_published: z.boolean(),
  is_featured: z.boolean(),
  is_verified: z.boolean(),
  is_premium: z.boolean(),
  is_hot: z.boolean(),
  is_exclusive: z.boolean(),
  agent_name: z.string().optional().nullable(),
  agent_phone: z.string().optional().nullable(),
  agent_whatsapp: z.string().optional().nullable(),
  agent_email: z.string().optional().nullable(),
  agent_office: z.string().optional().nullable(),
});

export type PropertyFormValues = z.infer<typeof schema>;

const DRAFT_KEY = "brokrsuite-property-draft";

function defaults(property?: Property | null): PropertyFormValues {
  return {
    title: property?.title ?? "",
    property_code: property?.property_code ?? generatePropertyCode(),
    slug: property?.slug ?? "",
    property_type: property?.property_type ?? "apartment",
    purpose: property?.purpose ?? "sale",
    status: property?.status ?? "draft",
    description: property?.description ?? "",
    price: property?.price ?? 0,
    negotiable: property?.negotiable ?? false,
    maintenance_charges: property?.maintenance_charges ?? null,
    booking_amount: property?.booking_amount ?? null,
    security_deposit: property?.security_deposit ?? null,
    city: property?.city ?? "Gurgaon",
    sector: property?.sector ?? "",
    address: property?.address ?? "",
    landmark: property?.landmark ?? "",
    pin_code: property?.pin_code ?? "",
    latitude: property?.latitude ?? null,
    longitude: property?.longitude ?? null,
    maps_url: property?.maps_url ?? "",
    bedrooms: property?.bedrooms ?? null,
    bathrooms: property?.bathrooms ?? null,
    balconies: property?.balconies ?? null,
    parking: property?.parking ?? null,
    floor_no: property?.floor_no ?? null,
    total_floors: property?.total_floors ?? null,
    facing: property?.facing ?? null,
    area_unit: property?.area_unit ?? "sqft",
    carpet_area: property?.carpet_area ?? null,
    builtup_area: property?.builtup_area ?? null,
    super_area: property?.super_area ?? null,
    age: property?.age ?? null,
    furnishing: property?.furnishing ?? null,
    amenities: property?.amenities ?? [],
    cover_image: property?.cover_image ?? "",
    youtube_url: property?.youtube_url ?? "",
    virtual_tour_url: property?.virtual_tour_url ?? "",
    meta_title: property?.meta_title ?? "",
    meta_description: property?.meta_description ?? "",
    keywords: property?.keywords ?? "",
    is_published: property?.is_published ?? false,
    is_featured: property?.is_featured ?? false,
    is_verified: property?.is_verified ?? false,
    is_premium: property?.is_premium ?? false,
    is_hot: property?.is_hot ?? false,
    is_exclusive: property?.is_exclusive ?? false,
    agent_name: property?.agent_name ?? "Deepak Yadav",
    agent_phone: property?.agent_phone ?? "+91 98110 45678",
    agent_whatsapp: property?.agent_whatsapp ?? "+91 98110 45678",
    agent_email: property?.agent_email ?? "hello@deeprealestate.in",
    agent_office: property?.agent_office ?? "Sector 48, Sohna Road, Gurgaon",
  };
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PropertyForm({ property }: { property?: Property | null }) {
  const navigate = useNavigate();
  const create = useCreateProperty();
  const update = useUpdateProperty();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploading, setUploading] = useState(false);


  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(property),
  });

  const { register, handleSubmit, watch, setValue, formState } = form;
  const values = watch();

  // Auto-save draft locally for new listings so nothing is lost on refresh.
  useEffect(() => {
    if (property) return;
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      setSavedAt(new Date().toLocaleTimeString());
    }, 1500);
    return () => clearTimeout(timer);
  }, [values, property]);

  useEffect(() => {
    if (property) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      form.reset({ ...defaults(null), ...JSON.parse(raw) });
    } catch {
      /* ignore malformed drafts */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoSlug = useCallback(() => {
    const generated = slugify(values.title || "");
    setValue("slug", generated, { shouldDirty: true });
    if (!values.meta_title) setValue("meta_title", values.title);
  }, [values.title, values.meta_title, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    const payload = {
      ...data,
      slug: data.slug || slugify(data.title),
      meta_title: data.meta_title || data.title,
      sector: data.sector || null,
      facing: (data.facing || null) as never,
      age: (data.age || null) as never,
      furnishing: (data.furnishing || null) as never,
      property_type: data.property_type as never,
      purpose: data.purpose as never,
      status: data.status as never,
      area_unit: data.area_unit as never,
    };
    try {
      if (property) {
        await update.mutateAsync({ id: property.id, values: payload as never });
        toast.success("Listing updated");
      } else {
        const created = await create.mutateAsync(payload as never);

        // Upload any images staged before the listing existed.
        if (pendingFiles.length) {
          setUploading(true);
          let cover: string | null = null;
          try {
            for (let i = 0; i < pendingFiles.length; i += 1) {
              const url = await uploadToStorage(pendingFiles[i]!, created.id);
              await supabase.from("property_images").insert({
                property_id: created.id,
                url,
                sort_order: i,
                is_featured: i === coverIndex,
              });
              if (i === coverIndex) cover = url;
            }
            if (cover) {
              await supabase.from("properties").update({ cover_image: cover }).eq("id", created.id);
            }
            toast.success(`${pendingFiles.length} file(s) uploaded`);
          } catch (uploadError) {
            toast.error(
              uploadError instanceof Error ? uploadError.message : "Some media failed to upload",
            );
          } finally {
            setUploading(false);
            setPendingFiles([]);
          }
        }

        localStorage.removeItem(DRAFT_KEY);
        toast.success("Listing created");
        navigate({ to: "/properties/$id/edit", params: { id: created.id } });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the listing");
    }
  });

  const pending = create.isPending || update.isPending || uploading;
  const sectorOptions = values.city === "Gurgaon" ? GURGAON_SECTORS : [];


  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <p className="font-medium">
            {property ? property.property_code : values.property_code}
          </p>
          <p className="text-xs text-muted-foreground">
            {savedAt ? `Draft auto-saved at ${savedAt}` : "Changes are auto-saved locally"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={values.is_published}
              onCheckedChange={(v) => setValue("is_published", v, { shouldDirty: true })}
              id="published"
            />
            <Label htmlFor="published" className="text-sm">
              Published
            </Label>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {property ? "Save changes" : "Create listing"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basics">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="seo">SEO &amp; Flags</TabsTrigger>
          <TabsTrigger value="agent">Agent</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="surface mt-4 space-y-5 p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Property title">
              <Input {...register("title")} placeholder="Luxury 4BHK Villa in Sector 56" />
              {formState.errors.title && (
                <p className="text-xs text-destructive">{formState.errors.title.message}</p>
              )}
            </Field>
            <Field label="Property ID">
              <Input {...register("property_code")} readOnly className="bg-muted/60" />
            </Field>
            <Field label="Slug" hint="Used for the public URL /property/…">
              <div className="flex gap-2">
                <Input {...register("slug")} placeholder="luxury-4bhk-villa-sector-56" />
                <Button type="button" variant="secondary" onClick={autoSlug}>
                  <Wand2 className="h-4 w-4" /> Auto
                </Button>
              </div>
            </Field>
            <Field label="Property type">
              <Select
                value={values.property_type}
                onValueChange={(v) => setValue("property_type", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Purpose">
              <Select
                value={values.purpose}
                onValueChange={(v) => setValue("purpose", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={values.status}
                onValueChange={(v) => setValue("status", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <RichTextEditor
              value={values.description ?? ""}
              onChange={(html) => setValue("description", html, { shouldDirty: true })}
            />
          </Field>
        </TabsContent>

        <TabsContent value="pricing" className="surface mt-4 grid gap-5 p-5 md:grid-cols-2">
          <Field label="Expected price (₹)">
            <Input type="number" {...register("price")} />
          </Field>
          <div className="flex items-end gap-3 pb-2">
            <Switch
              id="negotiable"
              checked={values.negotiable}
              onCheckedChange={(v) => setValue("negotiable", v, { shouldDirty: true })}
            />
            <Label htmlFor="negotiable">Price is negotiable</Label>
          </div>
          <Field label="Maintenance charges (₹)">
            <Input type="number" {...register("maintenance_charges")} />
          </Field>
          <Field label="Booking amount (₹)">
            <Input type="number" {...register("booking_amount")} />
          </Field>
          <Field label="Security deposit (₹)">
            <Input type="number" {...register("security_deposit")} />
          </Field>
        </TabsContent>

        <TabsContent value="location" className="surface mt-4 grid gap-5 p-5 md:grid-cols-2">
          <Field label="City">
            <Select
              value={values.city}
              onValueChange={(v) => {
                setValue("city", v, { shouldDirty: true });
                setValue("sector", "", { shouldDirty: true });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Sector" hint={sectorOptions.length ? undefined : "Sectors apply to Gurgaon"}>
            <Select
              value={values.sector ?? ""}
              onValueChange={(v) => setValue("sector", v, { shouldDirty: true })}
              disabled={!sectorOptions.length}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {sectorOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    Sector {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Address">
            <Input {...register("address")} />
          </Field>
          <Field label="Landmark">
            <Input {...register("landmark")} />
          </Field>
          <Field label="Pin code">
            <Input {...register("pin_code")} />
          </Field>
          <Field label="Google Maps URL">
            <Input {...register("maps_url")} placeholder="https://maps.google.com/…" />
          </Field>
          <Field label="Latitude">
            <Input type="number" step="any" {...register("latitude")} />
          </Field>
          <Field label="Longitude">
            <Input type="number" step="any" {...register("longitude")} />
          </Field>
        </TabsContent>

        <TabsContent value="details" className="surface mt-4 grid gap-5 p-5 md:grid-cols-3">
          <Field label="Bedrooms">
            <Input type="number" {...register("bedrooms")} />
          </Field>
          <Field label="Bathrooms">
            <Input type="number" {...register("bathrooms")} />
          </Field>
          <Field label="Balconies">
            <Input type="number" {...register("balconies")} />
          </Field>
          <Field label="Parking">
            <Input type="number" {...register("parking")} />
          </Field>
          <Field label="Floor">
            <Input type="number" {...register("floor_no")} />
          </Field>
          <Field label="Total floors">
            <Input type="number" {...register("total_floors")} />
          </Field>
          <Field label="Facing">
            <Select
              value={values.facing ?? ""}
              onValueChange={(v) => setValue("facing", v, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {FACINGS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Area unit">
            <Select
              value={values.area_unit}
              onValueChange={(v) => setValue("area_unit", v, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREA_UNITS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Property age">
            <Select
              value={values.age ?? ""}
              onValueChange={(v) => setValue("age", v, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_AGES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Carpet area">
            <Input type="number" {...register("carpet_area")} />
          </Field>
          <Field label="Built-up area">
            <Input type="number" {...register("builtup_area")} />
          </Field>
          <Field label="Super area">
            <Input type="number" {...register("super_area")} />
          </Field>
          <Field label="Furnishing">
            <Select
              value={values.furnishing ?? ""}
              onValueChange={(v) => setValue("furnishing", v, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {FURNISHINGS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </TabsContent>

        <TabsContent value="amenities" className="surface mt-4 p-5">
          <Field label="Amenities">
            <MultiSelectChips
              options={AMENITY_LIST}
              value={values.amenities}
              onChange={(next) => setValue("amenities", next, { shouldDirty: true })}
              placeholder="Search and select amenities"
            />
          </Field>
        </TabsContent>

        <TabsContent value="media" className="surface mt-4 space-y-5 p-5">
          {property ? (
            <MediaManager
              propertyId={property.id}
              coverImage={values.cover_image ?? null}
              onCoverChange={(url: string) => setValue("cover_image", url, { shouldDirty: true })}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Create the listing first — image, video and document uploads unlock right after.
            </p>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="YouTube link">
              <Input {...register("youtube_url")} placeholder="https://youtube.com/watch?v=…" />
            </Field>
            <Field label="Virtual tour link">
              <Input {...register("virtual_tour_url")} />
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="surface mt-4 space-y-5 p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Meta title">
              <Input {...register("meta_title")} />
            </Field>
            <Field label="Keywords">
              <Input {...register("keywords")} placeholder="villa, sector 56, gurgaon" />
            </Field>
          </div>
          <Field label="Meta description">
            <Textarea rows={3} {...register("meta_description")} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROPERTY_FLAGS.map((flag) => (
              <label
                key={flag.key}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
              >
                <span className="text-sm">{flag.label}</span>
                <Switch
                  checked={Boolean(values[flag.key as keyof PropertyFormValues])}
                  onCheckedChange={(v) =>
                    setValue(flag.key as keyof PropertyFormValues, v as never, {
                      shouldDirty: true,
                    })
                  }
                />
              </label>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agent" className="surface mt-4 grid gap-5 p-5 md:grid-cols-2">
          <Field label="Agent name">
            <Input {...register("agent_name")} />
          </Field>
          <Field label="Phone">
            <Input {...register("agent_phone")} />
          </Field>
          <Field label="WhatsApp">
            <Input {...register("agent_whatsapp")} />
          </Field>
          <Field label="Email">
            <Input {...register("agent_email")} />
          </Field>
          <Field label="Office address">
            <Input {...register("agent_office")} />
          </Field>
        </TabsContent>
      </Tabs>
    </form>
  );
}
