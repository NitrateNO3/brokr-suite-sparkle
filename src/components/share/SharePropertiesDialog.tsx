import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Loader2, Mail, MessageCircle, Search, Send, Building2 } from "lucide-react";
import { toast } from "sonner";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCustomersQuery, useCreateShare, type ShareChannel } from "@/lib/customers";
import { usePropertiesQuery } from "@/lib/queries";
import { formatPrice, locationLine } from "@/lib/format";
import { mailtoUrl, openWithSystemApp, whatsappUrl } from "@/lib/native";

type Created = { customerId: string | null; token: string; name: string; url: string };

const CHANNELS: { value: ShareChannel; label: string; icon: typeof Send }[] = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: Send },
  { value: "link", label: "Copy link", icon: Copy },
  { value: "qr", label: "QR code", icon: Check },
];

export function SharePropertiesDialog({
  open,
  onOpenChange,
  presetPropertyIds = [],
  presetCustomerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetPropertyIds?: string[];
  presetCustomerId?: string;
}) {
  const { data: customers } = useCustomersQuery();
  const { data: properties } = usePropertiesQuery();
  const createShare = useCreateShare();

  const [customerIds, setCustomerIds] = useState<string[]>([]);
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [channel, setChannel] = useState<ShareChannel>("whatsapp");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const [created, setCreated] = useState<Created[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCustomerIds(presetCustomerId ? [presetCustomerId] : []);
    setPropertyIds(presetPropertyIds);
    setCreated([]);
    setTitle("");
    setMessage("");
    setCustomerSearch("");
    setPropertySearch("");
  }, [open, presetCustomerId, presetPropertyIds]);

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    return (customers ?? []).filter((c) =>
      term
        ? [c.full_name, c.phone, c.email].some((v) => v?.toLowerCase().includes(term))
        : true,
    );
  }, [customers, customerSearch]);

  const filteredProperties = useMemo(() => {
    const term = propertySearch.trim().toLowerCase();
    return (properties ?? []).filter((p) =>
      term
        ? [p.title, p.city, p.sector, p.property_code].some((v) =>
            v?.toLowerCase().includes(term),
          )
        : true,
    );
  }, [properties, propertySearch]);

  const toggle = (list: string[], id: string, setter: (next: string[]) => void) =>
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const generate = async () => {
    if (!propertyIds.length) {
      toast.error("Select at least one property.");
      return;
    }
    try {
      const results = await createShare.mutateAsync({
        customerIds,
        propertyIds,
        channel,
        title: title.trim() || null,
        message: message.trim() || null,
      });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setCreated(
        results.map((r) => ({
          customerId: r.customerId,
          token: r.share.token,
          url: `${origin}/s/${r.share.token}`,
          name:
            (customers ?? []).find((c) => c.id === r.customerId)?.full_name ?? "Shareable link",
        })),
      );
      toast.success(`${results.length} share link(s) created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create share");
    }
  };

  const bodyText = (entry: Created) =>
    `${title || "Handpicked properties for you"}\n${message ? `${message}\n` : ""}${entry.url}`;

  const send = async (entry: Created) => {
    const customer = (customers ?? []).find((c) => c.id === entry.customerId);
    if (channel === "whatsapp") {
      await openWithSystemApp(whatsappUrl(bodyText(entry), customer?.whatsapp ?? customer?.phone));
      return;
    }
    if (channel === "email") {
      await openWithSystemApp(
        mailtoUrl(customer?.email ?? "", title || "Properties for you", bodyText(entry)),
      );
      return;
    }
    if (channel === "sms") {
      const phone = (customer?.phone ?? "").replace(/[^\d+]/g, "");
      await openWithSystemApp(`sms:${phone}?body=${encodeURIComponent(bodyText(entry))}`);
      return;
    }
    await navigator.clipboard.writeText(entry.url);
    setCopied(entry.token);
    toast.success("Link copied");
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display-title">Share properties</DialogTitle>
          <DialogDescription>
            Bundle one or more listings into a branded link and track every open, favourite and
            enquiry.
          </DialogDescription>
        </DialogHeader>

        {created.length === 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Picker
                title={`Customers (${customerIds.length})`}
                search={customerSearch}
                onSearch={setCustomerSearch}
                placeholder="Search customers…"
                empty="No customers match."
              >
                {filteredCustomers.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={customerIds.includes(c.id)}
                      onCheckedChange={() => toggle(customerIds, c.id, setCustomerIds)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{c.full_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.phone ?? c.email ?? "No contact"}
                      </span>
                    </span>
                  </label>
                ))}
              </Picker>

              <Picker
                title={`Properties (${propertyIds.length})`}
                search={propertySearch}
                onSearch={setPropertySearch}
                placeholder="Search listings…"
                empty="No listings match."
              >
                {filteredProperties.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={propertyIds.includes(p.id)}
                      onCheckedChange={() => toggle(propertyIds, p.id, setPropertyIds)}
                    />
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                      {p.cover_image ? (
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{p.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {locationLine(p.city, p.sector)} · {formatPrice(Number(p.price))}
                      </span>
                    </span>
                  </label>
                ))}
              </Picker>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Share via</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    size="sm"
                    variant={channel === item.value ? "default" : "outline"}
                    onClick={() => setChannel(item.value)}
                  >
                    <item.icon className="h-4 w-4" /> {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Collection title</Label>
                <Input
                  value={title}
                  placeholder="3 BHK options in Sector 54"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Message</Label>
                <Textarea
                  rows={2}
                  value={message}
                  placeholder="Sharing shortlisted homes as discussed."
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => void generate()} disabled={createShare.isPending}>
                {createShare.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create share link{customerIds.length > 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-3">
            {created.map((entry) => (
              <div key={entry.token} className="surface space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{entry.name}</p>
                  <Badge variant="secondary">{propertyIds.length} properties</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input readOnly value={entry.url} className="text-xs" aria-label="Share link" />
                  <Button size="icon" variant="secondary" onClick={() => void send(entry)}>
                    {copied === entry.token ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => void send(entry)}>
                    Send via {CHANNELS.find((c) => c.value === channel)?.label}
                  </Button>
                  {channel === "qr" && (
                    <div className="rounded-lg border border-border bg-background p-2">
                      <QRCodeCanvas value={entry.url} size={110} includeMargin />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreated([])}>
                Share more
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Picker({
  title,
  search,
  onSearch,
  placeholder,
  empty,
  children,
}: {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border p-3">
        <p className="mb-2 text-sm font-medium">{title}</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            placeholder={placeholder}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="h-56">
        <div className="p-2">
          {items.length ? (
            children
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">{empty}</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
