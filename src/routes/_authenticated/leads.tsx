import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquare, Phone, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeadsQuery, useUpdateLead, useDeleteLead } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import { LEAD_STATUSES } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];

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

function LeadsPage() {
  const { data, isLoading } = useLeadsQuery();
  const update = useUpdateLead();
  const remove = useDeleteLead();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((lead) => {
      if (status !== "all" && lead.status !== status) return false;
      if (!term) return true;
      return [lead.name, lead.email, lead.phone, lead.property_title]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [data, search, status]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    (data ?? []).forEach((l) => map.set(l.status, (map.get(l.status) ?? 0) + 1));
    return map;
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Enquiries captured from your public listing pages."
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
