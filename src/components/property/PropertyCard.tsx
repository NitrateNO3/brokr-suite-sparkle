import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Images,
  MapPin,
  Pencil,
  Share2,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatNumber, formatPrice, locationLine, pricePerArea, timeAgo } from "@/lib/format";
import { PROPERTY_TYPES, labelFor } from "@/lib/constants";
import type { Property } from "@/lib/queries";

/** Premium inventory card used by the grid view of the properties module. */
export function PropertyCard({
  property,
  selected,
  onToggleSelect,
  imageCount = 0,
  agentName,
  onShare,
  onDelete,
  onDuplicate,
  onTogglePublished,
  onToggleFeatured,
}: {
  property: Property;
  selected: boolean;
  onToggleSelect: () => void;
  imageCount?: number;
  agentName?: string | null;
  onShare: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
}) {
  const area = property.super_area ?? property.builtup_area ?? property.carpet_area;
  const rate = pricePerArea(
    Number(property.price),
    area ? Number(area) : null,
    property.area_unit,
  );

  return (
    <article className="surface surface-hover group flex flex-col overflow-hidden">
      <div className="relative">
        {property.cover_image ? (
          <img
            src={property.cover_image}
            alt={`${property.title} cover photo`}
            loading="lazy"
            decoding="async"
            className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-44 w-full place-items-center bg-muted text-muted-foreground">
            <Building2 className="h-8 w-8 opacity-40" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${property.title}`}
            className="bg-background/90"
          />
          {property.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
          {property.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold">
              <Star className="h-3 w-3" /> Featured
            </span>
          )}
        </div>

        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-foreground/70 px-2 py-0.5 text-[10px] font-medium text-background">
          <Images className="h-3 w-3" /> {imageCount || (property.cover_image ? 1 : 0)}
        </span>
        <span className="absolute bottom-3 left-3">
          <StatusBadge status={property.status} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {property.property_code} · {labelFor(PROPERTY_TYPES, property.property_type)} · For{" "}
          {property.purpose}
        </p>
        <Link
          to="/properties/$id/edit"
          params={{ id: property.id }}
          className="line-clamp-2 font-medium hover:text-primary"
        >
          {property.title}
        </Link>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {locationLine(property.city, property.sector)}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="display-title text-lg text-primary">
            {formatPrice(Number(property.price))}
          </p>
          {rate && <span className="text-[11px] text-muted-foreground">{rate}</span>}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {[
            property.builder,
            `Posted ${timeAgo(property.created_at)}`,
            `${formatNumber(property.views)} views`,
            agentName ? `Agent: ${agentName}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={property.is_featured ? "Remove from featured" : "Mark as featured"}
            onClick={onToggleFeatured}
          >
            <Star className={`h-4 w-4 ${property.is_featured ? "fill-brass text-brass" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={property.is_published ? "Unpublish" : "Publish"}
            onClick={onTogglePublished}
          >
            {property.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Share" onClick={onShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Open public page">
            <Link to="/property/$slug" params={{ slug: property.slug }} target="_blank">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Brochure">
            <Link to="/properties/$id/brochure" params={{ id: property.id }}>
              <FileText className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Duplicate" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Edit">
            <Link to="/properties/$id/edit" params={{ id: property.id }}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </article>
  );
}
