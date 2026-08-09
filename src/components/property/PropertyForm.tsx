import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Rocket,
  Save,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/property/RichTextEditor";
import { MediaManager } from "@/components/property/MediaManager";
import { PendingMediaPicker } from "@/components/property/PendingMediaPicker";
import { SearchableSelect } from "@/components/property/SearchableSelect";
import { ChoiceCard, CATEGORY_CARDS, PURPOSE_CARDS } from "@/components/property/wizard/PurposeCards";
import { AmenityPicker } from "@/components/property/wizard/AmenityPicker";
import { EmiCalculator } from "@/components/property/wizard/EmiCalculator";
import { supabase } from "@/integrations/supabase/client";
import { uploadToStorage } from "@/lib/storage";
import { friendlyError } from "@/lib/errors";
import { isConnected } from "@/lib/native/network";
import { saveDraft } from "@/lib/offline-drafts";
import {
  AREA_UNITS,
  CITIES,
  FACINGS,
  FURNISHINGS,
  GURGAON_SECTORS,
  PROPERTY_AGES,
  PROPERTY_FLAGS,
  PROPERTY_TYPES,
  STATUSES,
  labelFor,
} from "@/lib/constants";
import {
  areaUnitLabel,
  formatPrice,
  generatePropertyCode,
  locationLine,
  pricePerArea,
  slugify,
} from "@/lib/format";
import { useCreateProperty, useUpdateProperty, type Property } from "@/lib/queries";
import { useTeamQuery } from "@/lib/roles";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(4, "Give the listing a descriptive title"),
  property_code: z.string().min(3),
  slug: z.string().min(3, "A URL slug is required"),
  property_type: z.string(),
  purpose: z.string(),
  status: z.string(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  negotiable: z.boolean(),
  maintenance_charges: z.coerce.number().optional().nullable(),
  booking_amount: z.coerce.number().optional().nullable(),
  security_deposit: z.coerce.number().optional().nullable(),
  city: z.string().min(2, "Choose a city"),
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
  builder: z.string().optional().nullable(),
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
  assigned_to: z.string().optional().nullable(),
  agent_name: z.string().optional().nullable(),
  agent_phone: z.string().optional().nullable(),
  agent_whatsapp: z.string().optional().nullable(),
  agent_email: z.string().optional().nullable(),
  agent_office: z.string().optional().nullable(),
  share_show_price: z.boolean(),
  share_show_address: z.boolean(),
  share_show_location: z.boolean(),
  share_show_contact: z.boolean(),
  share_show_description: z.boolean(),
  share_show_amenities: z.boolean(),
  share_show_specs: z.boolean(),
  share_show_documents: z.boolean(),
});

export const SHARE_FIELDS = [
  { key: "share_show_price", label: "Price", hint: "Hide to share without any pricing" },
  { key: "share_show_location", label: "City & sector", hint: "Broad location line" },
  { key: "share_show_address", label: "Exact address", hint: "Street address, map and landmark" },
  { key: "share_show_specs", label: "Specifications", hint: "Beds, baths, area, facing" },
  { key: "share_show_description", label: "Description", hint: "About this property" },
  { key: "share_show_amenities", label: "Amenities", hint: "Amenity chips" },
  { key: "share_show_contact", label: "Agent contact", hint: "Phone number on the page" },
  { key: "share_show_documents", label: "Documents", hint: "Brochures and PDFs" },
] as const;

export type PropertyFormValues = z.infer<typeof schema>;

const DRAFT_KEY = "brokrsuite-property-draft";

const STEPS = [
  { id: "purpose", label: "Property", caption: "What are you listing?" },
  { id: "location", label: "Location", caption: "Where is your property?" },
  { id: "details", label: "Details", caption: "Configuration and highlights" },
  { id: "price", label: "Price", caption: "Ask and charges" },
  { id: "photos", label: "Photos", caption: "Show it beautifully" },
  { id: "publish", label: "Publish", caption: "Preview and go live" },
] as const;

const STEP_FIELDS: Record<number, (keyof PropertyFormValues)[]> = {
  0: ["property_type", "purpose"],
  1: ["city"],
  2: ["title", "slug"],
  3: ["price"],
  4: [],
  5: [],
};


