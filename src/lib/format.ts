/** Formatting helpers shared across the admin portal and public pages. */

/** Indian currency short form: 1.2 Cr / 45.5 L / ₹38,000 */
export function formatPrice(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2).replace(/\.00$/, "")} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(value?: string | null): string {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/** SEO-friendly slug generator. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Auto property code, e.g. DRE-4F92AC */
export function generatePropertyCode(): string {
  return `DRE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function locationLine(city?: string | null, sector?: string | null): string {
  if (!sector) return city ?? "—";
  // Sector labels are stored as free text ("Sector 54", "Sushant Lok Phase 1"),
  // so only prefix "Sector" when it is a bare number.
  const label = /^\d/.test(sector.trim()) ? `Sector ${sector.trim()}` : sector.trim();
  return city ? `${label}, ${city}` : label;
}
