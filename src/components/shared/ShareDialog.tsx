import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Building2,
  Check,
  Copy,
  ExternalLink,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,
  Send,
  Share2,
  Twitter,
} from "lucide-react";
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
  coverImage,
  subtitle,
  price,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  title: string;
  coverImage?: string | null;
  subtitle?: string | null;
  price?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/property/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Public link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const networks = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: whatsappUrl(`${title} — ${url}`),
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    { label: "X", icon: Twitter, href: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedText}` },
    { label: "Telegram", icon: Send, href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodedText}&body=${encodeURIComponent(`${title}\n${url}`)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display-title">Share property</DialogTitle>
          <DialogDescription>
            Anyone with this link sees only the details you allowed for “{title}”.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border border-border">
          {coverImage ? (
            <img
              src={coverImage}
              alt={`${title} cover`}
              loading="lazy"
              className="h-32 w-full object-cover"
            />
          ) : (
            <div className="grid h-32 w-full place-items-center bg-muted text-muted-foreground">
              <Building2 className="h-8 w-8 opacity-40" />
            </div>
          )}
          <div className="space-y-0.5 p-3">
            <p className="truncate text-sm font-medium">{title}</p>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            {price && <p className="text-sm font-semibold text-primary">{price}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input readOnly value={url} className="text-xs" aria-label="Public link" />
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
          {networks.map((network) => (
            <Button
              key={network.label}
              variant="outline"
              onClick={() => void openWithSystemApp(network.href)}
            >
              <network.icon className="h-4 w-4" /> {network.label}
            </Button>
          ))}
          <Button variant="outline" onClick={() => void openWithSystemApp(url)}>
            <ExternalLink className="h-4 w-4" /> Open
          </Button>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 p-5">
          <QRCodeCanvas value={url} size={148} includeMargin bgColor="#ffffff" fgColor="#111827" />
          <p className="text-xs text-muted-foreground">Scan to open the listing</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
