import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList, Plus, Trash2, UserRound } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useTeamQuery } from "@/lib/roles";
import { usePropertiesQuery } from "@/lib/queries";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  useCreateTask,
  useDeleteTask,
  useTasksQuery,
  useUpdateTask,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";
import {
  FOLLOW_UP_TONE,
  followUpState,
  formatFollowUp,
  fromLocalInput,
  toLocalInput,
} from "@/lib/followup";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks & assignments — BrokrSuite" },
      {
        name: "description",
        content:
          "Assign follow-ups, site visits and listing work to your agency teammates and track progress.",
      },
      { property: "og:title", content: "Tasks & assignments — BrokrSuite" },
      {
        property: "og:description",
        content: "Delegate work to agents and track every task to completion.",
      },
    ],
  }),
  component: TasksPage,
});

const UNASSIGNED = "unassigned";
const NO_PROPERTY = "none";

const PRIORITY_TONE: Record<TaskPriority, string> = {
  low: "text-muted-foreground",
  medium: "text-primary",
  high: "text-destructive",
};

function AddTaskDialog() {
  const create = useCreateTask();
  const { data: team } = useTeamQuery();
  const { data: properties } = usePropertiesQuery();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    details: "",
    assigned_to: UNASSIGNED,
    property_id: NO_PROPERTY,
    priority: "medium" as TaskPriority,
    due_at: "",
  });

  const reset = () =>
    setForm({
      title: "",
      details: "",
      assigned_to: UNASSIGNED,
      property_id: NO_PROPERTY,
      priority: "medium",
      due_at: "",
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="display-title">Assign a task</DialogTitle>
          <DialogDescription>
            Give a teammate something to do — a site visit, a callback or listing paperwork.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              {
                title: form.title,
                details: form.details || null,
                assigned_to: form.assigned_to === UNASSIGNED ? null : form.assigned_to,
                property_id: form.property_id === NO_PROPERTY ? null : form.property_id,
                priority: form.priority,
                due_at: fromLocalInput(form.due_at),
              },
              {
                onSuccess: () => {
                  toast.success("Task assigned");
                  reset();
                  setOpen(false);
                },
                onError: (error) =>
                  toast.error(error instanceof Error ? error.message : "Could not create the task"),
              },
            );
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Task</Label>
            <Input
              required
              placeholder="Call back the Sector 62 buyer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Details</Label>
            <Textarea
              rows={3}
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select
              value={form.assigned_to}
              onValueChange={(v) => setForm({ ...form, assigned_to: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {(team ?? []).map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name ?? member.email ?? "Teammate"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Related property</Label>
            <Select
              value={form.property_id}
              onValueChange={(v) => setForm({ ...form, property_id: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROPERTY}>None</SelectItem>
                {(properties ?? []).map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Due</Label>
            <Input
              type="datetime-local"
              value={form.due_at}
              onChange={(e) => setForm({ ...form, due_at: e.target.value })}
            />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={create.isPending}>
              Assign task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TasksPage() {
  const { data, isLoading } = useTasksQuery();
  const { data: team } = useTeamQuery();
  const { data: properties } = usePropertiesQuery();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const [owner, setOwner] = useState("all");
  const [status, setStatus] = useState("all");

  const nameOf = (id: string | null) =>
    (team ?? []).find((m) => m.id === id)?.full_name ??
    (team ?? []).find((m) => m.id === id)?.email ??
    "Unassigned";

  const titleOf = (id: string | null) => (properties ?? []).find((p) => p.id === id)?.title ?? null;

  const filtered = useMemo(
    () =>
      (data ?? []).filter((task) => {
        if (owner === UNASSIGNED && task.assigned_to) return false;
        if (owner !== "all" && owner !== UNASSIGNED && task.assigned_to !== owner) return false;
        if (status !== "all" && task.status !== status) return false;
        return true;
      }),
    [data, owner, status],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & assignments"
        description="Delegate work to your team and track every follow-up to completion."
        actions={<AddTaskDialog />}
      />

      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {(team ?? []).map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.full_name ?? member.email ?? "Teammate"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks yet"
          description="Assign a callback, site visit or listing update to a teammate to get started."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="surface flex flex-col gap-4 p-4 lg:flex-row lg:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{task.title}</p>
                  <Badge variant="secondary" className={PRIORITY_TONE[task.priority]}>
                    {TASK_PRIORITIES.find((p) => p.value === task.priority)?.label}
                  </Badge>
                  {task.status === "done" && (
                    <Badge variant="outline">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </Badge>
                  )}
                </div>
                {task.details && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.details}</p>
                )}
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" /> {nameOf(task.assigned_to)}
                  </span>
                  <span className={FOLLOW_UP_TONE[followUpState(task.due_at)]}>
                    {task.due_at ? formatFollowUp(task.due_at) : "No due date"}
                  </span>
                  {titleOf(task.property_id) && <span>· {titleOf(task.property_id)}</span>}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={task.assigned_to ?? UNASSIGNED}
                  onValueChange={(v) =>
                    update.mutate(
                      { id: task.id, values: { assigned_to: v === UNASSIGNED ? null : v } },
                      {
                        onSuccess: () => toast.success("Task reassigned"),
                        onError: (error) =>
                          toast.error(
                            error instanceof Error ? error.message : "Could not reassign",
                          ),
                      },
                    )
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {(team ?? []).map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name ?? member.email ?? "Teammate"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={task.status}
                  onValueChange={(v) =>
                    update.mutate({
                      id: task.id,
                      values: {
                        status: v as TaskStatus,
                        completed_at: v === "done" ? new Date().toISOString() : null,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="datetime-local"
                  className="w-52"
                  value={toLocalInput(task.due_at)}
                  onChange={(e) =>
                    update.mutate({
                      id: task.id,
                      values: { due_at: fromLocalInput(e.target.value) },
                    })
                  }
                />

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete task"
                  onClick={() =>
                    remove.mutate(task.id, {
                      onSuccess: () => toast.success("Task deleted"),
                      onError: (error) =>
                        toast.error(error instanceof Error ? error.message : "Could not delete"),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
