import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type LocationRow = Tables<"locations">;
export type DemandLevel = Enums<"demand_level">;

export const DEMAND_LEVELS: { value: DemandLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very high" },
];

export function useLocationsFullQuery() {
  return useQuery({
    queryKey: ["locations-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("city")
        .order("sector");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"locations">) => {
      const { data, error } = await supabase.from("locations").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations-full"] }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"locations"> }) => {
      const { error } = await supabase.from("locations").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations-full"] }),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations-full"] }),
  });
}

/** Bulk insert from a CSV with headers: city, area, sector, sub_sector, pin_code. */
export function useImportLocations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: TablesInsert<"locations">[]) => {
      if (!rows.length) throw new Error("Nothing to import.");
      const { error } = await supabase.from("locations").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations-full"] }),
  });
}

/** Moves every property from one sector label to another, then removes the source row. */
export function useMergeLocations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ source, target }: { source: LocationRow; target: LocationRow }) => {
      if (source.sector) {
        const { error } = await supabase
          .from("properties")
          .update({ city: target.city, sector: target.sector })
          .eq("city", source.city)
          .eq("sector", source.sector);
        if (error) throw error;
      }
      const { error: delError } = await supabase.from("locations").delete().eq("id", source.id);
      if (delError) throw delError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations-full"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function parseLocationCsv(text: string): TablesInsert<"locations">[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const rows: TablesInsert<"locations">[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((c) => c.trim());
    const city = idx("city") >= 0 ? cells[idx("city")] : undefined;
    if (!city) continue;
    rows.push({
      city,
      area: idx("area") >= 0 ? (cells[idx("area")] ?? null) : null,
      sector: idx("sector") >= 0 ? (cells[idx("sector")] ?? null) : null,
      sub_sector: idx("sub_sector") >= 0 ? (cells[idx("sub_sector")] ?? null) : null,
      pin_code: idx("pin_code") >= 0 ? (cells[idx("pin_code")] ?? null) : null,
    });
  }
  return rows;
}
