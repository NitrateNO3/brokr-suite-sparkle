import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "create_lead",
  title: "Create lead",
  description: "Log a new buyer enquiry (walk-in, phone or referral) in the CRM.",
  inputSchema: {
    name: z.string().trim().min(1).describe("Lead's full name."),
    phone: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
    message: z.string().trim().optional().describe("What the lead is looking for."),
    source: z.string().trim().optional().describe("e.g. phone, walk-in, referral."),
    property_id: z.string().trim().optional().describe("Property UUID the enquiry relates to."),
    follow_up_at: z.string().trim().optional().describe("ISO timestamp for the next follow-up."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: input.name,
        phone: input.phone ?? null,
        email: input.email ?? null,
        message: input.message ?? null,
        source: input.source ?? "mcp",
        property_id: input.property_id ?? null,
        follow_up_at: input.follow_up_at ?? null,
      })
      .select()
      .maybeSingle();
    if (error) return fail(error.message);
    return ok(data);
  },
});
