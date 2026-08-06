import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, LogOut, Upload } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useSignOut } from "@/hooks/useSignOut";
import { useActivityQuery } from "@/lib/queries";
import { useChangePassword, useMyProfile, useUpdateMyProfile } from "@/lib/profile";
import { uploadToStorage } from "@/lib/storage";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — BrokrSuite" },
      {
        name: "description",
        content: "Edit your account details, avatar and password, and review recent activity.",
      },
      { property: "og:title", content: "Profile — BrokrSuite" },
      { property: "og:description", content: "Account settings and activity history." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, loading } = useAuth();
  const signOut = useSignOut();
  const { data: activity } = useActivityQuery();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const changePassword = useChangePassword();

  const email = session?.user.email ?? "";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setJobTitle(profile.job_title ?? "");
  }, [profile]);

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      toast.error("Enter your full name");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        job_title: jobTitle.trim() || null,
      });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile");
    }
  };

  const onAvatar = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToStorage(file, "avatars");
      await updateProfile.mutateAsync({ avatar_url: url });
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload the photo");
    } finally {
      setUploading(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await changePassword.mutateAsync(password);
      setPassword("");
      setConfirm("");
      toast.success("Password changed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change your password");
    }
  };

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
        <div className="space-y-4">
          <div className="surface p-5">
            {loading || profileLoading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : (
              <>
                <div className="flex items-center gap-4">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={`${profile.full_name ?? email} profile photo`}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <span className="brand-gradient flex h-14 w-14 items-center justify-center rounded-full text-xl text-primary-foreground">
                      {(profile?.full_name ?? email).charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{profile?.full_name ?? email}</p>
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-2 text-xs text-muted-foreground hover:bg-muted/50">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading…" : "Change profile photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => void onAvatar(e.target.files?.[0])}
                  />
                </label>
              </>
            )}
          </div>

          <form className="surface space-y-3 p-5" onSubmit={savePassword}>
            <p className="display-title text-lg">Change password</p>
            <div className="space-y-1.5">
              <Label htmlFor="pw">New password</Label>
              <Input
                id="pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw2">Confirm password</Label>
              <Input
                id="pw2"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={changePassword.isPending}>
              {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Update
              password
            </Button>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <form className="surface space-y-4 p-5" onSubmit={saveDetails}>
            <p className="display-title text-lg">Account details</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full name</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-title">Job title</Label>
                <Input
                  id="job-title"
                  value={jobTitle}
                  placeholder="Senior sales advisor"
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  placeholder="+91 98xxxxxxx"
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-readonly">Email</Label>
                <Input id="email-readonly" value={email} readOnly disabled />
              </div>
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
            </Button>
          </form>

          <div className="surface p-5">
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
    </div>
  );
}
