import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Images,
  LayoutDashboard,
  MapPin,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { usePropertiesQuery, useLeadsQuery } from "@/lib/queries";
import { formatPrice, locationLine } from "@/lib/format";

const NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Properties", to: "/properties", icon: Building2 },
  { label: "Leads", to: "/leads", icon: Users },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Media library", to: "/media", icon: Images },
  { label: "Locations", to: "/locations", icon: MapPin },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

/** Cmd/Ctrl+K palette that searches inventory, leads and navigation in one box. */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: properties } = usePropertiesQuery();
  const { data: leads } = useLeadsQuery();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground hidden gap-2 sm:flex"
        onClick={() => setOpen(true)}
        aria-label="Open global search"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search…</span>
        <kbd className="bg-muted hidden rounded px-1.5 py-0.5 text-[10px] font-medium md:inline">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open global search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search properties, leads or pages…" />
        <CommandList>
          <CommandEmpty>No matches found.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            <CommandItem
              value="add new property create listing"
              onSelect={() => go(() => navigate({ to: "/properties/new" }))}
            >
              <Plus className="mr-2 h-4 w-4" /> Add property
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Properties">
            {(properties ?? []).slice(0, 40).map((property) => (
              <CommandItem
                key={property.id}
                value={`${property.title} ${property.property_code} ${property.city ?? ""} ${property.sector ?? ""}`}
                onSelect={() =>
                  go(() => navigate({ to: "/properties/$id/edit", params: { id: property.id } }))
                }
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span className="truncate">{property.title}</span>
                <span className="text-muted-foreground ml-auto pl-3 text-xs">
                  {locationLine(property.city, property.sector)} ·{" "}
                  {formatPrice(Number(property.price))}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Leads">
            {(leads ?? []).slice(0, 25).map((lead) => (
              <CommandItem
                key={lead.id}
                value={`${lead.name} ${lead.phone ?? ""} ${lead.email ?? ""}`}
                onSelect={() => go(() => navigate({ to: "/leads" }))}
              >
                <Users className="mr-2 h-4 w-4" />
                <span className="truncate">{lead.name}</span>
                <span className="text-muted-foreground ml-auto pl-3 text-xs">
                  {lead.phone ?? lead.email ?? lead.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Go to">
            {NAV.map((item) => (
              <CommandItem
                key={item.to}
                value={item.label}
                onSelect={() => go(() => navigate({ to: item.to }))}
              >
                <item.icon className="mr-2 h-4 w-4" /> {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
