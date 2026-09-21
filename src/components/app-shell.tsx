import { getLoginRoute } from "@/lib/auth-routing";
import { ActionButton } from "@/components/action-feedback";
import { type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@/lib/router-compat";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { PulseLogoOnDark } from "@/components/brand";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { isSuperAdminRole, useAuth } from "@/context/AuthContext";
import { useData } from "@/context/AppDataProvider";
import { practiceModules, practiceNavigation } from "@/lib/practice-navigation";
import "./practice.css";

const DESCRIPTIONS: Record<string, string> = {
  "/claims": "Prepare, review and track your practice’s medical aid claims.",
  "/dashboard":
    "Your day, connected. A little less admin, a little more time for care.",
  "/calendar":
    "A clear view of your appointments and the people you’ll see next.",
  "/patients":
    "The people at the heart of your practice. Find their details and care history.",
  "/patients/new":
    "Start a patient’s care journey with an organised, connected record.",
  "/appointments":
    "Make room for the next patient. Arrange a visit with your practice.",
  "/appointments/new":
    "The next step in great care starts with a well-planned appointment.",
  "/prescriptions":
    "Patient prescriptions, organised and ready when you need them.",
  "/sick-notes":
    "Create and manage the documents that support your patients’ recovery.",
  "/inventory":
    "Keep everyday essentials in view, from stock levels to expiry dates.",
  "/equipment": "Take care of the equipment your team relies on.",
  "/billing": "Invoices, payments and practice finances, brought together.",
  "/reports": "Understand your practice’s activity and finances at a glance.",
  "/staff": "Bring your team together with the right roles and access.",
  "/settings": "Make PulseMD work for your practice, your team and your day.",
  "/booking/inbox":
    "Connect with patients online and manage incoming booking requests.",
  "/booking/availability":
    "Make time for your patients. Set when your practice is available.",
  "/booking/profile":
    "Help patients get to know your practice before their first visit.",
};

export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { tenant: tenantData, patient } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const path = useRouterState({ select: (s) => s.location.pathname }).replace(
    /\/$/,
    "",
  );
  const tenant =
    tenantData.tenants.find((item) => item.id === user?.tenantId) ?? null;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: getLoginRoute() });
      return;
    }
    if (user.mustChangePassword) {
      navigate({ to: "/change-password" });
      return;
    }
    if (isSuperAdminRole(user.role)) {
      navigate({ to: "/admin" });
      return;
    }
    if (tenant?.status === "pending_approval") navigate({ to: "/pending" });
    if (tenant?.status === "suspended") navigate({ to: "/suspended" });
    if (tenant?.status === "rejected") navigate({ to: "/rejected" });
  }, [loading, navigate, path, tenant, user]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onResize = () => {
      if (media.matches) setMobileOpen(false);
    };
    media.addEventListener("change", onResize);
    return () => media.removeEventListener("change", onResize);
  }, []);

  if (
    loading ||
    !user ||
    user.mustChangePassword ||
    isSuperAdminRole(user.role) ||
    (tenant && tenant.status !== "active")
  )
    return null;

  const nav = practiceNavigation(tenant, user.role);
  const enabled = practiceModules(tenant, user.role);
  const activeItem = nav
    .flatMap((group) => group.items)
    .filter((item) => path === item.to || path.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;
  const matches = query.trim()
    ? patient.patients
        .filter(
          (item) =>
            (!item.tenantId || item.tenantId === user.tenantId) &&
            `${item.firstName} ${item.lastName} ${item.idNumber} ${item.phone}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
        )
        .slice(0, 8)
    : [];
  const closeNavigation = () => setMobileOpen(false);
  const handleLogout = async () => {
    await logout();
  };

  const navigation = (compact: boolean, mobile = false) => (
    <>
      <div className="gp-brand">
        <Link
          to="/dashboard"
          aria-label="PulseMD practice overview"
          onClick={closeNavigation}
        >
          <PulseLogoOnDark size={38} withWordmark={!compact} />
        </Link>
        {!mobile && (
          <ActionButton
            type="button"
            className="gp-collapse"
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!compact}
            onClick={() => setCollapsed(!compact)}
          >
            {compact ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </ActionButton>
        )}
      </div>
      {!compact && (
        <div className="gp-practice">
          <span>
            <Building2 size={18} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div>
            <strong
              title={tenant?.name ?? user.practiceName ?? "Your practice"}
            >
              {tenant?.name ?? user.practiceName ?? "Your practice"}
            </strong>
            <small>
              {tenant?.plan ? `${tenant.plan} plan` : "Practice workspace"}
            </small>
          </div>
        </div>
      )}
      <nav
        className="gp-navigation"
        aria-label={
          mobile ? "Mobile practice navigation" : "Practice navigation"
        }
      >
        {nav.map((group) => (
          <div className="gp-nav-group" key={group.label}>
            {!compact && <p>{group.label}</p>}
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeNavigation}
                className={`gp-nav-link ${activeItem?.to === item.to ? "is-active" : ""}`}
                aria-current={activeItem?.to === item.to ? "page" : undefined}
                aria-label={compact ? item.label : undefined}
                title={compact ? item.label : undefined}
              >
                <item.icon size={17} strokeWidth={1.5} aria-hidden="true" />
                {!compact && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="gp-account">
        <span className="gp-avatar">{initials}</span>
        {!compact && (
          <div>
            <strong>
              {user.title} {user.firstName} {user.lastName}
            </strong>
            <small>{user.role.replaceAll("_", " ")}</small>
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
    <div className={`gp-portal ${collapsed ? "gp-is-collapsed" : ""}`}>
      <a href="#gp-main" className="gp-skip">
        Skip to content
      </a>
      <aside className="gp-sidebar">{navigation(collapsed)}</aside>
      <div className="gp-workspace">
        <header className="gp-topbar">
          <div className="gp-breadcrumb">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <ActionButton
                  type="button"
                  className="gp-mobile-trigger"
                  aria-label="Open practice navigation"
                >
                  <Menu size={21} />
                </ActionButton>
              </SheetTrigger>
              <SheetContent side="left" className="gp-mobile-drawer">
                <SheetTitle className="sr-only">
                  PulseMD practice navigation
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Manage patients, appointments and your practice.
                </SheetDescription>
                {navigation(false, true)}
              </SheetContent>
            </Sheet>
            <span className="gp-breadcrumb-root">My practice</span>
            <ChevronRight
              size={13}
              className="gp-breadcrumb-root"
              aria-hidden="true"
            />
            <span>{activeItem?.label ?? title}</span>
          </div>
          <div className="gp-topbar-actions">
            {enabled.has("patients") && (
              <Dialog
                open={searchOpen}
                onOpenChange={(open) => {
                  setSearchOpen(open);
                  if (!open) setQuery("");
                }}
              >
                <DialogTrigger asChild>
                  <ActionButton
                    type="button"
                    className="gp-search-trigger"
                    aria-label="Find a patient"
                  >
                    <Search size={16} aria-hidden="true" />
                    <span>Find a patient</span>
                  </ActionButton>
                </DialogTrigger>
                <DialogContent className="gp-search-dialog">
                  <DialogTitle>Find a patient</DialogTitle>
                  <DialogDescription>
                    Search your practice records by name, ID number or phone.
                  </DialogDescription>
                  <label className="gp-search-field">
                    <Search size={18} aria-hidden="true" />
                    <span className="sr-only">Search patient records</span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Start with a name, ID or phone…"
                    />
                  </label>
                  <div className="gp-search-results" aria-live="polite">
                    {patient.isPatientLoading ? (
                      <p>Loading patient records…</p>
                    ) : matches.length ? (
                      matches.map((item) => (
                        <Link
                          to="/patients/$id"
                          params={{ id: item.id }}
                          key={item.id}
                          onClick={() => {
                            setSearchOpen(false);
                            setQuery("");
                          }}
                        >
                          <span className="gp-avatar">
                            {item.firstName[0]}
                            {item.lastName[0]}
                          </span>
                          <span>
                            <strong>
                              {item.firstName} {item.lastName}
                            </strong>
                            <small>
                              {item.phone || "No phone number recorded"}
                            </small>
                          </span>
                          <ArrowUpRight size={17} aria-hidden="true" />
                        </Link>
                      ))
                    ) : (
                      <p>
                        {query.trim()
                          ? "No patients match your search."
                          : "Enter a search to find a patient’s record."}
                      </p>
                    )}
                  </div>
                  <Link
                    to="/patients"
                    className="gp-inline-link"
                    onClick={() => setSearchOpen(false)}
                  >
                    View all patients{" "}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </DialogContent>
              </Dialog>
            )}
            {enabled.has("appointments") && (
              <Link
                to="/appointments/new"
                className="gp-button gp-button-yellow gp-topbar-appointment"
                aria-label="New appointment"
              >
                <Plus size={16} aria-hidden="true" />
                <span>New appointment</span>
              </Link>
            )}
            <span
              className="gp-avatar gp-topbar-avatar"
              title={`${user.firstName} ${user.lastName}`}
            >
              {initials}
            </span>
          </div>
        </header>
        <main id="gp-main" className="gp-main" tabIndex={-1}>
          <div className="gp-page-heading">
            <div>
              <p className="gp-eyebrow">
                <span /> YOUR PRACTICE, CONNECTED
              </p>
              <h1>{title}</h1>
              <p>
                {DESCRIPTIONS[path] ??
                  "The details you need, connected to the care you provide."}
              </p>
            </div>
            <div className="gp-date">
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
          <footer className="gp-footer">
            <span>© {new Date().getFullYear()} PulseMD</span>
            <span>
              <ShieldCheck size={13} aria-hidden="true" /> Practice
              intelligence, delivered.
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
