import { createFileRoute, Link } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Pill,
  Plus,
  Search,
  ShieldCheck,
  Calendar as CalIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { currentTenant, tenantPrescriptions } from "@/lib/store";
import { useData } from "@/context/AppDataProvider";

export const Route = createFileRoute("/prescriptions/")({
  component: PrescriptionsList,
});

function PrescriptionsList() {
  const t = currentTenant();
  const { appointment, patient, invoice, prescription } = useData();
  
  const all = useMemo(() => tenantPrescriptions(t?.id), [t?.id]);
  const [q, setQ] = useState("");
  const list = all.filter((p) =>
    p.patientName.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell title="Prescriptions">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search prescriptions by patient…"
            className="block w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-blue"
          />
        </div>
        <Link
          to="/prescriptions/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New prescription
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="pulse-card flex flex-col items-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint">
            <Pill className="h-5 w-5 text-blue" />
          </div>
          <div className="mt-4 text-[16px] font-semibold text-navy">
            No prescriptions yet
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Issue your first prescription to a patient.
          </p>
          <Link
            to="/prescriptions/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New prescription
          </Link>
        </div>
      ) : (
        <div className="pulse-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-surface text-left text-[11.5px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5">Issued</th>
                <th className="px-4 py-2.5">Items</th>
                <th className="px-4 py-2.5">Valid</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-2.5 font-medium text-navy">
                    {p.patientName}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <CalIcon className="mr-1 inline h-3.5 w-3.5" />
                    {format(new Date(p.issuedAt), "d MMM yyyy")}
                  </td>
                  <td className="px-4 py-2.5">{p.items.length}</td>
                  <td className="px-4 py-2.5">{p.validDays} days</td>
                  <td className="px-4 py-2.5 font-mono text-[11.5px] text-muted-foreground">
                    <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-teal" />
                    {p.securityCode.slice(0, 4)}••••
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      to="/prescriptions/$id"
                      params={{ id: p.id }}
                      className="text-blue hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
