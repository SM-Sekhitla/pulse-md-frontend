import { createFileRoute } from "@/lib/router-compat";
import { AppShell } from "@/components/app-shell";
import { formatZAR } from "@/lib/pricing";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  Package,
  Receipt,
  TrendingUp,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { differenceInCalendarDays, format, parseISO, subMonths } from "date-fns";
import { useData } from "@/context/AppDataProvider";
import { useQuery } from "@tanstack/react-query";
import { getMedicalAidSchemes } from "@/lib/medical-aid-api";

export const Route = createFileRoute("/reports")({ component: Reports });

const REPORTS = [
  { icon: BarChart3, name: "Appointment summary", desc: "By status, type, GP, and date range.", view: "" },
  { icon: TrendingUp, name: "Patient growth", desc: "New registrations per month and cohort retention.", view: "" },
  { icon: Receipt, name: "Revenue report", desc: "Period breakdown by payment type.", view: "" },
  { icon: Activity, name: "No-show analysis", desc: "Cancellation and no-show rates over time.", view: "" },
  { icon: Package, name: "Inventory usage", desc: "Most dispensed products and value consumed.", view: "" },
  { icon: Wrench, name: "Equipment compliance", desc: "Percentage serviced on time.", view: "" },
  { icon: Users, name: "Medical aid vs private", desc: "Billing ratio by payment type.", view: "revenue_split" },
  { icon: FileText, name: "Medical aid claims summary", desc: "Billed, paid, co-payments, and status by scheme.", view: "claims_summary" },
  { icon: BarChart3, name: "Claims aging analysis", desc: "Outstanding claims by current, 31-60, 61-90, and 90+ days.", view: "aging" },
  { icon: Activity, name: "Revenue leak detection", desc: "Completed appointments without linked invoices.", view: "leaks" },
  { icon: UserCog, name: "Staff activity", desc: "Appointments managed per staff member.", view: "" },
] as const;

type ReportView = (typeof REPORTS)[number]["view"];

function Reports() {
  const { invoice, appointment } = useData();
  const [view, setView] = useState<ReportView>("");

  if (view) {
    return (
      <AppShell title="Reports">
        <button onClick={() => setView("")} className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-navy">
          <ArrowLeft className="h-3.5 w-3.5" /> Reports hub
        </button>
        {view === "claims_summary" && <ClaimsSummary invoices={invoice.invoices} />}
        {view === "aging" && <ClaimsAging invoices={invoice.invoices} />}
        {view === "revenue_split" && <RevenueSplit invoices={invoice.invoices} />}
        {view === "leaks" && <RevenueLeaks invoices={invoice.invoices} appointments={appointment.appointments} />}
      </AppShell>
    );
  }

  return (
    <AppShell title="Reports">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <button
            key={report.name}
            onClick={() => report.view && setView(report.view)}
            className="pulse-card p-5 text-left transition-colors hover:bg-blue-tint"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-tint">
              <report.icon className="h-5 w-5 text-blue" />
            </div>
            <div className="mt-4 text-[14.5px] font-semibold text-navy">{report.name}</div>
            <div className="mt-1 text-[12.5px] text-muted-foreground">{report.desc}</div>
          </button>
        ))}
      </div>
    </AppShell>
  );
}

