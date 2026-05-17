import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Stethoscope, User as UserIcon, MapPin, FileText } from "lucide-react";
import { createAppointment, store, type Appointment, type AppointmentType } from "@/lib/store";

interface Props {
  defaultDate?: Date;
  onCreated?: (a: Appointment) => void;
  onCancel?: () => void;
}

const TYPES: AppointmentType[] = ["Consultation", "Follow-up", "Procedure", "Telehealth", "Emergency", "Walk-in"];
const ROOMS = ["Room 1", "Room 2", "Room 3", "Telehealth"];
const DURATIONS = [10, 15, 20, 30, 45, 60];

export function AppointmentForm({ defaultDate, onCreated, onCancel }: Props) {
  const s = store.get();
  const patients = useMemo(() => s.patients.slice().sort((a, b) => a.lastName.localeCompare(b.lastName)), [s.patients]);
  const gp = s.users.find(u => u.role === "owner" && u.tenantId === s.user?.tenantId);
  const gpName = gp ? `${gp.title} ${gp.firstName[0]}. ${gp.lastName}` : "Dr. M. Naidoo";

  const initial = defaultDate || new Date();
  const [patientId, setPatientId] = useState<string>(patients[0]?.id || "");
  const [type, setType] = useState<AppointmentType>("Consultation");
  const [date, setDate] = useState<string>(format(initial, "yyyy-MM-dd"));
  const [time, setTime] = useState<string>(format(initial, "HH:mm"));
  const [duration, setDuration] = useState<number>(20);
  const [room, setRoom] = useState<string>("Room 1");
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50);
  const selectedPatient = patients.find(p => p.id === patientId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const p = patients.find(x => x.id === patientId);
    if (!p) { setError("Please select a patient."); return; }
    if (!reason.trim()) { setError("Reason for visit is required."); return; }
    const start = new Date(`${date}T${time}:00`);
    if (isNaN(start.getTime())) { setError("Invalid date/time."); return; }
    const end = new Date(start.getTime() + duration * 60000);
    const a = createAppointment({
      patientId: p.id,
      patientName: `${p.firstName} ${p.lastName}`,
      type,
      start: start.toISOString(),
      end: end.toISOString(),
      status: "Booked",
      reason: reason.trim(),
      room,
      gp: gpName,
    });
    onCreated?.(a);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Section icon={<UserIcon className="h-4 w-4" />} title="Patient">
        <input
          placeholder="Search patients by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue"
        />
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue"
        >
          <option value="">— Select a patient —</option>
          {filtered.map(p => (
            <option key={p.id} value={p.id}>
              {p.lastName}, {p.firstName} · {p.medicalAid}
            </option>
          ))}
        </select>
        {selectedPatient && (
          <div className="mt-2 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] text-muted-foreground">
            Selected: <span className="font-medium text-navy">{selectedPatient.firstName} {selectedPatient.lastName}</span> · {selectedPatient.medicalAid} · {selectedPatient.medicalAidNumber}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-4">
        <Section icon={<Stethoscope className="h-4 w-4" />} title="Visit type">
          <select value={type} onChange={(e) => setType(e.target.value as AppointmentType)} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Section>
        <Section icon={<MapPin className="h-4 w-4" />} title="Room">
          <select value={room} onChange={(e) => setRoom(e.target.value)} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">
            {ROOMS.map(r => <option key={r}>{r}</option>)}
          </select>
        </Section>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Section icon={<Calendar className="h-4 w-4" />} title="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue" />
        </Section>
        <Section icon={<Clock className="h-4 w-4" />} title="Start time">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue" />
        </Section>
        <Section icon={<Clock className="h-4 w-4" />} title="Duration">
          <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">
            {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </Section>
      </div>

      <Section icon={<FileText className="h-4 w-4" />} title="Reason for visit">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. BP review, repeat script, flu symptoms"
          className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue" />
      </Section>

      <div className="rounded-md border border-border bg-surface px-3 py-2 text-[12px] text-muted-foreground">
        Will be booked with <span className="font-medium text-navy">{gpName}</span>.
      </div>

      {error && <div className="rounded-md bg-[#FEE2E2] px-3 py-2 text-[12.5px] text-[#991B1B]">{error}</div>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-navy hover:bg-surface">
            Cancel
          </button>
        )}
        <button type="submit" className="rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">
          Schedule appointment
        </button>
      </div>
    </form>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}<span>{title}</span>
      </div>
      {children}
    </div>
  );
}
