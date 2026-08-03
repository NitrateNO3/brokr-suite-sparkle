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

/** Public, RLS-scoped read of one published listing plus its gallery. */
export const getPublicProperty = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: property, error } = await supabase
      .from("properties")
      .select("*, property_images(*)")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!property) return null;

    // Redact anything the agent chose not to share, so hidden values never
    // reach the browser payload at all.
    const redacted = { ...property } as Record<string, unknown>;
    if (!property.share_show_price) {
      redacted["price"] = null;
      redacted["negotiable"] = false;
      redacted["maintenance_charges"] = null;
      redacted["booking_amount"] = null;
      redacted["security_deposit"] = null;
    }
    if (!property.share_show_location) {
      redacted["city"] = null;
      redacted["sector"] = null;
      redacted["pin_code"] = null;
    }
    if (!property.share_show_address) {
      redacted["address"] = null;
      redacted["landmark"] = null;
      redacted["latitude"] = null;
      redacted["longitude"] = null;
      redacted["maps_url"] = null;
    }
    if (!property.share_show_specs) {
      for (const key of [
        "bedrooms",
        "bathrooms",
        "balconies",
        "parking",
        "floor_no",
        "total_floors",
        "facing",
        "furnishing",
        "super_area",
        "carpet_area",
        "builtup_area",
        "super_area",
      ]) {
        redacted[key] = null;
      }
    }
    if (!property.share_show_description) redacted["description"] = null;
    if (!property.share_show_amenities) redacted["amenities"] = [];
    if (!property.share_show_contact) {
      redacted["agent_phone"] = null;
      redacted["agent_whatsapp"] = null;
      redacted["agent_email"] = null;
      redacted["agent_office"] = null;
    }
    return redacted as typeof property;
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
