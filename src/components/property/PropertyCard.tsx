import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  Copy,
  CopyPlus,
  Crown,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Images,
  ImagePlus,
  MapPin,
  Pencil,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { IconAction, InfoTip } from "@/components/shared/IconAction";
import { formatArea, formatNumber, formatPrice, locationLine, pricePerArea, timeAgo } from "@/lib/format";
import { PROPERTY_TYPES, labelFor } from "@/lib/constants";
import { usePermissions } from "@/lib/roles";
import type { Property } from "@/lib/queries";

/** Compact, information-dense inventory card used by the properties grid. */
function CoverImage({
  src,
  alt,
  propertyId,
  canUpload,
}: {
  src: string | null;
  alt: string;
  propertyId: string;
  canUpload: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-muted to-accent/40 text-muted-foreground">
        <Building2 className="h-6 w-6 opacity-40" aria-hidden="true" />
        <p className="text-[11px] font-medium">No image</p>
        {canUpload && (
          <Button asChild size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]">
            <Link to="/properties/$id/edit" params={{ id: propertyId }}>
              <ImagePlus className="h-3 w-3" /> Upload
            </Link>
          </Button>
        )}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
    />
  );
}


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
  const { canUploadMedia: canUpload, canDeleteProperty } = usePermissions();
  const area = property.super_area ?? property.builtup_area ?? property.carpet_area;
  const rate = pricePerArea(Number(property.price), area ? Number(area) : null, property.area_unit);
  const specs = [
    labelFor(PROPERTY_TYPES, property.property_type),
    property.bedrooms ? `${property.bedrooms} BHK` : null,
    formatArea(area ? Number(area) : null, property.area_unit),
    `For ${property.purpose}`,
  ].filter(Boolean) as string[];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/property/${property.slug}`);
      toast.success("Property link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <article className="surface group flex flex-col overflow-hidden rounded-xl border border-border/70 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-within:border-primary/40">
      <div className="relative overflow-hidden">
        <CoverImage
          src={property.cover_image}
          alt={`${property.title} cover photo`}
          propertyId={property.id}
          canUpload={canUpload}
        />

        <div className="absolute left-2 top-2 flex items-center gap-1">
          <InfoTip label="Select Property">
            <span className="inline-flex">
              <Checkbox
                checked={selected}
                onCheckedChange={onToggleSelect}
                aria-label={`Select ${property.title}`}
                className="h-4 w-4 bg-background/90"
              />
            </span>
          </InfoTip>
          {property.is_verified && (
            <InfoTip label="Verified Listing">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" /> Verified
              </span>
            </InfoTip>
          )}
          {property.is_featured && (
            <InfoTip label="Featured Listing">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold">
                <Star className="h-2.5 w-2.5" aria-hidden="true" /> Featured
              </span>
            </InfoTip>
          )}
          {property.is_premium && (
            <InfoTip label="Premium Listing">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-brass/90 px-1.5 py-0.5 text-[9px] font-semibold text-background">
                <Crown className="h-2.5 w-2.5" aria-hidden="true" /> Premium
              </span>
            </InfoTip>
          )}
        </div>

        <InfoTip label="View Property Images">
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-foreground/70 px-1.5 py-0.5 text-[9px] font-medium text-background">
            <Images className="h-2.5 w-2.5" aria-hidden="true" />{" "}
            {imageCount || (property.cover_image ? 1 : 0)}
          </span>
        </InfoTip>
        <span className="absolute bottom-2 left-2">
          <InfoTip label="Current Property Status">
            <span className="inline-flex scale-90 origin-bottom-left">
              <StatusBadge status={property.status} />
            </span>
          </InfoTip>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="display-title truncate text-base text-primary">
            {formatPrice(Number(property.price))}
          </p>
          {rate && <span className="shrink-0 text-[10px] text-muted-foreground">{rate}</span>}
        </div>

        <Link
          to="/properties/$id/edit"
          params={{ id: property.id }}
          className="line-clamp-1 text-sm font-semibold transition-colors hover:text-primary"
        >
          {property.title}
        </Link>

        <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{locationLine(property.city, property.sector)}</span>
        </p>

        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          {specs.map((spec) => (
            <span
              key={spec}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {spec}
            </span>
          ))}
        </div>

        <p className="truncate text-[10px] text-muted-foreground">
          {property.property_code} · {timeAgo(property.created_at)} ·{" "}
          {formatNumber(property.views)} views{agentName ? ` · ${agentName}` : ""}
        </p>

        <div
          className="-mx-0.5 mt-auto flex flex-wrap items-center gap-0.5 border-t border-border/60 pt-2"
          role="group"
          aria-label={`Actions for ${property.title}`}
        >
          <IconAction
            label={property.is_featured ? "Remove from Favorites" : "Add to Favorites"}
            active={property.is_featured}
            onClick={onToggleFeatured}
          >
            <Star className={`h-3.5 w-3.5 ${property.is_featured ? "fill-brass text-brass" : ""}`} />
          </IconAction>
          <IconAction
            label={property.is_published ? "Hide Property" : "View Property"}
            onClick={onTogglePublished}
          >
            {property.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </IconAction>
          <IconAction label="Share Property" onClick={onShare}>
            <Share2 className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction label="Open Public Listing" asChild>
            <Link to="/property/$slug" params={{ slug: property.slug }} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </IconAction>
          <IconAction label="Generate Brochure / PDF" asChild>
            <Link to="/properties/$id/brochure" params={{ id: property.id }}>
              <FileText className="h-3.5 w-3.5" />
            </Link>
          </IconAction>
          <IconAction label="Copy Property Link" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction label="Duplicate Property" onClick={onDuplicate}>
            <CopyPlus className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction label="Edit Property" asChild>
            <Link to="/properties/$id/edit" params={{ id: property.id }}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </IconAction>
          {canDeleteProperty && (
            <IconAction
              label="Delete Property"
              onClick={onDelete}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </IconAction>
          )}
        </div>
      </div>
    </article>
  );
}
