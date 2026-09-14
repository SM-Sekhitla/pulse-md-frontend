import { ActionButton } from "@/components/action-feedback";
import { type ReactNode, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  FileText,
  HeartHandshake,
  Package,
  Plus,
  Receipt,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import { createFileRoute, Link } from "@/lib/router-compat";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import { useData } from "@/context/AppDataProvider";
import { useAuth } from "@/context/AuthContext";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { practiceModules } from "@/lib/practice-navigation";
import { formatZAR } from "@/lib/pricing";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const STATUS_VARIANT = (status: string) =>
  status === "Completed"
    ? "success"
    : status === "In progress"
      ? "blue"
      : status === "Checked-in"
        ? "teal"
        : status === "No-show"
          ? "danger"
          : status === "Confirmed"
            ? "warning"
            : "neutral";
const INACTIVE = new Set(["Cancelled", "No-show", "Completed"]);

function Dashboard() {
  const { appointment, invoice, inventory, patient } = useData();
  const { user } = useAuth();
  const tenant = useCurrentTenant();
  const enabled = practiceModules(tenant, user?.role);
  const canSchedule = enabled.has("appointments") || enabled.has("calendar");
  const [now, setNow] = useState(() => new Date());
  const [scheduleFilter, setScheduleFilter] = useState("All visits");
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const appointments = appointment.appointments.filter(
    (item) => !item.tenantId || item.tenantId === user?.tenantId,
  );
  const invoices = invoice.invoices.filter(
    (item) => !item.tenantId || item.tenantId === user?.tenantId,
  );
  const patients = patient.patients.filter(
    (item) => !item.tenantId || item.tenantId === user?.tenantId,
  );
  const stock = inventory.inventoryList.filter(
    (item) => !item.tenantId || item.tenantId === user?.tenantId,
  );
  const todays = appointments
    .filter((item) => isSameDay(parseISO(item.start), now))
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const completed = todays.filter((item) => item.status === "Completed").length;
  const waiting = todays.filter((item) => item.status === "Checked-in").length;
  const visibleVisits = todays.filter(
    (item) =>
      scheduleFilter === "All visits" ||
      (scheduleFilter === "Waiting"
        ? item.status === "Checked-in"
        : item.status === "Completed"),
  );
  const next = appointments
    .filter(
      (item) =>
        !INACTIVE.has(item.status) && Date.parse(item.end) > now.getTime(),
    )
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
  const paid = invoices.filter((item) => item.status === "Paid");
  const monthPaid = paid
    .filter((item) => isSameMonth(parseISO(item.date), now))
    .reduce((sum, item) => sum + item.amount, 0);
  const outstanding = invoices.filter((item) =>
    ["Sent", "Overdue", "Partially paid"].includes(item.status),
  );
  const lowStock = stock.filter((item) => item.stock <= item.reorderLevel);
  const expiring = stock.filter((item) => {
    const remaining = Date.parse(item.expiry) - now.getTime();
    return remaining >= 0 && remaining <= 60 * 86400000;
  });
  const dailyCounts = Array.from({ length: 14 }, (_, index) => {
    const day = subDays(now, 13 - index);
    return {
      day: format(day, "d MMM"),
      visits: appointments.filter(
        (item) =>
          item.status !== "Cancelled" && isSameDay(parseISO(item.start), day),
      ).length,
    };
  });
  const weeklyRevenue = Array.from({ length: 8 }, (_, index) => {
    const week = startOfWeek(subWeeks(now, 7 - index), { weekStartsOn: 1 });
    return {
      week: format(week, "d MMM"),
      amount: paid
        .filter((item) =>
          isSameDay(
            startOfWeek(parseISO(item.date), { weekStartsOn: 1 }),
            week,
          ),
        )
        .reduce((sum, item) => sum + item.amount, 0),
    };
  });
  const visitTypes = Object.entries(
    todays
      .filter((item) => item.status !== "Cancelled")
      .reduce<Record<string, number>>((result, item) => {
        result[item.type] = (result[item.type] ?? 0) + 1;
        return result;
      }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const totalVisits = visitTypes.reduce((sum, [, count]) => sum + count, 0);
  const shortcuts = [
    {
      to: "/patients/new",
      title: "Register a patient",
      detail: "Start a connected care record",
      icon: Users,
      visible: enabled.has("patients"),
    },
    {
      to: "/prescriptions/new",
      title: "Write a prescription",
      detail: "Prepare the next step in care",
      icon: FileText,
      visible: enabled.has("prescriptions"),
    },
    {
      to: "/sick-notes/new",
      title: "Create a sick note",
      detail: "Support your patient’s recovery",
      icon: HeartHandshake,
      visible: enabled.has("sick_notes"),
    },
    {
      to: "/billing",
      title: "Manage invoices",
      detail: "Keep practice finances in view",
      icon: Receipt,
      visible: enabled.has("billing"),
    },
  ].filter((item) => item.visible);

  return (
    <AppShell title="Practice overview">
      <section className="gp-welcome">
        <img
          src="/images/landing/medical-care.webp"
          alt=""
          aria-hidden="true"
        />
        <div className="gp-welcome-wash" />
        <div className="gp-welcome-copy">
          <p className="gp-eyebrow">
            <span /> BETTER PRACTICE. BETTER CARE.
          </p>
          <h2>
            Hello
            {user
              ? `, ${[user.title, user.lastName].filter(Boolean).join(" ")}`
              : ""}
            .<br />
            <span>More room for great care.</span>
          </h2>
          <p>
            Your patients come first. Bring the rest of your day together in one
            connected workspace.
          </p>
          <div className="gp-welcome-actions">
            {enabled.has("appointments") ? (
              <Link
                to="/appointments/new"
                className="gp-button gp-button-yellow"
              >
                Book an appointment{" "}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ) : enabled.has("patients") ? (
              <Link to="/patients/new" className="gp-button gp-button-yellow">
                Register a patient <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ) : user?.role !== "receptionist" ? (
              <Link to="/settings" className="gp-button gp-button-yellow">
                Your practice settings{" "}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ) : null}
            {enabled.has("calendar") && (
              <Link to="/calendar" className="gp-inline-link">
                View calendar <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="gp-kpi-grid" aria-label="Practice statistics">
        {canSchedule && (
          <KPI
            label="Today’s appointments"
            value={
              appointment.isLoading
                ? "—"
                : todays.filter((item) => item.status !== "Cancelled").length
            }
            note={`${completed} completed today`}
            icon={CalendarDays}
          />
        )}
        {canSchedule && (
          <KPI
            label="In the waiting room"
            value={appointment.isLoading ? "—" : waiting}
            note="Patients checked in today"
            icon={Clock}
            highlight={waiting > 0}
          />
        )}
        {enabled.has("patients") && (
          <KPI
            label="Patient records"
            value={patient.isPatientLoading ? "—" : patients.length}
            note={`${patients.filter((item) => item.active).length} active patients`}
            icon={Users}
          />
        )}
        {enabled.has("billing") && (
          <KPI
            label="Paid invoices this month"
            value={invoice.isInvoiceLoading ? "—" : formatZAR(monthPaid)}
            note="Grouped by invoice date"
            icon={Receipt}
          />
        )}
      </section>

      {enabled.has("inventory") &&
        !inventory.isInventoryLoading &&
        (lowStock.length > 0 || expiring.length > 0) && (
          <div className="gp-stock-alert">
            <Package size={20} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <strong>A little attention for your inventory</strong>
              <p>
                {lowStock.length} item{lowStock.length === 1 ? "" : "s"} at or
                below reorder level · {expiring.length} expiring within 60 days
              </p>
            </div>
            <Link to="/inventory">
              View stock <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}

      <div className="gp-dashboard-grid">
        <div className="gp-dashboard-primary">
          {canSchedule ? (
            <section className="pulse-card gp-schedule">
              <div className="gp-panel-heading">
                <div>
                  <p className="gp-eyebrow">
                    {format(now, "EEEE, d MMMM").toUpperCase()}
                  </p>
                  <h2>
                    Today’s appointments{" "}
                    <span className="gp-count">
                      {appointment.isLoading ? "—" : todays.length}
                    </span>
                  </h2>
                </div>
                {enabled.has("calendar") && (
                  <Link to="/calendar" className="gp-inline-link">
                    Open calendar <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </div>
              <div
                className="gp-schedule-filters"
                role="group"
                aria-label="Filter today's appointments"
              >
                {["All visits", "Waiting", "Completed"].map((filter) => (
                  <ActionButton
                    key={filter}
                    type="button"
                    aria-pressed={scheduleFilter === filter}
                    onClick={() => setScheduleFilter(filter)}
                  >
                    {filter}
                    {filter === "Waiting" && waiting > 0 && (
                      <span>{waiting}</span>
                    )}
                  </ActionButton>
                ))}
              </div>
              {appointment.isLoading ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Loading today’s appointments…"
                  loading
                />
              ) : visibleVisits.length ? (
                <div className="gp-visit-list">
                  {visibleVisits.map((visit) => (
                    <div key={visit.id} className="gp-visit">
                      <div className="gp-visit-time">
                        <time dateTime={visit.start}>
                          {format(parseISO(visit.start), "HH:mm")}
                        </time>
                        <span>
                          {Math.round(
                            (Date.parse(visit.end) - Date.parse(visit.start)) /
                              60000,
                          )}{" "}
                          min
                        </span>
                      </div>
                      <span className="gp-patient-avatar">
                        {visit.patientName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div className="gp-visit-person">
                        {enabled.has("patients") ? (
                          <Link
                            to="/patients/$id"
                            params={{ id: visit.patientId }}
                          >
                            {visit.patientName}
                          </Link>
                        ) : (
                          <strong>{visit.patientName}</strong>
                        )}
                        <p>
                          {visit.type}
                          <span>·</span>
                          {visit.room}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT(visit.status)}>
                        {visit.status}
                      </Badge>
                      {enabled.has("patients") && (
                        <Link
                          to="/patients/$id"
                          params={{ id: visit.patientId }}
                          className="gp-visit-link"
                          aria-label={`Open ${visit.patientName} patient record`}
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title={
                    scheduleFilter === "All visits"
                      ? "A little breathing room."
                      : `No ${scheduleFilter.toLowerCase()} visits yet.`
                  }
                  description={
                    scheduleFilter === "All visits"
                      ? "Appointments for today will appear here as they’re booked."
                      : "Choose All visits to see the rest of today’s schedule."
                  }
                />
              )}
              <div className="gp-schedule-footer">
                <span>
                  <Check size={14} aria-hidden="true" /> {completed} completed{" "}
                  <span>·</span> {waiting} waiting
                </span>
                {enabled.has("appointments") && (
                  <Link to="/appointments/new">
                    <Plus size={14} aria-hidden="true" /> Add appointment
                  </Link>
                )}
              </div>
            </section>
          ) : (
            <section className="pulse-card">
              <EmptyState
                icon={HeartHandshake}
                title="Your practice, your workspace."
                description="The tools included in your practice’s plan are available in the sidebar. You can manage your practice details in Settings."
              />
            </section>
          )}

          {canSchedule && (
            <section className="pulse-card gp-chart-panel">
              <div className="gp-panel-heading">
                <div>
                  <p className="gp-eyebrow">YOUR PRACTICE AT A GLANCE</p>
                  <h2>Appointment activity</h2>
                </div>
                <span className="gp-panel-period">Last 14 days</span>
              </div>
              <div
                className="gp-chart"
                role="img"
                aria-label={`${dailyCounts.reduce((sum, item) => sum + item.visits, 0)} non-cancelled appointments over the last 14 days`}
              >
                <ResponsiveContainer width="100%" height={205}>
                  <AreaChart
                    data={dailyCounts}
                    margin={{ top: 10, right: 12, left: -22, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="gp-activity-fill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ffcc53"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#ffcc53"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="#e7edef"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "#70818b" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#70818b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 6,
                        border: "1px solid #dfe6e8",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      name="Appointments"
                      stroke="#153c55"
                      strokeWidth={2}
                      fill="url(#gp-activity-fill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="gp-chart-note">
                Based on booked appointment dates. Cancelled visits are
                excluded.
              </p>
            </section>
          )}

          {enabled.has("billing") && (
            <section className="pulse-card gp-chart-panel">
              <div className="gp-panel-heading">
                <div>
                  <p className="gp-eyebrow">A CLEARER VIEW OF YOUR FINANCES</p>
                  <h2>Paid invoices by week</h2>
                </div>
                <Link to="/billing" className="gp-inline-link">
                  View billing <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <div
                className="gp-chart"
                role="img"
                aria-label={`${formatZAR(weeklyRevenue.reduce((sum, item) => sum + item.amount, 0))} in paid invoices over the last 8 weeks`}
              >
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={weeklyRevenue}
                    margin={{ left: -10, right: 10 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#e7edef"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: "#70818b" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={25}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "#70818b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value: number) =>
                        value >= 1000 ? `${value / 1000}k` : `${value}`
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatZAR(value),
                        "Paid invoices",
                      ]}
                      contentStyle={{
                        borderRadius: 6,
                        border: "1px solid #dfe6e8",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#d5ad50"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="gp-chart-note">
                Last 8 weeks · Invoice dates, not payment receipt dates.
              </p>
            </section>
          )}
        </div>
        <div className="gp-dashboard-secondary">
          {canSchedule && (
            <section className="gp-next">
              <p className="gp-eyebrow">
                <span /> NEXT IN YOUR DAY
              </p>
              <div className="gp-next-heading">
                <h2>Up next</h2>
                <Stethoscope size={25} strokeWidth={1.3} aria-hidden="true" />
              </div>
              {appointment.isLoading ? (
                <p role="status">Loading appointments…</p>
              ) : next ? (
                <>
                  <div className="gp-next-patient">
                    <span className="gp-patient-avatar">
                      {next.patientName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <h3>{next.patientName}</h3>
                    <p>{next.type}</p>
                  </div>
                  <div className="gp-next-details">
                    <span>
                      <CalendarDays size={15} aria-hidden="true" />
                      {isSameDay(parseISO(next.start), now)
                        ? "Today"
                        : format(parseISO(next.start), "d MMM")}
                    </span>
                    <span>
                      <Clock size={15} aria-hidden="true" />
                      {format(parseISO(next.start), "HH:mm")} –{" "}
                      {format(parseISO(next.end), "HH:mm")}
                    </span>
                  </div>
                  <p className="gp-next-room">
                    {next.room} · {next.status}
                  </p>
                  {enabled.has("patients") && (
                    <Link
                      to="/patients/$id"
                      params={{ id: next.patientId }}
                      className="gp-button gp-button-yellow"
                    >
                      Open patient record{" "}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>
                  )}
                </>
              ) : (
                <div className="gp-next-empty">
                  <Check size={29} aria-hidden="true" />
                  <h3>Nothing coming up just yet.</h3>
                  <p>Your next scheduled visit will appear here.</p>
                </div>
              )}
            </section>
          )}

          {shortcuts.length > 0 && (
            <section className="pulse-card gp-shortcuts">
              <div className="gp-panel-heading">
                <div>
                  <p className="gp-eyebrow">LESS CLICKING. MORE CARING.</p>
                  <h2>Everyday essentials</h2>
                </div>
              </div>
              {shortcuts.map((item) => (
                <Link to={item.to} key={item.to}>
                  <item.icon size={20} strokeWidth={1.5} aria-hidden="true" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </section>
          )}

          {canSchedule && (
            <section className="pulse-card gp-visit-types">
              <div className="gp-panel-heading">
                <div>
                  <p className="gp-eyebrow">TODAY’S MIX</p>
                  <h2>Care at a glance</h2>
                </div>
                <Activity size={20} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                {visitTypes.length ? (
                  visitTypes.map(([type, count], index) => (
                    <div className="gp-type-row" key={type}>
                      <div>
                        <span>
                          <i
                            style={{
                              background: ["#153c55", "#e3b545", "#809f95"][
                                index % 3
                              ],
                            }}
                          />
                          {type}
                        </span>
                        <strong>{count}</strong>
                      </div>
                      <div className="gp-type-track">
                        <span
                          style={{
                            width: `${(count / totalVisits) * 100}%`,
                            background: ["#153c55", "#e3b545", "#809f95"][
                              index % 3
                            ],
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="gp-small-empty">
                    Your appointment mix will appear as visits are booked.
                  </p>
                )}
              </div>
            </section>
          )}
          {enabled.has("billing") && (
            <Link to="/billing" className="gp-billing-note">
              <span>
                <Receipt size={19} aria-hidden="true" />
              </span>
              <div>
                <strong>
                  {invoice.isInvoiceLoading
                    ? "Loading invoices…"
                    : `${outstanding.length} outstanding invoices`}
                </strong>
                <p>Keep track of the next payment.</p>
              </div>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function KPI({
  label,
  value,
  note,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div className={`pulse-card gp-kpi ${highlight ? "gp-kpi-highlight" : ""}`}>
      <div>
        <span>{label}</span>
        <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  loading,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="gp-empty" role={loading ? "status" : undefined}>
      <span>
        <Icon size={25} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
