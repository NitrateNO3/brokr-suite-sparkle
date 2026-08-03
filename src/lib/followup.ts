/** Helpers for lead follow-up scheduling. */

/** ISO timestamp -> value for <input type="datetime-local">. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

/** datetime-local value -> ISO timestamp (or null when cleared). */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type FollowUpState = "overdue" | "today" | "upcoming" | "none";

export function followUpState(iso: string | null | undefined): FollowUpState {
  if (!iso) return "none";
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return "none";
  const now = new Date();
  if (due.getTime() < now.getTime()) return "overdue";
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return due.getTime() <= endOfDay.getTime() ? "today" : "upcoming";
}

export function formatFollowUp(iso: string | null | undefined): string {
  if (!iso) return "No follow-up set";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "No follow-up set";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const FOLLOW_UP_TONE: Record<FollowUpState, string> = {
  overdue: "text-destructive",
  today: "text-primary",
  upcoming: "text-muted-foreground",
  none: "text-muted-foreground",
};

export const FOLLOW_UP_LABEL: Record<FollowUpState, string> = {
  overdue: "Overdue",
  today: "Due today",
  upcoming: "Scheduled",
  none: "Not scheduled",
};

/** Quick presets in hours from now. */
export const FOLLOW_UP_PRESETS = [
  { label: "Tomorrow 10am", hours: 24, at: 10 },
  { label: "In 3 days", hours: 72 },
  { label: "Next week", hours: 24 * 7 },
] as const;

export function presetIso(preset: { hours: number; at?: number }): string {
  const d = new Date(Date.now() + preset.hours * 3600 * 1000);
  if (preset.at !== undefined) d.setHours(preset.at, 0, 0, 0);
  return d.toISOString();
}
