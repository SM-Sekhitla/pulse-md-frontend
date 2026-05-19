import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@/lib/router-compat";
import {
  LayoutDashboard, Calendar, Users, UserPlus, Stethoscope, Pill,
  FileText, Package, Wrench, Receipt, BarChart3, UserCog, Settings,
  Search, Bell, Plus, LogOut, ChevronLeft,
} from "lucide-react";
import { PulseLogoOnDark } from "@/components/brand";
import { cn } from "@/lib/utils";
import { currentUser, currentTenant, logout, tenantEnabledModules, type ModuleKey, type User } from "@/lib/store";
import { Badge } from "@/components/badge-pill";

interface NavItem { to: string; label: string; icon: any; module?: ModuleKey; }
interface NavGroup { label: string; items: NavItem[]; }

const OWNER_NAV: NavGroup[] = [
  { label: "Overview", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/calendar", label: "Calendar", icon: Calendar, module: "calendar" },
  ]},
  { label: "Patients", items: [
    { to: "/patients", label: "All patients", icon: Users, module: "patients" },
    { to: "/patients/new", label: "New patient", icon: UserPlus, module: "patients" },
  ]},
  { label: "Clinical", items: [
    { to: "/appointments", label: "Appointments", icon: Stethoscope, module: "appointments" },
    { to: "/prescriptions", label: "Prescriptions", icon: Pill, module: "prescriptions" },
    { to: "/sick-notes", label: "Sick notes", icon: FileText, module: "sick_notes" },
  ]},
  { label: "Operations", items: [
    { to: "/inventory", label: "Medical inventory", icon: Package, module: "inventory" },
    { to: "/equipment", label: "Equipment", icon: Wrench, module: "equipment" },
  ]},
  { label: "Finance", items: [
    { to: "/billing", label: "Billing & invoices", icon: Receipt, module: "billing" },
    { to: "/reports", label: "Financial reports", icon: BarChart3, module: "reports" },
  ]},
  { label: "Practice", items: [
    { to: "/staff", label: "Staff & roles", icon: UserCog, module: "staff" },
    { to: "/settings", label: "Settings", icon: Settings },
  ]},
];

const RECEPTIONIST_NAV: NavGroup[] = [
  { label: "Overview", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { label: "Patients", items: [
    { to: "/patients", label: "All patients", icon: Users, module: "patients" },
    { to: "/patients/new", label: "New patient", icon: UserPlus, module: "patients" },
  ]},
  { label: "Appointments", items: [
    { to: "/calendar", label: "Calendar", icon: Calendar, module: "calendar" },
    { to: "/appointments", label: "Today's schedule", icon: Stethoscope, module: "appointments" },
  ]},
];

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const u = currentUser();
    if (!u) { navigate({ to: "/login" }); return; }
    if (u.mustChangePassword) { navigate({ to: "/change-password" }); return; }
    if (u.role === "super_admin") { navigate({ to: "/admin" }); return; }
    const t = currentTenant();
    if (t) {
      if (t.status === "pending_approval") { navigate({ to: "/pending" }); return; }
      if (t.status === "suspended") { navigate({ to: "/suspended" }); return; }
      if (t.status === "rejected") { navigate({ to: "/rejected" }); return; }
    }
    setUser(u);
  }, [navigate, path]);

  if (!user) return null;

  const handleLogout = () => { logout(); navigate({ to: "/" }); };
  const baseNav = user.role === "receptionist" ? RECEPTIONIST_NAV : OWNER_NAV;
  const enabled = new Set(tenantEnabledModules(user.tenantId));
  const NAV: NavGroup[] = baseNav
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.module || enabled.has(i.module)) }))
    .filter((g) => g.items.length > 0);
  const tenant = currentTenant();

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className={cn("fixed left-0 top-0 z-30 flex h-screen flex-col bg-navy text-white transition-all", collapsed ? "w-[64px]" : "w-[240px]")}>
        <div className={cn("flex items-center justify-between px-4 py-4", collapsed && "justify-center px-0")}>
          <Link to="/dashboard"><PulseLogoOnDark size={32} withWordmark={!collapsed} /></Link>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="text-white/40 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
          )}
        </div>
        {!collapsed && (
          <div className="px-4 pb-3">
            <div className="text-[13px] font-medium text-white/90 truncate">{tenant?.name || user.practiceName}</div>
            <div className="mt-1"><Badge variant="blue">{tenant?.plan || "Growth"} plan</Badge></div>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {NAV.map((group) => (
            <div key={group.label} className="mt-4">
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">{group.label}</div>
              )}
              <div>
                {group.items.map((item) => {
                  const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
                  const Icon = item.icon;
                  return (
                    <Link key={item.to} to={item.to}
                      className={cn(
                        "relative flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors",
                        active ? "bg-[rgba(59,123,248,0.10)] text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-blue" />}
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className={cn("border-t border-white/10 px-3 py-3", collapsed && "px-1")}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-[12px] font-semibold text-white">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-[13px] font-medium text-white">{user.title} {user.firstName} {user.lastName}</div>
                <div className="text-[11px] capitalize text-white/50">{user.role.replace("_", " ")}</div>
              </div>
              <button onClick={handleLogout} className="text-white/50 hover:text-white" title="Log out"><LogOut className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => setCollapsed(false)} className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue text-[12px] font-semibold text-white">
              {user.firstName[0]}
            </button>
          )}
        </div>
      </aside>

      <div className={cn("flex-1 transition-all", collapsed ? "ml-[64px]" : "ml-[240px]")}>
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-white px-8">
          <h1 className="text-[16px] font-semibold text-navy">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Search patients, invoices…  ⌘K"
                className="h-9 w-[320px] rounded-md border border-border bg-surface pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-blue" />
            </div>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-navy hover:bg-surface">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">3</span>
            </button>
            <Link to="/appointments/new" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
              <Plus className="h-4 w-4" /> New appointment
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1280px] px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
