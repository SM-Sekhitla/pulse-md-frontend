import { createFileRoute } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Save,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Copy,
  Sun,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useData } from "@/context/AppDataProvider";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import type { TenantOut } from "@/types/tenant";

export const Route = createFileRoute("/booking/availability")({
  component: AvailabilityPage,
});

const DAYS = [
  { v: 1, key: "monday", label: "Monday", l: "Mon" },
  { v: 2, key: "tuesday", label: "Tuesday", l: "Tue" },
  { v: 3, key: "wednesday", label: "Wednesday", l: "Wed" },
  { v: 4, key: "thursday", label: "Thursday", l: "Thu" },
  { v: 5, key: "friday", label: "Friday", l: "Fri" },
  { v: 6, key: "saturday", label: "Saturday", l: "Sat" },
  { v: 0, key: "sunday", label: "Sunday", l: "Sun" },
];

interface BookingAvailability {
  workDays: number[];
  startTime: string;
  endTime: string;
  slotMinutes: number;
  breakStart?: string;
  breakEnd?: string;
}

const DEFAULT_AVAILABILITY: BookingAvailability = {
  workDays: [1, 2, 3, 4, 5],
  startTime: "08:00",
  endTime: "16:00",
  slotMinutes: 30,
};

function AvailabilityPage() {
  const { tenant: tenantData } = useData();
  const tenant = useCurrentTenant();

  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [av, setAv] = useState<BookingAvailability>(DEFAULT_AVAILABILITY);
  const [holidays, setHolidays] = useState<string[]>([]);

  useEffect(() => {
    if (!tenant) return;
    setAv(availabilityFromTenant(tenant));
  }, [tenant]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayNumber = selectedDate.getDay();
  const isWorkingDay = av.workDays.includes(selectedDayNumber);
  const isBlocked = holidays.includes(selectedKey);

  const slotsPerDay = Math.max(
    0,
    Math.floor(
      (toMin(av.endTime) -
        toMin(av.startTime) -
        (av.breakStart && av.breakEnd
          ? toMin(av.breakEnd) - toMin(av.breakStart)
          : 0)) /
        av.slotMinutes
    )
  );

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });

    return eachDayOfInterval({ start, end });
  }, [month]);

  const toggleSelectedDayAvailability = () => {
    if (isBlocked) {
      setHolidays((h) => h.filter((x) => x !== selectedKey));
      setAv((s) => ({
        ...s,
        workDays: s.workDays.includes(selectedDayNumber)
          ? s.workDays
          : [...s.workDays, selectedDayNumber].sort(),
      }));
      return;
    }

    setHolidays((h) => [...h, selectedKey].sort());
  };

  const applyToAllWorkingDays = () => {
    setAv((s) => ({
      ...s,
      workDays: [1, 2, 3, 4, 5],
    }));

    toast.success("Applied to Monday - Friday");
  };

  const openEveryDay = () => {
    setAv((s) => ({
      ...s,
      workDays: [0, 1, 2, 3, 4, 5, 6],
    }));

    toast.success("All days opened");
  };

  const closeEveryDay = () => {
    setAv((s) => ({
      ...s,
      workDays: [],
    }));

    toast.success("All days closed");
  };

  const save = async () => {
    if (!tenant) return;

    if (av.startTime >= av.endTime) {
      toast.error("End time must be after start time");
      return;
    }

    if (av.slotMinutes < 5 || av.slotMinutes > 120) {
      toast.error("Slot duration must be 5–120 minutes");
      return;
    }

    await tenantData.updateTenant(tenant.id, {
      workingHours: toWorkingHours(av),
    });
    toast.success("Availability saved");
  };

  if (!tenant) return null;

  return (
    <AppShell title="Booking availability">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h1 className="text-[22px] font-semibold text-navy">
                Manage appointment availability
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Click a day on the calendar to open, close, or manage booking hours.
              </p>
            </div>

            <button
              type="button"
              onClick={save}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue px-5 py-3 text-[13px] font-semibold text-white hover:bg-blue/90"
            >
              <Save className="h-4 w-4" />
              Save changes
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                className="rounded-xl border border-border bg-white p-2 text-navy hover:bg-surface"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="text-[18px] font-semibold text-navy">
                {format(month, "MMMM yyyy")}
              </div>

              <button
                type="button"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                className="rounded-xl border border-border bg-white p-2 text-navy hover:bg-surface"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {DAYS.map((d) => (
                <div key={d.v}>{d.l}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayNo = day.getDay();
                const working = av.workDays.includes(dayNo);
                const blocked = holidays.includes(key);
                const selected = isSameDay(day, selectedDate);
                const muted = !isSameMonth(day, month);

                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[96px] rounded-2xl border p-3 text-left transition-all duration-200 ${
                      selected
                        ? "border-navy bg-navy text-white shadow-lg shadow-navy/20"
                        : blocked
                          ? "border-red-100 bg-red-50 text-red-600 hover:border-red-200"
                          : working
                            ? "border-blue/15 bg-blue/5 text-navy hover:border-blue/40 hover:bg-blue/10"
                            : "border-border bg-white text-muted-foreground hover:bg-surface"
                    } ${muted ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold">{format(day, "d")}</span>

                      {blocked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : working ? (
                        <Unlock className="h-3.5 w-3.5" />
                      ) : null}
                    </div>

                    <div
                      className={`mt-5 inline-flex rounded-full px-2 py-1 text-[10.5px] font-semibold ${
                        selected
                          ? "bg-white/15 text-white"
                          : blocked
                            ? "bg-red-100 text-red-600"
                            : working
                              ? "bg-navy/10 text-navy"
                              : "bg-slate-100 text-muted-foreground"
                      }`}
                    >
                      {blocked ? "Blocked" : working ? `${slotsPerDay} slots` : "Closed"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Selected day
              </div>

              <div className="mt-1 text-[22px] font-semibold text-navy">
                {format(selectedDate, "EEEE")}
              </div>

              <div className="text-[13px] text-muted-foreground">
                {format(selectedDate, "d MMMM yyyy")}
              </div>

             <button
                type="button"
                onClick={toggleSelectedDayAvailability}
                className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold text-white transition ${
                  isBlocked
                    ? "bg-navy hover:bg-navy/90"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isBlocked ? (
                  <>
                    <Unlock className="h-4 w-4" />
                    Open this day
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Block this day
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue" />
                <h2 className="text-[15px] font-semibold text-navy">Booking hours</h2>
              </div>

              <div className="mt-4 grid gap-4">
                <Field label="Start time">
                  <TimeInput
                    value={av.startTime}
                    onChange={(v) => setAv((s) => ({ ...s, startTime: v }))}
                  />
                </Field>

                <Field label="End time">
                  <TimeInput
                    value={av.endTime}
                    onChange={(v) => setAv((s) => ({ ...s, endTime: v }))}
                  />
                </Field>

                <Field label="Slot duration">
                  <select
                    value={av.slotMinutes}
                    onChange={(e) =>
                      setAv((s) => ({ ...s, slotMinutes: Number(e.target.value) }))
                    }
                    className={inputClass}
                  >
                    {[10, 15, 20, 30, 45, 60].map((n) => (
                      <option key={n} value={n}>
                        {n} minutes
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Field label="Break start">
                    <TimeInput
                      value={av.breakStart || ""}
                      onChange={(v) =>
                        setAv((s) => ({ ...s, breakStart: v || undefined }))
                      }
                    />
                  </Field>

                  <Field label="Break end">
                    <TimeInput
                      value={av.breakEnd || ""}
                      onChange={(v) =>
                        setAv((s) => ({ ...s, breakEnd: v || undefined }))
                      }
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-navy/5 px-4 py-3 text-[13px] text-navy">
                <span className="font-semibold">≈ {slotsPerDay} slots</span> per open day.
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={applyToAllWorkingDays}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-[13px] font-semibold text-navy hover:bg-surface"
                >
                  <Copy className="h-4 w-4" />
                  Apply to Monday - Friday
                </button>

                <button
                  type="button"
                  onClick={openEveryDay}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-[13px] font-semibold text-navy hover:bg-surface"
                >
                  <Sun className="h-4 w-4" />
                  Open all days
                </button>

                <button
                  type="button"
                  onClick={closeEveryDay}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-50"
                >
                  <Lock className="h-4 w-4" />
                  Close all days
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function TimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-blue";

function toMin(t: string) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function availabilityFromTenant(tenant: TenantOut): BookingAvailability {
  const enabledHours = tenant.workingHours?.find((item) => item.enabled);
  const workDays =
    tenant.workingHours
      ?.filter((item) => item.enabled)
      .map((item) => DAYS.find((day) => day.key === item.key)?.v)
      .filter((value): value is number => value !== undefined) ?? DEFAULT_AVAILABILITY.workDays;

  return {
    ...DEFAULT_AVAILABILITY,
    workDays: workDays.length ? workDays : DEFAULT_AVAILABILITY.workDays,
    startTime: enabledHours?.start ?? DEFAULT_AVAILABILITY.startTime,
    endTime: enabledHours?.end ?? DEFAULT_AVAILABILITY.endTime,
  };
}

function toWorkingHours(av: BookingAvailability) {
  return DAYS.map((day) => ({
    key: day.key,
    label: day.label,
    short: day.l,
    enabled: av.workDays.includes(day.v),
    start: av.startTime,
    end: av.endTime,
  }));
}
