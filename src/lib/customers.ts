import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Customer = Tables<"customers">;
export type CustomerNote = Tables<"customer_notes">;
export type CustomerDocument = Tables<"customer_documents">;
export type CustomerActivity = Tables<"customer_activity">;
export type PropertyShare = Tables<"property_shares">;
export type ShareEvent = Tables<"share_events">;
export type SiteVisit = Tables<"site_visits">;

export type CustomerStatus = Enums<"customer_status">;
export type CustomerPriority = Enums<"customer_priority">;
export type CustomerIntent = Enums<"customer_intent">;
export type ShareChannel = Enums<"share_channel">;
export type VisitStatus = Enums<"visit_status">;

export const CUSTOMER_STATUSES: { value: CustomerStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "following_up", label: "Following up" },
  { value: "negotiating", label: "Negotiating" },
  { value: "converted", label: "Converted" },
  { value: "inactive", label: "Inactive" },
  { value: "lost", label: "Lost" },
];

export const CUSTOMER_PRIORITIES: { value: CustomerPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "vip", label: "VIP" },
];

export const CUSTOMER_INTENTS: { value: CustomerIntent; label: string }[] = [
  { value: "buy", label: "Buying" },
  { value: "rent", label: "Renting" },
  { value: "lease", label: "Leasing" },
  { value: "invest", label: "Investing" },
];

export const VISIT_STATUSES: { value: VisitStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "no_show", label: "No show" },
];

export function labelOf<T extends string>(list: { value: T; label: string }[], value: T) {
  return list.find((item) => item.value === value)?.label ?? value;
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Append an entry to a customer's timeline. Best-effort — never blocks the caller. */
export async function logCustomerActivity(input: {
  customerId: string;
  kind: string;
  title: string;
  detail?: string | null;
  meta?: Record<string, unknown> | null;
}) {
  try {
    await supabase.from("customer_activity").insert({
      customer_id: input.customerId,
      kind: input.kind,
      title: input.title,
      detail: input.detail ?? null,
      meta: (input.meta ?? null) as never,
      actor_id: await currentUserId(),
    });
  } catch {
    /* timeline is non-critical */
  }
}

/* -------------------------------- customers ------------------------------- */

export function useCustomersQuery() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCustomerQuery(id?: string) {
  return useQuery({
    queryKey: ["customer", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"customers">) => {
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...values, created_by: await currentUserId() })
        .select()
        .single();
      if (error) throw error;
      await logCustomerActivity({
        customerId: data.id,
        kind: "created",
        title: "Customer created",
        detail: data.source ? `Source: ${data.source}` : null,
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"customers"> }) => {
      const { data, error } = await supabase
        .from("customers")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", data.id] });
      qc.invalidateQueries({ queryKey: ["customer-activity", data.id] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

/* ---------------------------------- notes --------------------------------- */

export function useCustomerNotesQuery(customerId?: string) {
  return useQuery({
    queryKey: ["customer-notes", customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_notes")
        .select("*")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddCustomerNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, body }: { customerId: string; body: string }) => {
      const { error } = await supabase
        .from("customer_notes")
        .insert({ customer_id: customerId, body, author_id: await currentUserId() });
      if (error) throw error;
      await logCustomerActivity({ customerId, kind: "note", title: "Note added", detail: body });
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["customer-notes", vars.customerId] });
      qc.invalidateQueries({ queryKey: ["customer-activity", vars.customerId] });
    },
  });
}

/* -------------------------------- documents ------------------------------- */

export function useCustomerDocumentsQuery(customerId?: string) {
  return useQuery({
    queryKey: ["customer-docs", customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_documents")
        .select("*")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddCustomerDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerId,
      url,
      name,
    }: {
      customerId: string;
      url: string;
      name: string;
    }) => {
      const { error } = await supabase.from("customer_documents").insert({
        customer_id: customerId,
        url,
        name,
        uploaded_by: await currentUserId(),
      });
      if (error) throw error;
      await logCustomerActivity({
        customerId,
        kind: "document",
        title: "Document uploaded",
        detail: name,
      });
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["customer-docs", vars.customerId] });
      qc.invalidateQueries({ queryKey: ["customer-activity", vars.customerId] });
    },
  });
}

export function useDeleteCustomerDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; customerId: string }) => {
      const { error } = await supabase.from("customer_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ["customer-docs", vars.customerId] }),
  });
}

/* -------------------------------- timeline -------------------------------- */

