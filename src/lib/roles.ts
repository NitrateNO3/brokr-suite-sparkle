import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums, Tables } from "@/integrations/supabase/types";

export type AppRole = Enums<"app_role">;
export type Profile = Tables<"profiles">;
export type UserRole = Tables<"user_roles">;

export const ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full access, can manage team roles" },
  { value: "manager", label: "Manager", description: "Manages listings and leads" },
  { value: "agent", label: "Agent", description: "Works assigned listings and leads" },
];

export function roleLabel(role: AppRole) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

/** Roles of the signed-in user. */
export function useMyRoles() {
  const query = useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [] as AppRole[];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id);
      if (error) throw error;
      return data.map((r) => r.role);
    },
  });
  const roles = query.data ?? [];
  return { ...query, roles, isAdmin: roles.includes("admin") };
}

/**
 * Single source of truth for UI permissions. These mirror the database policies —
 * the backend enforces the same rules, so bypassing the UI changes nothing.
 */
export function usePermissions() {
  const { roles, isLoading } = useMyRoles();
  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");
  const privileged = isAdmin || isManager;
  return {
    isLoading,
    roles,
    isAdmin,
    isManager,
    canManageTeam: isAdmin,
    canManageSettings: isAdmin,
    canDeleteProperty: privileged,
    canDeleteLead: privileged,
    canDeleteCustomer: privileged,
    canUploadMedia: privileged,
  };
}


/** Every teammate with their assigned roles. */
export function useTeamQuery() {
  return useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("*"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return (profiles ?? []).map((profile) => ({
        ...profile,
        roles: (roles ?? []).filter((r) => r.user_id === profile.id).map((r) => r.role),
      }));
    },
  });
}

export function useToggleRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
      enabled,
    }: {
      userId: string;
      role: AppRole;
      enabled: boolean;
    }) => {
      if (enabled) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["my-roles"] });
    },
  });
}
