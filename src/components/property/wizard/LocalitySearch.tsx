import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useLocationsFullQuery, type LocationRow } from "@/lib/locations";
import { cn } from "@/lib/utils";

export type LocalityPick = {
  city: string;
  sector: string;
  area: string | null;
  pin_code: string | null;
};

/**
 * Single search box over the existing locations catalogue.
 * Picking a result auto-fills city, locality/sector and pin code.
 */
export function LocalitySearch({ onPick }: { onPick: (pick: LocalityPick) => void }) {
  const { data: locations, isLoading } = useLocationsFullQuery();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    return (locations ?? [])
      .filter((row: LocationRow) =>
        [row.city, row.area, row.sector, row.sub_sector, row.pin_code]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 8);
  }, [locations, term]);

  const label = (row: LocationRow) =>
    [row.sub_sector, row.sector ? (/^\d/.test(row.sector) ? `Sector ${row.sector}` : row.sector) : null]
      .filter(Boolean)
      .join(" · ") || row.area || row.city;

  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Search locality, sector, society or project"
        aria-label="Search locality, sector, society or project"
        className="h-14 rounded-2xl pl-10 text-base shadow-sm"
      />
      {open && term.trim().length > 0 && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-lg">
          {isLoading && <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>}
          {!isLoading && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No saved locality matches “{term}”. Fill the fields below manually.
            </p>
          )}
          {results.map((row) => (
            <button
              key={row.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick({
                  city: row.city,
                  sector: row.sector ?? row.area ?? "",
                  area: row.area,
                  pin_code: row.pin_code,
                });
                setTerm("");
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
              )}
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{label(row)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[row.area, row.city, row.pin_code].filter(Boolean).join(", ")}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
