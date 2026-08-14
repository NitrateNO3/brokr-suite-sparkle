import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Users,
  UserRound,
  ClipboardList,
  Images,
  BarChart3,
  MapPin,
  Sparkles,
  Settings as SettingsIcon,
  ShieldCheck,
  CircleUser,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/hooks/useSignOut";

const workspace = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Properties", url: "/properties", icon: Building2 },
  { title: "Add Property", url: "/properties/new", icon: PlusCircle },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Tasks", url: "/tasks", icon: ClipboardList },
  { title: "Customers", url: "/customers", icon: UserRound },
];

const catalogue = [
  { title: "Media Library", url: "/media", icon: Images },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "Amenities", url: "/amenities", icon: Sparkles },
];

const account = [
  { title: "Team & Roles", url: "/team", icon: ShieldCheck },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
  { title: "Profile", url: "/profile", icon: CircleUser },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const signOut = useSignOut();

  const isActive = (url: string) => pathname === url;

  const renderGroup = (label: string, items: typeof workspace) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="eyebrow">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link
                    to={item.url}
                    className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${
                      active ? "nav-active font-medium text-sidebar-accent-foreground" : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`absolute left-0 h-5 w-[3px] rounded-full bg-sidebar-primary transition-all duration-300 ${
                        active ? "opacity-100" : "scale-y-0 opacity-0"
                      }`}
                    />
                    <item.icon
                      className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                        active ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                      }`}
                    />
                    {!collapsed && <span className="truncate text-[13px]">{item.title}</span>}
                  </Link>
                </SidebarMenuButton>

              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-3">
          <span className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-soft)]">
            <Building2 className="h-4.5 w-4.5" />
          </span>
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="display-title block truncate text-base">BrokrSuite</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                Deep Real Estate
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>


      <SidebarContent>
        {renderGroup("Workspace", workspace)}
        {renderGroup("Catalogue", catalogue)}
        {renderGroup("Account", account)}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Logout" aria-label="Logout">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
