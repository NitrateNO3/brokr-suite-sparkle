import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Building2, Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const raw = s["next"];
    const safe =
      typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
    return safe ? { next: safe } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — BrokrSuite Agency Portal" },
      {
        name: "description",
        content:
          "Sign in to the BrokrSuite agency portal to manage property inventory, leads and public listing pages.",
      },
      { property: "og:title", content: "Sign in — BrokrSuite Agency Portal" },
      {
        property: "og:description",
        content: "Secure access to the Deep Real Estate inventory and lead workspace.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  /** Where to land after auth — preserves an OAuth consent hand-off when present. */
  const destination = next ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: destination, replace: true });
    });
  }, [navigate, destination]);

  useEffect(() => {
    const saved = window.localStorage.getItem("brokrsuite.remembered-email");
    if (saved) setEmail(saved);
  }, []);

  /** Emails a recovery link that lands on /reset-password. */
  const sendReset = async (mail: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(mail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Reset link sent — check your inbox");
      setMode("signin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the reset link");
    } finally {
      setBusy(false);
    }
  };

  /** Signs in or registers with validated credentials; errors stay deliberately generic. */
  const authenticate = async (mail: string, pass: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim())) {
      toast.error("Enter a valid email address");
      return;
    }
    if (mode === "signup" && (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/\d/.test(pass))) {
      toast.error("Password must be at least 8 characters and include a letter and a number");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: mail.trim(),
          password: pass,
          options: { emailRedirectTo: `${window.location.origin}${destination}` },
        });
        if (error) throw error;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: mail.trim(),
        password: pass,
      });
      if (error) throw new Error("Invalid email or password");
      if (remember) window.localStorage.setItem("brokrsuite.remembered-email", mail.trim());
      else window.localStorage.removeItem("brokrsuite.remembered-email");
      toast.success("Welcome back to BrokrSuite");
      navigate({ to: destination, replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign you in");
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="brand-gradient relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="display-title text-xl">BrokrSuite</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <p className="display-title text-4xl leading-tight text-primary-foreground">
            The quiet operating system for modern brokerages.
          </p>

          <p className="mt-4 text-sm/relaxed text-primary-foreground/80">
            Manage inventory, capture leads and publish beautiful shareable property pages — without
            touching a line of code.
          </p>
        </motion.div>

        <p className="text-xs text-primary-foreground/70">
          Powering Deep Real Estate across Gurgaon, Sohna &amp; Manesar.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <span className="brand-gradient mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <p className="display-title text-xl">BrokrSuite</p>
          </div>

          <h1 className="display-title text-2xl">
            {mode === "signin"
              ? "Sign in to your agency portal"
              : mode === "signup"
                ? "Create your account"
                : "Reset your password"}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "We'll email you a secure link to choose a new password."
              : "Deep Real Estate agency workspace."}
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === "forgot") void sendReset(email);
              else void authenticate(email, password);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {mode === "signin" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                    aria-label="Remember my email"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
            </Button>

          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New teammate?" : "Already have access?"}{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>


        </motion.div>
      </div>
    </div>
  );
}
