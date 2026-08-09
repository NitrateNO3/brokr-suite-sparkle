import {
  Building,
  Building2,
  Factory,
  Home,
  Hotel,
  KeyRound,
  LandPlot,
  Landmark,
  Store,
  Tag,
  Trees,
  Warehouse,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const PURPOSE_CARDS = [
  { value: "sale", label: "For Sale", hint: "Outright ownership transfer", icon: Tag },
  { value: "rent", label: "For Rent", hint: "Monthly rental / PG", icon: KeyRound },
  { value: "lease", label: "For Lease", hint: "Long-term commercial lease", icon: Landmark },
] as const;

/**
 * Broker-facing listing intents. Each maps onto the purposes the database
 * accepts (sale / rent / lease) and can pre-select a property category.
 */
export const LISTING_INTENTS = [
  { id: "sale", label: "For Sale", hint: "Outright ownership transfer", icon: Tag, purpose: "sale" },
  { id: "rent", label: "For Rent", hint: "Monthly rental", icon: KeyRound, purpose: "rent" },
  { id: "pg", label: "PG / Co-living", hint: "Per-bed or shared rental", icon: Home, purpose: "rent" },
  {
    id: "commercial",
    label: "Commercial",
    hint: "Office, shop or warehouse lease",
    icon: Landmark,
    purpose: "lease",
    category: "office_space",
  },
  {
    id: "plot",
    label: "Plot / Land",
    hint: "Residential or industrial land",
    icon: LandPlot,
    purpose: "sale",
    category: "plot",
  },
] as const;


export const CATEGORY_CARDS = [
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "builder_floor", label: "Builder Floor", icon: Building },
  { value: "independent_house", label: "Independent House", icon: Home },
  { value: "villa", label: "Villa", icon: Hotel },
  { value: "penthouse", label: "Penthouse", icon: Hotel },
  { value: "plot", label: "Plot", icon: LandPlot },
  { value: "farm_house", label: "Farm House", icon: Trees },
  { value: "office_space", label: "Commercial Office", icon: Building2 },
  { value: "retail_shop", label: "Retail Shop", icon: Store },
  { value: "commercial", label: "Commercial", icon: Factory },
  { value: "warehouse", label: "Warehouse", icon: Warehouse },
] as const;

export function ChoiceCard({
  label,
  hint,
  icon: Icon,
  selected,
  onSelect,
}: {
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/30"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 place-items-center rounded-xl transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="space-y-0.5">
        <span className="block text-sm font-semibold">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </button>
  );
}
