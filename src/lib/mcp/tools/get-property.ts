import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_property",
  title: "Get property details",
  description: "Fetch one property with its images, by property id, slug or property code.",
  inputSchema: {
    id: z.string().trim().optional().describe("Property UUID."),
    slug: z.string().trim().optional().describe("Public listing slug."),
    property_code: z.string().trim().optional().describe("Internal property code."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    if (!input.id && !input.slug && !input.property_code)
      return fail("Provide one of id, slug or property_code.");

    const supabase = supabaseForUser(ctx);
    let q = supabase.from("properties").select("*, property_images(*)").limit(1);
    if (input.id) q = q.eq("id", input.id);
    else if (input.slug) q = q.eq("slug", input.slug);
    else q = q.eq("property_code", input.property_code!);

    const { data, error } = await q.maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("No matching property found.");
    return ok(data);
  },
});
