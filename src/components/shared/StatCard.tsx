import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  index = 0,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "brass" | "success";
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
      className="surface group relative overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="display-title mt-2 text-2xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
            tone === "brass" && "bg-brass/15 text-brass",
            tone === "success" && "bg-success/15 text-success",
            tone === "default" && "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </motion.div>
  );
}
