import { createFileRoute, useNavigate } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  User as UserIcon,
  FileText,
  Pill,
  Plus,
  Trash2,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  createPrescription,
  currentTenant,
  currentUser,
  myScopedStore,
  patientAppointments,
  store,
  type PrescriptionItem,
} from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/AppDataProvider";

export const Route = createFileRoute("/prescriptions/new")({
  component: NewPrescription,
});

function NewPrescription() {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { user: userData, patient, inventory, prescription } = useData();
  const tenant = currentTenant();

  const allUsers = userData.users;
  const patients = useMemo(
    () =>
      patient.patients.slice().sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [patient.patients],
  );

  const owner = allUsers.find(
    (u) => u.role === "owner" && u.tenantId === tenant?.id,
  );
  const gpName = owner
    ? `${owner.title} ${owner.firstName} ${owner.lastName}`
    : me
      ? `${me.title} ${me.firstName} ${me.lastName}`
      : "Dr. M. Naidoo";
  const hpcsa = owner?.hpcsa || tenant?.hpcsa || "MP0712345";

  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState<string>("");
  const [appointmentId, setAppointmentId] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState("");
  const [icd10, setIcd10] = useState("");
  const [validDays, setValidDays] = useState(30);
  const [items, setItems] = useState<PrescriptionItem[]>([
    { drug: "", dose: "", frequency: "", duration: "", notes: "" },
  ]);
  const [error, setError] = useState<string | null>(null);

  const filtered = patients
    .filter((p) =>
      `${p.firstName} ${p.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .slice(0, 50);
  const selectedPatient = patients.find((p) => p.id === patientId);
  const apptOptions = selectedPatient
    ? patientAppointments(selectedPatient.id)
    : [];
  const medications = useMemo(
    () =>
      inventory.inventoryList
        .filter(
          (i) =>
            i.category === "Prescription medication" ||
            i.category === "OTC medication",
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [s.inventory],
  );

  const updateItem = (i: number, patch: Partial<PrescriptionItem>) =>
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    );
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { drug: "", dose: "", frequency: "", duration: "", notes: "" },
    ]);
  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedPatient) {
      setError("Please select a patient.");
      return;
    }
    const cleanItems = items
      .filter((i) => i.drug.trim())
      .map((i) => ({
        drug: i.drug.trim(),
        dose: i.dose.trim(),
        frequency: i.frequency.trim(),
        duration: i.duration.trim(),
        notes: i.notes?.trim() || undefined,
      }));
    if (cleanItems.length === 0) {
      setError("Add at least one medication.");
      return;
    }
    const rx = prescription.createPrescription({
      patientId: selectedPatient.id,
      appointmentId: appointmentId || undefined,
      gpName,
      hpcsa,
      diagnosis: diagnosis.trim() || undefined,
      icd10: icd10.trim() || undefined,
      validDays,
      items: cleanItems,
    });
    navigate({ to: "/prescriptions/$id", params: { id: rx.id } });
  };

  return (
    <AppShell title="New prescription">
      <form onSubmit={submit} className="mx-auto max-w-[820px] space-y-5">
        <div className="pulse-card p-6">
          <h2 className="text-[16px] font-semibold text-navy">
            Issue a prescription
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Choose a patient, optionally link to an appointment, and add
            medications.
          </p>

          <div className="mt-5 space-y-5">
            <Section icon={<UserIcon className="h-4 w-4" />} title="Patient">
              <input
                placeholder="Search patients by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue"
              />
              <select
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value);
                  setAppointmentId("");
                }}
                className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue"
              >
                <option value="">— Select a patient —</option>
                {filtered.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.lastName}, {p.firstName} · {p.medicalAid}
                  </option>
                ))}
              </select>
              {selectedPatient && (
                <div className="mt-2 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] text-muted-foreground">
                  Selected:{" "}
                  <span className="font-medium text-navy">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </span>{" "}
                  · DOB {selectedPatient.dob}
                  {selectedPatient.allergies.length > 0 && (
                    <span className="ml-2 text-[#991B1B]">
                      ⚠ Allergies: {selectedPatient.allergies.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </Section>

            {selectedPatient && (
              <Section
                icon={<Stethoscope className="h-4 w-4" />}
                title="Link to appointment (optional)"
              >
                <select
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue"
                >
                  <option value="">— No linked appointment —</option>
                  {apptOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {format(new Date(a.start), "d MMM yyyy, HH:mm")} ·{" "}
                      {a.type} · {a.reason}
                    </option>
                  ))}
                </select>
              </Section>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Section title="Diagnosis">
                <input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute pharyngitis"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue"
                />
              </Section>
              <Section title="ICD-10">
                <input
                  value={icd10}
                  onChange={(e) => setIcd10(e.target.value)}
                  placeholder="e.g. J02.9"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] font-mono outline-none focus:border-blue"
                />
              </Section>
              <Section title="Valid for (days)">
                <select
                  value={validDays}
                  onChange={(e) => setValidDays(parseInt(e.target.value))}
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue"
                >
                  {[7, 14, 30, 60, 90, 180].map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </Section>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Pill className="h-4 w-4" /> Medications
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 text-[12px] font-medium text-navy hover:bg-surface"
                >
                  <Plus className="h-3.5 w-3.5" /> Add medication
                </button>
              </div>
              <div className="space-y-3">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-border bg-white p-3"
                  >
                    <div className="grid grid-cols-12 gap-2">
                      <select
                        value={it.drug}
                        onChange={(e) =>
                          updateItem(i, { drug: e.target.value })
                        }
                        className="col-span-5 rounded-md border border-border bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-blue"
                      >
                        <option value="">— Select medication —</option>
                        <optgroup label="Prescription medication">
                          {medications
                            .filter(
                              (m) => m.category === "Prescription medication",
                            )
                            .map((m) => (
                              <option key={m.id} value={m.name}>
                                {m.name}{" "}
                                {m.stock <= 0
                                  ? "(out of stock)"
                                  : `· stock ${m.stock}`}
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="OTC medication">
                          {medications
                            .filter((m) => m.category === "OTC medication")
                            .map((m) => (
                              <option key={m.id} value={m.name}>
                                {m.name}{" "}
                                {m.stock <= 0
                                  ? "(out of stock)"
                                  : `· stock ${m.stock}`}
                              </option>
                            ))}
                        </optgroup>
                      </select>
                      <input
                        value={it.dose}
                        onChange={(e) =>
                          updateItem(i, { dose: e.target.value })
                        }
                        placeholder="Dose (1 tab)"
                        className="col-span-2 rounded-md border border-border bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-blue"
                      />
                      <input
                        value={it.frequency}
                        onChange={(e) =>
                          updateItem(i, { frequency: e.target.value })
                        }
                        placeholder="Frequency (TDS)"
                        className="col-span-2 rounded-md border border-border bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-blue"
                      />
                      <input
                        value={it.duration}
                        onChange={(e) =>
                          updateItem(i, { duration: e.target.value })
                        }
                        placeholder="Duration (5 days)"
                        className="col-span-2 rounded-md border border-border bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-blue"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        disabled={items.length === 1}
                        className="col-span-1 inline-flex items-center justify-center rounded-md border border-border bg-white text-muted-foreground hover:bg-surface disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      value={it.notes || ""}
                      onChange={(e) => updateItem(i, { notes: e.target.value })}
                      placeholder="Notes (optional, e.g. take with food)"
                      className="mt-2 block w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-[12.5px] outline-none focus:border-blue"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface px-3 py-2 text-[12px] text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-teal" />
              On issue, a unique 12-character security code is generated and
              embedded in a QR on the printed prescription. Pharmacies scan it
              to verify authenticity.
            </div>

            {error && (
              <div className="rounded-md bg-[#FEE2E2] px-3 py-2 text-[12.5px] text-[#991B1B]">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigate({ to: "/prescriptions" })}
                className="rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-navy hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
              >
                <FileText className="h-4 w-4" /> Issue prescription
              </button>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}
