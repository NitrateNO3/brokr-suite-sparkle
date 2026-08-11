import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, MessageCircle, Phone, Smartphone, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/errors";
import { generatePropertyCode, slugify } from "@/lib/format";
import { labelFor, PROPERTY_TYPES } from "@/lib/constants";
import { useCreateProperty } from "@/lib/queries";
import { cn } from "@/lib/utils";

const POSTER_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "agent", label: "Agent" },
  { value: "builder", label: "Builder" },
] as const;

const LISTING_FOR = [
  { value: "sale", label: "Sale" },
  { value: "rent", label: "Rent/ Lease" },
  { value: "pg", label: "PG/Hostel" },
] as const;

const RESIDENTIAL_TYPES = [
  "apartment",
  "builder_floor",
  "independent_house",
  "villa",
  "penthouse",
  "farm_house",
  "plot",
];
const COMMERCIAL_TYPES = ["office_space", "retail_shop", "commercial", "warehouse"];

/** Fast single-page "post a property" form modelled on the classic portal flow. */
export function QuickPostForm() {
  const navigate = useNavigate();
  const create = useCreateProperty();

  const [role, setRole] = useState<string>("agent");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [listingFor, setListingFor] = useState<string>("sale");
  const [propertyType, setPropertyType] = useState<string>("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [exclusive, setExclusive] = useState(true);
  const [agreed, setAgreed] = useState(true);
  const [whatsapp, setWhatsapp] = useState(true);

  const typeLabel = useMemo(() => labelFor(PROPERTY_TYPES, propertyType), [propertyType]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!propertyType) return toast.error("Select a property type");
    if (!city.trim()) return toast.error("Enter the city");
    if (!locality.trim()) return toast.error("Enter the locality");
    if (!agreed) return toast.error("Please accept the terms to continue");

    const code = generatePropertyCode();
    const title = `${typeLabel} in ${locality.trim()}, ${city.trim()}`;
    const purpose = listingFor === "sale" ? "sale" : listingFor === "pg" ? "rent" : "rent";

    try {
      const created = await create.mutateAsync({
        title,
        property_code: code,
        slug: `${slugify(title)}-${code.toLowerCase()}`,
        property_type: propertyType as never,
        purpose: purpose as never,
        status: "draft" as never,
        price: 0,
        city: city.trim(),
        sector: locality.trim(),
        area_unit: "sqft" as never,
        agent_name: name.trim() || null,
        agent_phone: mobile.trim() || null,
        agent_whatsapp: whatsapp ? mobile.trim() || null : null,
        agent_email: email.trim() || null,
        is_exclusive: exclusive,
        amenities: [],
        meta_title: title,
      } as never);

      if (name.trim() || role) {
        await supabase
          .from("properties")
          .update({ description: `Posted by ${role}${name.trim() ? ` — ${name.trim()}` : ""}` })
          .eq("id", created.id);
      }

      toast.success("Property posted — add photos and pricing next");
      navigate({ to: "/properties/$id/edit", params: { id: created.id } });
    } catch (error) {
      toast.error(friendlyError(error, "Could not post the property"));
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={submit} className="max-w-xl space-y-10">
        <header className="space-y-1">
          <h2 className="display-title text-2xl">Sell or Rent your Property</h2>
          <p className="text-sm text-muted-foreground">
            You are posting this property for{" "}
            <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-semibold uppercase text-accent-foreground">
              free
            </span>
          </p>
        </header>

        <section className="space-y-5">
          <h3 className="text-base font-semibold">Personal Details</h3>

          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm text-muted-foreground">I am</span>
            <RadioGroup value={role} onValueChange={setRole} className="flex flex-wrap gap-6">
              {POSTER_ROLES.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem value={option.value} id={`role-${option.value}`} />
                  <Label htmlFor={`role-${option.value}`} className="cursor-pointer font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Field label="Name">
            <UnderlineInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Your Name"
              autoComplete="name"
            />
          </Field>

          <Field label="Mobile">
            <div className="flex items-center gap-3">
              <span className="flex shrink-0 items-center gap-1.5 border-b border-input pb-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> IND +91
              </span>
              <UnderlineInput
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                placeholder="Enter Mobile Number"
                inputMode="numeric"
                autoComplete="tel"
              />
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-md bg-accent/60 px-3 py-2.5 text-xs text-accent-foreground">
              <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Enter your WhatsApp No. to get enquiries from Buyer/Tenant
            </p>
          </Field>

          <Field label="Email">
            <UnderlineInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Your Email"
              autoComplete="email"
            />
          </Field>
        </section>

        <section className="space-y-5">
          <h3 className="text-base font-semibold">Property Details</h3>

          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm text-muted-foreground">For</span>
            <RadioGroup
              value={listingFor}
              onValueChange={setListingFor}
              className="flex flex-wrap gap-6"
            >
              {LISTING_FOR.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem value={option.value} id={`for-${option.value}`} />
                  <Label htmlFor={`for-${option.value}`} className="cursor-pointer font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Field label="Property Type">
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="h-10 rounded-none border-0 border-b border-input px-0 shadow-none focus:ring-0">
                <SelectValue placeholder="Select Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>All Residential</SelectLabel>
                  {PROPERTY_TYPES.filter((t) => RESIDENTIAL_TYPES.includes(t.value)).map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>All Commercial</SelectLabel>
                  {PROPERTY_TYPES.filter((t) => COMMERCIAL_TYPES.includes(t.value)).map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </section>

        <section className="space-y-5">
          <h3 className="text-base font-semibold">Property Location</h3>
          <Field label="City">
            <UnderlineInput
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter City"
            />
          </Field>
          <Field label="Locality">
            <UnderlineInput
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="Enter Locality"
            />
          </Field>
        </section>

        <section className="space-y-3">
          <CheckRow checked={exclusive} onChange={setExclusive}>
            I am posting this property ‘exclusively’ with our agency
          </CheckRow>
          <CheckRow checked={agreed} onChange={setAgreed}>
            I agree to the Terms &amp; Conditions, Privacy Policy &amp; Cookie Policy
          </CheckRow>
          <CheckRow checked={whatsapp} onChange={setWhatsapp}>
            I want to receive responses on WhatsApp
          </CheckRow>
        </section>

        <Button type="submit" disabled={create.isPending} className="px-6">
          {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Post Property
        </Button>
      </form>

      <aside className="h-fit space-y-4 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">
          How to find the right{" "}
          <span className="text-primary">{listingFor === "sale" ? "Buyer" : "Tenant"}</span>?
        </h3>
        <Tip
          icon={Phone}
          title="Respond to enquiries"
          body="Connect with leads the moment they contact you on this property."
        />
        <Tip
          icon={UserCheck}
          title="Connect with matching clients"
          body="Actively check your CRM for matching customers and reach out."
        />
        <Tip
          icon={Smartphone}
          title="Use the mobile app"
          body="Get notified on every new enquiry and reply instantly."
        />
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function UnderlineInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={cn(
        "h-10 rounded-none border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0",
        className,
      )}
    />
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

function Tip({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="space-y-0.5">
        <span className="block text-sm font-medium text-primary">{title}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
    </div>
  );
}
