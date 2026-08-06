import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, Plus, CircleUser } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { theme, toggle } = useTheme();

  return (
    <SidebarProvider>
      <div className="flex min-h-dvh w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-20 grid h-16 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger aria-label="Toggle sidebar">
                <Menu className="h-4 w-4" />
              </SidebarTrigger>
              <span className="hidden truncate text-sm text-muted-foreground lg:inline">
                Deep Real Estate · Agency workspace
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <GlobalSearch />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label="Toggle theme"
                className="rounded-full"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="Your profile" className="rounded-full">
                <Link to="/profile">
                  <CircleUser className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="sm" className="shadow-[var(--shadow-soft)]">
                <Link to="/properties/new">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add property</span>
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

