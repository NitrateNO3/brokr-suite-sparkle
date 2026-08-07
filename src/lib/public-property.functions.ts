import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export type PublicProperty = Database["public"]["Tables"]["properties"]["Row"] & {
  property_images: Database["public"]["Tables"]["property_images"]["Row"][];
  property_videos: { id: string; url: string; title: string | null }[];
  property_documents: { id: string; url: string; name: string; doc_type: string | null }[];
};

export type PublicPropertyCard = {
  slug: string;
  title: string;
  property_type: string;
  purpose: string;
  cover_image: string | null;
  price: number | null;
  city: string | null;
  sector: string | null;
  bedrooms: number | null;
  super_area: number | null;
  area_unit: string;
};

type RpcCaller = (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

/**
 * Public read of one published listing plus its gallery.
 * Redaction happens inside the database function, so hidden fields never leave
 * the server and cannot be recovered by querying the table directly.
 */
export const getPublicProperty = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    // Redaction happens inside a SECURITY DEFINER routine that only the trusted
    // server role may execute, so it is called with the server-side client.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: property, error } = await (supabaseAdmin.rpc as unknown as RpcCaller)(
      "get_published_property",
      { p_slug: data.slug },
    );
    if (error) throw new Error(error.message);
    if (!property) return null;
    return property as PublicProperty;
  });

/** Compact public cards used for the "similar" and "recent" strips. */
export const getPublicPropertyCards = createServerFn({ method: "GET" })
  .inputValidator(
    (data: { excludeSlug?: string; city?: string | null; propertyType?: string | null }) => data,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cards, error } = await (supabaseAdmin.rpc as unknown as RpcCaller)(
      "list_published_property_cards",
      {
        p_exclude_slug: data.excludeSlug ?? null,
        p_city: data.city ?? null,
        p_property_type: data.propertyType ?? null,
        p_limit: 8,
      },
    );
    if (error) throw new Error(error.message);
    return (cards ?? []) as PublicPropertyCard[];
  });

/** Records an anonymous page view and bumps the denormalised counter. */
export const recordPropertyView = createServerFn({ method: "POST" })
  .inputValidator((data: { propertyId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    await supabase.from("property_views").insert({ property_id: data.propertyId });
    return { ok: true };
  });

/** Public enquiry submission from a listing page. */
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      name: string;
      phone: string;
      email?: string;
      message?: string;
      propertyId?: string;
      propertyTitle?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { error } = await supabase.from("leads").insert({
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      message: data.message ?? null,
      property_id: data.propertyId ?? null,
      property_title: data.propertyTitle ?? null,
      source: "Property page",
    });
    if (error) throw error;
    return { ok: true };
  });