export function useCustomerActivityQuery(customerId?: string) {
  return useQuery({
    queryKey: ["customer-activity", customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_activity")
        .select("*")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

/* --------------------------------- shares --------------------------------- */

export type ShareWithItems = PropertyShare & {
  property_share_items: { property_id: string; is_favourite: boolean }[];
};

export function useCustomerSharesQuery(customerId?: string) {
  return useQuery({
    queryKey: ["customer-shares", customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_shares")
        .select("*, property_share_items(property_id, is_favourite)")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ShareWithItems[];
    },
  });
}

export function useRecentSharesQuery(limit = 12) {
  return useQuery({
    queryKey: ["recent-shares", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_shares")
        .select("*, property_share_items(property_id, is_favourite)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as ShareWithItems[];
    },
  });
}

export function useShareEventsQuery(shareId?: string) {
  return useQuery({
    queryKey: ["share-events", shareId],
    enabled: Boolean(shareId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("share_events")
        .select("*")
        .eq("share_id", shareId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Creates one share bundle per selected customer and returns the share links. */
export function useCreateShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      customerIds: string[];
      propertyIds: string[];
      channel: ShareChannel;
      title?: string | null;
      message?: string | null;
    }) => {
      const userId = await currentUserId();
      const targets = input.customerIds.length ? input.customerIds : [null];
      const results: { customerId: string | null; share: PropertyShare }[] = [];

      for (const customerId of targets) {
        const { data: share, error } = await supabase
          .from("property_shares")
          .insert({
            customer_id: customerId,
            channel: input.channel,
            title: input.title ?? null,
            message: input.message ?? null,
            shared_by: userId,
          })
          .select()
          .single();
        if (error) throw error;

        const { error: itemsError } = await supabase.from("property_share_items").insert(
          input.propertyIds.map((propertyId, index) => ({
            share_id: share.id,
            property_id: propertyId,
            sort_order: index,
          })),
        );
        if (itemsError) throw itemsError;

        await supabase.from("share_events").insert({ share_id: share.id, event: "sent" });

        if (customerId) {
          await logCustomerActivity({
            customerId,
            kind: "share",
            title: `${input.propertyIds.length} property(s) shared via ${input.channel}`,
            detail: input.title ?? null,
            meta: { share_id: share.id },
          });
        }
        results.push({ customerId, share });
      }
      return results;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-shares"] });
      qc.invalidateQueries({ queryKey: ["recent-shares"] });
      qc.invalidateQueries({ queryKey: ["customer-activity"] });
    },
  });
}

/* ------------------------------- site visits ------------------------------ */

export type SiteVisitRow = SiteVisit & {
  customers: { id: string; full_name: string; phone: string | null } | null;
  properties: { id: string; title: string; slug: string; city: string | null } | null;
  profiles: { id: string; full_name: string | null } | null;
};

export function useSiteVisitsQuery(customerId?: string) {
  return useQuery({
    queryKey: ["site-visits", customerId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("site_visits")
        .select(
          "*, customers(id, full_name, phone), properties(id, title, slug, city), profiles:agent_id(id, full_name)",
        )
        .order("scheduled_at", { ascending: true });
      if (customerId) q = q.eq("customer_id", customerId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as SiteVisitRow[];
    },
  });
}

export function useCreateSiteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"site_visits">) => {
      const { data, error } = await supabase
        .from("site_visits")
        .insert({ ...values, created_by: await currentUserId() })
        .select()
        .single();
      if (error) throw error;
      if (data.customer_id) {
        await logCustomerActivity({
          customerId: data.customer_id,
          kind: "visit",
          title: "Site visit scheduled",
          detail: new Date(data.scheduled_at).toLocaleString("en-IN"),
          meta: { visit_id: data.id },
        });
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-visits"] });
      qc.invalidateQueries({ queryKey: ["customer-activity"] });
    },
  });
}

export function useUpdateSiteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"site_visits"> }) => {
      const { error } = await supabase.from("site_visits").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-visits"] }),
  });
}

export function useDeleteSiteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-visits"] }),
  });
}

/** Converts a lead into a customer record (idempotent on phone). */
export function useConvertLeadToCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Tables<"leads">) => {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", lead.phone ?? "")
        .maybeSingle();
      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("customers")
        .insert({
          full_name: lead.name,
          phone: lead.phone,
          whatsapp: lead.phone,
          email: lead.email,
          notes: lead.message,
          source: lead.source ?? "lead",
          lead_id: lead.id,
          assigned_to: lead.assigned_to,
          status: "active",
          created_by: await currentUserId(),
        })
        .select("id")
        .single();
      if (error) throw error;
      await logCustomerActivity({
        customerId: data.id,
        kind: "created",
        title: "Converted from lead",
        detail: lead.property_title,
      });
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
