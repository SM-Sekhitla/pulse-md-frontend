import { createFileRoute, Link } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, StatusDot } from "@/components/badge-pill";
import {
  store,
  type Appointment,
  type InventoryItem,
  formatZAR,
  myScopedStore,
} from "@/lib/store";
import {
  format,
  isToday,
  isThisMonth,
  isThisWeek,
  parseISO,
  subDays,
  addDays,
} from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  AlertTriangle,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const TYPE_COLOR: Record<string, string> = {
  Consultation: "#3B7BF8",
  "Follow-up": "#6366F1",
  Procedure: "#9333EA",
  Telehealth: "#5DEBD7",
  Emergency: "#E53E3E",
  "Walk-in": "#D97706",
};

const STATUS_VARIANT = (s: string) =>
  s === "Completed"
    ? "success"
    : s === "In progress"
      ? "blue"
      : s === "Checked-in"
        ? "teal"
        : s === "Confirmed"
          ? "indigo"
          : s === "No-show"
            ? "danger"
            : s === "Cancelled"
              ? "neutral"
              : "neutral";

function Dashboard() {
  const [data, setData] = useState(() => myScopedStore());
  useEffect(() => {
    setData(myScopedStore());
  }, []);

  const today = new Date();
  const todays = useMemo(
    () =>
      data.appointments
        .filter((a) => isToday(parseISO(a.start)))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [data.appointments],
  );
  const seenThisWeek = data.appointments.filter(
    (a) => isThisWeek(parseISO(a.start)) && a.status === "Completed",
  ).length;
  const monthRevenue = data.invoices
    .filter((i) => isThisMonth(parseISO(i.date)) && i.status === "Paid")
    .reduce((s, i) => s + i.amount, 0);
  const outstanding = data.invoices.filter(
    (i) =>
      i.status === "Sent" ||
      i.status === "Overdue" ||
      i.status === "Partially paid",
  );
  const lowStock: InventoryItem[] = data.inventory.filter(
    (i) => i.stock <= i.reorderLevel,
  );
  const expiringSoon = data.inventory.filter((i) => {
    const d = parseISO(i.expiry).getTime() - Date.now();
    return d > 0 && d < 60 * 24 * 60 * 60 * 1000;
  });

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(today, 29 - i);
    const count = data.appointments.filter(
      (a) =>
        format(parseISO(a.start), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"),
    ).length;
    return { day: format(d, "dd MMM"), count };
  });

  const revenueWeekly = Array.from({ length: 8 }, (_, i) => ({
    week: `W${i + 1}`,
    revenue: 12000 + Math.round(Math.sin(i * 0.7) * 3000) + i * 850,
  }));

  const typeBreakdown = Object.entries(
    data.appointments.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {}),
  ).map(([type, count]) => ({ type, count }));

  return (
    <AppShell title="Dashboard">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="label-caps">Today</div>
          <div className="text-[22px] font-semibold text-navy">
            {format(today, "EEEE, d MMMM yyyy")}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-border bg-white px-3.5 py-2 text-[13px] font-medium text-navy hover:bg-surface">
            Walk-in
          </button>
          <Link
            to="/appointments/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New appointment
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPI
          label="Today's appointments"
          value={`${todays.filter((a) => a.status === "Completed").length} / ${todays.length}`}
          sub="seen / booked"
        />
        <KPI
          label="Patients this week"
          value={seenThisWeek}
          trend="up"
          trendValue="+12%"
        />
        <KPI
          label="Revenue this month"
          value={formatZAR(monthRevenue)}
          trend="up"
          trendValue="+8.4%"
        />
        <KPI
          label="Outstanding invoices"
          value={outstanding.length}
          sub={formatZAR(outstanding.reduce((s, i) => s + i.amount, 0))}
        />
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || expiringSoon.length > 0) && (
        <div className="mt-4 rounded-lg border border-[#FEE2C2] bg-[#FFFBEB] px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
            <div className="text-[13px] text-navy">
              <span className="font-semibold">
                {lowStock.length} item{lowStock.length === 1 ? "" : "s"} below
                reorder level
              </span>
              {expiringSoon.length > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold">
                    {expiringSoon.length} expiring within 60 days
                  </span>
                </>
              )}
              <a
                href="/inventory"
                className="ml-2 font-medium text-blue hover:underline"
              >
                View inventory →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <div className="pulse-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div>
                <div className="text-[14px] font-semibold text-navy">
                  Today's timeline
                </div>
                <div className="text-[12px] text-muted-foreground">
                  8:00 — 18:00
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />{" "}
                Live
              </div>
            </div>
            <Timeline appointments={todays} />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <ChartCard title="Appointments per day" sub="Last 30 days">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#64718A" }}
                    interval={4}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64718A" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ stroke: "#3B7BF8", strokeWidth: 1 }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E2E5EE",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B7BF8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Revenue by week" sub="Last 8 weeks">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueWeekly}>
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10, fill: "#64718A" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64718A" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#EEF3FE" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E2E5EE",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3B7BF8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-6 pulse-card p-5">
            <div className="text-[14px] font-semibold text-navy">
              Top appointment types
            </div>
            <div className="mt-4 space-y-3">
              {typeBreakdown
                .sort((a, b) => b.count - a.count)
                .map((t) => {
                  const max = Math.max(...typeBreakdown.map((x) => x.count));
                  const pct = (t.count / max) * 100;
                  return (
                    <div key={t.type}>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="text-navy">{t.type}</span>
                        <span className="font-mono text-muted-foreground">
                          {t.count}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-surface">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: TYPE_COLOR[t.type] || "#3B7BF8",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-3">
          <div className="pulse-card">
            <div className="border-b border-border px-5 py-3.5 text-[14px] font-semibold text-navy">
              Next up
            </div>
            <div className="divide-y divide-border">
              {data.appointments
                .filter((a) => parseISO(a.start) > new Date())
                .sort((a, b) => a.start.localeCompare(b.start))
                .slice(0, 5)
                .map((a) => (
                  <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="font-mono text-[11px] text-muted-foreground w-12 pt-0.5">
                      {format(parseISO(a.start), "HH:mm")}
                    </div>
                    <div
                      className="h-8 w-1 rounded-full"
                      style={{ background: TYPE_COLOR[a.type] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[13px] font-medium text-navy">
                        {a.patientName}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {a.type} · {a.room}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="pulse-card">
            <div className="border-b border-border px-5 py-3.5 text-[14px] font-semibold text-navy">
              Recent activity
            </div>
            <div className="divide-y divide-border">
              {[
                {
                  who: "Receptionist",
                  what: "checked in Thandiwe Mokoena",
                  time: "2m ago",
                },
                {
                  who: "Dr. Naidoo",
                  what: "completed consultation for Sipho Dlamini",
                  time: "18m ago",
                },
                {
                  who: "System",
                  what: "sent SMS reminders to 14 patients",
                  time: "1h ago",
                },
                {
                  who: "Manager",
                  what: "received stock for Amoxicillin (×60)",
                  time: "2h ago",
                },
                {
                  who: "Dr. Naidoo",
                  what: "issued invoice PM-2418",
                  time: "3h ago",
                },
              ].map((a, i) => (
                <div key={i} className="px-5 py-3 text-[12.5px]">
                  <div className="text-navy">
                    <span className="font-semibold">{a.who}</span> {a.what}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {a.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pulse-card p-5">
            <div className="text-[14px] font-semibold text-navy">
              Quick stats
            </div>
            <div className="mt-3 space-y-2.5 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">No-show rate (mo)</span>
                <span className="font-mono font-semibold text-navy">4.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg appointment</span>
                <span className="font-mono font-semibold text-navy">
                  22 min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active patients</span>
                <span className="font-mono font-semibold text-navy">
                  {data.patients.filter((p) => p.active).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function KPI({
  label,
  value,
  sub,
  trend,
  trendValue,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down";
  trendValue?: string;
}) {
  return (
    <div className="pulse-card p-5">
      <div className="label-caps">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-[26px] font-bold text-navy">{value}</div>
        {trend && (
          <div
            className={`flex items-center gap-0.5 text-[12px] font-medium ${trend === "up" ? "text-success" : "text-danger"}`}
          >
            {trend === "up" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {trendValue}
          </div>
        )}
      </div>
      {sub && (
        <div className="mt-1 text-[12px] text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pulse-card p-5">
      <div className="text-[14px] font-semibold text-navy">{title}</div>
      <div className="text-[11.5px] text-muted-foreground">{sub}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Timeline({ appointments }: { appointments: Appointment[] }) {
  const HOUR_PX = 70;
  const startHour = 8;
  const endHour = 18;

  return (
    <div className="relative px-5 py-4 overflow-x-auto">
      <div
        className="relative"
        style={{
          minWidth: 900,
          height: ((endHour - startHour) * HOUR_PX) / 4 + 32,
        }}
      >
        {/* hour grid */}
        {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
          const left = i * HOUR_PX;
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-border"
              style={{ left }}
            >
              <div className="ml-2 text-[10px] font-mono text-muted-foreground">
                {(startHour + i).toString().padStart(2, "0")}:00
              </div>
            </div>
          );
        })}
        {/* blocks */}
        {appointments.map((a) => {
          const start = parseISO(a.start);
          const end = parseISO(a.end);
          const hours = start.getHours() + start.getMinutes() / 60;
          const dur = (end.getTime() - start.getTime()) / 3600000;
          const left = (hours - startHour) * HOUR_PX;
          const width = Math.max(dur * HOUR_PX - 4, 60);
          return (
            <div
              key={a.id}
              className="absolute rounded-md px-2.5 py-1.5 text-white shadow-sm cursor-pointer hover:scale-[1.02] transition-transform"
              style={{
                left,
                width,
                top: 22,
                background: TYPE_COLOR[a.type],
                color: a.type === "Telehealth" ? "#0A0E1A" : "white",
              }}
            >
              <div className="truncate text-[11.5px] font-semibold">
                {a.patientName}
              </div>
              <div className="truncate text-[10px] opacity-90">
                {a.type} · {format(start, "HH:mm")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
