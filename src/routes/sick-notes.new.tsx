import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { User as UserIcon, FileText, Stethoscope, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createSickNote, currentTenant, currentUser, patientAppointments, store } from "@/lib/store";

export const Route = createFileRoute("/sick-notes/new")({ component: NewSickNote });

function NewSickNote() {
  const navigate = useNavigate();
  const tenant = currentTenant();
  const me = currentUser();
  const s = store.get();
  const patients = useMemo(() => s.patients.slice().sort((a, b) => a.lastName.localeCompare(b.lastName)), [s.patients]);
  const owner = s.users.find(u => u.role === "owner" && u.tenantId === tenant?.id);
  const gpName = owner ? `${owner.title} ${owner.firstName} ${owner.lastName}` : (me ? `${me.title} ${me.firstName} ${me.lastName}` : "Dr. M. Naidoo");
  const hpcsa = owner?.hpcsa || tenant?.hpcsa || "MP0712345";

  const today = format(new Date(), "yyyy-MM-dd");
  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reason, setReason] = useState("");
  const [icd10, setIcd10] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = patients.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())).slice(0, 50);
  const selectedPatient = patients.find(p => p.id === patientId);
  const apptOptions = selectedPatient ? patientAppointments(selectedPatient.id) : [];
  const days = (() => { try { return differenceInCalendarDays(new Date(toDate), new Date(fromDate)) + 1; } catch { return 0; } })();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedPatient) { setError("Please select a patient."); return; }
    if (!reason.trim()) { setError("Reason is required."); return; }
    if (new Date(toDate) < new Date(fromDate)) { setError("End date must be on or after start date."); return; }
    const note = createSickNote({
      tenantId: tenant?.id || "tn_demo",
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      appointmentId: appointmentId || undefined,
      gpName, hpcsa,
      fromDate, toDate, reason: reason.trim(),
      icd10: icd10.trim() || undefined,
      recommendation: recommendation.trim() || undefined,
    });
    navigate({ to: "/sick-notes/$id", params: { id: note.id } });
  };

  return (
    <AppShell title="New sick note">
      <form onSubmit={submit} className="mx-auto max-w-[820px] space-y-5">
        <div className="pulse-card p-6">
          <h2 className="text-[16px] font-semibold text-navy">Issue a sick note</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Select a patient, link an appointment if relevant, and capture the period of incapacity.</p>

          <div className="mt-5 space-y-5">
            <Section icon={<UserIcon className="h-4 w-4" />} title="Patient">
              <input placeholder="Search patients by name…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue" />
              <select value={patientId} onChange={(e) => { setPatientId(e.target.value); setAppointmentId(""); }}
                className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">
                <option value="">— Select a patient —</option>
                {filtered.map(p => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} · {p.medicalAid}</option>)}
              </select>
              {selectedPatient && (
                <div className="mt-2 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] text-muted-foreground">
                  Selected: <span className="font-medium text-navy">{selectedPatient.firstName} {selectedPatient.lastName}</span> · DOB {selectedPatient.dob}
                </div>
              )}
            </Section>

            {selectedPatient && (
              <Section icon={<Stethoscope className="h-4 w-4" />} title="Link to appointment (optional)">
                <select value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)}
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">
                  <option value="">— No linked appointment —</option>
                  {apptOptions.map(a => (
                    <option key={a.id} value={a.id}>
                      {format(new Date(a.start), "d MMM yyyy, HH:mm")} · {a.type} · {a.reason}
                    </option>
                  ))}
                </select>
              </Section>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Section title="From">
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue" />
              </Section>
              <Section title="To">
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue" />
              </Section>
              <Section title="Total days">
                <div className="rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-navy">{days > 0 ? `${days} day${days > 1 ? "s" : ""}` : "—"}</div>
              </Section>
            </div>

            <Section title="Reason / diagnosis">
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Acute viral illness"
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue" />
            </Section>

            <div className="grid grid-cols-2 gap-4">
              <Section title="ICD-10 code">
                <input value={icd10} onChange={(e) => setIcd10(e.target.value)} placeholder="e.g. J06.9"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] font-mono outline-none focus:border-blue" />
              </Section>
              <Section title="Recommendation (optional)">
                <input value={recommendation} onChange={(e) => setRecommendation(e.target.value)} placeholder="e.g. Bed rest, hydration"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue" />
              </Section>
            </div>

            <div className="rounded-md border border-border bg-surface px-3 py-2 text-[12px] text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-teal" />
              On issue, a unique 12-character security code is generated and embedded in a QR on the printed note. Employers scan it to verify the note's authenticity, issue date and validity.
            </div>

            {error && <div className="rounded-md bg-[#FEE2E2] px-3 py-2 text-[12.5px] text-[#991B1B]">{error}</div>}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => navigate({ to: "/sick-notes" })} className="rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-navy hover:bg-surface">Cancel</button>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">
                <FileText className="h-4 w-4" /> Issue sick note
              </button>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}<span>{title}</span>
      </div>
      {children}
    </div>
  );
}
