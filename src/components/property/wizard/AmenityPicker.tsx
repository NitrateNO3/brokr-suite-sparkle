import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AMENITY_LIST } from "@/lib/constants";

const EXTRA = [
  "Club House",
  "Smart Home",
  "EV Charging",
  "Park",
  "Rain Water Harvesting",
  "Fire Safety",
  "Intercom",
  "Gated Community",
  "Vaastu Compliant",
  "Wheelchair Friendly",
];

const POPULAR = [
  "Lift",
  "Power Backup",
  "24x7 Security",
  "Swimming Pool",
  "Gym",
  "Club House",
  "Garden",
  "Kids Play Area",
  "Visitor Parking",
  "Modular Kitchen",
];

export const ALL_AMENITIES = Array.from(new Set([...AMENITY_LIST, ...EXTRA])).sort();

export function AmenityPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [term, setTerm] = useState("");

  const list = useMemo(() => {
    const q = term.trim().toLowerCase();
    const matched = ALL_AMENITIES.filter((a) => (q ? a.toLowerCase().includes(q) : true));
    // Popular picks bubble to the top when the user isn't searching.
    return q
      ? matched
      : [...POPULAR, ...matched.filter((a) => !POPULAR.includes(a))].filter((a) =>
          ALL_AMENITIES.includes(a),
        );
  }, [term]);

  const toggle = (amenity: string) =>
    onChange(
      value.includes(amenity) ? value.filter((a) => a !== amenity) : [...value, amenity],
    );

  const custom = term.trim();
  const canAddCustom = custom.length > 1 && !ALL_AMENITIES.some((a) => a.toLowerCase() === custom.toLowerCase());

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search amenities — pool, gym, power backup…"
          className="h-11 pl-9"
          aria-label="Search amenities"
        />
      </div>

      {canAddCustom && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            toggle(custom);
            setTerm("");
          }}
        >
          + Add “{custom}”
        </Button>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((amenity) => {
          const selected = value.includes(amenity);
          return (
            <button
              key={amenity}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(amenity)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left text-sm transition-all",
                "hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-primary/5 font-medium text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              <span className="truncate">{amenity}</span>
              {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">{value.length} amenities selected</p>
      )}
    </div>
  );
}
