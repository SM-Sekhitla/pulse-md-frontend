import { SearchableSelect } from "@/components/searchable-select";
import { ICD10_CODES } from "@/lib/medical-aid";
import { ActionButton, ActionForm } from "@/components/action-feedback";
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
import type { PrescriptionItem } from "@/types/prescription";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/AppDataProvider";
import { useCurrentTenant } from "@/hooks/use-current-tenant";

export const Route = createFileRoute("/prescriptions/new")({
  component: NewPrescription,
});

function NewPrescription() {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const {
    appointment,
    user: userData,
    patient,
    inventory,
    prescription,
  } = useData();
  const tenant = useCurrentTenant();

  const allUsers = userData.users;
  const patients = useMemo(
    () =>
      patient.patients
        .slice()
        .sort((a, b) => a.lastName.localeCompare(b.lastName)),
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
  const hpcsa = owner?.hpcsa || tenant?.hpcsa || "";

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
    ? appointment.appointments.filter(
        (item) => item.patientId === selectedPatient.id,
      )
    : [];
  const medications = useMemo(
    () =>
      inventory.inventoryList
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [inventory.inventoryList],
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      icd10.trim() &&
      !/^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/.test(icd10.trim().toUpperCase())
    ) {
      setError(
        "Select an ICD-10 code or enter a code such as J02.9, without its description.",
      );
      return;
    }
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
    const rx = await prescription.createPrescription({
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      appointmentId: appointmentId || undefined,
      gpName,
      hpcsa,
      reason: diagnosis.trim() || "Medication prescribed",
      diagnosis: diagnosis.trim() || undefined,
      icd10: icd10.trim() || undefined,
      validDays,
      items: cleanItems,
    });
    navigate({ to: "/prescriptions/$id", params: { id: rx.id } });
  };

  return (
    <AppShell title="New prescription">
      <ActionForm onSubmit={submit} className="mx-auto max-w-[820px] space-y-5">
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
                <SearchableSelect
                  label="ICD-10 code"
                  value={icd10}
                  onChange={setIcd10}
                  allowCustom
                  className="w-full"
                  options={ICD10_CODES.map((item) => ({
                    value: item.code,
                    label: `${item.code} — ${item.description}`,
                  }))}
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
                <ActionButton
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 text-[12px] font-medium text-navy hover:bg-surface"
                >
                  <Plus className="h-3.5 w-3.5" /> Add medication
                </ActionButton>
              </div>
              <div className="space-y-3">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-border bg-white p-3"
                  >
                    <div className="grid grid-cols-12 gap-2">
                      <SearchableSelect
                        label="Select medication"
                        value={it.drug}
                        onChange={(drug) => updateItem(i, { drug })}
                        className="col-span-5"
                        options={medications.map((item) => ({
                          value: item.name,
                          label: `${item.name} · ${item.category} · ${item.stock <= 0 ? "out of stock" : `stock ${item.stock}`}`,
                          keywords: item.category,
                        }))}
                      />
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
                      <ActionButton
                        type="button"
                        onClick={() => removeItem(i)}
                        disabled={items.length === 1}
                        className="col-span-1 inline-flex items-center justify-center rounded-md border border-border bg-white text-muted-foreground hover:bg-surface disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ActionButton>
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
              <ActionButton
                type="button"
                onClick={() => navigate({ to: "/prescriptions" })}
                className="rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-navy hover:bg-surface"
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
              >
                <FileText className="h-4 w-4" /> Issue prescription
              </ActionButton>
            </div>
          </div>
        </div>
      </ActionForm>
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
