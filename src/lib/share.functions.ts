import { createServerFn } from "@tanstack/react-start";

type RpcCaller = (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

export type SharedPropertyCard = {
  id: string;
  slug: string;
  title: string;
  cover_image: string | null;
  property_type: string;
  purpose: string;
  price: number | null;
  city: string | null;
  sector: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  super_area: number | null;
  area_unit: string;
  is_favourite: boolean;
};

export type ShareBundle = {
  id: string;
  title: string | null;
  message: string | null;
  created_at: string;
  customer_name: string | null;
  properties: SharedPropertyCard[];
};

/** Reads a shared collection by its public token. Redaction happens in the database. */
export const getShareBundle = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bundle, error } = await (supabaseAdmin.rpc as unknown as RpcCaller)(
      "get_share_bundle",
      { p_token: data.token },
    );
    if (error) throw new Error(error.message);
    if (!bundle) return null;
    return bundle as ShareBundle;
  });

/** Records opened / viewed / favourite / enquiry / visit activity for a share link. */
export const recordShareEvent = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      token: string;
      event:
        | "opened"
        | "viewed"
        | "favourite"
        | "brochure_downloaded"
        | "enquiry"
        | "visit_booked"
        | "reshared";
      propertyId?: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.rpc as unknown as RpcCaller)("record_share_event", {
      p_token: data.token,
      p_event: data.event,
      p_property_id: data.propertyId ?? null,
      p_meta: null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
