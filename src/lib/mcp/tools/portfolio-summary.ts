import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "portfolio_summary",
  title: "Portfolio summary",
  description:
    "Summarise inventory and pipeline: listing counts by status, portfolio value, lead counts by status and follow-ups due.",
  inputSchema: {
    days: z.number().int().min(1).max(365).default(30).describe("Window in days for new leads."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const since = new Date(Date.now() - (input.days ?? 30) * 86_400_000).toISOString();

    const [props, leads] = await Promise.all([
      supabase.from("properties").select("status, price, city"),
      supabase.from("leads").select("status, created_at, follow_up_at"),
    ]);
    if (props.error) return fail(props.error.message);
    if (leads.error) return fail(leads.error.message);

    const byStatus: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    let portfolioValue = 0;
    for (const p of props.data ?? []) {
      const s = String(p.status ?? "unknown");
      byStatus[s] = (byStatus[s] ?? 0) + 1;
      const c = String(p.city ?? "unknown");
      byCity[c] = (byCity[c] ?? 0) + 1;
      portfolioValue += Number(p.price ?? 0);
    }

    const now = Date.now();
    const leadsByStatus: Record<string, number> = {};
    let recentLeads = 0;
    let dueFollowUps = 0;
    for (const l of leads.data ?? []) {
      const s = String(l.status ?? "unknown");
      leadsByStatus[s] = (leadsByStatus[s] ?? 0) + 1;
      if (l.created_at && l.created_at >= since) recentLeads += 1;
      if (l.follow_up_at && new Date(l.follow_up_at).getTime() <= now) dueFollowUps += 1;
    }

    return ok({
      properties: { total: props.data?.length ?? 0, by_status: byStatus, by_city: byCity, portfolio_value: portfolioValue },
      leads: { total: leads.data?.length ?? 0, by_status: leadsByStatus, [`new_last_${input.days ?? 30}_days`]: recentLeads, due_follow_ups: dueFollowUps },
    });
  },
});
