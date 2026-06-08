import { createFileRoute } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import { store, formatZAR, myScopedStore } from "@/lib/store";
import { format, parseISO } from "date-fns";
import { Plus, Search } from "lucide-react";
import { useData } from "@/context/AppDataProvider";

export const Route = createFileRoute("/billing")({
  component: Billing,
});

function Billing() {
  const { invoice } = useData();
  
  
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const filtered = invoice.invoices.filter((i) => {
    return (
      (!q ||
        i.patientName.toLowerCase().includes(q.toLowerCase()) ||
        i.number.toLowerCase().includes(q.toLowerCase())) &&
      (!status || i.status === status)
    );
  });

  const total = filtered.reduce((s, i) => s + i.amount, 0);
  const paid = filtered
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + i.amount, 0);
  const overdue = filtered
    .filter((i) => i.status === "Overdue")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <AppShell title="Billing & invoices">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total invoiced" value={formatZAR(total)} />
        <Stat label="Paid" value={formatZAR(paid)} tone="success" />
        <Stat label="Overdue" value={formatZAR(overdue)} tone="danger" />
      </div>

      <div className="mt-6 pulse-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search invoice or patient…"
              className="h-9 w-full rounded-md border border-border bg-white pl-9 pr-3 text-[13px] outline-none focus:border-blue"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-md border border-border bg-white px-3 text-[13px]"
          >
            <option value="">All statuses</option>
            {["Draft", "Sent", "Partially paid", "Paid", "Overdue", "Void"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
          <button className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-1.5 text-[13px] font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> New invoice
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-surface text-left">
              <tr>
                {[
                  "Invoice",
                  "Patient",
                  "Date",
                  "Due",
                  "Amount",
                  "Type",
                  "Status",
                ].map((h) => (
                  <th key={h} className="px-5 py-2.5 label-caps font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.id}
                  className={`border-b border-border last:border-0 hover:bg-blue-tint ${i.status === "Overdue" ? "bg-[#FFFBEB]" : ""}`}
                >
                  <td className="px-5 py-3 font-mono text-navy">{i.number}</td>
                  <td className="px-5 py-3 text-navy">{i.patientName}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {format(parseISO(i.date), "d MMM yyyy")}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {format(parseISO(i.dueDate), "d MMM yyyy")}
                  </td>
                  <td className="px-5 py-3 font-semibold text-navy">
                    {formatZAR(i.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={i.type === "Private" ? "neutral" : "indigo"}
                    >
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
                            : i.status === "Sent"
                              ? "blue"
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
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: any;
  tone?: "neutral" | "success" | "danger";
}) {
  const accent =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-danger"
        : "text-navy";
  return (
    <div className="pulse-card p-5">
      <div className="label-caps">{label}</div>
      <div className={`mt-2 text-[24px] font-bold ${accent}`}>{value}</div>
    </div>
  );
}
