import { useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatRupees } from "@/lib/format";

/** Simple reducing-balance EMI estimate shown alongside the asking price. */
export function EmiCalculator({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const { loan, emi, total, interest } = useMemo(() => {
    const principal = Math.max(price * (1 - downPct / 100), 0);
    const r = rate / 12 / 100;
    const n = years * 12;
    const monthly = r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    const value = Number.isFinite(monthly) ? Math.round(monthly) : 0;
    return {
      loan: Math.round(principal),
      emi: value,
      total: value * n,
      interest: Math.max(value * n - principal, 0),
    };
  }, [price, downPct, rate, years]);

  if (!price || price <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Enter an expected price to see the EMI estimate.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="space-y-5">
        <SliderRow
          label="Down payment"
          value={`${downPct}% · ${formatRupees(Math.round((price * downPct) / 100))}`}
          min={0}
          max={80}
          step={5}
          current={downPct}
          onChange={setDownPct}
        />
        <SliderRow
          label="Interest rate"
          value={`${rate.toFixed(1)}% p.a.`}
          min={6}
          max={14}
          step={0.1}
          current={rate}
          onChange={setRate}
        />
        <SliderRow
          label="Tenure"
          value={`${years} years`}
          min={5}
          max={30}
          step={1}
          current={years}
          onChange={setYears}
        />
      </div>
      <div className="rounded-2xl border border-border bg-muted/40 p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly EMI</p>
        <p className="display-title text-2xl text-primary">{formatRupees(emi)}</p>
        <dl className="mt-4 space-y-2 text-xs text-muted-foreground">
          <Row label="Loan amount" value={formatRupees(loan)} />
          <Row label="Total interest" value={formatRupees(Math.round(interest))} />
          <Row label="Total payable" value={formatRupees(Math.round(total))} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[current]}
        onValueChange={([next]) => onChange(next ?? current)}
        aria-label={label}
      />
    </div>
  );
}
