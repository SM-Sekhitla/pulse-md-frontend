import { createFileRoute } from "@/lib/router-compat";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import { formatZAR } from "@/lib/pricing";
import { rid } from "@/lib/id";
import { format, parseISO, addDays } from "date-fns";
import { Info, Plus, Printer, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/context/AppDataProvider";
import { ICD10_CODES, TARIFF_CODES, type Icd10Code } from "@/lib/medical-aid";
import type { Invoice } from "@/types/invoice";
import type { Patient } from "@/types/patient";
import { useQuery } from "@tanstack/react-query";
import { getMedicalAidSchemes } from "@/lib/medical-aid-api";
import { useCurrentTenant } from "@/hooks/use-current-tenant";

export const Route = createFileRoute("/billing")({
  component: Billing,
});

const claimLabels: Record<string, string> = {
  not_submitted: "Not submitted",
  submitted: "Submitted",
  paid: "Paid",
  partially_paid: "Partially paid",
  rejected: "Rejected",
  appealed: "Appealed",
};

function Billing() {
  const { invoice, patient } = useData();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filtered = invoice.invoices.filter((item) => {
    return (
      (!q ||
        item.patientName.toLowerCase().includes(q.toLowerCase()) ||
        item.number.toLowerCase().includes(q.toLowerCase())) &&
      (!status || item.status === status)
    );
  });

  const total = filtered.reduce((sum, item) => sum + item.amount, 0);
  const paid = filtered.filter((item) => item.status === "Paid").reduce((sum, item) => sum + item.amount, 0);
  const medicalAidOutstanding = filtered
    .filter((item) => item.billingType === "medical_aid" && !["paid"].includes(item.claimStatus ?? "not_submitted"))
    .reduce((sum, item) => sum + (item.schemeBilledAmount ?? item.amount) - (item.schemePaidAmount ?? 0), 0);

  return (
    <AppShell title="Billing & invoices">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total invoiced" value={formatZAR(total)} />
        <Stat label="Paid" value={formatZAR(paid)} tone="success" />
        <Stat label="Medical aid outstanding" value={formatZAR(medicalAidOutstanding)} tone="warning" />
      </div>

      <div className="mt-6 pulse-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search invoice or patient..."
              className="h-9 w-full rounded-md border border-border bg-white pl-9 pr-3 text-[13px] outline-none focus:border-blue"
            />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border border-border bg-white px-3 text-[13px]">
            <option value="">All statuses</option>
            {["Draft", "Sent", "Partially paid", "Paid", "Overdue", "Void"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button onClick={() => setShowNew(true)} className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-1.5 text-[13px] font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> New invoice
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-surface text-left">
              <tr>
                {["Invoice", "Patient", "Date", "Amount", "Type", "Claim", "Status"].map((heading) => (
                  <th key={heading} className="px-5 py-2.5 label-caps font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} onClick={() => setSelectedInvoice(item)} className={`cursor-pointer border-b border-border last:border-0 hover:bg-blue-tint ${item.status === "Overdue" ? "bg-[#FFFBEB]" : ""}`}>
                  <td className="px-5 py-3 font-mono text-navy">{item.number}</td>
                  <td className="px-5 py-3 text-navy">{item.patientName}</td>
                  <td className="px-5 py-3 text-muted-foreground">{format(parseISO(item.date), "d MMM yyyy")}</td>
                  <td className="px-5 py-3 font-semibold text-navy">{formatZAR(item.amount)}</td>
                  <td className="px-5 py-3"><Badge variant={item.type === "Private" ? "neutral" : "indigo"}>{item.type}</Badge></td>
                  <td className="px-5 py-3">
                    {item.billingType === "medical_aid" ? <ClaimBadge status={item.claimStatus ?? "not_submitted"} /> : <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-5 py-3"><InvoiceStatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <NewInvoiceModal
          patients={patient.patients}
          onClose={() => setShowNew(false)}
          onCreate={async (payload) => {
            await invoice.createInvoice(payload);
            setShowNew(false);
            toast.success("Invoice created");
          }}
        />
      )}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          patient={patient.patients.find((item) => item.id === selectedInvoice.patientId)}
          onClose={() => setSelectedInvoice(null)}
          onUpdate={async (patch) => {
            const updated = await invoice.updateInvoice(selectedInvoice.id, patch);
            if (updated) {
              setSelectedInvoice(updated);
              toast.success("Invoice updated");
            }
          }}
        />
      )}
    </AppShell>
  );
}

function NewInvoiceModal({
  patients,
  onClose,
  onCreate,
}: {
  patients: Patient[];
  onClose: () => void;
  onCreate: (payload: any) => Promise<void>;
}) {
  const { data: allSchemes = [] } = useQuery({
    queryKey: ["medical-aid-schemes"],
    queryFn: getMedicalAidSchemes,
  });
  const schemes = allSchemes.filter((scheme) => scheme.isActive && scheme.acceptedByPractice);
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const selectedPatient = patients.find((patient) => patient.id === patientId);
  const patientScheme = schemes.find((scheme) => scheme.id === selectedPatient?.medicalAidSchemeId);
  const [billingType, setBillingType] = useState<"private" | "medical_aid">(
    selectedPatient?.billingType === "medical_aid" ? "medical_aid" : "private",
  );
  const [schemeId, setSchemeId] = useState(patientScheme?.id ?? schemes[0]?.id ?? "");
  const selectedScheme = schemes.find((scheme) => scheme.id === schemeId);
  const [plan, setPlan] = useState(selectedPatient?.medicalAidPlan ?? selectedScheme?.plans[0] ?? "");
  const [memberNumber, setMemberNumber] = useState(selectedPatient?.medicalAidNumber ?? "");
  const [mainMemberName, setMainMemberName] = useState(selectedPatient?.mainMemberName ?? "");
  const [dependantCode, setDependantCode] = useState(selectedPatient?.dependantCode ?? "");
  const [icdQuery, setIcdQuery] = useState("");
  const [icdCodes, setIcdCodes] = useState<Icd10Code[]>([]);
  const [tariffs, setTariffs] = useState([{ ...TARIFF_CODES[1], quantity: 1, amount: TARIFF_CODES[1].rate }]);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [schemePercent, setSchemePercent] = useState(90);

  const filteredIcd = ICD10_CODES.filter((code) =>
    `${code.code} ${code.description}`.toLowerCase().includes(icdQuery.toLowerCase()),
  ).slice(0, 8);
  const subtotal = tariffs.reduce((sum, item) => sum + item.amount, 0);
  const vat = vatEnabled ? subtotal * 0.15 : 0;
  const total = Math.round((subtotal + vat) * 100) / 100;
  const estimatedSchemePays = billingType === "medical_aid" ? Math.round(total * (schemePercent / 100) * 100) / 100 : 0;
  const estimatedCopayment = Math.max(0, total - estimatedSchemePays);

  const selectPatient = (id: string) => {
    const nextPatient = patients.find((patient) => patient.id === id);
    const nextScheme = schemes.find((scheme) => scheme.id === nextPatient?.medicalAidSchemeId);
    setPatientId(id);
    setBillingType(nextPatient?.billingType === "medical_aid" ? "medical_aid" : "private");
    setSchemeId(nextScheme?.id ?? schemes[0]?.id ?? "");
    setPlan(nextPatient?.medicalAidPlan ?? nextScheme?.plans[0] ?? "");
    setMemberNumber(nextPatient?.medicalAidNumber ?? "");
    setMainMemberName(nextPatient?.mainMemberName ?? "");
    setDependantCode(nextPatient?.dependantCode ?? "");
  };

  const submit = async () => {
    if (!selectedPatient) return toast.error("Select a patient");
    if (billingType === "medical_aid" && icdCodes.length === 0) return toast.error("Add at least one ICD-10 diagnosis code");
    if (billingType === "medical_aid" && (!selectedScheme || !memberNumber.trim())) return toast.error("Scheme and member number are required");

    const today = new Date();
    const invoiceNumber = `PM-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}-${rid("").slice(0, 4).toUpperCase()}`;
    await onCreate({
      number: invoiceNumber,
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      date: format(today, "yyyy-MM-dd"),
      dueDate: format(addDays(today, 30), "yyyy-MM-dd"),
      amount: total,
      type: billingType === "medical_aid" ? "Medical aid" : "Private",
      status: "Draft",
      billingType,
      medicalAidSchemeId: billingType === "medical_aid" ? selectedScheme?.id : undefined,
      medicalAidSchemeName: billingType === "medical_aid" ? selectedScheme?.name : undefined,
      medicalAidPlan: billingType === "medical_aid" ? plan : undefined,
      medicalAidNumber: billingType === "medical_aid" ? memberNumber.trim() : undefined,
      mainMemberName,
      dependantCode,
      claimStatus: billingType === "medical_aid" ? "not_submitted" : undefined,
      schemeBilledAmount: billingType === "medical_aid" ? total : 0,
      schemePaidAmount: 0,
      patientCopayment: billingType === "medical_aid" ? estimatedCopayment : 0,
      icd10Codes: icdCodes,
      tariffCodes: billingType === "medical_aid" ? tariffs : [],
      claimReference: billingType === "medical_aid" ? invoiceNumber : undefined,
      serviceDate: format(today, "yyyy-MM-dd"),
    });
  };

  return (
    <Modal title="New invoice" onClose={onClose}>
      <div className="space-y-5">
        <Field label="Patient">
          <select value={patientId} onChange={(event) => selectPatient(event.target.value)} className={inputClass}>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>
            ))}
          </select>
        </Field>

        <div>
          <Label>Billing type</Label>
          <div className="mt-1 inline-flex rounded-md border border-border bg-white p-1">
            {[
              ["private", "Private"],
              ["medical_aid", "Medical aid"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setBillingType(value as typeof billingType)}
                className={`rounded px-4 py-1.5 text-[13px] font-medium ${billingType === value ? "bg-navy text-white" : "text-muted-foreground hover:text-navy"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {billingType === "medical_aid" && (
          <div className="space-y-4 rounded-xl border border-[#B8CAFF] bg-[#EEF4FF] p-4">
            {selectedPatient?.billingType === "medical_aid" && (
              <div className="flex items-center gap-2 rounded-md border border-blue/20 bg-white/70 px-3 py-2 text-[12.5px] text-blue">
                <Info className="h-3.5 w-3.5" />
                Auto-filled from {selectedPatient.firstName}'s medical aid record
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Scheme">
                <select value={schemeId} onChange={(event) => { setSchemeId(event.target.value); setPlan(""); }} className={inputClass}>
                  {schemes.map((scheme) => <option key={scheme.id} value={scheme.id}>{scheme.name}</option>)}
                </select>
              </Field>
              <Field label="Plan">
                {selectedScheme?.plans.length ? (
                  <select value={plan} onChange={(event) => setPlan(event.target.value)} className={inputClass}>
                    <option value="">Select plan...</option>
                    {selectedScheme.plans.map((item) => <option key={item} value={item}>{item}</option>)}
                    <option value="Other">Other (type below)</option>
                  </select>
                ) : (
                  <input value={plan} onChange={(event) => setPlan(event.target.value)} className={inputClass} />
                )}
              </Field>
              <Field label="Member number"><input value={memberNumber} onChange={(event) => setMemberNumber(event.target.value)} className={inputClass} /></Field>
              <Field label="Main member name"><input value={mainMemberName} onChange={(event) => setMainMemberName(event.target.value)} className={inputClass} /></Field>
              <Field label="Dependant code"><input value={dependantCode} onChange={(event) => setDependantCode(event.target.value.slice(0, 2))} className={inputClass} /></Field>
            </div>
          </div>
        )}

        <div>
          <Label>Diagnosis (ICD-10)*</Label>
          <input value={icdQuery} onChange={(event) => setIcdQuery(event.target.value)} placeholder="Search by code or description..." className={`${inputClass} mt-1`} />
          {icdQuery && (
            <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-border bg-white">
              {filteredIcd.map((code) => (
                <button
                  key={code.code}
                  type="button"
                  onClick={() => {
                    if (!icdCodes.some((item) => item.code === code.code)) setIcdCodes([...icdCodes, code]);
                    setIcdQuery("");
                  }}
                  className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-blue-tint"
                >
                  <span className="font-mono text-navy">{code.code}</span>
                  <span className="mx-2 text-muted-foreground">|</span>
                  <span className="text-muted-foreground">{code.description}</span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {icdCodes.map((code) => (
              <Chip key={code.code} onRemove={() => setIcdCodes(icdCodes.filter((item) => item.code !== code.code))}>
                {code.code} - {code.description}
              </Chip>
            ))}
          </div>
        </div>

        {billingType === "medical_aid" ? (
          <TariffEditor tariffs={tariffs} onChange={setTariffs} vatEnabled={vatEnabled} onVatChange={setVatEnabled} />
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4">
            <Label>Private invoice line items</Label>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Private invoices use the standard consultation line item.</p>
          </div>
        )}

        {billingType === "medical_aid" && (
          <div className="rounded-lg border border-[#FDE68A] bg-[#FFFAEB] p-3">
            <div className="text-[12px] font-semibold text-[#92400E]">Expected medical aid payment</div>
            <div className="mt-3 flex max-w-xs items-center gap-2">
              <input type="number" value={schemePercent} onChange={(event) => setSchemePercent(Number(event.target.value))} className={inputClass} placeholder="e.g. 100" />
              <span className="text-[12.5px] text-muted-foreground">% of tariff</span>
            </div>
            <div className="mt-2 text-[12px] text-muted-foreground">Schemes typically pay 80-100% of their own tariff rate. Confirm with your scheme.</div>
            <div className="mt-3 grid gap-2 text-[13px] md:grid-cols-2">
              <div className="font-medium text-success">Estimated scheme pays: {formatZAR(estimatedSchemePays)}</div>
              <div className="font-medium text-warning">Estimated patient co-payment: {formatZAR(estimatedCopayment)}</div>
            </div>
            <div className="mt-1 text-[11.5px] text-muted-foreground">These are estimates only. Actual payment depends on the patient's available benefits and scheme rules.</div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-[13px] text-muted-foreground">Total billed: <span className="font-semibold text-navy">{formatZAR(total)}</span></div>
          <button type="button" onClick={submit} className="rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">Create invoice</button>
        </div>
      </div>
    </Modal>
  );
}

function TariffEditor({
  tariffs,
  onChange,
  vatEnabled,
  onVatChange,
}: {
  tariffs: Array<{ code: string; description: string; rate: number; quantity: number; amount: number }>;
  onChange: (tariffs: Array<{ code: string; description: string; rate: number; quantity: number; amount: number }>) => void;
  vatEnabled: boolean;
  onVatChange: (enabled: boolean) => void;
}) {
  const subtotal = tariffs.reduce((sum, item) => sum + item.amount, 0);
  const vat = vatEnabled ? subtotal * 0.15 : 0;
  const total = subtotal + vat;

  const updateRow = (index: number, patch: Partial<(typeof tariffs)[number]>) => {
    onChange(tariffs.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      const next = { ...row, ...patch };
      return { ...next, amount: Number(next.quantity || 0) * Number(next.rate || 0) };
    }));
  };

  return (
    <div>
      <div>
        <Label>Procedure / tariff codes</Label>
        <p className="mt-1 text-[12.5px] text-muted-foreground">Required for medical aid billing. Use the codes applicable to this consultation.</p>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-[12.5px]">
          <thead className="bg-surface text-left">
            <tr>
              {["Tariff code", "Description", "Qty", "Rate", "Amount", ""].map((heading) => (
                <th key={heading} className="px-3 py-2 label-caps font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tariffs.map((row, index) => (
              <tr key={`${row.code}-${index}`} className="border-t border-border">
                <td className="px-3 py-2">
                  <select value={row.code} onChange={(event) => {
                    const selected = TARIFF_CODES.find((item) => item.code === event.target.value)!;
                    updateRow(index, { ...selected, quantity: row.quantity });
                  }} className={inputClass}>
                    {TARIFF_CODES.map((item) => <option key={item.code} value={item.code}>{item.code}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-navy">{row.description}</td>
                <td className="px-3 py-2"><input type="number" min={1} value={row.quantity} onChange={(event) => updateRow(index, { quantity: Number(event.target.value) })} className={inputClass} /></td>
                <td className="px-3 py-2"><input type="number" min={0} value={row.rate} onChange={(event) => updateRow(index, { rate: Number(event.target.value) })} className={inputClass} /></td>
                <td className="px-3 py-2 font-semibold text-navy">{formatZAR(row.amount)}</td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => onChange(tariffs.filter((_, rowIndex) => rowIndex !== index))} className="rounded-md border border-border p-1 text-navy hover:bg-surface" aria-label="Remove tariff">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={() => onChange([...tariffs, { ...TARIFF_CODES[0], quantity: 1, amount: TARIFF_CODES[0].rate }])} className="mt-3 rounded-md border border-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-navy hover:bg-surface">
        Add another code
      </button>
      <div className="mt-4 flex flex-col items-end gap-1 text-[13px]">
        <label className="mb-1 flex items-center gap-2 text-muted-foreground">
          <input type="checkbox" checked={vatEnabled} onChange={(event) => onVatChange(event.target.checked)} className="accent-blue" />
          VAT registered
        </label>
        <div>Subtotal: <span className="font-semibold text-navy">{formatZAR(subtotal)}</span></div>
        <div>VAT: <span className="font-semibold text-navy">{formatZAR(vat)}</span></div>
        <div>Total billed to medical aid: <span className="font-semibold text-navy">{formatZAR(total)}</span></div>
      </div>
    </div>
  );
}

function InvoiceDetailModal({
  invoice,
  patient,
  onClose,
  onUpdate,
}: {
  invoice: Invoice;
  patient?: Patient;
  onClose: () => void;
  onUpdate: (patch: Partial<Invoice>) => Promise<void>;
}) {
  const tenant = useCurrentTenant();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const claimStatus = invoice.claimStatus ?? "not_submitted";
  const schemeBilled = invoice.schemeBilledAmount ?? invoice.amount;

  const markSubmitted = () => onUpdate({ claimStatus: "submitted", status: "Sent" } as Partial<Invoice>);
  const markAppealed = () => onUpdate({ claimStatus: "appealed" } as Partial<Invoice>);

  return (
    <Modal title={`Invoice ${invoice.number}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid gap-3 text-[13px] md:grid-cols-3">
          <InfoCell label="Patient" value={invoice.patientName} />
          <InfoCell label="Invoice date" value={format(parseISO(invoice.date), "d MMM yyyy")} />
          <InfoCell label="Amount" value={formatZAR(invoice.amount)} />
        </div>

        {invoice.billingType === "medical_aid" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground">Claim status:</span>
              <ClaimBadge status={claimStatus} />
            </div>
            {claimStatus === "not_submitted" && (
              <button onClick={markSubmitted} className="rounded-md border border-blue/30 px-3 py-1.5 text-[12.5px] font-medium text-blue hover:bg-blue-tint">
                Mark as submitted
              </button>
            )}
            {claimStatus === "submitted" && (
              <button onClick={() => setPaymentOpen(true)} className="rounded-md bg-blue px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90">
                Record payment
              </button>
            )}
            {claimStatus === "rejected" && (
              <button onClick={markAppealed} className="rounded-md border border-border px-3 py-1.5 text-[12.5px] font-medium text-navy hover:bg-white">
                Resubmit / appeal
              </button>
            )}
          </div>
        )}

        <div className="rounded-lg border border-border bg-white p-5 print:border-0">
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="text-[18px] font-semibold text-navy">{tenant?.name ?? "PulseMD Practice"}</div>
              <div className="mt-1 text-[12.5px] text-muted-foreground">{tenant?.address ?? ""}</div>
              <div className="text-[12.5px] text-muted-foreground">
                {[tenant?.owner?.phone, tenant?.owner?.email].filter(Boolean).join(" - ")}
              </div>
            </div>
            <div className="text-right text-[12.5px] text-navy">
              <div className="font-semibold">HPCSA Practice Number</div>
              <div className="font-mono">{tenant?.hpcsa ?? "—"}</div>
              <div className="mt-1 text-muted-foreground">VAT {tenant?.vat ?? "—"}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <Label>Patient</Label>
              <div className="mt-1 text-[13px] text-navy">{invoice.patientName}</div>
              {patient?.dob && <div className="text-[12px] text-muted-foreground">DOB {patient.dob}</div>}
              {patient?.idNumber && <div className="text-[12px] text-muted-foreground">ID {patient.idNumber}</div>}
            </div>
            {invoice.billingType === "medical_aid" && (
              <div>
                <Label>Medical aid</Label>
                <div className="mt-1 text-[13px] text-navy">{invoice.medicalAidSchemeName}</div>
                <div className="text-[12px] text-muted-foreground">{invoice.medicalAidPlan}</div>
                <div className="text-[12px] text-muted-foreground">Member {invoice.medicalAidNumber}</div>
                {invoice.mainMemberName && <div className="text-[12px] text-muted-foreground">Main member {invoice.mainMemberName}</div>}
                {invoice.dependantCode && <div className="text-[12px] text-muted-foreground">Dependant {invoice.dependantCode}</div>}
              </div>
            )}
          </div>

          <div className="mt-5">
            <Label>Diagnosis</Label>
            <table className="mt-2 min-w-full text-[12.5px]">
              <tbody>
                {(invoice.icd10Codes ?? []).map((code) => (
                  <tr key={code.code} className="border-t border-border">
                    <td className="w-24 py-2 font-mono text-navy">{code.code}</td>
                    <td className="py-2 text-muted-foreground">{code.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5">
            <Label>Procedure / tariff codes</Label>
            <table className="mt-2 min-w-full text-[12.5px]">
              <thead className="bg-surface text-left">
                <tr>
                  {["Tariff code", "Description", "Qty", "Rate", "Amount"].map((heading) => (
                    <th key={heading} className="px-3 py-2 label-caps font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(invoice.tariffCodes ?? []).map((code) => (
                  <tr key={code.code} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-navy">{code.code}</td>
                    <td className="px-3 py-2 text-muted-foreground">{code.description}</td>
                    <td className="px-3 py-2">{code.quantity}</td>
                    <td className="px-3 py-2">{formatZAR(code.rate)}</td>
                    <td className="px-3 py-2 font-semibold text-navy">{formatZAR(code.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoice.billingType === "medical_aid" && (
            <div className="mt-5 rounded-lg border border-border bg-surface p-4 text-[13px]">
              <div className="grid gap-2 md:grid-cols-3">
                <InfoCell label="Total billed to scheme" value={formatZAR(schemeBilled)} />
                <InfoCell label="Scheme paid" value={formatZAR(invoice.schemePaidAmount ?? 0)} />
                <InfoCell label="Patient co-payment" value={formatZAR(invoice.patientCopayment ?? 0)} />
              </div>
              <div className="mt-3 text-[11.5px] text-muted-foreground">This is an estimate. Your scheme will process the claim and advise of actual payment.</div>
            </div>
          )}

          <div className="mt-5 border-t border-border pt-4 text-[11.5px] text-muted-foreground">
            This account has been prepared in accordance with HPCSA ethical guidelines.
            {tenant?.owner?.email ? ` Queries: ${tenant.owner.email}` : ""}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-navy hover:bg-surface">
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </div>
      {paymentOpen && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setPaymentOpen(false)}
          onSave={async (amount, copayment) => {
            const status = amount >= schemeBilled ? "paid" : "partially_paid";
            await onUpdate({
              claimStatus: status,
              schemePaidAmount: amount,
              patientCopayment: copayment || Math.max(0, schemeBilled - amount),
              status: status === "paid" ? "Paid" : "Partially paid",
            } as Partial<Invoice>);
            setPaymentOpen(false);
          }}
        />
      )}
    </Modal>
  );
}

function PaymentModal({ invoice, onClose, onSave }: { invoice: Invoice; onClose: () => void; onSave: (amount: number, copayment: number) => Promise<void> }) {
  const [amount, setAmount] = useState(invoice.schemePaidAmount ?? 0);
  const [copayment, setCopayment] = useState(invoice.patientCopayment ?? 0);
  const [reference, setReference] = useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-[16px] font-semibold text-navy">Record payment</h3>
          <button onClick={onClose} className="rounded-md border border-border p-1.5 text-navy hover:bg-surface"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <Field label="Amount received from scheme"><input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className={inputClass} /></Field>
          <Field label="Date received"><input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} className={inputClass} /></Field>
          <Field label="Payment reference"><input value={reference} onChange={(event) => setReference(event.target.value)} className={inputClass} /></Field>
          <Field label="Any co-payment received from patient"><input type="number" value={copayment} onChange={(event) => setCopayment(Number(event.target.value))} className={inputClass} /></Field>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={() => onSave(amount, copayment)} className="rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">Save payment</button>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 p-4 py-10">
      <div className="w-full max-w-5xl rounded-xl border border-border bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-[18px] font-semibold text-navy">{title}</h2>
          <button onClick={onClose} className="rounded-md border border-border p-1.5 text-navy hover:bg-surface" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "success" | "warning" }) {
  const accent = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-navy";
  return (
    <div className="pulse-card p-5">
      <div className="label-caps">{label}</div>
      <div className={`mt-2 text-[24px] font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function ClaimBadge({ status }: { status: string }) {
  const variant =
    status === "paid" ? "success" :
    status === "partially_paid" ? "amber" :
    status === "rejected" ? "danger" :
    status === "appealed" ? "purple" :
    status === "submitted" ? "blue" : "neutral";
  return <Badge variant={variant as any}>{claimLabels[status] ?? status}</Badge>;
}

function InvoiceStatusBadge({ status }: { status: Invoice["status"] }) {
  const variant = status === "Paid" ? "success" : status === "Overdue" ? "danger" : status === "Sent" ? "blue" : status === "Partially paid" ? "warning" : "neutral";
  return <Badge variant={variant}>{status}</Badge>;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-caps">{label}</div>
      <div className="mt-1 font-medium text-navy">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue/20 bg-blue-tint px-3 py-1 text-[12.5px] font-medium text-blue">
      {children}
      <button type="button" onClick={onRemove} aria-label="Remove"><X className="h-3 w-3" /></button>
    </span>
  );
}

const inputClass = "h-10 w-full rounded-md border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-blue";
