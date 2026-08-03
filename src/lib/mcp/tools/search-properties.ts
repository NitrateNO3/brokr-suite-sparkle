import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "search_properties",
  title: "Search properties",
  description:
    "Search the agency property inventory by keyword, city, status, purpose or price range.",
  inputSchema: {
    query: z.string().trim().optional().describe("Free-text match on title, address or property code."),
    city: z.string().trim().optional().describe("City filter, e.g. Gurgaon."),
    status: z.string().trim().optional().describe("Listing status, e.g. published, draft, sold."),
    purpose: z.string().trim().optional().describe("sale or rent."),
    min_price: z.number().optional(),
    max_price: z.number().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("properties")
      .select("id, property_code, title, slug, city, sector, address, price, purpose, status, property_type, bedrooms, bathrooms, area, area_unit, created_at")
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 20);

    if (input.query) q = q.or(`title.ilike.%${input.query}%,address.ilike.%${input.query}%,property_code.ilike.%${input.query}%`);
    if (input.city) q = q.ilike("city", `%${input.city}%`);
    if (input.status) q = q.eq("status", input.status);
    if (input.purpose) q = q.eq("purpose", input.purpose);
    if (typeof input.min_price === "number") q = q.gte("price", input.min_price);
    if (typeof input.max_price === "number") q = q.lte("price", input.max_price);

    const { data, error } = await q;
    if (error) return fail(error.message);
    return ok({ count: data?.length ?? 0, properties: data ?? [] });
  },
});
