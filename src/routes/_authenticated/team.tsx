import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ShieldCheck, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES, roleLabel, useMyRoles, useTeamQuery, useToggleRole, type AppRole } from "@/lib/roles";
import { addTeamMember } from "@/lib/team.functions";
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

function AddTeamMemberDialog() {
  const qc = useQueryClient();
  const addMember = useServerFn(addTeamMember);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    jobTitle: "",
    role: "agent" as AppRole,
  });

  const mutation = useMutation({
    mutationFn: () =>
      addMember({
        data: {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          jobTitle: form.jobTitle || undefined,
          role: form.role,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Teammate added — share the sign-in details with them");
      setForm({ fullName: "", email: "", password: "", phone: "", jobTitle: "", role: "agent" });
      setOpen(false);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not add teammate"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Add teammate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="display-title">Add a teammate</DialogTitle>
          <DialogDescription>
            Creates their portal account with a temporary password you share with them.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Temporary password</Label>
            <Input
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Job title</Label>
            <Input
              value={form.jobTitle}
              placeholder="Sales advisor"
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as AppRole })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              Create account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
            ? "Add teammates and grant or revoke access levels for the workspace."
            : "Only admins can add teammates or change access levels."
        }
        actions={isAdmin ? <AddTeamMemberDialog /> : undefined}
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
