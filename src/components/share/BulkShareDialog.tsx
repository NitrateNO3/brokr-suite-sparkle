import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Copy, Mail, MessageCircle, Share2 } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPrice, locationLine } from "@/lib/format";
import { PROPERTY_TYPES, labelFor } from "@/lib/constants";
import { mailtoUrl, openWithSystemApp, shareNative, whatsappUrl } from "@/lib/native";
import type { Property } from "@/lib/queries";

/** Builds one public link that carries every selected property id. */
export function buildMultiShareUrl(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/shared/properties?id=${unique.join(",")}`;
}

export function BulkShareDialog({
  open,
  onOpenChange,
  properties,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
}) {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => buildMultiShareUrl(properties.map((p) => p.id)), [properties]);
  const count = properties.length;
  const text = `Here are some properties you may be interested in:\n${url}`;

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Share link copied successfully.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const nativeShare = async () => {
    const shared = await shareNative({ title: "Properties", text, url });
    if (!shared) await copy();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Properties</DialogTitle>
          <DialogDescription>
            You are sharing {count} {count === 1 ? "property" : "properties"} in a single link.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-64 rounded-lg border border-border/70">
          <ul className="divide-y divide-border/60">
            {properties.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-2.5">
                {p.cover_image ? (
                  <img
                    src={p.cover_image}
                    alt={`${p.title} cover`}
                    loading="lazy"
                    className="h-12 w-16 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {locationLine(p.city, p.sector)} · {labelFor(PROPERTY_TYPES, p.property_type)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {formatPrice(Number(p.price))}
                </span>
              </li>
            ))}
          </ul>
        </ScrollArea>

        <div className="truncate rounded-lg bg-muted px-3 py-2 text-[11px] text-muted-foreground">
          {url}
        </div>

        <DialogFooter className="flex-row flex-wrap justify-end gap-2 sm:justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openWithSystemApp(whatsappUrl(text))}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              openWithSystemApp(
                mailtoUrl("", `${count} ${count === 1 ? "property" : "properties"} for you`, text),
              )
            }
          >
            <Mail className="h-4 w-4" /> Email
          </Button>
          <Button size="sm" variant="outline" onClick={nativeShare}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button size="sm" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Share Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
