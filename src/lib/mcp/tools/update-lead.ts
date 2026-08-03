import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "update_lead",
  title: "Update lead",
  description:
    "Update a lead's status, internal notes, assignee or next follow-up date/time.",
  inputSchema: {
    id: z.string().trim().min(1).describe("Lead UUID."),
    status: z.string().trim().optional().describe("new, contacted, qualified, negotiating, won, lost."),
    notes: z.string().trim().optional(),
    assigned_to: z.string().trim().optional().describe("Teammate profile UUID."),
    follow_up_at: z.string().trim().optional().describe("ISO timestamp for the next follow-up."),
    mark_contacted: z.boolean().optional().describe("Stamp last contacted now and clear the pending follow-up."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const patch: Record<string, unknown> = {};
    if (input.status) patch['status'] = input.status;
    if (input.notes !== undefined) patch['notes'] = input.notes;
    if (input.assigned_to) patch['assigned_to'] = input.assigned_to;
    if (input.follow_up_at) patch['follow_up_at'] = input.follow_up_at;
    if (input.mark_contacted) {
      patch['last_contacted_at'] = new Date().toISOString();
      patch['follow_up_at'] = null;
    }
    if (!Object.keys(patch).length) return fail("Nothing to update.");

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("leads")
      .update(patch as never)
      .eq("id", input.id)
      .select()
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("Lead not found.");
    return ok(data);
  },
});
