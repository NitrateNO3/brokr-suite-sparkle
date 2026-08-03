import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Users,
  UserRound,
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
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-3">
          <span className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary-foreground">
            <Building2 className="h-4.5 w-4.5" />
          </span>
          {!collapsed && (
            <span className="leading-tight">
              <span className="display-title block text-base">BrokrSuite</span>
              <span className="block text-[11px] text-muted-foreground">Deep Real Estate</span>
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
            <SidebarMenuButton onClick={signOut} tooltip="Logout">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
