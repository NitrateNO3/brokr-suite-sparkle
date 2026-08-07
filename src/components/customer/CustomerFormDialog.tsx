import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CUSTOMER_INTENTS,
  CUSTOMER_PRIORITIES,
  CUSTOMER_STATUSES,
  useCreateCustomer,
  useUpdateCustomer,
  type Customer,
  type CustomerIntent,
  type CustomerPriority,
  type CustomerStatus,
} from "@/lib/customers";
import { useTeamQuery } from "@/lib/roles";
import { PROPERTY_TYPES } from "@/lib/constants";
import { uploadToStorage } from "@/lib/storage";
import { fromLocalInput, toLocalInput } from "@/lib/followup";

const UNASSIGNED = "unassigned";

type FormState = {
  full_name: string;
  photo_url: string;
  phone: string;
  whatsapp: string;
  email: string;
  occupation: string;
  company: string;
  budget_min: string;
  budget_max: string;
  preferred_city: string;
  preferred_location: string;
  property_type: string;
  bhk_preference: string;
  intent: CustomerIntent;
  assigned_to: string;
  source: string;
  status: CustomerStatus;
  priority: CustomerPriority;
  is_vip: boolean;
  tags: string;
  notes: string;
  next_follow_up_at: string;
};

const EMPTY: FormState = {
  full_name: "",
  photo_url: "",
  phone: "",
  whatsapp: "",
  email: "",
  occupation: "",
  company: "",
  budget_min: "",
  budget_max: "",
  preferred_city: "Gurgaon",
  preferred_location: "",
  property_type: "",
  bhk_preference: "",
  intent: "buy",
  assigned_to: UNASSIGNED,
  source: "manual",
  status: "new",
  priority: "medium",
  is_vip: false,
  tags: "",
  notes: "",
  next_follow_up_at: "",
};

function fromCustomer(customer: Customer): FormState {
  return {
    full_name: customer.full_name,
    photo_url: customer.photo_url ?? "",
    phone: customer.phone ?? "",
    whatsapp: customer.whatsapp ?? "",
    email: customer.email ?? "",
    occupation: customer.occupation ?? "",
    company: customer.company ?? "",
    budget_min: customer.budget_min?.toString() ?? "",
    budget_max: customer.budget_max?.toString() ?? "",
    preferred_city: customer.preferred_city ?? "",
    preferred_location: customer.preferred_location ?? "",
    property_type: customer.property_type ?? "",
    bhk_preference: customer.bhk_preference?.toString() ?? "",
    intent: customer.intent,
    assigned_to: customer.assigned_to ?? UNASSIGNED,
    source: customer.source ?? "manual",
    status: customer.status,
    priority: customer.priority,
    is_vip: customer.is_vip,
    tags: (customer.tags ?? []).join(", "),
    notes: customer.notes ?? "",
    next_follow_up_at: toLocalInput(customer.next_follow_up_at),
  };
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const { data: team } = useTeamQuery();

  useEffect(() => {
    if (open) setForm(customer ? fromCustomer(customer) : EMPTY);
  }, [open, customer]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToStorage(file, "customers");
      set("photo_url", url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.full_name.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    const values = {
      full_name: form.full_name.trim(),
      photo_url: form.photo_url || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || form.phone.trim() || null,
      email: form.email.trim() || null,
      occupation: form.occupation.trim() || null,
      company: form.company.trim() || null,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      preferred_city: form.preferred_city.trim() || null,
      preferred_location: form.preferred_location.trim() || null,
      property_type: (form.property_type || null) as Customer["property_type"],
      bhk_preference: form.bhk_preference ? Number(form.bhk_preference) : null,
      intent: form.intent,
      assigned_to: form.assigned_to === UNASSIGNED ? null : form.assigned_to,
      source: form.source.trim() || "manual",
      status: form.status,
      priority: form.is_vip ? ("vip" as CustomerPriority) : form.priority,
      is_vip: form.is_vip,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes: form.notes.trim() || null,
      next_follow_up_at: fromLocalInput(form.next_follow_up_at),
    };

    try {
      if (customer) {
        await update.mutateAsync({ id: customer.id, values });
        toast.success("Customer updated");
      } else {
        await create.mutateAsync(values);
        toast.success("Customer added");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save customer");
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display-title">
            {customer ? "Edit customer" : "Add customer"}
          </DialogTitle>
          <DialogDescription>
            Capture requirements once so every share, visit and follow-up stays connected.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={form.photo_url || undefined} alt={form.full_name} />
            <AvatarFallback>{form.full_name.charAt(0).toUpperCase() || "C"}</AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="customer-photo" className="cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Profile photo
              </span>
            </Label>
            <input
              id="customer-photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void pickPhoto(e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *">
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={form.whatsapp}
              placeholder="Same as phone when blank"
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Occupation">
            <Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
          </Field>
          <Field label="Company">
            <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
          </Field>
          <Field label="Budget from (₹)">
            <Input
              type="number"
              value={form.budget_min}
              onChange={(e) => set("budget_min", e.target.value)}
            />
          </Field>
          <Field label="Budget to (₹)">
            <Input
              type="number"
              value={form.budget_max}
              onChange={(e) => set("budget_max", e.target.value)}
            />
          </Field>
          <Field label="Preferred city">
            <Input
              value={form.preferred_city}
              onChange={(e) => set("preferred_city", e.target.value)}
            />
          </Field>
          <Field label="Preferred location">
            <Input
              value={form.preferred_location}
              placeholder="Sector 54, DLF Phase 5…"
              onChange={(e) => set("preferred_location", e.target.value)}
            />
          </Field>
          <Field label="Property type">
            <Select
              {...(form.property_type ? { value: form.property_type } : {})}
              onValueChange={(v) => set("property_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="BHK preference">
            <Input
              type="number"
              min={0}
              value={form.bhk_preference}
              onChange={(e) => set("bhk_preference", e.target.value)}
            />
          </Field>
          <Field label="Intent">
            <Select value={form.intent} onValueChange={(v) => set("intent", v as CustomerIntent)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_INTENTS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Assigned agent">
            <Select value={form.assigned_to} onValueChange={(v) => set("assigned_to", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {(team ?? []).map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name ?? member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Lead source">
            <Input value={form.source} onChange={(e) => set("source", e.target.value)} />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as CustomerStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_STATUSES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={form.priority}
              onValueChange={(v) => set("priority", v as CustomerPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_PRIORITIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Next follow-up">
            <Input
              type="datetime-local"
              value={form.next_follow_up_at}
              onChange={(e) => set("next_follow_up_at", e.target.value)}
            />
          </Field>
          <Field label="Tags (comma separated)">
            <Input
              value={form.tags}
              placeholder="investor, nri, urgent"
              onChange={(e) => set("tags", e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <p className="text-sm font-medium">Mark as VIP</p>
            <p className="text-xs text-muted-foreground">Pins the customer to the top of lists.</p>
          </div>
          <Switch checked={form.is_vip} onCheckedChange={(v) => set("is_vip", v)} />
        </div>

        <Field label="Notes">
          <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {customer ? "Save changes" : "Add customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
