import { cn } from "@/lib/utils";

export type ChipOption = { value: string; label: string };

/** Compact visual selector used across the Add Property wizard (BHK, facing, furnishing…). */
export function ChipSelect({
  options,
  value,
  onChange,
  clearable = true,
  className,
  ariaLabel,
}: {
  options: readonly ChipOption[];
  value: string;
  onChange: (next: string) => void;
  clearable?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected && clearable ? "" : option.value)}
            className={cn(
              "min-w-11 rounded-xl border px-3.5 py-2 text-sm transition-all",
              "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary bg-primary/10 font-semibold text-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export const COUNT_OPTIONS = (max = 6): ChipOption[] =>
  Array.from({ length: max }, (_, i) => ({
    value: String(i + 1),
    label: i + 1 === max ? `${max}+` : String(i + 1),
  }));
