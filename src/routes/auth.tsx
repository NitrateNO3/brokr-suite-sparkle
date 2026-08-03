import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Building2, Loader2, Lock, Mail, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const DEMO_EMAIL = "manavyadav34@gmail.com";
const DEMO_PASSWORD = "Brokrsuit.deeprealesate";

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
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: destination, replace: true });
    });
  }, [navigate, destination]);

  /** Signs in, and provisions the account on first use so the demo login always works. */
  const authenticate = async (mail: string, pass: string) => {
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: mail,
          password: pass,
          options: { emailRedirectTo: `${window.location.origin}${destination}` },
        });
        if (error && !error.message.toLowerCase().includes("already")) throw error;
      }
      let { error } = await supabase.auth.signInWithPassword({ email: mail, password: pass });
      if (error && error.message.toLowerCase().includes("invalid")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: mail,
          password: pass,
          options: { emailRedirectTo: `${window.location.origin}${destination}` },
        });
        if (signUpError) throw signUpError;
        ({ error } = await supabase.auth.signInWithPassword({ email: mail, password: pass }));
      }
      if (error) throw error;
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
          <h1 className="display-title text-4xl leading-tight text-primary-foreground">
            The quiet operating system for modern brokerages.
          </h1>
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

          <h2 className="display-title text-2xl">
            {mode === "signin" ? "Sign in to your portal" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Deep Real Estate agency workspace.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              authenticate(email, password);
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

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={() => {
                setEmail(DEMO_EMAIL);
                setPassword(DEMO_PASSWORD);
                authenticate(DEMO_EMAIL, DEMO_PASSWORD);
              }}
            >
              <Sparkles className="h-4 w-4" /> Use demo account
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

          <div className="mt-8 rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Demo credentials</p>
            <p className="mt-1">{DEMO_EMAIL}</p>
            <p>{DEMO_PASSWORD}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
