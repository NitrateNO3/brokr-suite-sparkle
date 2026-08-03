import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { labelFor, STATUSES, LEAD_STATUSES } from "@/lib/constants";

const propertyTone: Record<string, string> = {
  available: "bg-success/15 text-success border-success/25",
  sold: "bg-destructive/12 text-destructive border-destructive/25",
  rented: "bg-primary/12 text-primary border-primary/25",
  draft: "bg-muted text-muted-foreground border-border",
  under_offer: "bg-brass/18 text-brass border-brass/30",
  archived: "bg-muted text-muted-foreground border-border",
};

const leadTone: Record<string, string> = {
  new: "bg-brass/18 text-brass border-brass/30",
  contacted: "bg-primary/12 text-primary border-primary/25",
  qualified: "bg-primary/12 text-primary border-primary/25",
  visit_scheduled: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  negotiation: "bg-warning/18 text-warning-foreground border-warning/35",
  won: "bg-success/15 text-success border-success/25",
  lost: "bg-destructive/12 text-destructive border-destructive/25",
};

export function StatusBadge({
  status,
  kind = "property",
}: {
  status: string;
  kind?: "property" | "lead";
}) {
  const tone = kind === "lead" ? leadTone[status] : propertyTone[status];
  const label = labelFor(kind === "lead" ? LEAD_STATUSES : STATUSES, status);
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", tone)}>
      {label}
    </Badge>
  );
}
