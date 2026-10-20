import { ActionButton } from "@/components/action-feedback";
import { StartConsultation } from "@/components/start-consultation";
import { createFileRoute, Link } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import type { Appointment } from "@/types/appointment";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  BookOpen,
} from "lucide-react";
import { useData } from "@/context/AppDataProvider";
import { matchesPatient } from "@/lib/patient-search";
import { appointmentStatusSchema } from "@/schema/appointment";
import { AppointmentForm } from "@/components/appointment-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

const TYPE_COLOR: Record<string, string> = {
  Consultation: "#153C55",
  "Follow-up": "#8C6A24",
  Procedure: "#656581",
  Telehealth: "#A4C7BA",
  Emergency: "#B94343",
  "Walk-in": "#967247",
};

const HOUR_HEIGHT = 56;
const START_HOUR = 8;
const END_HOUR = 18;

function CalendarPage() {
  const { appointment, patient } = useData();

  const [anchor, setAnchor] = useState<Date>(new Date());
  const [view, setView] = useState<
    "day" | "week" | "month" | "agenda" | "diary"
  >("diary");
  const [selected, setSelected] = useState<Appointment | null>(null);

  const [search, setSearch] = useState("");
  const [doctor, setDoctor] = useState("");
  const [status, setStatus] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingPatient, setBookingPatient] = useState<string>();
  const patientsById = useMemo(
    () => new Map(patient.patients.map((p) => [p.id, p])),
    [patient.patients],
  );
  const matchingPatients = useMemo(
    () => patient.patients.filter((p) => matchesPatient(search, p)),
    [patient.patients, search],
  );
  const matchingIds = new Set(matchingPatients.map((p) => p.id));
  const filtered = appointment.appointments.filter(
    (a) =>
      (!doctor || a.gp === doctor) &&
      (!status || a.status === status) &&
      (!search.trim() ||
        matchingIds.has(a.patientId) ||
        a.patientName.toLowerCase().includes(search.trim().toLowerCase())),
  );
  const dayAppointments = filtered.filter((a) =>
    isSameDay(parseISO(a.start), anchor),
  );
  const move = (direction: number) =>
    setAnchor((current) =>
      view === "month"
        ? addMonths(current, direction)
        : view === "day" || view === "diary"
          ? addDays(current, direction)
          : addWeeks(current, direction),
    );
  const period =
    view === "month"
      ? "month"
      : view === "day" || view === "diary"
        ? "day"
        : "week";
  // Keep the details panel current after a consultation changes the booking.
  useEffect(() => {
    setSelected((current) =>
      current
        ? appointment.appointments.find((a) => a.id === current.id) || null
        : null,
    );
  }, [appointment.appointments]);

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(anchor, { weekStartsOn: 1 }),
  });

  const inRange = filtered.filter((a) =>
    days.some((d) => isSameDay(parseISO(a.start), d)),
  );
  const changeStatus = async (a: Appointment, next: Appointment["status"]) => {
    const updated = await appointment.updateAppointmentStatus(a.id, next);
    if (!updated)
      throw new Error("Could not update the appointment. Please try again.");
    setSelected((current) => (current?.id === a.id ? updated : current));
  };

  return (
    <AppShell title="Calendar">
      <div className="mb-5 rounded-xl bg-navy p-5 text-white">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-yellow">
          <BookOpen size={16} /> Practice diary
        </div>
        <h2 className="mt-2 text-2xl font-semibold">Your day, at a glance</h2>
        <p className="mt-1 text-sm text-white/70">
          Find a patient, follow their appointment and open their clinical
          notes.
        </p>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            onClick={() => setAnchor(new Date())}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-navy hover:bg-surface"
          >
            Today
          </ActionButton>
          <div className="flex items-center gap-1">
            <ActionButton
              onClick={() => move(-1)}
              aria-label={`Previous ${period}`}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white hover:bg-surface"
            >
              <ChevronLeft className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={() => move(1)}
              aria-label={`Next ${period}`}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white hover:bg-surface"
            >
              <ChevronRight className="h-4 w-4" />
            </ActionButton>
          </div>
          <div className="text-[16px] font-semibold text-navy">
            {view === "month"
              ? format(anchor, "MMMM yyyy")
              : period === "day"
                ? format(anchor, "EEE d MMM yyyy")
                : `${format(weekStart, "d MMM")} — ${format(days[6], "d MMM yyyy")}`}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex max-w-full flex-wrap rounded-md border border-border bg-white p-0.5">
            {(["diary", "day", "week", "month", "agenda"] as const).map((v) => (
              <ActionButton
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`rounded px-3 py-1 text-[12.5px] capitalize ${view === v ? "bg-blue text-white" : "text-navy hover:bg-surface"}`}
              >
                {v}
              </ActionButton>
            ))}
          </div>
          <ActionButton
            onClick={() => {
              setBookingPatient(undefined);
              setBooking(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-1.5 text-[13px] font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New appointment
          </ActionButton>
        </div>
      </div>

      <div className="pulse-card mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_auto_auto_auto]">
          <div>
            <label
              htmlFor="diary-search"
              className="text-xs font-medium text-navy"
            >
              Find patient
            </label>
            <div className="relative mt-1">
              <Search
                size={16}
                className="absolute left-3 top-3 text-muted-foreground"
              />
              <input
                id="diary-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Surname or phone number…"
                className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>
          <label className="text-xs font-medium text-navy">
            Go to date
            <input
              type="date"
              aria-label="Go to date"
              value={format(anchor, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) setAnchor(parseISO(e.target.value));
              }}
              className="mt-1 block rounded-md border border-border bg-white p-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-navy">
            Doctor
            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="mt-1 block rounded-md border border-border bg-white p-2 text-sm"
            >
              <option value="">All doctors</option>
              {[...new Set(appointment.appointments.map((a) => a.gp))]
                .sort()
                .map((gp) => (
                  <option key={gp}>{gp}</option>
                ))}
            </select>
          </label>
          <label className="text-xs font-medium text-navy">
            Booking status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block rounded-md border border-border bg-white p-2 text-sm"
            >
              <option value="">All statuses</option>
              {appointmentStatusSchema.options.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        {(search || doctor || status) && (
          <ActionButton
            onClick={() => {
              setSearch("");
              setDoctor("");
              setStatus("");
            }}
            className="mt-3 text-sm text-blue underline"
          >
            Clear filters
          </ActionButton>
        )}
        {search.trim() && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              Patient matches across all dates. The calendar below also filters
              to your search.
            </p>
            <div className="mt-2 max-h-64 overflow-auto divide-y divide-border">
              {matchingPatients.map((p) => {
                const bookings = appointment.appointments
                  .filter((a) => a.patientId === p.id)
                  .sort((a, b) => a.start.localeCompare(b.start));
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <Link
                        to={`/patients/${p.id}`}
                        className="text-sm font-semibold text-navy underline"
                      >
                        {p.lastName}, {p.firstName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.phone}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        className="rounded-md border border-border px-3 py-2 text-xs"
                        onClick={() => {
                          setBookingPatient(p.id);
                          setBooking(true);
                        }}
                      >
                        Book appointment
                      </ActionButton>
                      {bookings.length ? (
                        <select
                          aria-label={`Appointments for ${p.firstName} ${p.lastName}`}
                          value=""
                          onChange={(e) => {
                            const a = bookings.find(
                              (a) => a.id === e.target.value,
                            );
                            if (a) {
                              setAnchor(parseISO(a.start));
                              setDoctor("");
                              setStatus("");
                              setView("diary");
                              setSelected(a);
                            }
                          }}
                          className="max-w-full rounded-md border border-border bg-white p-2 text-xs"
                        >
                          <option value="">
                            Find appointment ({bookings.length})
                          </option>
                          {bookings.map((a) => (
                            <option value={a.id} key={a.id}>
                              {format(parseISO(a.start), "d MMM yyyy HH:mm")} ·{" "}
                              {a.status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No appointments booked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {patient.isPatientLoading && (
                <p role="status" className="py-3 text-sm">
                  Loading patients…
                </p>
              )}
              {!patient.isPatientLoading && !matchingPatients.length && (
                <p className="py-3 text-sm text-muted-foreground">
                  No matching patients. Try another surname or phone number.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      {appointment.isLoading && (
        <p role="status" className="mb-3 text-sm">
          Loading appointments…
        </p>
      )}
      <div className="pulse-card overflow-hidden">
        {view === "diary" && (
          <>
            <div className="flex flex-wrap gap-5 border-b border-border bg-surface px-5 py-4 text-sm">
              <span>
                <strong>{dayAppointments.length}</strong>{" "}
                {dayAppointments.length === 1 ? "appointment" : "appointments"}
              </span>
              <span>
                <strong>
                  {
                    dayAppointments.filter((a) => a.status === "Checked-in")
                      .length
                  }
                </strong>{" "}
                waiting
              </span>
              <span>
                <strong>
                  {
                    dayAppointments.filter((a) => a.status === "In progress")
                      .length
                  }
                </strong>{" "}
                in consultation
              </span>
              <span>
                <strong>
                  {
                    dayAppointments.filter((a) => a.status === "Completed")
                      .length
                  }
                </strong>{" "}
                completed
              </span>
            </div>
            {!dayAppointments.length && (
              <p className="p-8 text-center text-muted-foreground">
                {search || doctor || status
                  ? "No appointments match your filters for this day."
                  : "No appointments for this day. Choose another date or book an appointment."}
              </p>
            )}
            <div className="divide-y divide-border">
              {[...dayAppointments]
                .sort((a, b) => a.start.localeCompare(b.start))
                .map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center gap-4 p-5"
                    style={{ borderLeft: `4px solid ${TYPE_COLOR[a.type]}` }}
                  >
                    <div className="w-24">
                      <div className="font-semibold text-navy">
                        {format(parseISO(a.start), "HH:mm")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        to {format(parseISO(a.end), "HH:mm")}
                      </div>
                    </div>
                    <div className="min-w-40 flex-1">
                      <Link
                        to={`/patients/${a.patientId}`}
                        className="font-semibold text-navy hover:underline"
                      >
                        {a.patientName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {patientsById.get(a.patientId)?.phone ||
                          "No phone recorded"}
                      </p>
                      <p className="mt-1 text-sm">
                        {a.type} · {a.gp} · {a.room}
                      </p>
                    </div>
                    <Badge
                      variant={
                        a.status === "Completed"
                          ? "success"
                          : a.status === "Cancelled" || a.status === "No-show"
                            ? "danger"
                            : "blue"
                      }
                    >
                      {a.status}
                    </Badge>
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        onClick={() => setSelected(a)}
                        className="gp-button border border-border bg-white text-navy"
                      >
                        Details
                      </ActionButton>
                      {["Booked", "Confirmed"].includes(a.status) && (
                        <ActionButton
                          onClick={() => changeStatus(a, "Checked-in")}
                          className="gp-button border border-border bg-white text-navy"
                        >
                          Check in
                        </ActionButton>
                      )}
                      <StartConsultation id={a.id} status={a.status} />
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {view === "week" || view === "day" ? (
          <WeekGrid
            days={view === "day" ? [anchor] : days}
            appointments={inRange}
            onSelect={setSelected}
          />
        ) : view === "month" ? (
          <MonthGrid
            anchor={anchor}
            appointments={filtered}
            onSelect={setSelected}
          />
        ) : view === "agenda" ? (
          <AgendaList appointments={inRange} onSelect={setSelected} />
        ) : null}
      </div>

      <Dialog open={booking} onOpenChange={setBooking}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New appointment</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            defaultDate={anchor}
            defaultPatientId={bookingPatient}
            onCancel={() => setBooking(false)}
            onCreated={(a) => {
              setBooking(false);
              setAnchor(parseISO(a.start));
              setSelected(a);
            }}
          />
        </DialogContent>
      </Dialog>
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

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="px-6 py-5 space-y-5">
              <div>
                <div className="label-caps">Patient</div>
                <div className="mt-1 text-[16px] font-semibold text-navy">
                  <Link
                    to={`/patients/${selected.patientId}`}
                    className="underline"
                  >
                    {selected.patientName}
                  </Link>
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
                <div className="mt-3">
                  <StartConsultation
                    id={selected.id}
                    status={selected.status}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    ["Confirmed", "Checked-in", "No-show", "Cancelled"] as const
                  ).map((s) => (
                    <ActionButton
                      key={s}
                      disabled={
                        s === selected.status ||
                        ["Completed", "In progress"].includes(selected.status)
                      }
                      onClick={() => changeStatus(selected, s)}
                      className="rounded-md border border-border px-3 py-2 text-xs text-navy disabled:opacity-40"
                    >
                      {s === "Cancelled" ? "Cancel appointment" : s}
                    </ActionButton>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
                  <ActionButton
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
                  </ActionButton>
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
                  <ActionButton
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[10.5px] text-white"
                    style={{ background: TYPE_COLOR[a.type] }}
                  >
                    {format(parseISO(a.start), "HH:mm")} {a.patientName}
                  </ActionButton>
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
      {!sorted.length && (
        <p className="p-8 text-center text-muted-foreground">
          No appointments for this week with the selected filters.
        </p>
      )}
      {sorted.map((a) => (
        <ActionButton
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
        </ActionButton>
      ))}
    </div>
  );
}