function ClaimsSummary({ invoices }: { invoices: any[] }) {
  const { data: schemes = [] } = useQuery({
    queryKey: ["medical-aid-schemes"],
    queryFn: getMedicalAidSchemes,
  });
  const [scheme, setScheme] = useState("");
  const [status, setStatus] = useState("");
  const rows = invoices.filter((invoice) =>
    invoice.billingType === "medical_aid" &&
    (!scheme || invoice.medicalAidSchemeId === scheme) &&
    (!status || invoice.claimStatus === status),
  );
  const totals = rows.reduce((acc, invoice) => ({
    billed: acc.billed + (invoice.schemeBilledAmount ?? invoice.amount),
    paid: acc.paid + (invoice.schemePaidAmount ?? 0),
    copayment: acc.copayment + (invoice.patientCopayment ?? 0),
  }), { billed: 0, paid: 0, copayment: 0 });

  return (
    <ReportShell title="Medical aid claims summary" actions={<ExportButtons rows={rows} />}>
      <div className="mb-4 flex flex-wrap gap-3">
        <input type="date" className={inputClass} />
        <input type="date" className={inputClass} />
        <select value={scheme} onChange={(event) => setScheme(event.target.value)} className={inputClass}>
          <option value="">All schemes</option>
          {schemes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
          <option value="">All claim statuses</option>
          {["not_submitted", "submitted", "paid", "partially_paid", "rejected", "appealed"].map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}
        </select>
      </div>
      <DataTable
        headings={["Patient name", "Scheme", "Invoice #", "Date", "Billed", "Scheme paid", "Co-payment", "Status"]}
        rows={rows.map((invoice) => [
          invoice.patientName,
          invoice.medicalAidSchemeName,
          invoice.number,
          invoice.date,
          formatZAR(invoice.schemeBilledAmount ?? invoice.amount),
          formatZAR(invoice.schemePaidAmount ?? 0),
          formatZAR(invoice.patientCopayment ?? 0),
          invoice.claimStatus?.replace("_", " ") ?? "not submitted",
        ])}
        footer={["Totals", "", "", "", formatZAR(totals.billed), formatZAR(totals.paid), formatZAR(totals.copayment), ""]}
      />
    </ReportShell>
  );
}

function ClaimsAging({ invoices }: { invoices: any[] }) {
  const [band, setBand] = useState("");
  const today = new Date();
  const outstanding = invoices.filter((invoice) => invoice.billingType === "medical_aid" && !["paid"].includes(invoice.claimStatus ?? ""));
  const buckets = [
    { key: "0-30", label: "Current (0-30 days)", min: 0, max: 30 },
    { key: "31-60", label: "Overdue 31-60 days", min: 31, max: 60 },
    { key: "61-90", label: "Overdue 61-90 days", min: 61, max: 90 },
    { key: "90+", label: "Overdue 90+ days", min: 91, max: Infinity },
  ].map((bucket) => {
    const rows = outstanding.filter((invoice) => {
      const age = differenceInCalendarDays(today, parseISO(invoice.date));
      return age >= bucket.min && age <= bucket.max;
    });
    return { ...bucket, rows, total: rows.reduce((sum, invoice) => sum + (invoice.schemeBilledAmount ?? invoice.amount) - (invoice.schemePaidAmount ?? 0), 0) };
  });
  const max = Math.max(...buckets.map((bucket) => bucket.total), 1);
  const selected = buckets.find((bucket) => bucket.key === band)?.rows ?? [];

  return (
    <ReportShell title="Claims aging analysis">
      <div className="grid gap-3 md:grid-cols-4">
        {buckets.map((bucket) => (
          <button key={bucket.key} onClick={() => setBand(bucket.key)} className={`rounded-lg border p-4 text-left ${band === bucket.key ? "border-blue bg-blue-tint" : "border-border bg-white"}`}>
            <div className="text-[12px] font-semibold text-navy">{bucket.label}</div>
            <div className="mt-2 text-[20px] font-bold text-navy">{bucket.rows.length}</div>
            <div className="text-[12px] text-muted-foreground">{formatZAR(bucket.total)}</div>
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {buckets.map((bucket) => (
          <div key={bucket.key}>
            <div className="mb-1 flex justify-between text-[12.5px] text-muted-foreground">
              <span>{bucket.label}</span>
              <span>{formatZAR(bucket.total)}</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-blue" style={{ width: `${(bucket.total / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      {band && <div className="mt-6"><InvoiceMiniTable rows={selected} /></div>}
    </ReportShell>
  );
}

function RevenueSplit({ invoices }: { invoices: any[] }) {
  const privateTotal = invoices.filter((invoice) => invoice.billingType !== "medical_aid").reduce((sum, invoice) => sum + invoice.amount, 0);
  const medicalTotal = invoices.filter((invoice) => invoice.billingType === "medical_aid").reduce((sum, invoice) => sum + invoice.amount, 0);
  const total = privateTotal + medicalTotal || 1;
  const byScheme = Object.values(invoices.filter((invoice) => invoice.billingType === "medical_aid").reduce((acc: Record<string, any>, invoice) => {
    const key = invoice.medicalAidSchemeName || "Unknown";
    acc[key] = acc[key] ?? { scheme: key, count: 0, total: 0 };
    acc[key].count += 1;
    acc[key].total += invoice.amount;
    return acc;
  }, {}));
  const months = Array.from({ length: 6 }, (_, index) => subMonths(new Date(), 5 - index));
  const monthRows = months.map((month) => {
    const key = format(month, "yyyy-MM");
    const monthInvoices = invoices.filter((invoice) => invoice.date.startsWith(key));
    return {
      label: format(month, "MMM"),
      private: monthInvoices.filter((invoice) => invoice.billingType !== "medical_aid").reduce((sum, invoice) => sum + invoice.amount, 0),
      medical: monthInvoices.filter((invoice) => invoice.billingType === "medical_aid").reduce((sum, invoice) => sum + invoice.amount, 0),
    };
  });
  const maxMonth = Math.max(...monthRows.map((row) => row.private + row.medical), 1);

  return (
    <ReportShell title="Revenue split: Private vs Medical aid">
      <div className="mb-4 flex gap-3"><input type="date" className={inputClass} /><input type="date" className={inputClass} /></div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="rounded-lg border border-border bg-white p-5">
          <div className="mx-auto grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(#3B7BF8 0 ${(medicalTotal / total) * 100}%, #5DEBD7 0 100%)` }}>
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
              <div>
                <div className="text-[11px] text-muted-foreground">Total</div>
                <div className="text-[14px] font-semibold text-navy">{formatZAR(total)}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-[13px]">
            <Legend color="bg-blue" label="Medical aid" value={formatZAR(medicalTotal)} />
            <Legend color="bg-teal" label="Private" value={formatZAR(privateTotal)} />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-white p-5">
          <div className="text-[14px] font-semibold text-navy">6-month trend</div>
          <div className="mt-5 flex h-48 items-end gap-3">
            {monthRows.map((row) => (
              <div key={row.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full max-w-12 flex-col justify-end overflow-hidden rounded-t bg-surface" style={{ height: `${Math.max(8, ((row.private + row.medical) / maxMonth) * 170)}px` }}>
                  <div className="bg-blue" style={{ height: `${((row.medical / Math.max(row.private + row.medical, 1)) * 100)}%` }} />
                  <div className="bg-teal" style={{ height: `${((row.private / Math.max(row.private + row.medical, 1)) * 100)}%` }} />
                </div>
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6">
        <DataTable
          headings={["Scheme", "Claim count", "Total billed"]}
          rows={byScheme.map((row: any) => [row.scheme, row.count, formatZAR(row.total)])}
        />
      </div>
    </ReportShell>
  );
}

function RevenueLeaks({ invoices, appointments }: { invoices: any[]; appointments: any[] }) {
  const prices: Record<string, number> = { Consultation: 650, "Follow-up": 520, Telehealth: 350, Procedure: 780, Emergency: 850, "Walk-in": 650 };
  const rows = appointments.filter((appointment) =>
    appointment.status === "Completed" && !invoices.some((invoice) => invoice.patientId === appointment.patientId),
  );
  const total = rows.reduce((sum, appointment) => sum + (prices[appointment.type] ?? 650), 0);

  return (
    <ReportShell title="Revenue leak detection">
      <div className="mb-4 rounded-lg border border-[#FDE68A] bg-[#FFFAEB] p-4 text-[14px] font-semibold text-[#92400E]">
        Estimated unbilled revenue: {formatZAR(total)}
      </div>
      <DataTable
        headings={["Patient", "GP", "Date", "Appointment type", "Duration", "Estimated missed revenue", ""]}
        rows={rows.map((appointment) => [
          appointment.patientName,
          appointment.gp,
          format(parseISO(appointment.start), "d MMM yyyy"),
          appointment.type,
          "20 min",
          formatZAR(prices[appointment.type] ?? 650),
          "Create invoice",
        ])}
      />
    </ReportShell>
  );
}

function ReportShell({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="pulse-card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-semibold text-navy">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  );
}

function DataTable({ headings, rows, footer }: { headings: string[]; rows: any[][]; footer?: any[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-[12.5px]">
        <thead className="bg-surface text-left">
          <tr>{headings.map((heading) => <th key={heading} className="px-4 py-2.5 label-caps font-semibold">{heading}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-border">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 text-navy">{String(cell ?? "")}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={headings.length} className="px-4 py-8 text-center text-muted-foreground">No records found.</td></tr>}
        </tbody>
        {footer && (
          <tfoot className="border-t border-border bg-surface">
            <tr>{footer.map((cell, index) => <td key={index} className="px-4 py-3 font-semibold text-navy">{cell}</td>)}</tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function InvoiceMiniTable({ rows }: { rows: any[] }) {
  return (
    <DataTable
      headings={["Patient", "Invoice #", "Date", "Outstanding", "Status"]}
      rows={rows.map((invoice) => [
        invoice.patientName,
        invoice.number,
        invoice.date,
        formatZAR((invoice.schemeBilledAmount ?? invoice.amount) - (invoice.schemePaidAmount ?? 0)),
        invoice.claimStatus?.replace("_", " ") ?? "not submitted",
      ])}
    />
  );
}

function ExportButtons({ rows }: { rows: any[] }) {
  const exportCsv = () => {
    const csv = rows.map((row) => [row.patientName, row.medicalAidSchemeName, row.number, row.date, row.amount].join(",")).join("\n");
    const blob = new Blob([`Patient,Scheme,Invoice,Date,Amount\n${csv}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "medical-aid-claims.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="flex gap-2">
      <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-navy hover:bg-surface"><Download className="h-3.5 w-3.5" /> CSV</button>
      <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-navy hover:bg-surface"><Download className="h-3.5 w-3.5" /> PDF</button>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${color}`} />{label}</span>
      <span className="font-semibold text-navy">{value}</span>
    </div>
  );
}

const inputClass = "h-9 rounded-md border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-blue";
