import { createFileRoute, Link } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminPagination } from "@/components/admin-pagination";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/badge-pill";
import type { TenantStatus } from "@/types/tenant";
import { format, parseISO } from "date-fns";
import { useData } from "@/context/AppDataProvider";

export const Route = createFileRoute("/admin/practices/")({
  component: AllPractices,
});

const PAGE_SIZE = 20;

const STATUS_VARIANT = (s: TenantStatus) =>
  s === "active"
    ? "success"
    : s === "pending_approval"
      ? "warning"
      : s === "suspended"
        ? "danger"
        : "neutral";

function AllPractices() {
  const { tenant, patient } = useData();

  const [statusFilter, setStatusFilter] = useState<TenantStatus | "all">("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const rows = useMemo(
    () =>
      tenant.tenants.filter((t) => {
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        if (planFilter !== "all" && t.plan !== planFilter) return false;
        //const owner = user.users.find((u) => u.id === t.gpUserId);
        const owner = t.owner;
        const hay = `${t.name} ${owner?.email || ""}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        return true;
      }),
    [planFilter, q, statusFilter, tenant.tenants],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, rows],
  );

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, planFilter]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  return (
    <AdminShell title="All practices">
      <div className="admin-filter-bar">
        <label className="admin-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search practice or email</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search practice or email…"
            className="h-9 w-[280px] rounded-md border border-border bg-white px-3 text-[13px] outline-none focus:border-blue"
          />
        </label>
        <select
          aria-label="Filter by practice status"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as TenantStatus | "all")
          }
          className="h-9 rounded-md border border-border bg-white px-3 text-[13px]"
        >
          <option value="all">All statuses</option>
          <option value="pending_approval">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          aria-label="Filter by plan"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-white px-3 text-[13px]"
        >
          <option value="all">All plans</option>
          <option value="Starter">Starter</option>
          <option value="Growth">Growth</option>
          <option value="Enterprise">Enterprise</option>
        </select>
        <div className="admin-result-count" role="status">
          {rows.length} result{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="pulse-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-surface text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th>Practice</Th>
              <Th>GP</Th>
              <Th>Email</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Registered</Th>
              <Th>Approved</Th>
              <Th className="text-right">Patients</Th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((t) => {
              //const owner = user.users.find((u) => u.id === t.gpUserId);
              const owner = t.owner;
              return (
                <tr
                  key={t.id}
                  className="border-t border-border hover:bg-surface cursor-pointer"
                >
                  <Td>
                    <Link
                      to="/admin/practices/$id"
                      params={{ id: t.id }}
                      className="font-semibold text-navy hover:text-blue"
                    >
                      {t.name}
                    </Link>
                  </Td>
                  <Td>
                    {owner?.title} {owner?.firstName} {owner?.lastName}
                  </Td>
                  <Td className="text-muted-foreground">{owner?.email}</Td>
                  <Td>{t.plan}</Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT(t.status)}>
                      {t.status.replace("_", " ")}
                    </Badge>
                  </Td>
                  <Td className="text-muted-foreground">
                    {format(parseISO(t.createdAt), "d MMM yyyy")}
                  </Td>
                  <Td className="text-muted-foreground">
                    {t.approvedAt
                      ? format(parseISO(t.approvedAt), "d MMM yyyy")
                      : "—"}
                  </Td>
                  <Td className="text-right font-mono">
                    {
                      patient.patients.filter(
                        (p) => !p.tenantId || p.tenantId === t.id,
                      ).length
                    }
                  </Td>
                </tr>
              );
            })}
            {!tenant.isLoading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center text-muted-foreground"
                >
                  No practices match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <AdminPagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={rows.length}
          onPageChange={setPage}
        />
      </div>
    </AdminShell>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-5 py-3 text-left font-semibold ${className}`}>
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-3 ${className}`}>{children}</td>;
}
