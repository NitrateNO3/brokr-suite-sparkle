import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Phone, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PendingMediaPicker } from "@/components/property/PendingMediaPicker";
import {
  ChipGroup,
  DynamicField,
  FieldShell,
  MoneyInput,
  Section,
  SegmentedControl,
  SuggestInput,
  formatIndian,
} from "@/components/property/post/PostFields";
import { supabase } from "@/integrations/supabase/client";
import { uploadToStorage } from "@/lib/storage";
import { friendlyError } from "@/lib/errors";
import { generatePropertyCode, slugify } from "@/lib/format";
import { CITIES, GURGAON_SECTORS, INDIAN_STATES, PRIVATE_COLONIES } from "@/lib/constants";
import { useLocationsFullQuery } from "@/lib/locations";
import { useCreateProperty } from "@/lib/queries";
import {
  DB_FIELD_KEYS,
  INTEGER_KEYS,
  LISTING_PURPOSES,
  NUMERIC_KEYS,
  PROPERTY_TYPE_CATALOGUE,
  amenitySetFor,
  detailFields,
  featureFields,
  findType,
  pricingFields,
  societiesFor,
  type FieldSpec,
  type ListingPurpose,
} from "@/lib/property-schema";

const POSTER_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "agent", label: "Agent" },
  { value: "builder", label: "Builder" },
];

/**
 * Magicbricks-style, schema-driven property posting flow.
 * Every field group is derived from the selected listing purpose + property type,
 * so the form only ever asks what is relevant.
 */
