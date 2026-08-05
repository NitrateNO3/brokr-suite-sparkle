import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Mail, MessageCircle, ExternalLink, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isNativeApp, openWithSystemApp, shareNative, whatsappUrl } from "@/lib/native";

export function ShareDialog({
  open,
  onOpenChange,
  slug,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/property/${slug}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Public link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display-title">Share property</DialogTitle>
          <DialogDescription>
            Anyone with this link can view the public page for “{title}”.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input readOnly value={url} className="text-xs" />
          <Button size="icon" variant="secondary" onClick={copy} aria-label="Copy link">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {isNativeApp() && (
          <Button
            variant="secondary"
            onClick={() => void shareNative({ title, text: `${title} — ${url}`, url })}
          >
            <Share2 className="h-4 w-4" /> Share via…
          </Button>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={() => void openWithSystemApp(whatsappUrl(`${title} — ${url}`))}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              void openWithSystemApp(
                `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
              )
            }
          >
            <Mail className="h-4 w-4" /> Email
          </Button>
          <Button variant="outline" onClick={() => void openWithSystemApp(url)}>
            <ExternalLink className="h-4 w-4" /> Open
          </Button>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 p-5">
          <QRCodeCanvas value={url} size={148} includeMargin bgColor="#ffffff" fgColor="#0f3d31" />
          <p className="text-xs text-muted-foreground">Scan to open the listing</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
