import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_leads",
  title: "List leads",
  description:
    "List buyer enquiries, optionally filtered by status or narrowed to follow-ups that are due.",
  inputSchema: {
    status: z.string().trim().optional().describe("Lead status, e.g. new, contacted, qualified."),
    due_follow_ups: z
      .boolean()
      .optional()
      .describe("Only leads whose next follow-up is due now or overdue."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("leads")
      .select(
        "id, name, email, phone, message, status, source, property_id, assigned_to, follow_up_at, last_contacted_at, notes, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 20);

    if (input.status) q = q.eq("status", input.status);
    if (input.due_follow_ups)
      q = q.not("follow_up_at", "is", null).lte("follow_up_at", new Date().toISOString());

    const { data, error } = await q;
    if (error) return fail(error.message);
    return ok({ count: data?.length ?? 0, leads: data ?? [] });
  },
});