const RESIDENTIAL = ["apartment", "builder_floor", "villa", "independent_house", "penthouse"];
const LAND = ["plot", "farm_house"];
const COMMERCIAL = ["commercial", "retail_shop", "office_space", "warehouse"];

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
    builder: property?.builder ?? "",
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
    assigned_to: property?.assigned_to ?? "",
    agent_name: property?.agent_name ?? "Deepak Yadav",
    agent_phone: property?.agent_phone ?? "+91 98110 45678",
    agent_whatsapp: property?.agent_whatsapp ?? "+91 98110 45678",
    agent_email: property?.agent_email ?? "hello@deeprealestate.in",
    agent_office: property?.agent_office ?? "Sector 48, Sohna Road, Gurgaon",
    share_show_price: property?.share_show_price ?? true,
    share_show_address: property?.share_show_address ?? true,
    share_show_location: property?.share_show_location ?? true,
    share_show_contact: property?.share_show_contact ?? true,
    share_show_description: property?.share_show_description ?? true,
    share_show_amenities: property?.share_show_amenities ?? true,
    share_show_specs: property?.share_show_specs ?? true,
    share_show_documents: property?.share_show_documents ?? false,
  };
}

function Field({
  label,
  children,
  hint,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string | undefined;
  error?: string | undefined;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function StepShell({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className="surface animate-fade-in space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h2 className="display-title text-xl md:text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <div className={className}>{children}</div>
    </section>
  );
}

export function PropertyForm({ property }: { property?: Property | null }) {
  const navigate = useNavigate();
  const create = useCreateProperty();
  const update = useUpdateProperty();
  const { data: team } = useTeamQuery();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(0);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(property),
    mode: "onChange",
  });

  const { register, watch, setValue, trigger, getValues, formState } = form;
  const values = watch();
  const errors = formState.errors;

  // Autosave the in-progress listing locally so a refresh never loses work.
  useEffect(() => {
    if (property) return;
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      setSavedAt(new Date().toLocaleTimeString());
    }, 1200);
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

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!formState.isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [formState.isDirty]);

  const autoSlug = useCallback(() => {
    setValue("slug", slugify(values.title || ""), { shouldDirty: true });
    if (!values.meta_title) setValue("meta_title", values.title);
  }, [values.title, values.meta_title, setValue]);

  useEffect(() => {
    if (property || formState.dirtyFields.slug) return;
    setValue("slug", slugify(values.title || ""));
  }, [values.title, property, formState.dirtyFields.slug, setValue]);

  const type = values.property_type;
  const isLand = LAND.includes(type);
  const isResidential = RESIDENTIAL.includes(type);
  const isCommercial = COMMERCIAL.includes(type);

  const sectorOptions = useMemo(
    () =>
      values.city === "Gurgaon"
        ? GURGAON_SECTORS.map((s) => ({ value: s, label: `Sector ${s}` }))
        : [],
    [values.city],
  );

  const completion = useMemo(() => {
    const checks = [
      Boolean(values.title && values.title.length > 3),
      Boolean(values.slug),
      Number(values.price) > 0,
      Boolean(values.city),
      Boolean(values.address || values.sector),
      Boolean(values.super_area || values.builtup_area || values.carpet_area),
      (values.amenities ?? []).length > 0,
      Boolean(values.cover_image || pendingFiles.length),
      Boolean(values.meta_description),
      Boolean(values.agent_phone),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [values, pendingFiles.length]);

  const publicUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/property/${values.slug || ""}`;
  }, [values.slug]);

  const mapSrc = useMemo(() => {
    if (values.latitude && values.longitude) {
      return `https://www.google.com/maps?q=${values.latitude},${values.longitude}&z=15&output=embed`;
    }
    const query = [values.address, values.sector, values.city, values.pin_code]
      .filter(Boolean)
      .join(", ");
    return query
      ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`
      : null;
  }, [values.latitude, values.longitude, values.address, values.sector, values.city, values.pin_code]);

  const persist = async (overrides: Partial<PropertyFormValues> = {}) => {
    const valid = await trigger();
    if (!valid) {
      toast.error("Please fix the highlighted fields");
      const firstBad = Object.keys(form.formState.errors)[0];
      const target = STEPS.findIndex((_, index) =>
        (STEP_FIELDS[index] ?? []).includes(firstBad as keyof PropertyFormValues),
      );
      if (target >= 0) setStep(target);
      return;
    }
    const data = { ...getValues(), ...overrides };
    const payload = {
      ...data,
      slug: data.slug || slugify(data.title),
      meta_title: data.meta_title || data.title,
      sector: data.sector || null,
      builder: data.builder || null,
      assigned_to: data.assigned_to || null,
      facing: (data.facing || null) as never,
      age: (data.age || null) as never,
      furnishing: (data.furnishing || null) as never,
      property_type: data.property_type as never,
      purpose: data.purpose as never,
      status: data.status as never,
      area_unit: data.area_unit as never,
    };

    if (!(await isConnected())) {
      await saveDraft({ propertyId: property?.id ?? null, values: payload as never });
      toast.success("Saved offline — this listing syncs automatically once you're back online");
      return;
    }

    try {
      if (property) {
        await update.mutateAsync({ id: property.id, values: payload as never });
        form.reset(data);
        toast.success(overrides.is_published ? "Listing published" : "Listing saved");
      } else {
        const created = await create.mutateAsync(payload as never);

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
            toast.error(friendlyError(uploadError, "Some media failed to upload"));
          } finally {
            setUploading(false);
            setPendingFiles([]);
          }
        }

        localStorage.removeItem(DRAFT_KEY);
        form.reset(data);
        toast.success(overrides.is_published ? "Listing published" : "Listing created");
        navigate({ to: "/properties/$id/edit", params: { id: created.id } });
      }
    } catch (error) {
      toast.error(friendlyError(error, "Could not save the listing"));
    }
  };

  const goTo = (index: number) => {
    setStep(Math.min(Math.max(index, 0), STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    const ok = fields.length ? await trigger(fields) : true;
    if (!ok) {
      toast.error("Please complete this step first");
      return;
    }
    goTo(step + 1);
  };

  const pending = create.isPending || update.isPending || uploading;
  const rate = pricePerArea(
    Number(values.price),
    Number(values.super_area ?? values.builtup_area ?? values.carpet_area ?? 0),
    values.area_unit,
  );

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Public link copied");
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Sticky header */}
      <div className="glass sticky top-0 z-30 -mx-4 space-y-3 border-b px-4 py-3 md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Back to inventory"
            onClick={() => navigate({ to: "/properties" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {values.title || "New listing"}
              <Badge variant="secondary" className="ml-2 align-middle text-[10px]">
                {property ? property.property_code : values.property_code}
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length} · {STEPS[step]!.label} ·{" "}
              {savedAt ? `auto-saved ${savedAt}` : "auto-saving locally"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-primary sm:inline">
              {completion}%
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => void persist()} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">Save draft</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => goTo(9)}
            >
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => void persist({ is_published: true, status: "available" })}
            >
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Publish</span>
            </Button>
          </div>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((s, index) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(index)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all",
                index === step
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : index < step
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted",
              )}
            >
              {index < step ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="text-[10px] font-semibold">{index + 1}</span>
              )}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1 — Purpose & category */}
      {step === 0 && (
        <StepShell
          title="What are you listing?"
          description="Pick the purpose and the category — the rest of the wizard adapts to your choice."
          className="space-y-8"
        >
          <div className="space-y-3">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Purpose
            </Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {PURPOSE_CARDS.map((item) => (
                <ChoiceCard
                  key={item.value}
                  label={item.label}
                  hint={item.hint}
                  icon={item.icon}
                  selected={values.purpose === item.value}
                  onSelect={() => setValue("purpose", item.value, { shouldDirty: true })}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Property category
            </Label>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {CATEGORY_CARDS.map((item) => (
                <ChoiceCard
                  key={item.value}
                  label={item.label}
                  icon={item.icon}
                  selected={values.property_type === item.value}
                  onSelect={() => setValue("property_type", item.value, { shouldDirty: true })}
                />
              ))}
            </div>
          </div>
        </StepShell>
      )}

      {/* Step 2 — Basic details */}
      {step === 1 && (
        <StepShell
          title="Basic details"
          description="Name the property and tell its story. The code and URL are generated for you."
          className="space-y-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Property name" error={errors.title?.message}>
              <Input
                {...register("title")}
                className="h-11"
                placeholder="Luxury 4BHK Villa in Sector 56"
              />
            </Field>
            <Field label="Property ID" hint="Generated automatically">
              <Input {...register("property_code")} readOnly className="h-11 bg-muted/60" />
            </Field>
            <Field
              label="Public URL slug"
              hint="Used for /property/…"
              error={errors.slug?.message}
            >
              <div className="flex gap-2">
                <Input {...register("slug")} className="h-11" placeholder="luxury-4bhk-villa-sector-56" />
                <Button type="button" variant="secondary" className="h-11" onClick={autoSlug}>
                  <Wand2 className="h-4 w-4" /> Auto
                </Button>
              </div>
            </Field>
            <Field label="Builder / project name" hint="Optional — shown on the public page">
              <Input {...register("builder")} className="h-11" placeholder="DLF, M3M, Godrej…" />
            </Field>
            <Field label="Property age / possession">
              <SearchableSelect
                options={PROPERTY_AGES}
                value={values.age ?? ""}
                clearable
                onChange={(v) => setValue("age", v, { shouldDirty: true })}
              />
            </Field>
            <Field label="Listing status">
              <SearchableSelect
                options={STATUSES}
                value={values.status}
                onChange={(v) => setValue("status", v, { shouldDirty: true })}
              />
            </Field>
          </div>
          <Field label="Description & highlights" hint="Lead with what makes this property special.">
            <RichTextEditor
              value={values.description ?? ""}
              onChange={(html) => setValue("description", html, { shouldDirty: true })}
            />
          </Field>
        </StepShell>
      )}

      {/* Step 3 — Location */}
      {step === 2 && (
        <StepShell
          title="Location"
          description="Add the address — the live map preview updates as you type."
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City" error={errors.city?.message}>
              <SearchableSelect
                options={CITIES.map((c) => ({ value: c, label: c }))}
                value={values.city}
                allowCustom
                onChange={(v) => {
                  setValue("city", v, { shouldDirty: true });
                  setValue("sector", "", { shouldDirty: true });
                }}
              />
            </Field>
            <Field
              label="Sector / locality"
              hint={sectorOptions.length ? "Type to search" : "Free text for this city"}
            >
              <SearchableSelect
                options={sectorOptions}
                value={values.sector ?? ""}
                allowCustom
                clearable
                placeholder="Select or type a locality"
                onChange={(v) => setValue("sector", v, { shouldDirty: true })}
              />
            </Field>
            <Field label="Street address" className="sm:col-span-2">
              <Input {...register("address")} className="h-11" placeholder="Tower B, Golf Course Extension Road" />
            </Field>
            <Field label="Nearby landmarks" hint="Metro, schools, hospitals, markets">
              <Input {...register("landmark")} className="h-11" placeholder="500m from Sector 55-56 metro" />
            </Field>
            <Field label="Pin code">
              <Input inputMode="numeric" maxLength={6} className="h-11" {...register("pin_code")} />
            </Field>
            <Field label="Latitude">
              <Input type="number" step="any" className="h-11" {...register("latitude")} />
            </Field>
            <Field label="Longitude">
              <Input type="number" step="any" className="h-11" {...register("longitude")} />
            </Field>
            <Field label="Google Maps URL" className="sm:col-span-2">
              <Input {...register("maps_url")} className="h-11" placeholder="https://maps.google.com/…" />
            </Field>
          </div>
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/40">
              {mapSrc ? (
                <iframe
                  title="Location preview"
                  src={mapSrc}
                  loading="lazy"
                  className="h-72 w-full border-0"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="grid h-72 place-items-center text-center text-sm text-muted-foreground">
                  <span>
                    <MapPin className="mx-auto mb-2 h-6 w-6" />
                    Add an address or coordinates to see the map
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {locationLine(values.city, values.sector)}
            </p>
          </div>
        </StepShell>
      )}

      {/* Step 4 — Pricing */}
      {step === 3 && (
        <StepShell
          title="Pricing"
          description="Set the ask and the associated charges. Buyers see an instant EMI estimate."
          className="space-y-6"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <Field label="Expected price (₹)" error={errors.price?.message}>
                <Input type="number" inputMode="numeric" className="h-12 text-lg" {...register("price")} />
              </Field>
              <p className="mt-2 text-sm font-semibold text-primary">
                {Number(values.price) > 0 ? formatPrice(Number(values.price)) : "—"}
              </p>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <Switch
                  checked={values.negotiable}
                  onCheckedChange={(v) => setValue("negotiable", v, { shouldDirty: true })}
                />
                Negotiable
              </label>
            </div>
            <div className="rounded-2xl border border-border p-5">
              <Field label="Maintenance (₹ / month)">
                <Input type="number" className="h-11" {...register("maintenance_charges")} />
              </Field>
              <div className="mt-4">
                <Field label="Booking / token amount (₹)">
                  <Input type="number" className="h-11" {...register("booking_amount")} />
                </Field>
              </div>
            </div>
            <div className="rounded-2xl border border-border p-5">
              <Field label={values.purpose === "sale" ? "Registration charges (₹)" : "Security deposit (₹)"}>
                <Input type="number" className="h-11" {...register("security_deposit")} />
              </Field>
              <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rate</p>
                <p className="font-semibold">{rate ?? "Add area to compute"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border p-5">
            <p className="mb-4 text-sm font-semibold">EMI calculator</p>
            <EmiCalculator price={Number(values.price) || 0} />
          </div>
        </StepShell>
      )}

      {/* Step 5 — Specifications */}
      {step === 4 && (
        <StepShell
          title="Specifications"
          description={`Only the fields that matter for ${labelFor(PROPERTY_TYPES, values.property_type)} listings.`}
          className="grid gap-5 md:grid-cols-3"
        >
          {isResidential && (
            <>
              <Field label="Bedrooms (BHK)">
                <Input type="number" className="h-11" {...register("bedrooms")} />
              </Field>
              <Field label="Bathrooms">
                <Input type="number" className="h-11" {...register("bathrooms")} />
              </Field>
              <Field label="Balconies">
                <Input type="number" className="h-11" {...register("balconies")} />
              </Field>
            </>
          )}
          {isCommercial && (
            <>
              <Field label="Cabins / rooms">
                <Input type="number" className="h-11" {...register("bedrooms")} />
              </Field>
              <Field label="Washrooms">
                <Input type="number" className="h-11" {...register("bathrooms")} />
              </Field>
            </>
          )}
          {!isLand && (
            <Field label="Car parking">
              <Input type="number" className="h-11" {...register("parking")} />
            </Field>
          )}
          {!isLand && (
            <>
              <Field label="Floor number">
                <Input type="number" className="h-11" {...register("floor_no")} />
              </Field>
              <Field label="Total floors">
                <Input type="number" className="h-11" {...register("total_floors")} />
              </Field>
            </>
          )}
          <Field label="Facing">
            <SearchableSelect
              options={FACINGS}
              value={values.facing ?? ""}
              clearable
              onChange={(v) => setValue("facing", v, { shouldDirty: true })}
            />
          </Field>
          {!isLand && (
            <Field label="Furnishing">
              <SearchableSelect
                options={FURNISHINGS}
                value={values.furnishing ?? ""}
                clearable
                onChange={(v) => setValue("furnishing", v, { shouldDirty: true })}
              />
            </Field>
          )}
          <Field label="Area unit">
            <SearchableSelect
              options={AREA_UNITS}
              value={values.area_unit}
              onChange={(v) => setValue("area_unit", v, { shouldDirty: true })}
            />
          </Field>
          <Field label={isLand ? `Plot area (${areaUnitLabel(values.area_unit)})` : `Carpet area (${areaUnitLabel(values.area_unit)})`}>
            <Input type="number" className="h-11" {...register("carpet_area")} />
          </Field>
          <Field label={`Built-up area (${areaUnitLabel(values.area_unit)})`}>
            <Input type="number" className="h-11" {...register("builtup_area")} />
          </Field>
          <Field label={`Super area (${areaUnitLabel(values.area_unit)})`}>
            <Input type="number" className="h-11" {...register("super_area")} />
          </Field>
        </StepShell>
      )}

      {/* Step 6 — Amenities */}
      {step === 5 && (
        <StepShell
          title="Amenities"
          description="Search or tap the cards. Popular picks appear first."
        >
          <AmenityPicker
            value={values.amenities ?? []}
            onChange={(next) => setValue("amenities", next, { shouldDirty: true })}
          />
        </StepShell>
      )}

      {/* Step 7 — Photos & videos */}
      {step === 6 && (
        <StepShell
          title="Photos & videos"
          description="Drag & drop images, reorder them and pick a cover. Files are compressed automatically."
          className="space-y-6"
        >
          {property ? (
            <MediaManager
              propertyId={property.id}
              coverImage={values.cover_image ?? null}
              onCoverChange={(url: string) => setValue("cover_image", url, { shouldDirty: true })}
              only={["photos", "floor", "360", "videos"]}
            />
          ) : (
            <PendingMediaPicker
              files={pendingFiles}
              onChange={setPendingFiles}
              coverIndex={coverIndex}
              onCoverIndexChange={setCoverIndex}
            />
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="YouTube link">
              <Input {...register("youtube_url")} className="h-11" placeholder="https://youtube.com/watch?v=…" />
            </Field>
            <Field label="360° / virtual tour link">
              <Input {...register("virtual_tour_url")} className="h-11" placeholder="https://…" />
            </Field>
          </div>
        </StepShell>
      )}

      {/* Step 8 — Documents */}
      {step === 7 && (
        <StepShell
          title="Documents"
          description="Registry, RERA, NOC, tax receipts, brochures and floor plans — stored privately."
          className="space-y-4"
        >
          {property ? (
            <MediaManager
              propertyId={property.id}
              coverImage={values.cover_image ?? null}
              onCoverChange={(url: string) => setValue("cover_image", url, { shouldDirty: true })}
              only={["docs"]}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Save the listing first to attach documents</p>
              <p className="mb-4 text-xs text-muted-foreground">
                Documents are linked to the saved property record.
              </p>
              <Button type="button" variant="outline" onClick={() => void persist()} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save draft now
              </Button>
            </div>
          )}
        </StepShell>
      )}

      {/* Step 9 — SEO & sharing */}
      {step === 8 && (
        <div className="space-y-6">
          <StepShell
            title="SEO & discoverability"
            description="How this listing appears on Google and in link previews."
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Meta title" hint="Defaults to the listing title">
                <Input {...register("meta_title")} className="h-11" />
              </Field>
              <Field label="Keywords">
                <Input {...register("keywords")} className="h-11" placeholder="villa, sector 56, gurgaon" />
              </Field>
            </div>
            <Field label="Meta description">
              <Textarea rows={3} {...register("meta_description")} />
            </Field>
            <Field label="Open Graph image" hint="Uses the cover photo of this listing">
              <Input {...register("cover_image")} className="h-11" placeholder="https://…" />
            </Field>
          </StepShell>

          <StepShell
            title="Share link & QR"
            description="Give clients a scannable link the moment the listing is published."
            className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input readOnly value={publicUrl} className="h-11 text-xs" aria-label="Public link" />
                <Button type="button" variant="secondary" className="h-11" onClick={() => void copyLink()}>
                  <Copy className="h-4 w-4" /> Copy
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {SHARE_FIELDS.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border px-4 py-3"
                  >
                    <span>
                      <span className="text-sm font-medium">{field.label}</span>
                      <span className="block text-xs text-muted-foreground">{field.hint}</span>
                    </span>
                    <Switch
                      checked={Boolean(values[field.key])}
                      onCheckedChange={(v) => setValue(field.key, v, { shouldDirty: true })}
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="justify-self-center rounded-2xl border border-border bg-background p-4">
              <QRCodeCanvas value={publicUrl} size={148} includeMargin />
            </div>
          </StepShell>

          <StepShell
            title="Listing badges & owner"
            description="Highlight the listing and assign the responsible teammate."
            className="space-y-5"
          >
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
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Assigned teammate">
                <SearchableSelect
                  options={(team ?? []).map((member) => ({
                    value: member.id,
                    label: member.full_name ?? member.email ?? "Teammate",
                  }))}
                  value={values.assigned_to ?? ""}
                  clearable
                  placeholder="Unassigned"
                  onChange={(v) => setValue("assigned_to", v, { shouldDirty: true })}
                />
              </Field>
              <Field label="Agent name">
                <Input {...register("agent_name")} className="h-11" />
              </Field>
              <Field label="Phone">
                <Input {...register("agent_phone")} className="h-11" />
              </Field>
              <Field label="WhatsApp">
                <Input {...register("agent_whatsapp")} className="h-11" />
              </Field>
              <Field label="Email">
                <Input type="email" {...register("agent_email")} className="h-11" />
              </Field>
              <Field label="Office address">
                <Input {...register("agent_office")} className="h-11" />
              </Field>
            </div>
          </StepShell>
        </div>
      )}

      {/* Step 10 — Preview & publish */}
      {step === 9 && (
        <div className="space-y-6">
          <div className="surface animate-fade-in overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[320px_minmax(0,1fr)]">
              {values.cover_image ? (
                <img
                  src={values.cover_image}
                  alt={`${values.title || "Listing"} cover`}
                  className="h-56 w-full object-cover md:h-full"
                />
              ) : (
                <div className="grid h-56 place-items-center bg-muted text-xs text-muted-foreground md:h-full">
                  {pendingFiles.length
                    ? `${pendingFiles.length} photo(s) ready to upload`
                    : "No cover photo yet"}
                </div>
              )}
              <div className="space-y-3 p-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {values.property_code} · For {values.purpose} ·{" "}
                  {labelFor(PROPERTY_TYPES, values.property_type)}
                </p>
                <h2 className="display-title text-2xl">{values.title || "Untitled listing"}</h2>
                <p className="text-sm text-muted-foreground">
                  {locationLine(values.city, values.sector)}
                </p>
                <p className="display-title text-2xl text-primary">
                  {values.share_show_price && Number(values.price) > 0
                    ? formatPrice(Number(values.price))
                    : "Price on request"}
                  {rate && <span className="ml-2 text-sm text-muted-foreground">{rate}</span>}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    values.bedrooms ? `${values.bedrooms} Beds` : null,
                    values.bathrooms ? `${values.bathrooms} Baths` : null,
                    values.super_area
                      ? `${values.super_area} ${areaUnitLabel(values.area_unit)}`
                      : null,
                    values.facing ? labelFor(FACINGS, values.facing) : null,
                    values.furnishing ? labelFor(FURNISHINGS, values.furnishing) : null,
                  ]
                    .filter(Boolean)
                    .map((chip) => (
                      <span key={chip as string} className="rounded-full border border-border px-3 py-1">
                        {chip}
                      </span>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(values.amenities ?? []).slice(0, 10).map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {values.agent_name} · {values.agent_phone}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => goTo(1)}>
                    Edit details
                  </Button>
                  {property?.is_published && (
                    <Button type="button" size="sm" variant="outline" asChild>
                      <a href={`/property/${property.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" /> Open public page
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <StepShell
            title="Ready to go live?"
            description="Publishing makes the listing reachable at its public link and in your sitemap."
            className="space-y-4"
          >
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span>
                <span className="text-sm font-medium">Published</span>
                <span className="block text-xs text-muted-foreground">
                  Visible to anyone with the link
                </span>
              </span>
              <Switch
                checked={values.is_published}
                onCheckedChange={(v) => setValue("is_published", v, { shouldDirty: true })}
              />
            </label>
            {completion < 70 && (
              <p className="rounded-xl bg-muted/60 p-4 text-xs text-muted-foreground">
                This listing is {completion}% complete. Adding photos, area and a description
                significantly improves enquiries.
              </p>
            )}
          </StepShell>
        </div>
      )}

      {/* Sticky bottom navigation */}
      <div className="glass sticky bottom-0 z-30 -mx-4 border-t px-4 py-3 md:-mx-6 md:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>
          <Button type="button" variant="ghost" onClick={() => void persist()} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save draft
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="hidden sm:inline-flex"
            onClick={() => goTo(9)}
          >
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => void next()}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={pending}
                onClick={() => void persist({ is_published: true, status: "available" })}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                Publish listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
