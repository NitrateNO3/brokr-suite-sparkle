import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, Plus } from "lucide-react";

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
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger aria-label="Toggle sidebar">
                <Menu className="h-4 w-4" />
              </SidebarTrigger>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Deep Real Estate · Agency workspace
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GlobalSearch />
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button asChild size="sm">
                <Link to="/properties/new">
                  <Plus className="h-4 w-4" /> Add property
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
