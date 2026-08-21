import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AREA_UNIT_OPTIONS, type FieldOption, type FieldSpec } from "@/lib/property-schema";

/* ------------------------------- layout bits ------------------------------- */

export function Section({
  step,
  title,
  hint,
  children,
  id,
}: {
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-border/70 pb-8 last:border-0">
      <header className="mb-5 flex items-baseline gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
          {step}
        </span>
        <div>
          <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function FieldShell({
  label,
  required,
  error,
  children,
  className,
}: {
  label?: string | undefined;
  required?: boolean | undefined;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <span className="block text-xs font-semibold text-foreground">
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </span>
      ) : null}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/* --------------------------------- controls -------------------------------- */

export function ChipGroup({
  options,
  value,
  onChange,
  multiple = false,
  ariaLabel,
}: {
  options: readonly FieldOption[];
  value: string;
  onChange: (next: string) => void;
  multiple?: boolean;
  ariaLabel?: string;
}) {
  const selected = multiple ? value.split(",").filter(Boolean) : [value].filter(Boolean);
  const toggle = (v: string) => {
    if (!multiple) return onChange(value === v ? "" : v);
    const next = selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v];
    onChange(next.join(","));
  };
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o.value)}
            className={cn(
              "min-w-10 rounded-lg border px-3 py-1.5 text-[13px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; hint?: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition-all",
              on
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-background hover:border-primary/40",
            )}
          >
            <span className={cn("block text-sm font-semibold", on ? "text-primary" : "text-foreground")}>
              {o.label}
            </span>
            {o.hint ? <span className="block text-xs text-muted-foreground">{o.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function AreaInput({
  value,
  unit,
  onValue,
  onUnit,
  placeholder,
  fixedUnit,
}: {
  value: string;
  unit: string;
  onValue: (v: string) => void;
  onUnit: (v: string) => void;
  placeholder?: string;
  fixedUnit?: string | undefined;
}) {
  return (
    <div className="flex gap-2">
      <Input
        value={value}
        inputMode="decimal"
        placeholder={placeholder ?? "0"}
        onChange={(e) => onValue(e.target.value.replace(/[^\d.]/g, ""))}
        className="h-10"
      />
      {fixedUnit ? (
        <span className="grid h-10 w-24 shrink-0 place-items-center rounded-md border border-input bg-muted/50 text-xs font-medium text-muted-foreground">
          {AREA_UNIT_OPTIONS.find((u) => u.value === fixedUnit)?.label ?? fixedUnit}
        </span>
      ) : (
      <Select value={unit} onValueChange={onUnit}>
        <SelectTrigger className="h-10 w-28 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AREA_UNIT_OPTIONS.map((u) => (
            <SelectItem key={u.value} value={u.value}>
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      )}
    </div>
  );
}

export function formatIndian(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
}

export function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex h-10 items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
      <span className="px-3 text-sm text-muted-foreground">₹</span>
      <input
        value={formatIndian(value)}
        inputMode="numeric"
        placeholder={placeholder ?? "0"}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        className="h-full w-full bg-transparent pr-3 text-sm outline-none"
      />
    </div>
  );
}

/** Autocomplete over a known list that still allows free text. */
export function SuggestInput({
  value,
  onChange,
  suggestions,
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  id: string;
}) {
  return (
    <>
      <Input
        list={`${id}-list`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10"
        autoComplete="off"
      />
      <datalist id={`${id}-list`}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}

/* ------------------------------ generic renderer ---------------------------- */

export function DynamicField({
  field,
  value,
  areaUnit,
  onChange,
  onAreaUnit,
  error,
}: {
  field: FieldSpec;
  value: string;
  areaUnit: string;
  onChange: (v: string) => void;
  onAreaUnit: (v: string) => void;
  error?: string | undefined;
}) {
  const control = () => {
    switch (field.kind) {
      case "chips":
        return (
          <ChipGroup
            options={field.options ?? []}
            value={value}
            onChange={onChange}
            multiple={field.key === "x_extra_rooms"}
            ariaLabel={field.label}
          />
        );
      case "select":
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "area":
        return (
          <AreaInput
            value={value}
            unit={field.fixedUnit ?? areaUnit}
            onValue={onChange}
            onUnit={onAreaUnit}
            fixedUnit={field.fixedUnit}
          />
        );
      case "money":
        return <MoneyInput value={value} onChange={onChange} />;
      case "toggle":
        return (
          <label className="flex h-10 items-center gap-3 text-sm">
            <Switch checked={value === "true"} onCheckedChange={(v) => onChange(v ? "true" : "")} />
            <span className="text-muted-foreground">{field.label}</span>
          </label>
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10"
          />
        );
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );
      case "number":
        return (
          <div className="relative">
            <Input
              value={value}
              inputMode="numeric"
              placeholder={field.placeholder ?? "0"}
              onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
              className="h-10"
            />
            {field.suffix ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {field.suffix}
              </span>
            ) : null}
          </div>
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="h-10"
          />
        );
    }
  };

  return (
    <FieldShell
      label={field.kind === "toggle" ? undefined : field.label}
      required={field.required}
      error={error}
      className={field.wide || field.kind === "chips" ? "sm:col-span-2" : undefined}
    >
      {control()}
    </FieldShell>
  );
}