export function PostPropertyForm() {
  const navigate = useNavigate();
  const create = useCreateProperty();
  const { data: locations } = useLocationsFullQuery();

  // contact
  const [role, setRole] = useState("agent");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  // core selection
  const [purpose, setPurpose] = useState<ListingPurpose | "">("");
  const [typeValue, setTypeValue] = useState("");

  // location
  const [stateName, setStateName] = useState("Haryana");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [society, setSociety] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pin, setPin] = useState("");

  // dynamic values
  const [values, setValues] = useState<Record<string, string>>({});
  const [areaUnit, setAreaUnit] = useState("sqft");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityTerm, setAmenityTerm] = useState("");
  const [description, setDescription] = useState("");

  // media + preferences
  const [files, setFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [youtube, setYoutube] = useState("");
  const [exclusive, setExclusive] = useState(true);
  const [whatsapp, setWhatsapp] = useState(true);
  const [agreed, setAgreed] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const typeSpec = useMemo(() => findType(typeValue), [typeValue]);
  const category = typeSpec?.category ?? "other";

  const features = useMemo(() => (typeSpec ? featureFields(category) : []), [typeSpec, category]);
  const details = useMemo(() => (typeSpec ? detailFields(category) : []), [typeSpec, category]);
  const pricing = useMemo(() => (purpose ? pricingFields(purpose) : []), [purpose]);
  const amenityOptions = useMemo(() => amenitySetFor(category), [category]);

  const cityOptions = useMemo(() => {
    const fromDb = (locations ?? []).map((l) => l.city);
    return Array.from(new Set([...CITIES, ...fromDb])).filter(Boolean) as string[];
  }, [locations]);

  const localityOptions = useMemo(() => {
    const rows = (locations ?? []).filter((l) => !city || l.city === city);
    const dbSectors = rows.flatMap((l) => [l.sector, l.area, l.sub_sector].filter(Boolean) as string[]);
    const sectors = GURGAON_SECTORS.map((s) => `Sector ${s}`);
    const colonies = [...PRIVATE_COLONIES];
    return Array.from(new Set([...sectors, ...colonies, ...dbSectors]));
  }, [locations, city]);

  const societyOptions = useMemo(() => societiesFor(city, locality), [city, locality]);

  const set = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  /** Drop values that no longer belong to the current property type, keep compatible ones. */
  const changeType = (next: string) => {
    setTypeValue(next);
    const spec = findType(next);
    if (!spec) return;
    const allowed = new Set([
      ...featureFields(spec.category).map((f) => f.key),
      ...detailFields(spec.category).map((f) => f.key),
      ...(purpose ? pricingFields(purpose).map((f) => f.key) : []),
    ]);
    setValues((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => allowed.has(k))),
    );
    setErrors({});
  };

  const changePurpose = (next: string) => {
    setPurpose(next as ListingPurpose);
    setErrors({});
  };

  const areaFor = (key: string) => Number(values[key] ?? "") || null;
  const pricePerSqft = useMemo(() => {
    const price = Number(values["price"] ?? "");
    const area = areaFor("builtup_area") ?? areaFor("carpet_area") ?? areaFor("super_area");
    if (!price || !area) return null;
    return Math.round(price / area);
  }, [values]);

  const typeLabel = typeSpec?.label ?? "Property";
  const title = useMemo(() => {
    const bhk = values["bedrooms"] ? `${values["bedrooms"]} BHK ` : "";
    const where = [society, locality, city].filter(Boolean).join(", ");
    return `${bhk}${typeLabel}${where ? ` in ${where}` : ""}`.trim();
  }, [values, society, locality, city, typeLabel]);

  const activeFields: FieldSpec[] = [...features, ...details, ...pricing];

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next["name"] = "Name is required";
    if (!/^\d{10}$/.test(mobile.trim())) next["mobile"] = "Enter a valid 10-digit mobile number";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next["email"] = "Enter a valid email address";
    if (!purpose) next["purpose"] = "Choose what this listing is for";
    if (!stateName.trim()) next["state"] = "State is required";
    if (!typeValue) next["type"] = "Select a property type";
    if (!city.trim()) next["city"] = "City is required";
    if (!locality.trim()) next["locality"] = "Locality is required";
    activeFields.forEach((f) => {
      if (f.required && !values[f.key]) next[f.key] = `${f.label} is required`;
    });
    if (!agreed) next["agreed"] = "Please accept the terms";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildDescription = () => {
    const extras = activeFields
      .filter((f) => !DB_FIELD_KEYS.has(f.key) && values[f.key])
      .map((f) => {
        const raw = values[f.key]!;
        const label =
          f.options?.find((o) => o.value === raw)?.label ??
          raw
            .split(",")
            .map((v) => f.options?.find((o) => o.value === v)?.label ?? v)
            .join(", ");
        return `- ${f.label}: ${label}${f.suffix ? ` ${f.suffix}` : ""}`;
      });
    const meta = [`Posted by ${role}${name.trim() ? ` — ${name.trim()}` : ""}`];
    return [description.trim(), extras.length ? `Additional details:\n${extras.join("\n")}` : "", meta.join("")]
      .filter(Boolean)
      .join("\n\n");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      toast.error("Please complete the highlighted fields");
      return;
    }
    const code = generatePropertyCode();
    const dbPurpose = purpose === "sale" ? "sale" : purpose === "pg" ? "rent" : "rent";

    const payload: Record<string, unknown> = {
      title,
      property_code: code,
      slug: `${slugify(title)}-${code.toLowerCase()}`,
      property_type: typeSpec!.dbType,
      purpose: dbPurpose,
      status: "draft",
      price: Number(values["price"] ?? 0) || 0,
      negotiable: values["negotiable"] === "true",
      city: city.trim(),
      sector: locality.trim(),
      builder: society.trim() || null,
      address: [address.trim(), stateName.trim()].filter(Boolean).join(", ") || null,
      landmark: landmark.trim() || null,
      pin_code: pin.trim() || null,
      area_unit: areaUnit,
      amenities,
      description: buildDescription(),
      youtube_url: youtube.trim() || null,
      agent_name: name.trim() || null,
      agent_phone: mobile.trim() || null,
      agent_whatsapp: whatsapp ? mobile.trim() || null : null,
      agent_email: email.trim() || null,
      is_exclusive: exclusive,
      meta_title: title,
    };

    activeFields.forEach((f) => {
      if (!DB_FIELD_KEYS.has(f.key)) return;
      const raw = values[f.key];
      if (!raw) return;
      if (INTEGER_KEYS.has(f.key)) payload[f.key] = parseInt(raw, 10);
      else if (NUMERIC_KEYS.has(f.key)) payload[f.key] = Number(raw);
      else if (f.key === "negotiable") payload[f.key] = raw === "true";
      else payload[f.key] = raw;
    });
    if (values["age"] && !["available", "approved", "under_development"].includes(values["age"])) {
      payload["age"] = values["age"];
    } else {
      delete payload["age"];
    }

    setBusy(true);
    try {
      const created = await create.mutateAsync(payload as never);

      if (files.length) {
        let cover: string | null = null;
        for (let i = 0; i < files.length; i += 1) {
          const url = await uploadToStorage(files[i]!, created.id);
          await supabase.from("property_images").insert({
            property_id: created.id,
            url,
            alt: title,
            sort_order: i,
            is_featured: i === coverIndex,
          });
          if (i === coverIndex) cover = url;
        }
        if (cover) {
          await supabase.from("properties").update({ cover_image: cover }).eq("id", created.id);
        }
      }

      toast.success("Property posted — review pricing and publish next");
      navigate({ to: "/properties/$id/edit", params: { id: created.id } });
    } catch (error) {
      toast.error(friendlyError(error, "Could not post the property"));
    } finally {
      setBusy(false);
    }
  };

  const grid = "grid gap-x-5 gap-y-5 sm:grid-cols-2";
  const ready = Boolean(purpose && typeValue);

  const filteredAmenities = amenityOptions.filter((a) =>
    a.toLowerCase().includes(amenityTerm.trim().toLowerCase()),
  );

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[600px] pb-28">
      <header className="mb-8">
        <h1 className="display-title text-2xl font-bold">Post your property</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer only what matters — the form adapts to the property you choose.
        </p>
      </header>

      <div className="space-y-8">
        <Section step={1} title="Contact Details">
          <FieldShell label="I am">
            <ChipGroup options={POSTER_ROLES} value={role} onChange={(v) => setRole(v || "agent")} />
          </FieldShell>
          <div className={grid}>
            <FieldShell label="Name" required error={errors["name"]}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-10" />
            </FieldShell>
            <FieldShell label="Mobile" required error={errors["mobile"]}>
              <div className="flex items-center gap-2">
                <span className="flex h-10 shrink-0 items-center gap-1 rounded-md border border-input px-2.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /> +91
                </span>
                <Input
                  value={mobile}
                  inputMode="numeric"
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit number"
                  className="h-10"
                />
              </div>
            </FieldShell>
            <FieldShell label="Email" required error={errors["email"]} className="sm:col-span-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                className="h-10"
              />
            </FieldShell>
          </div>
        </Section>

        <Section step={2} title="Property Details" hint="This drives the rest of the form.">
          <FieldShell label="For" required error={errors["purpose"]}>
            <SegmentedControl options={LISTING_PURPOSES} value={purpose} onChange={changePurpose} />
          </FieldShell>

          {purpose ? (
            <FieldShell label="Property Type" required error={errors["type"]}>
              <Select value={typeValue} onValueChange={changeType}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {(["Residential", "Commercial", "Other"] as const).map((group) => (
                    <SelectGroup key={group}>
                      <SelectLabel>{group}</SelectLabel>
                      {PROPERTY_TYPE_CATALOGUE.filter((t) => t.group === group).map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
          ) : null}
        </Section>

        {ready ? (
          <>
            <Section step={3} title="Property Location" hint="City → Locality → Society → Address">
              <div className={grid}>
                <FieldShell label="State" required error={errors["state"]}>
                  <Select value={stateName} onValueChange={setStateName}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {INDIAN_STATES.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldShell>
                <FieldShell label="City" required error={errors["city"]}>
                  <SuggestInput
                    id="city"
                    value={city}
                    onChange={(v) => {
                      setCity(v);
                      setSociety("");
                    }}
                    suggestions={cityOptions}
                    placeholder="e.g. Gurgaon"
                  />
                </FieldShell>
                <FieldShell label="Locality / Sector" required error={errors["locality"]}>
                  <SuggestInput
                    id="locality"
                    value={locality}
                    onChange={(v) => {
                      setLocality(v);
                      setSociety("");
                    }}
                    suggestions={localityOptions}
                    placeholder="e.g. Sector 54"
                  />
                </FieldShell>
                <FieldShell label="Society / Project" className="sm:col-span-2">
                  <SuggestInput
                    id="society"
                    value={society}
                    onChange={setSociety}
                    suggestions={societyOptions}
                    placeholder={
                      societyOptions.length ? "Start typing or pick a known project" : "e.g. DLF Park Place"
                    }
                  />
                  {societyOptions.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {societyOptions.slice(0, 5).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSociety(s)}
                          className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </FieldShell>
                <FieldShell label="Address" className="sm:col-span-2">
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-10" placeholder="House / tower / street" />
                </FieldShell>
                <FieldShell label="Landmark">
                  <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} className="h-10" />
                </FieldShell>
                <FieldShell label="Pincode">
                  <Input
                    value={pin}
                    inputMode="numeric"
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-10"
                  />
                </FieldShell>
              </div>
            </Section>

            {features.length ? (
              <Section step={4} title="Property Features">
                <div className={grid}>
                  {features.map((f) => (
                    <DynamicField
                      key={f.key}
                      field={f}
                      value={values[f.key] ?? ""}
                      areaUnit={areaUnit}
                      onChange={(v) => set(f.key, v)}
                      onAreaUnit={setAreaUnit}
                      error={errors[f.key]}
                    />
                  ))}
                </div>
              </Section>
            ) : null}

            <Section step={5} title={`${typeLabel} Details`}>
              <div className={grid}>
                {details.map((f) => (
                  <DynamicField
                    key={f.key}
                    field={f}
                    value={values[f.key] ?? ""}
                    areaUnit={areaUnit}
                    onChange={(v) => set(f.key, v)}
                    onAreaUnit={setAreaUnit}
                    error={errors[f.key]}
                  />
                ))}
              </div>
            </Section>

            <Section step={6} title="Pricing Details">
              <div className={grid}>
                {pricing.map((f) => (
                  <DynamicField
                    key={f.key}
                    field={f}
                    value={values[f.key] ?? ""}
                    areaUnit={areaUnit}
                    onChange={(v) => set(f.key, v)}
                    onAreaUnit={setAreaUnit}
                    error={errors[f.key]}
                  />
                ))}
              </div>
              {pricePerSqft ? (
                <p className="text-xs text-muted-foreground">
                  Approx. <span className="font-medium text-foreground">₹ {formatIndian(String(pricePerSqft))}</span> per unit area
                </p>
              ) : null}
            </Section>

            <Section step={7} title="Amenities">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={amenityTerm}
                  onChange={(e) => setAmenityTerm(e.target.value)}
                  placeholder="Search amenities"
                  className="h-10 pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredAmenities.map((a) => {
                  const on = amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setAmenities((prev) => (on ? prev.filter((x) => x !== a) : [...prev, a]))
                      }
                      className={
                        on
                          ? "rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-[13px] font-medium text-primary"
                          : "rounded-full border border-border px-3 py-1.5 text-[13px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section step={8} title="Property Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Highlight the layout, connectivity, view, recent renovations…"
              />
            </Section>

            <Section step={9} title="Photos & Videos">
              <PendingMediaPicker
                files={files}
                onChange={setFiles}
                coverIndex={coverIndex}
                onCoverIndexChange={setCoverIndex}
              />
              <FieldShell label="YouTube / video tour link">
                <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} className="h-10" placeholder="https://youtu.be/…" />
              </FieldShell>
            </Section>

            <Section step={10} title="Contact / Lead Preferences">
              <CheckRow checked={exclusive} onChange={setExclusive}>
                I am posting this property ‘exclusively’ with our agency
              </CheckRow>
              <CheckRow checked={whatsapp} onChange={setWhatsapp}>
                Send buyer / tenant enquiries to my WhatsApp
              </CheckRow>
              <CheckRow checked={agreed} onChange={setAgreed}>
                I agree to the{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setTermsOpen(true);
                  }}
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Terms &amp; Conditions and Privacy Policy
                </button>
              </CheckRow>
              {errors["agreed"] ? <p className="text-xs text-destructive">{errors["agreed"]}</p> : null}
            </Section>

            <Section step={11} title="Preview & Submit">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold">{title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{LISTING_PURPOSES.find((p) => p.value === purpose)?.label}</Badge>
                  {values["price"] ? <Badge variant="secondary">₹ {formatIndian(values["price"])}</Badge> : null}
                  {values["bedrooms"] ? <Badge variant="secondary">{values["bedrooms"]} BHK</Badge> : null}
                  {amenities.length ? <Badge variant="secondary">{amenities.length} amenities</Badge> : null}
                  {files.length ? <Badge variant="secondary">{files.length} photos</Badge> : null}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Saved as a draft — you can publish after reviewing in the editor.
                </p>
              </div>
            </Section>
          </>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[600px] items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            {ready ? "All set? Post to continue with publishing." : "Choose listing purpose and property type"}
          </span>
          <Button type="submit" disabled={!ready || busy} className="px-6">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Post Property
          </Button>
        </div>
      </div>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-bold">Terms &amp; Conditions and Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              By posting a property you confirm that the information provided is accurate and that you
              are authorised to list it — as the owner, an appointed agent or the builder.
            </p>
            <p>
              Listings may be reviewed before publishing. Misleading pricing, duplicate listings or
              photographs you do not own may be removed without notice.
            </p>
            <p>
              Contact details you enter are used only to route buyer and tenant enquiries to you, and
              are shared with a prospect only after they raise an enquiry on this listing.
            </p>
            <p>
              Documents uploaded against a property stay private to your team unless you explicitly
              enable document sharing on a share link.
            </p>
            <p>
              You may request removal of a listing and of your personal data at any time by contacting
              your agency administrator.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}

function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="text-muted-foreground">{children}</span>
    </label>
  );
}

/** Unused export kept for the money helper signature. */
export { MoneyInput };
