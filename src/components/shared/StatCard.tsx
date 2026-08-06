import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  index = 0,
  delta,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "brass" | "success" | "destructive";
  index?: number;
  /** Percentage change vs. previous period. */
  delta?: number | null;
}) {
  const positive = (delta ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
      className="surface surface-hover group relative overflow-hidden p-5"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100",
          tone === "brass" && "bg-brass",
          tone === "success" && "bg-success",
          tone === "destructive" && "bg-destructive",
          tone === "default" && "bg-primary",
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{label}</p>
          <p className="display-title mt-2 truncate text-2xl tabular-nums">{value}</p>
          <div className="mt-1.5 flex items-center gap-2">
            {typeof delta === "number" && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                  positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
                )}
              >
                {positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(delta)}%
              </span>
            )}
            {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
          </div>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            tone === "brass" && "bg-brass/15 text-brass",
            tone === "success" && "bg-success/15 text-success",
            tone === "destructive" && "bg-destructive/15 text-destructive",
            tone === "default" && "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </motion.div>
  );
}
