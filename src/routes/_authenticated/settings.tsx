import { usePermissions } from "@/lib/roles";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsQuery, useUpdateSettings } from "@/lib/queries";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — BrokrSuite" },
      {
        name: "description",
        content: "Configure agency branding, contact details and social links for public pages.",
      },
      { property: "og:title", content: "Settings — BrokrSuite" },
      { property: "og:description", content: "White-label your public listing experience." },
    ],
  }),
  component: SettingsPage,
});

type Draft = {
  agency_name: string;
  logo_url: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
};

const EMPTY: Draft = {
  agency_name: "",
  logo_url: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  address: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  youtube: "",
};

function SettingsPage() {
  const { data, isLoading } = useSettingsQuery();
  const update = useUpdateSettings();
  const { canManageSettings } = usePermissions();
  const { theme, toggle } = useTheme();
  const [draft, setDraft] = useState<Draft>(EMPTY);

  useEffect(() => {
    if (!data) return;
    setDraft({
      agency_name: data.agency_name ?? "",
      logo_url: data.logo_url ?? "",
      phone: data.phone ?? "",
      whatsapp: data.whatsapp ?? "",
      email: data.email ?? "",
      website: data.website ?? "",
      address: data.address ?? "",
      facebook: data.facebook ?? "",
      instagram: data.instagram ?? "",
      linkedin: data.linkedin ?? "",
      youtube: data.youtube ?? "",
    });
  }, [data]);

  const field = (key: keyof Draft, label: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={draft[key]}
        placeholder={placeholder ?? ""}
        onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
      />
    </div>
  );

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Branding and contact details shown across your public property pages."
        actions={
          <Button
            disabled={!data || update.isPending || !canManageSettings}
            onClick={() =>
              data &&
              update.mutate(
                { id: data.id, values: draft },
                { onSuccess: () => toast.success("Settings saved") },
              )
            }
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface space-y-4 p-5">
          <p className="display-title text-lg">Agency</p>
          {field("agency_name", "Agency name")}
          {field("logo_url", "Logo URL", "https://…")}
          <div className="space-y-1.5">
            <Label htmlFor="address">Office address</Label>
            <Textarea
              id="address"
              rows={3}
              value={draft.address}
              onChange={(e) => setDraft((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
        </div>

        <div className="surface space-y-4 p-5">
          <p className="display-title text-lg">Contact</p>
          {field("phone", "Phone", "+91 …")}
          {field("whatsapp", "WhatsApp", "+91 …")}
          {field("email", "Email")}
          {field("website", "Website", "https://…")}
        </div>

        <div className="surface space-y-4 p-5">
          <p className="display-title text-lg">Social</p>
          {field("facebook", "Facebook")}
          {field("instagram", "Instagram")}
          {field("linkedin", "LinkedIn")}
          {field("youtube", "YouTube")}
        </div>

        <div className="surface space-y-4 p-5">
          <p className="display-title text-lg">Appearance</p>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">
                Currently using {theme} mode for this browser.
              </p>
            </div>
            <Button variant="secondary" onClick={toggle}>
              Switch to {theme === "dark" ? "light" : "dark"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
