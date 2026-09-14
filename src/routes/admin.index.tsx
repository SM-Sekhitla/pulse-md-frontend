import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  Clock,
  CreditCard,
  ScrollText,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { createFileRoute, Link } from "@/lib/router-compat";
import { AdminShell } from "@/components/admin-shell";
import { formatZAR, planPrice } from "@/lib/pricing";
import { format, parseISO } from "date-fns";
import { useData } from "@/context/AppDataProvider";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const { tenant, patient, user, audit } = useData();
  const { user: currentUser } = useAuth();
  const active = tenant.tenants.filter((t) => t.status === "active");
  const pending = tenant.tenants.filter((t) => t.status === "pending_approval");
  const monthlyEstimate = active.reduce((sum, t) => sum + planPrice(t.plan), 0);
  const recentEvents = [...audit.audits]
    .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
    .slice(0, 6);
  const loadingValue = tenant.isLoading ? "—" : undefined;

  return (
    <AdminShell title="Platform overview">
      <section className="admin-welcome">
        <div>
          <p className="admin-eyebrow">
            <span /> PEOPLE AT THE HEART. TECHNOLOGY BY YOUR SIDE.
          </p>
          <h2>
            Welcome back
            {currentUser?.firstName ? `, ${currentUser.firstName}` : ""}.<br />
            <span>Let’s keep better care moving.</span>
          </h2>
          <p>
            Support your practices, connect your teams and take care of what
            comes next.
          </p>
          <Link
            to="/admin/practices"
            className="admin-button admin-button-yellow"
          >
            Manage practices <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="admin-welcome-art" aria-hidden="true">
          <div />
          <div />
          <Activity strokeWidth={0.8} />
          <span>ONE CONNECTED PLATFORM</span>
        </div>
      </section>

      <section className="admin-kpi-grid" aria-label="Platform statistics">
        <KPI
          icon={Building2}
          label="Active practices"
          value={loadingValue ?? active.length}
          note="Practices in your network"
          to="/admin/practices"
        />
        <KPI
          icon={Clock}
          label="Awaiting approval"
          value={loadingValue ?? pending.length}
          note={
            pending.length
              ? "Applications ready for review"
              : "Your approval queue"
          }
          to="/admin/practices/pending"
          highlighted={pending.length > 0}
        />
        <KPI
          icon={Users}
          label="Patient records"
          value={patient.isPatientLoading ? "—" : patient.patients.length}
          note="Across the platform"
        />
        <KPI
          icon={CreditCard}
          label="Est. monthly revenue"
          value={loadingValue ?? formatZAR(monthlyEstimate)}
          note="Based on active practice plan prices"
          to="/admin/subscriptions"
        />
      </section>

      <div className="admin-dashboard-grid">
        <section className="pulse-card admin-approvals">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">YOUR NEXT PRIORITY</p>
              <h2>
                Practice approvals{" "}
                <span className="admin-count">
                  {tenant.isLoading ? "—" : pending.length}
                </span>
              </h2>
            </div>
            <Link to="/admin/practices/pending" className="admin-inline-link">
              View queue <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {tenant.isLoading ? (
            <div className="admin-empty" role="status">
              Loading practice applications…
            </div>
          ) : pending.length ? (
            <div className="admin-approval-list">
              {pending.slice(0, 4).map((practice) => {
                const owner =
                  practice.owner ??
                  user.users.find((item) => item.id === practice.gpUserId);
                return (
                  <div key={practice.id} className="admin-approval-row">
                    <span className="admin-practice-icon">
                      <Building2
                        size={20}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <h3>{practice.name}</h3>
                      <p>
                        {owner
                          ? `${owner.title ?? ""} ${owner.firstName} ${owner.lastName}`.trim()
                          : "Practice application"}
                        <span>·</span>
                        {practice.plan}
                      </p>
                    </div>
                    <Link
                      to="/admin/practices/$id"
                      params={{ id: practice.id }}
                      className="admin-review-link"
                      aria-label={`Review ${practice.name}`}
                    >
                      Review <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty">
              <span className="admin-empty-icon">
                <Check size={25} aria-hidden="true" />
              </span>
              <h3>You’re all caught up.</h3>
              <p>
                New practice applications will appear here when they’re ready
                for review.
              </p>
            </div>
          )}
          <div className="admin-panel-note">
            <Clock size={14} aria-hidden="true" /> A thoughtful review. A
            confident start for every practice.
          </div>
        </section>

        <section className="pulse-card admin-plan-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">YOUR PRACTICE NETWORK</p>
              <h2>Practices by plan</h2>
            </div>
            <CreditCard size={20} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="admin-plan-total">
            <strong>{loadingValue ?? active.length}</strong>
            <span>active practices</span>
          </div>
          <div className="admin-plan-bars">
            {(["Starter", "Growth", "Enterprise"] as const).map(
              (plan, index) => {
                const count = active.filter((t) => t.plan === plan).length;
                const percentage = active.length
                  ? Math.round((count / active.length) * 100)
                  : 0;
                return (
                  <div
                    className={`admin-plan-bar admin-plan-bar-${index}`}
                    key={plan}
                  >
                    <div>
                      <span>
                        <i />
                        {plan}
                      </span>
                      <span>
                        {tenant.isLoading ? "—" : count}
                        <small>{percentage}%</small>
                      </span>
                    </div>
                    <div
                      role="meter"
                      aria-label={`${plan} share of active practices`}
                      aria-valuenow={percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="admin-bar-track"
                    >
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              },
            )}
          </div>
          <Link to="/admin/subscriptions" className="admin-panel-link">
            Manage subscriptions <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <section className="pulse-card admin-activity-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">ACROSS THE PLATFORM</p>
              <h2>Recent activity</h2>
            </div>
            <Link to="/admin/audit" className="admin-inline-link">
              View audit log <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {audit.isLoading ? (
            <div className="admin-empty" role="status">
              Loading recent activity…
            </div>
          ) : recentEvents.length ? (
            <div className="admin-activity-list">
              {recentEvents.map((event) => (
                <div key={event.id} className="admin-activity-row">
                  <span className="admin-activity-icon">
                    <ScrollText
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <p>{event.message}</p>
                    <span>
                      {event.type}
                      {event.actorEmail ? ` · ${event.actorEmail}` : ""}
                    </span>
                  </div>
                  <time dateTime={event.ts}>
                    {format(parseISO(event.ts), "d MMM")}
                    <span>{format(parseISO(event.ts), "HH:mm")}</span>
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              <span className="admin-empty-icon">
                <Activity size={25} aria-hidden="true" />
              </span>
              <h3>A clear record starts here.</h3>
              <p>
                Important platform activity will appear as your team gets to
                work.
              </p>
            </div>
          )}
        </section>

        <section className="admin-quick-panel">
          <p className="admin-eyebrow">
            <span /> KEEP THINGS MOVING
          </p>
          <h2>
            A little less admin.
            <br />A little more clarity.
          </h2>
          <p>The everyday tools that help you support every practice.</p>
          {[
            {
              to: "/admin/users",
              label: "Manage your people",
              detail: "Accounts, roles and access",
              icon: Users,
            },
            {
              to: "/admin/modules",
              label: "Shape each workspace",
              detail: "Practice modules and permissions",
              icon: SlidersHorizontal,
            },
            {
              to: "/admin/outbox",
              label: "Check email delivery",
              detail: "Messages and delivery attempts",
              icon: ScrollText,
            },
          ].map((item) => (
            <Link to={item.to} key={item.to}>
              <item.icon size={20} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  note,
  to,
  highlighted = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  note: string;
  to?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`pulse-card admin-kpi ${highlighted ? "admin-kpi-highlighted" : ""}`}
    >
      <div className="admin-kpi-top">
        <span>{label}</span>
        <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <div className="admin-kpi-bottom">
        <p>{note}</p>
        {to && (
          <Link to={to} aria-label={`View ${label.toLowerCase()}`}>
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
