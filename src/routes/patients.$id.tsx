import { createFileRoute, Link, useParams } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import { store, formatZAR, type Patient,myScopedStore } from "@/lib/store";
import { differenceInYears, format, parseISO } from "date-fns";
import {
  Calendar,
  FileText,
  Pill,
  MessageSquare,
  Receipt,
  Plus,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/patients/$id")({
  component: PatientDetail,
});

const TABS = [
  "Overview",
  "Visit history",
  "Clinical notes",
  "Documents",
  "Billing",
  "Prescriptions",
] as const;

function PatientDetail() {
  const { id } = useParams({ from: "/patients/$id" });
  const [data, setData] = useState(() => myScopedStore());
  useEffect(() => {
    setData(myScopedStore());
  }, []);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  const p = data.patients.find((x) => x.id === id);
  if (!p) {
    return (
      <AppShell title="Patient not found">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to patients
        </Link>
      </AppShell>
    );
  }

  const age = differenceInYears(new Date(), parseISO(p.dob));
  const visits = data.appointments
    .filter((a) => a.patientId === p.id)
    .sort((a, b) => b.start.localeCompare(a.start));
  const invoices = data.invoices.filter((i) => i.patientId === p.id);

  return (
    <AppShell title="Patient">
      <Link
        to="/patients"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-navy"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All patients
      </Link>

      {/* Header */}
      <div className="pulse-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-tint text-[18px] font-semibold text-blue">
              {p.firstName[0]}
              {p.lastName[0]}
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-navy">
                {p.firstName} {p.lastName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                <span>
                  {age} yrs · {p.gender === "F" ? "Female" : "Male"}
                </span>
                <span className="font-mono">{p.idNumber}</span>
                <Badge variant="indigo">{p.medicalAid}</Badge>
                <span>
                  Last visit: {format(parseISO(p.lastVisit), "d MMM yyyy")}
                </span>
              </div>
              {p.allergies.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="label-caps text-danger">Allergies:</span>
                  {p.allergies.map((a) => (
                    <Badge key={a} variant="danger">
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionBtn icon={Calendar}>New appointment</ActionBtn>
            <ActionBtn icon={FileText}>New note</ActionBtn>
            <ActionBtn icon={MessageSquare}>Message</ActionBtn>
            <ActionBtn icon={Receipt} primary>
              New invoice
            </ActionBtn>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-border">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
                tab === t
                  ? "text-navy"
                  : "text-muted-foreground hover:text-navy"
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === "Overview" && <Overview p={p} />}
        {tab === "Visit history" && <VisitHistory visits={visits} />}
        {tab === "Clinical notes" && <ClinicalNotes />}
        {tab === "Documents" && <Documents />}
        {tab === "Billing" && <BillingTab invoices={invoices} />}
        {tab === "Prescriptions" && <Prescriptions />}
      </div>
    </AppShell>
  );
}

function ActionBtn({
  icon: Icon,
  primary,
  children,
}: {
  icon: any;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12.5px] font-medium transition-opacity hover:opacity-90 ${
        primary
          ? "bg-blue text-white"
          : "border border-border bg-white text-navy"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function Overview({ p }: { p: Patient }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Section title="Demographics">
        <Row
          label="Date of birth"
          value={format(parseISO(p.dob), "d MMMM yyyy")}
        />
        <Row label="Gender" value={p.gender === "F" ? "Female" : "Male"} />
        <Row label="ID number" value={p.idNumber} mono />
        <Row label="Address" value="14 Riverside Drive, Cape Town, 8001" />
      </Section>
      <Section title="Contact">
        <Row label="Mobile" value={p.phone} mono />
        <Row label="Email" value={p.email} />
        <Row label="Emergency" value="Spouse · +27 82 555 9201" />
      </Section>
      <Section title="Medical aid">
        <Row label="Scheme" value={p.medicalAid} />
        <Row label="Plan" value="Comprehensive" />
        <Row label="Member number" value={p.medicalAidNumber} mono />
        <Row label="Dependant code" value="00 (Main)" />
      </Section>
      <Section title="Clinical">
        <div>
          <div className="label-caps">Chronic conditions</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.chronic.length === 0 ? (
              <span className="text-[13px] text-muted-foreground">
                None recorded
              </span>
            ) : (
              p.chronic.map((c) => (
                <Badge key={c} variant="warning">
                  {c}
                </Badge>
              ))
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="label-caps">Current medications</div>
          <div className="mt-2 space-y-1.5 text-[13px] text-navy">
            {p.chronic.includes("Hypertension") ? (
              <>
                <div>• Amlodipine 5mg — once daily</div>
                <div>• Hydrochlorothiazide 25mg — once daily</div>
              </>
            ) : (
              <span className="text-muted-foreground">None recorded</span>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="label-caps">Vaccinations</div>
          <div className="mt-2 text-[13px] text-navy">
            Influenza (May 2024) · COVID-19 booster (Sep 2023)
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pulse-card p-5">
      <div className="text-[14px] font-semibold text-navy">{title}</div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span className={`text-[13px] text-navy ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function VisitHistory({ visits }: { visits: any[] }) {
  if (visits.length === 0)
    return (
      <Empty title="No visits yet" sub="Past consultations will appear here." />
    );
  return (
    <div className="space-y-3">
      {visits.map((v) => (
        <div key={v.id} className="pulse-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[14px] font-semibold text-navy">
                {v.type}
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                {format(parseISO(v.start), "EEE d MMM yyyy · HH:mm")} · {v.gp}
              </div>
            </div>
            <Badge variant={v.status === "Completed" ? "success" : "blue"}>
              {v.status}
            </Badge>
          </div>
          <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-3">
            <div>
              <span className="label-caps">Reason</span>
              <div className="mt-0.5 text-navy">{v.reason}</div>
            </div>
            <div>
              <span className="label-caps">Diagnosis</span>
              <div className="mt-0.5 text-navy font-mono">
                J06.9 — Acute URTI
              </div>
            </div>
            <div>
              <span className="label-caps">Vitals</span>
              <div className="mt-0.5 text-navy">BP 124/82 · HR 72</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClinicalNotes() {
  return (
    <div className="pulse-card p-6">
      <div className="text-[14px] font-semibold text-navy">New SOAP note</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {["Subjective", "Objective", "Assessment", "Plan"].map((s) => (
          <div key={s}>
            <div className="label-caps">{s}</div>
            <textarea
              rows={4}
              placeholder={`${s} notes…`}
              className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue"
            />
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-navy hover:bg-surface">
          Save draft
        </button>
        <button className="rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">
          Lock & sign
        </button>
      </div>
    </div>
  );
}

function Documents() {
  return (
    <Empty
      title="No documents uploaded"
      sub="Lab results, referrals and letters will appear here."
      cta="Upload document"
    />
  );
}
function Prescriptions() {
  return (
    <Empty
      title="No prescriptions yet"
      sub="Generate a new prescription from this patient's profile."
      cta="New prescription"
    />
  );
}

function BillingTab({ invoices }: { invoices: any[] }) {
  if (invoices.length === 0)
    return (
      <Empty
        title="No invoices for this patient"
        sub="Create an invoice from a completed appointment."
        cta="Create invoice"
      />
    );
  return (
    <div className="pulse-card overflow-hidden">
      <table className="min-w-full text-[13px]">
        <thead className="bg-surface text-left">
          <tr>
            <th className="px-5 py-2.5 label-caps">Invoice</th>
            <th className="px-5 py-2.5 label-caps">Date</th>
            <th className="px-5 py-2.5 label-caps">Amount</th>
            <th className="px-5 py-2.5 label-caps">Type</th>
            <th className="px-5 py-2.5 label-caps">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr
              key={i.id}
              className="border-b border-border last:border-0 hover:bg-blue-tint"
            >
              <td className="px-5 py-3 font-mono text-navy">{i.number}</td>
              <td className="px-5 py-3 text-muted-foreground">
                {format(parseISO(i.date), "d MMM yyyy")}
              </td>
              <td className="px-5 py-3 font-semibold text-navy">
                {formatZAR(i.amount)}
              </td>
              <td className="px-5 py-3">
                <Badge variant={i.type === "Private" ? "neutral" : "indigo"}>
                  {i.type}
                </Badge>
              </td>
              <td className="px-5 py-3">
                <Badge
                  variant={
                    i.status === "Paid"
                      ? "success"
                      : i.status === "Overdue"
                        ? "danger"
                        : "warning"
                  }
                >
                  {i.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({
  title,
  sub,
  cta,
}: {
  title: string;
  sub: string;
  cta?: string;
}) {
  return (
    <div className="pulse-card flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint">
        <Plus className="h-5 w-5 text-blue" />
      </div>
      <div className="mt-4 text-[15px] font-semibold text-navy">{title}</div>
      <div className="mt-1 text-[13px] text-muted-foreground">{sub}</div>
      {cta && (
        <button className="mt-5 rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">
          {cta}
        </button>
      )}
    </div>
  );
}
