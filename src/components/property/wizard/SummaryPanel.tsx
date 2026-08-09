import { Building2, Camera, IndianRupee, MapPin, Ruler } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { labelFor, PROPERTY_TYPES, PURPOSES } from "@/lib/constants";
import { areaUnitLabel, formatPrice, locationLine } from "@/lib/format";

/** Live listing summary that mirrors what the broker has filled in so far. */
export function SummaryPanel({
  code,
  title,
  purpose,
  propertyType,
  city,
  sector,
  builder,
  bedrooms,
  area,
  areaUnit,
  price,
  rate,
  photoCount,
  coverImage,
  missing,
  onJump,
}: {
  code: string;
  title: string;
  purpose: string;
  propertyType: string;
  city: string;
  sector?: string | null;
  builder?: string | null;
  bedrooms?: number | null;
  area?: number | null;
  areaUnit: string;
  price: number;
  rate?: string | null;
  photoCount: number;
  coverImage?: string | null;
  missing: { label: string; step: number }[];
  onJump: (step: number) => void;
}) {
  return (
    <aside className="surface sticky top-40 space-y-4 overflow-hidden p-0">
      <div className="relative h-36 w-full bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={`${title || "Listing"} cover`} className="h-36 w-full object-cover" />
        ) : (
          <div className="grid h-36 place-items-center text-xs text-muted-foreground">
            <span className="text-center">
              <Camera className="mx-auto mb-1 h-5 w-5" />
              {photoCount ? `${photoCount} photo(s) ready` : "No photos yet"}
            </span>
          </div>
        )}
        <Badge variant="secondary" className="absolute left-3 top-3 text-[10px]">
          {code}
        </Badge>
      </div>

      <div className="space-y-3 px-5 pb-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          For {labelFor(PURPOSES, purpose)} · {labelFor(PROPERTY_TYPES, propertyType)}
        </p>
        <h3 className="text-base font-semibold leading-snug">{title || "Untitled listing"}</h3>

        <p className="display-title text-xl text-primary">
          {price > 0 ? formatPrice(price) : "Price not set"}
        </p>
        {rate ? <p className="-mt-2 text-xs text-muted-foreground">{rate}</p> : null}

        <dl className="space-y-2 text-sm">
          <Line icon={MapPin} value={locationLine(city, sector)} />
          {builder ? <Line icon={Building2} value={builder} /> : null}
          {bedrooms ? <Line icon={Building2} value={`${bedrooms} BHK`} /> : null}
          {area ? <Line icon={Ruler} value={`${area} ${areaUnitLabel(areaUnit)}`} /> : null}
          <Line icon={Camera} value={`${photoCount} photo${photoCount === 1 ? "" : "s"}`} />
          <Line icon={IndianRupee} value={price > 0 ? "Price added" : "Price pending"} />
        </dl>

        {missing.length > 0 && (
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="mb-2 text-xs font-medium">
              {missing.length} detail{missing.length === 1 ? "" : "s"} remaining
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onJump(item.step)}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function Line({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}
