import { createFileRoute, Link } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import { store, type Appointment, type AppointmentType } from "@/lib/store";
import {
  addDays,
  addMinutes,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  subWeeks,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

const TYPE_COLOR: Record<string, string> = {
  Consultation: "#3B7BF8",
  "Follow-up": "#6366F1",
  Procedure: "#9333EA",
  Telehealth: "#5DEBD7",
  Emergency: "#E53E3E",
  "Walk-in": "#D97706",
};

const HOUR_HEIGHT = 56;
const START_HOUR = 8;
const END_HOUR = 18;

function CalendarPage() {
  const [data, setData] = useState(() => store.get());
  useEffect(() => {
    setData(store.get());
  }, []);
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week" | "month" | "agenda">("week");
  const [selected, setSelected] = useState<Appointment | null>(null);

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(anchor, { weekStartsOn: 1 }),
  });

  const inRange = useMemo(
    () =>
      data.appointments.filter((a) =>
        days.some((d) => isSameDay(parseISO(a.start), d)),
      ),
    [data.appointments, days],
  );

  return (
    <AppShell title="Calendar">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAnchor(new Date())}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-navy hover:bg-surface"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAnchor(subWeeks(anchor, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white hover:bg-surface"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setAnchor(addWeeks(anchor, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white hover:bg-surface"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="text-[16px] font-semibold text-navy">
            {format(weekStart, "d MMM")} — {format(days[6], "d MMM yyyy")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-white p-0.5">
            {(["day", "week", "month", "agenda"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded px-3 py-1 text-[12.5px] capitalize ${view === v ? "bg-blue text-white" : "text-navy hover:bg-surface"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <Link
            to="/appointments/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-1.5 text-[13px] font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New appointment
          </Link>
        </div>
      </div>

      <div className="pulse-card overflow-hidden">
        {view === "week" || view === "day" ? (
          <WeekGrid
            days={view === "day" ? [anchor] : days}
            appointments={inRange}
            onSelect={setSelected}
          />
        ) : view === "month" ? (
          <MonthGrid
            anchor={anchor}
            appointments={data.appointments}
            onSelect={setSelected}
          />
        ) : (
          <AgendaList appointments={data.appointments} onSelect={setSelected} />
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(TYPE_COLOR).map(([t, c]) => (
          <div
            key={t}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground"
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: c }}
            />
            {t}
          </div>
        ))}
      </div>

      {/* Slide-over */}
      {selected && (
        <div
          className="fixed inset-0 z-40 flex"
          onClick={() => setSelected(null)}
        >
          <div className="flex-1 bg-navy/30" />
          <div
            className="w-[440px] bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="text-[15px] font-semibold text-navy">
                Appointment
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <div className="label-caps">Patient</div>
                <div className="mt-1 text-[16px] font-semibold text-navy">
                  {selected.patientName}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="label-caps">Type</div>
                  <div className="mt-1">
                    <Badge variant="blue">{selected.type}</Badge>
                  </div>
                </div>
                <div>
                  <div className="label-caps">Status</div>
                  <div className="mt-1">
                    <Badge variant="success">{selected.status}</Badge>
                  </div>
                </div>
                <div>
                  <div className="label-caps">Start</div>
                  <div className="mt-1 text-[13px] text-navy">
                    {format(parseISO(selected.start), "EEE d MMM, HH:mm")}
                  </div>
                </div>
                <div>
                  <div className="label-caps">Room</div>
                  <div className="mt-1 text-[13px] text-navy">
                    {selected.room}
                  </div>
                </div>
              </div>
              <div>
                <div className="label-caps">Reason</div>
                <div className="mt-1 text-[13.5px] text-navy">
                  {selected.reason}
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="label-caps">Workflow</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Booked",
                    "Confirmed",
                    "Checked-in",
                    "In progress",
                    "Completed",
                  ].map((s) => (
                    <button
                      key={s}
                      className={`rounded-md border px-2.5 py-1 text-[12px] ${
                        s === selected.status
                          ? "border-blue bg-blue text-white"
                          : "border-border bg-white text-navy hover:bg-surface"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 border-t border-border pt-4">
                <button className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-navy hover:bg-surface">
                  Reschedule
                </button>
                <button className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-danger hover:bg-surface">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function WeekGrid({
  days,
  appointments,
  onSelect,
}: {
  days: Date[];
  appointments: Appointment[];
  onSelect: (a: Appointment) => void;
}) {
  return (
    <div className="overflow-auto">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `60px repeat(${days.length}, minmax(140px, 1fr))`,
        }}
      >
        {/* Day headers */}
        <div className="border-b border-border bg-surface" />
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className="border-b border-l border-border bg-surface px-3 py-2.5 text-center"
          >
            <div className="label-caps">{format(d, "EEE")}</div>
            <div
              className={`mt-0.5 text-[16px] font-semibold ${isToday(d) ? "text-blue" : "text-navy"}`}
            >
              {format(d, "d")}
            </div>
          </div>
        ))}
        {/* Hours grid */}
        <div className="relative">
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
            <div
              key={i}
              className="border-b border-border text-right pr-2 font-mono text-[10px] text-muted-foreground"
              style={{ height: HOUR_HEIGHT }}
            >
              {(START_HOUR + i).toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((d) => {
          const dayAppts = appointments.filter((a) =>
            isSameDay(parseISO(a.start), d),
          );
          return (
            <div
              key={d.toISOString()}
              className="relative border-l border-border"
              style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
            >
              {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-b border-border"
                  style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                />
              ))}
              {dayAppts.map((a) => {
                const start = parseISO(a.start);
                const end = parseISO(a.end);
                const top =
                  (start.getHours() + start.getMinutes() / 60 - START_HOUR) *
                  HOUR_HEIGHT;
                const height =
                  ((end.getTime() - start.getTime()) / 3600000) * HOUR_HEIGHT -
                  2;
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className="absolute left-1 right-1 rounded-md px-2 py-1 text-left transition-transform hover:scale-[1.01]"
                    style={{
                      top: top + 1,
                      height,
                      background: TYPE_COLOR[a.type],
                      color: a.type === "Telehealth" ? "#0A0E1A" : "white",
                    }}
                  >
                    <div className="truncate text-[11.5px] font-semibold leading-tight">
                      {a.patientName}
                    </div>
                    <div className="truncate text-[10px] opacity-90">
                      {format(start, "HH:mm")} · {a.type}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthGrid({
  anchor,
  appointments,
  onSelect,
}: {
  anchor: Date;
  appointments: Appointment[];
  onSelect: (a: Appointment) => void;
}) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const cells = eachDayOfInterval({
    start: gridStart,
    end: addDays(gridStart, 41),
  });
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border bg-surface">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="border-r border-border px-3 py-2 text-center label-caps"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const dayAppts = appointments.filter((a) =>
            isSameDay(parseISO(a.start), d),
          );
          const isCurMonth = d.getMonth() === anchor.getMonth();
          return (
            <div
              key={d.toISOString()}
              className={`min-h-[110px] border-b border-r border-border p-2 ${!isCurMonth ? "bg-surface/50" : "bg-white"}`}
            >
              <div
                className={`text-[12px] font-semibold ${isToday(d) ? "text-blue" : isCurMonth ? "text-navy" : "text-muted-foreground"}`}
              >
                {format(d, "d")}
              </div>
              <div className="mt-1 space-y-1">
                {dayAppts.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[10.5px] text-white"
                    style={{ background: TYPE_COLOR[a.type] }}
                  >
                    {format(parseISO(a.start), "HH:mm")} {a.patientName}
                  </button>
                ))}
                {dayAppts.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">
                    +{dayAppts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaList({
  appointments,
  onSelect,
}: {
  appointments: Appointment[];
  onSelect: (a: Appointment) => void;
}) {
  const sorted = [...appointments].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  return (
    <div className="divide-y divide-border">
      {sorted.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a)}
          className="grid w-full grid-cols-[120px_1fr_auto] items-center gap-4 px-5 py-3 text-left hover:bg-blue-tint"
        >
          <div>
            <div className="text-[13px] font-semibold text-navy">
              {format(parseISO(a.start), "d MMM")}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {format(parseISO(a.start), "HH:mm")}
            </div>
          </div>
          <div>
            <div className="text-[13.5px] font-medium text-navy">
              {a.patientName}
            </div>
            <div className="text-[12px] text-muted-foreground">
              {a.reason} · {a.room}
            </div>
          </div>
          <Badge variant="blue">{a.type}</Badge>
        </button>
      ))}
    </div>
  );
}
