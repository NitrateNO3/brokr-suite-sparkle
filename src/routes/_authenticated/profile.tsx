import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useSignOut } from "@/hooks/useSignOut";
import { useActivityQuery } from "@/lib/queries";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — BrokrSuite" },
      {
        name: "description",
        content: "Your account details and a running log of recent workspace activity.",
      },
      { property: "og:title", content: "Profile — BrokrSuite" },
      { property: "og:description", content: "Account and activity history." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, loading } = useAuth();
  const signOut = useSignOut();
  const { data: activity } = useActivityQuery();
  const email = session?.user.email ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your BrokrSuite account for the Deep Real Estate workspace."
        actions={
          <Button variant="secondary" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5">
          {loading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : (
            <>
              <span className="brand-gradient flex h-14 w-14 items-center justify-center rounded-full text-xl text-primary-foreground">
                {email.charAt(0).toUpperCase()}
              </span>
              <p className="mt-4 font-medium">{email}</p>
              <p className="text-xs text-muted-foreground">Agency administrator</p>
              <dl className="mt-5 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Signed in since</dt>
                  <dd>{timeAgo(new Date(Date.now()).toISOString())}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Workspace</dt>
                  <dd>Deep Real Estate</dd>
                </div>
              </dl>
            </>
          )}
        </div>

        <div className="surface p-5 lg:col-span-2">
          <p className="display-title text-lg">Recent activity</p>
          <div className="mt-4 space-y-3">
            {(activity ?? []).map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 border-b border-border pb-3 last:border-0"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actor_email ?? "System"} · {timeAgo(entry.created_at)}
                  </p>
                </div>
              </div>
            ))}
            {(activity?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
