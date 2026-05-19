import { createFileRoute, Link } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import { store, type Patient, myScopedStore } from "@/lib/store";
import { differenceInYears, format, parseISO } from "date-fns";
import { Search, Plus, Download, Filter } from "lucide-react";

export const Route = createFileRoute("/patients/")({
  component: PatientsList,
});

function PatientsList() {
  const [data, setData] = useState(() => myScopedStore());
  useEffect(() => {
    setData(myScopedStore());
  }, []);
  const [q, setQ] = useState("");
  const [scheme, setScheme] = useState("");

  const filtered = useMemo(() => {
    return data.patients.filter((p) => {
      const matchQ = q
        ? `${p.firstName} ${p.lastName} ${p.idNumber} ${p.phone}`
            .toLowerCase()
            .includes(q.toLowerCase())
        : true;
      const matchS = scheme ? p.medicalAid === scheme : true;
      return matchQ && matchS;
    });
  }, [data.patients, q, scheme]);

  const schemes = Array.from(new Set(data.patients.map((p) => p.medicalAid)));

  return (
    <AppShell title="Patients">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="label-caps">Directory</div>
          <h2 className="text-[22px] font-semibold text-navy">
            {filtered.length} patients
          </h2>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3.5 py-2 text-[13px] font-medium text-navy hover:bg-surface">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <Link
            to="/patients/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Register patient
          </Link>
        </div>
      </div>

      <div className="pulse-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, ID, or phone…"
              className="h-9 w-full rounded-md border border-border bg-white pl-9 pr-3 text-[13px] outline-none focus:border-blue"
            />
          </div>
          <select
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
            className="h-9 rounded-md border border-border bg-white px-3 text-[13px] focus:border-blue"
          >
            <option value="">All schemes</option>
            {schemes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-[13px] text-navy hover:bg-surface">
            <Filter className="h-4 w-4" /> More filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-surface text-left">
              <tr>
                <Th>Patient</Th>
                <Th>ID number</Th>
                <Th>Age</Th>
                <Th>Medical aid</Th>
                <Th>Phone</Th>
                <Th>Last visit</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <PatientRow key={p.id} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-2.5 label-caps font-semibold">{children}</th>;
}

function PatientRow({ p }: { p: Patient }) {
  const age = differenceInYears(new Date(), parseISO(p.dob));
  return (
    <tr className="border-b border-border last:border-0 transition-colors hover:bg-blue-tint">
      <td className="px-5 py-3">
        <Link
          to="/patients/$id"
          params={{ id: p.id }}
          className="flex items-center gap-3 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-tint text-[12px] font-semibold text-blue">
            {p.firstName[0]}
            {p.lastName[0]}
          </div>
          <div>
            <div className="font-medium text-navy group-hover:text-blue">
              {p.firstName} {p.lastName}
            </div>
            <div className="text-[11.5px] text-muted-foreground">
              {p.gender === "F" ? "Female" : "Male"}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">
        {p.idNumber}
      </td>
      <td className="px-5 py-3 text-navy">{age}</td>
      <td className="px-5 py-3">
        <Badge variant="indigo">{p.medicalAid}</Badge>
      </td>
      <td className="px-5 py-3 font-mono text-[12px] text-navy">{p.phone}</td>
      <td className="px-5 py-3 text-muted-foreground">
        {format(parseISO(p.lastVisit), "d MMM yyyy")}
      </td>
      <td className="px-5 py-3">
        <Badge variant={p.active ? "success" : "neutral"}>
          {p.active ? "Active" : "Inactive"}
        </Badge>
      </td>
    </tr>
  );
}
