import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(80),
  phone: z.string().max(30).optional(),
  jobTitle: z.string().max(80).optional(),
  role: z.enum(["admin", "manager", "agent"]),
});

/** Admin-only: create a teammate account and assign their starting role. */
export const addTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof schema>) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: adminRow, error: roleError } = await context.supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw roleError;
    if (!adminRow) throw new Error("Only admins can add teammates");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error) throw new Error(error.message);
    const userId = created.user?.id;
    if (!userId) throw new Error("Could not create the teammate account");

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone ?? null,
      job_title: data.jobTitle ?? null,
    });

    const { error: grantError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (grantError && grantError.code !== "23505") throw grantError;

    return { id: userId };
  });
