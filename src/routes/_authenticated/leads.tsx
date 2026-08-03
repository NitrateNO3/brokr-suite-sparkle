import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock,
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeadsQuery, useUpdateLead, useDeleteLead, useCreateLead } from "@/lib/queries";
import { useTeamQuery } from "@/lib/roles";
import { timeAgo } from "@/lib/format";
import {
  FOLLOW_UP_LABEL,
  FOLLOW_UP_TONE,
  followUpState,
  formatFollowUp,
  fromLocalInput,
  toLocalInput,
} from "@/lib/followup";
import { LEAD_STATUSES } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];

const UNASSIGNED = "unassigned";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "Leads — BrokrSuite" },
      {
        name: "description",
        content: "Track enquiries from public property pages, update status and keep notes.",
      },
      { property: "og:title", content: "Leads — BrokrSuite" },
      { property: "og:description", content: "Every buyer enquiry in one pipeline." },
    ],
  }),
  component: LeadsPage,
});

function AddLeadDialog({ team }: { team: { id: string; full_name: string | null; email: string | null }[] }) {
  const create = useCreateLead();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    property_title: "",
    source: "Walk-in",
    message: "",
    assigned_to: UNASSIGNED,
    follow_up: "",
  });

  const reset = () =>
    setForm({
      name: "",
      phone: "",
      email: "",
      property_title: "",
      source: "Walk-in",
      message: "",
      assigned_to: UNASSIGNED,
      follow_up: "",
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Add lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="display-title">Add a lead</DialogTitle>
          <DialogDescription>
            Log an enquiry that came in by phone, walk-in or referral and assign it to a teammate.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              {
                name: form.name,
                phone: form.phone || null,
                email: form.email || null,
                property_title: form.property_title || null,
                source: form.source || null,
                message: form.message || null,
                assigned_to: form.assigned_to === UNASSIGNED ? null : form.assigned_to,
                follow_up_at: fromLocalInput(form.follow_up),
              },
              {
                onSuccess: () => {
                  toast.success("Lead added");
                  reset();
                  setOpen(false);
                },
                onError: (error) =>
                  toast.error(error instanceof Error ? error.message : "Could not add lead"),
              },
            );
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input
                value={form.source}
                placeholder="Walk-in, referral, portal…"
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Interested in</Label>
              <Input
                value={form.property_title}
                placeholder="Property or requirement"
                onChange={(e) => setForm({ ...form, property_title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Assign to</Label>
              <Select
                value={form.assigned_to}
                onValueChange={(v) => setForm({ ...form, assigned_to: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {team.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name ?? member.email ?? "Teammate"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Next follow-up</Label>
              <Input
                type="datetime-local"
                value={form.follow_up}
                onChange={(e) => setForm({ ...form, follow_up: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes / requirement</Label>
              <Textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              Save lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LeadsPage() {
  const { data, isLoading } = useLeadsQuery();
  const { data: team } = useTeamQuery();
  const update = useUpdateLead();
  const remove = useDeleteLead();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [owner, setOwner] = useState("all");
  const [dueOnly, setDueOnly] = useState(false);

  const members = useMemo(() => team ?? [], [team]);
  const nameOf = (id: string | null) => {
    if (!id) return "Unassigned";
    const member = members.find((m) => m.id === id);
    return member?.full_name ?? member?.email ?? "Teammate";
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((lead) => {
      if (status !== "all" && lead.status !== status) return false;
      if (owner === UNASSIGNED && lead.assigned_to) return false;
      if (owner !== "all" && owner !== UNASSIGNED && lead.assigned_to !== owner) return false;
      if (dueOnly && !["overdue", "today"].includes(followUpState(lead.follow_up_at))) return false;
      if (!term) return true;
      return [lead.name, lead.email, lead.phone, lead.property_title]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [data, search, status, owner, dueOnly]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    (data ?? []).forEach((l) => map.set(l.status, (map.get(l.status) ?? 0) + 1));
    return map;
  }, [data]);

  const dueCount = useMemo(
    () =>
      (data ?? []).filter((l) => ["overdue", "today"].includes(followUpState(l.follow_up_at)))
        .length,
    [data],
  );



  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Enquiries from your public listings plus anything you log manually."
        actions={<AddLeadDialog team={members} />}
      />

      <div className="flex flex-wrap gap-2">
        {LEAD_STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(status === s.value ? "all" : s.value)}
            className={`surface px-4 py-2 text-xs transition-colors ${
              status === s.value ? "ring-2 ring-primary" : ""
            }`}
          >
            <span className="font-medium">{s.label}</span>{" "}
            <span className="text-muted-foreground">{counts.get(s.value) ?? 0}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDueOnly((v) => !v)}
          className={`surface flex items-center gap-1.5 px-4 py-2 text-xs transition-colors ${
            dueOnly ? "ring-2 ring-primary" : ""
          }`}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          <span className="font-medium">Follow-ups due</span>{" "}
          <span className="text-muted-foreground">{dueCount}</span>
        </button>
      </div>


      <div className="surface flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, phone, email or property…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.full_name ?? member.email ?? "Teammate"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads yet"
          description="Enquiries submitted on your public property pages will appear here."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((lead) => (
            <div key={lead.id} className="surface space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{lead.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.property_title ?? "General enquiry"} · {timeAgo(lead.created_at)}
                  </p>
                </div>
                <StatusBadge status={lead.status} kind="lead" />
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {lead.phone && (
                  <a className="flex items-center gap-1 hover:text-foreground" href={`tel:${lead.phone}`}>
                    <Phone className="h-3.5 w-3.5" /> {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a className="flex items-center gap-1 hover:text-foreground" href={`mailto:${lead.email}`}>
                    <Mail className="h-3.5 w-3.5" /> {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a
                    className="flex items-center gap-1 hover:text-foreground"
                    href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
              </div>

              {lead.message && (
                <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                  {lead.message}
                </p>
              )}

              <Textarea
                rows={2}
                placeholder="Internal notes…"
                defaultValue={lead.notes ?? ""}
                onBlur={(e) => {
                  if (e.target.value === (lead.notes ?? "")) return;
                  update.mutate({ id: lead.id, values: { notes: e.target.value } });
                }}
              />

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" /> {nameOf(lead.assigned_to)}
                </span>
                <Select
                  value={lead.assigned_to ?? UNASSIGNED}
                  onValueChange={(value) =>
                    update.mutate(
                      {
                        id: lead.id,
                        values: { assigned_to: value === UNASSIGNED ? null : value },
                      },
                      {
                        onSuccess: () =>
                          toast.success(
                            value === UNASSIGNED
                              ? "Lead unassigned"
                              : `Assigned to ${nameOf(value)}`,
                          ),
                      },
                    )
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Assign to teammate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name ?? member.email ?? "Teammate"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="flex items-center gap-2">
                <Select
                  value={lead.status}
                  onValueChange={(value) =>
                    update.mutate(
                      { id: lead.id, values: { status: value as LeadStatus } },
                      { onSuccess: () => toast.success("Lead updated") },
                    )
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete lead"
                  onClick={() =>
                    remove.mutate(lead.id, { onSuccess: () => toast.success("Lead removed") })
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
