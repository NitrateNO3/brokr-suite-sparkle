import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Property = Tables<"properties">;
export type PropertyImage = Tables<"property_images">;
export type Lead = Tables<"leads">;
export type Settings = Tables<"settings">;
export type Amenity = Tables<"amenities">;
export type LocationRow = Tables<"locations">;
export type ActivityRow = Tables<"activity_log">;

/* ------------------------------- properties ------------------------------- */

export function usePropertiesQuery() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePropertyQuery(id?: string) {
  return useQuery({
    queryKey: ["property", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as (Property & { property_images: PropertyImage[] }) | null;
    },
  });
}

export function usePropertyImagesQuery(propertyId?: string) {
  return useQuery({
    queryKey: ["property-images", propertyId],
    enabled: Boolean(propertyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", propertyId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useAllImagesQuery() {
  return useQuery({
    queryKey: ["all-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_images")
        .select("*, properties(title, slug)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as (PropertyImage & { properties: { title: string; slug: string } | null })[];
    },
  });
}

async function logActivity(action: string, entity: string, entityId?: string) {
  const { data } = await supabase.auth.getUser();
  await supabase.from("activity_log").insert({
    action,
    entity,
    entity_id: entityId ?? null,
    actor_id: data.user?.id ?? null,
    actor_email: data.user?.email ?? null,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"properties">) => {
      const { data, error } = await supabase.from("properties").insert(values).select().single();
      if (error) throw error;
      await logActivity("Created property", "property", data.id);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"properties"> }) => {
      const { data, error } = await supabase
        .from("properties")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logActivity("Updated property", "property", id);
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["property", vars.id] });
    },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
      await logActivity("Deleted property", "property", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useDuplicateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (property: Property) => {
      const {
        id: _id,
        created_at: _c,
        updated_at: _u,
        property_code: _pc,
        views: _v,
        ...rest
      } = property;
      const suffix = Math.random().toString(36).slice(2, 6);
      const { data, error } = await supabase
        .from("properties")
        .insert({
          ...rest,
          title: `${property.title} (Copy)`,
          slug: `${property.slug}-${suffix}`,
          property_code: `DRE-${suffix.toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`,
          status: "draft",
          is_published: false,
        })
        .select()
        .single();
      if (error) throw error;
      await logActivity("Duplicated property", "property", data.id);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

/* ---------------------------------- leads --------------------------------- */

export function useLeadsQuery() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"leads">) => {
      const { data, error } = await supabase.from("leads").insert(values).select().single();
      if (error) throw error;
      await logActivity("Added lead", "lead", data.id);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"leads"> }) => {
      const { error } = await supabase.from("leads").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

/* -------------------------------- reference ------------------------------- */

export function useAmenitiesQuery() {
  return useQuery({
    queryKey: ["amenities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("amenities").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useLocationsQuery() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("locations").select("*").order("city");
      if (error) throw error;
      return data;
    },
  });
}

export function useSettingsQuery() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"settings"> }) => {
      const { error } = await supabase.from("settings").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useActivityQuery() {
  return useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
}

export function useViewsQuery() {
  return useQuery({
    queryKey: ["property-views"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_views")
        .select("id, property_id, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });
}
