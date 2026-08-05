import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { isNativeApp } from "@/lib/native";
import { isConnected } from "@/lib/native/network";

const KEY = "brokrsuite.offline.property-drafts";

export type OfflineDraft = {
  id: string;
  createdAt: number;
  updatedAt: number;
  /** `null` for a brand-new listing, otherwise the property being edited. */
  propertyId: string | null;
  values: TablesInsert<"properties">;
};

/** Preferences on native (survives webview cache clears), localStorage on web. */
async function readRaw(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (isNativeApp()) {
    const { Preferences } = await import("@capacitor/preferences");
    return (await Preferences.get({ key: KEY })).value;
  }
  return window.localStorage.getItem(KEY);
}

async function writeRaw(value: string) {
  if (typeof window === "undefined") return;
  if (isNativeApp()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: KEY, value });
    return;
  }
  window.localStorage.setItem(KEY, value);
}

export async function listDrafts(): Promise<OfflineDraft[]> {
  try {
    const raw = await readRaw();
    return raw ? (JSON.parse(raw) as OfflineDraft[]) : [];
  } catch {
    return [];
  }
}

export async function saveDraft(
  draft: Omit<OfflineDraft, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<OfflineDraft> {
  const drafts = await listDrafts();
  const now = Date.now();
  const existing = draft.id ? drafts.find((d) => d.id === draft.id) : undefined;
  const next: OfflineDraft = {
    id: draft.id ?? `draft-${now}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    propertyId: draft.propertyId,
    values: draft.values,
  };
  const merged = existing
    ? drafts.map((d) => (d.id === next.id ? next : d))
    : [...drafts, next];
  await writeRaw(JSON.stringify(merged));
  return next;
}

export async function removeDraft(id: string) {
  const drafts = await listDrafts();
  await writeRaw(JSON.stringify(drafts.filter((d) => d.id !== id)));
}

/** Pushes every queued draft to the backend. Returns how many synced. */
export async function syncDrafts(): Promise<{ synced: number; failed: number }> {
  if (!(await isConnected())) return { synced: 0, failed: 0 };
  const drafts = await listDrafts();
  if (!drafts.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  for (const draft of drafts) {
    try {
      if (draft.propertyId) {
        const { error } = await supabase
          .from("properties")
          .update(draft.values)
          .eq("id", draft.propertyId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("properties").insert(draft.values);
        if (error) throw error;
      }
      await removeDraft(draft.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }
  return { synced, failed };
}

/** Draft count + a manual sync trigger, for banners and the sync indicator. */
export function useOfflineDrafts() {
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setCount((await listDrafts()).length);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await syncDrafts();
      await refresh();
      return result;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  return { count, syncing, sync, refresh };
}
