import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ROLES, roleLabel, useMyRoles, useTeamQuery, useToggleRole } from "@/lib/roles";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team & roles — BrokrSuite" },
      {
        name: "description",
        content:
          "Manage agency teammates and control who is an admin, manager or agent in the portal.",
      },
      { property: "og:title", content: "Team & roles — BrokrSuite" },
      { property: "og:description", content: "Control access levels for your agency team." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { data, isLoading } = useTeamQuery();
  const { isAdmin } = useMyRoles();
  const toggle = useToggleRole();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team & roles"
        description={
          isAdmin
            ? "Grant or revoke access levels for everyone in the workspace."
            : "Only admins can change access levels."
        }
      />

      <div className="surface flex flex-wrap gap-4 p-4 text-xs text-muted-foreground">
        {ROLES.map((role) => (
          <div key={role.value} className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-brass" />
            <span>
              <span className="font-medium text-foreground">{role.label}</span> — {role.description}
            </span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={Users}
          title="No teammates yet"
          description="Anyone who signs up with your agency account appears here automatically."
        />
      ) : (
        <div className="space-y-3">
          {data.map((member) => (
            <div
              key={member.id}
              className="surface flex flex-col gap-4 p-4 lg:flex-row lg:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{member.full_name ?? "Unnamed teammate"}</p>
                  {member.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {roleLabel(role)}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {member.email ?? "—"}
                  {member.phone ? ` · ${member.phone}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Joined {formatDate(member.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {ROLES.map((role) => (
                  <label key={role.value} className="flex items-center gap-2 text-sm">
                    <Switch
                      disabled={!isAdmin || toggle.isPending}
                      checked={member.roles.includes(role.value)}
                      onCheckedChange={(enabled) =>
                        toggle.mutate(
                          { userId: member.id, role: role.value, enabled },
                          {
                            onSuccess: () =>
                              toast.success(
                                `${role.label} ${enabled ? "granted" : "revoked"} for ${
                                  member.full_name ?? member.email ?? "teammate"
                                }`,
                              ),
                            onError: (error) =>
                              toast.error(
                                error instanceof Error ? error.message : "Could not update role",
                              ),
                          },
                        )
                      }
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
