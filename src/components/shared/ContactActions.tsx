import { MapPin, Mail, MessageCircle, Phone } from "lucide-react";

import { mailtoUrl, mapsUrl, openWithSystemApp, telUrl, whatsappUrl } from "@/lib/native";

type Props = {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  mapsLink?: string | null;
};

/**
 * Phone / WhatsApp / email / maps actions. On Android these hand off to the
 * dialer, WhatsApp, the mail app and Google Maps; on web they open normally.
 */
export function ContactActions({
  phone,
  whatsapp,
  email,
  title,
  latitude,
  longitude,
  address,
  mapsLink,
}: Props) {
  const hasMap = Boolean(mapsLink || (latitude != null && longitude != null) || address);
  const items: Array<{ key: string; label: string; icon: typeof Phone; url: string }> = [];

  if (phone) items.push({ key: "call", label: phone, icon: Phone, url: telUrl(phone) });
  if (whatsapp || phone)
    items.push({
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      url: whatsappUrl(`Hi, I'm interested in ${title}`, whatsapp ?? phone),
    });
  if (email)
    items.push({ key: "email", label: "Email", icon: Mail, url: mailtoUrl(email, title) });
  if (hasMap)
    items.push({
      key: "map",
      label: "Directions",
      icon: MapPin,
      url: mapsUrl({
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        query: address ?? title,
        mapsUrl: mapsLink ?? null,
      }),
    });

  if (!items.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ key, label, icon: Icon, url }) => (
        <button
          key={key}
          type="button"
          onClick={() => void openWithSystemApp(url)}
          className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm transition-colors hover:bg-accent"
        >
          <Icon className="h-4 w-4" /> <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}
