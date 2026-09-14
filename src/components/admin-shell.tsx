import { ActionButton } from "@/components/action-feedback";
import { type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@/lib/router-compat";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { PulseLogoOnDark } from "@/components/brand";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { isSuperAdminRole, useAuth } from "@/context/AuthContext";
import { useData } from "@/context/AppDataProvider";
import "./admin.css";

const NAV = [
  {
    label: "Workspace",
    items: [{ to: "/admin", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Practice management",
    items: [
      { to: "/admin/practices", label: "All practices", icon: Building2 },
      {
        to: "/admin/practices/pending",
        label: "Pending approval",
        icon: Clock,
      },
      { to: "/admin/modules", label: "Module access", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
      { to: "/admin/audit", label: "Audit log", icon: ScrollText },
      { to: "/admin/outbox", label: "Email outbox", icon: Mail },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin/settings", label: "Platform settings", icon: Settings },
    ],
  },
];

const DESCRIPTIONS: Record<string, string> = {
  "/admin": "A clear view of your platform, and the people behind better care.",
  "/admin/practices":
    "Manage your practice network, from the first application to everyday care.",
  "/admin/practices/pending":
    "Give each new practice the right start. Review and manage incoming applications.",
  "/admin/modules":
    "The right tools for every team. Manage what each practice can access.",
  "/admin/users":
    "Your people, connected. View accounts and access across the platform.",
  "/admin/subscriptions":
    "Keep practice plans and estimated subscription revenue in view.",
  "/admin/audit":
    "Follow important changes and activity across your practice network.",
  "/admin/outbox":
    "Track outgoing emails and review delivery attempts in one place.",
  "/admin/settings":
    "Manage the contact details and operating preferences behind PulseMD.",
};

export function AdminShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { tenant } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname }).replace(
    /\/$/,
    "",
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!isSuperAdminRole(user.role)) navigate({ to: "/dashboard" });
  }, [loading, navigate, path, user]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (media.matches) setMobileOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  if (loading || !user || !isSuperAdminRole(user.role)) return null;

  const pending = tenant.tenants.filter(
    (t) => t.status === "pending_approval",
  ).length;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;
  const activeItem = NAV.flatMap((group) => group.items)
    .filter(
      (item) =>
        path === item.to ||
        (item.to !== "/admin" && path.startsWith(`${item.to}/`)),
    )
    .sort((a, b) => b.to.length - a.to.length)[0];
  const handleLogout = async () => {
    await logout();
  };

  const navigation = (compact: boolean, mobile = false) => (
    <>
      <div className="admin-brand">
        <Link
          to="/admin"
          aria-label="PulseMD admin overview"
          onClick={() => setMobileOpen(false)}
        >
          <PulseLogoOnDark size={38} withWordmark={!compact} />
        </Link>
        {!mobile && (
          <ActionButton
            type="button"
            className="admin-collapse"
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!compact}
            onClick={() => setCollapsed(!compact)}
          >
            {compact ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </ActionButton>
        )}
      </div>
      {!compact && (
        <div className="admin-workspace-label">
          <ShieldCheck size={14} aria-hidden="true" /> Administration
        </div>
      )}
      <nav
        aria-label={mobile ? "Mobile admin navigation" : "Admin navigation"}
        className="admin-navigation"
      >
        {NAV.map((group) => (
          <div key={group.label} className="admin-nav-group">
            {!compact && <p>{group.label}</p>}
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`admin-nav-link ${activeItem?.to === item.to ? "is-active" : ""}`}
                aria-current={activeItem?.to === item.to ? "page" : undefined}
                aria-label={compact ? item.label : undefined}
                title={compact ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={18} strokeWidth={1.6} aria-hidden="true" />
                {!compact && (
                  <>
                    <span>{item.label}</span>
                    {item.to === "/admin/practices/pending" && pending > 0 && (
                      <b>{pending}</b>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      {!compact && (
        <div className="admin-sidebar-note">
          <Activity size={24} strokeWidth={1.4} aria-hidden="true" />
          <p>
            Better practice.
            <br />
            <strong>Better care.</strong>
          </p>
          <Link to="/">
            Visit the website <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}
      <div className="admin-account">
        <span className="admin-avatar">{initials}</span>
        {!compact && (
          <div>
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            <span title={user.email}>{user.email}</span>
          </div>
        )}
        <ActionButton
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={17} />
        </ActionButton>
      </div>
    </>
  );

  return (
    <div className={`admin-portal ${collapsed ? "admin-is-collapsed" : ""}`}>
      <a href="#admin-main" className="admin-skip">
        Skip to content
      </a>
      <aside className="admin-sidebar">{navigation(collapsed)}</aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <ActionButton
                  type="button"
                  className="admin-mobile-trigger"
                  aria-label="Open admin navigation"
                >
                  <Menu size={21} />
                </ActionButton>
              </SheetTrigger>
              <SheetContent side="left" className="admin-mobile-drawer">
                <SheetTitle className="sr-only">
                  PulseMD administration
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Navigate practice management and platform administration.
                </SheetDescription>
                {navigation(false, true)}
              </SheetContent>
            </Sheet>
            <span className="admin-breadcrumb-root">Workspace</span>
            <ChevronRight
              size={13}
              className="admin-breadcrumb-root"
              aria-hidden="true"
            />
            <span>{activeItem?.label ?? title}</span>
          </div>
          <div className="admin-topbar-actions">
            <Link to="/" className="admin-website-link">
              View website <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link
              to="/admin/practices/pending"
              className="admin-pending-link"
              aria-label={`${pending} practices pending approval`}
            >
              <Clock size={18} aria-hidden="true" />
              {pending > 0 && <span>{pending}</span>}
            </Link>
            <span className="admin-role">
              <ShieldCheck size={14} aria-hidden="true" /> Super admin
            </span>
            <span
              className="admin-avatar admin-topbar-avatar"
              aria-label={`${user.firstName} ${user.lastName}`}
            >
              {initials}
            </span>
          </div>
        </header>
        <main id="admin-main" className="admin-main" tabIndex={-1}>
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">
                <span /> PULSEMD ADMINISTRATION
              </p>
              <h1>{title}</h1>
              <p>
                {DESCRIPTIONS[path] ??
                  "Practice details, access and administration, all in one place."}
              </p>
            </div>
            <div className="admin-date">
              <CalendarDays size={16} aria-hidden="true" />
              <time dateTime={new Date().toLocaleDateString("en-CA")}>
                {new Date().toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
            </div>
          </div>
          {children}
          <footer className="admin-footer">
            <span>© {new Date().getFullYear()} PulseMD</span>
            <span>Practice intelligence, delivered.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
