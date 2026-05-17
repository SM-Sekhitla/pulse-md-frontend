import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Building2, Clock, Users, CreditCard, ScrollText, Settings, LogOut, ChevronLeft, Mail, SlidersHorizontal } from "lucide-react";
import { PulseLogoOnDark } from "@/components/brand";
import { cn } from "@/lib/utils";
import { currentUser, logout, store, type User } from "@/lib/store";
import { Badge } from "@/components/badge-pill";

const NAV = [
  { label: "Overview", items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Practices", items: [
    { to: "/admin/practices", label: "All practices", icon: Building2 },
    { to: "/admin/practices/pending", label: "Pending approval", icon: Clock },
    { to: "/admin/modules", label: "Module access", icon: SlidersHorizontal },
  ]},
  { label: "Platform", items: [
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
    { to: "/admin/audit", label: "Audit log", icon: ScrollText },
    { to: "/admin/outbox", label: "Email outbox", icon: Mail },
  ]},
  { label: "Settings", items: [{ to: "/admin/settings", label: "Platform settings", icon: Settings }] },
];

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const u = currentUser();
    if (!u) { navigate({ to: "/login" }); return; }
    if (u.role !== "super_admin") { navigate({ to: "/dashboard" }); return; }
    setUser(u);
  }, [navigate, path]);

  if (!user) return null;

  const pending = store.get().tenants.filter(t => t.status === "pending_approval").length;
  const handleLogout = () => { logout(); navigate({ to: "/" }); };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className={cn("fixed left-0 top-0 z-30 flex h-screen flex-col bg-navy text-white transition-all", collapsed ? "w-[64px]" : "w-[240px]")}>
        <div className={cn("flex items-center justify-between px-4 py-4", collapsed && "justify-center px-0")}>
          <Link to="/admin"><PulseLogoOnDark size={32} withWordmark={!collapsed} /></Link>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="text-white/40 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
          )}
        </div>
        {!collapsed && (
          <div className="px-4 pb-3">
            <Badge variant="purple">Super Admin</Badge>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {NAV.map((group) => (
            <div key={group.label} className="mt-4">
              {!collapsed && <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">{group.label}</div>}
              {group.items.map((item) => {
                const active = path === item.to || (item.to !== "/admin" && path.startsWith(item.to));
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
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && item.to === "/admin/practices/pending" && pending > 0 && (
                      <span className="rounded-full bg-warning px-1.5 text-[10px] font-semibold text-white">{pending}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className={cn("border-t border-white/10 px-3 py-3", collapsed && "px-1")}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-[12px] font-semibold text-white">{user.firstName[0]}{user.lastName[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-[13px] font-medium text-white">{user.firstName} {user.lastName}</div>
                <div className="text-[11px] text-white/50">{user.email}</div>
              </div>
              <button onClick={handleLogout} className="text-white/50 hover:text-white"><LogOut className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => setCollapsed(false)} className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue text-[12px] font-semibold text-white">{user.firstName[0]}</button>
          )}
        </div>
      </aside>

      <div className={cn("flex-1 transition-all", collapsed ? "ml-[64px]" : "ml-[240px]")}>
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-white px-8">
          <h1 className="text-[16px] font-semibold text-navy">{title}</h1>
          <Badge variant="purple">Platform Admin</Badge>
        </header>
        <main className="mx-auto max-w-[1280px] px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
