import { createFileRoute, Link } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Check,
  Copy,
  CreditCard,
  LayoutGrid,
  MapPin,
  Search,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { AdminPagination } from "@/components/admin-pagination";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/badge-pill";
import type { TenantStatus } from "@/types/tenant";
import { format, parseISO } from "date-fns";
import { useData } from "@/context/AppDataProvider";
import { planPrice, formatZAR } from "@/lib/pricing";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const { tenant, patient, user } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tenant.tenants.find((t) => t.id === selectedId) ?? null;

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
                  onClick={() => setSelectedId(t.id)}
                >
                  <Td>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(t.id);
                      }}
                      className="text-left font-semibold text-navy hover:text-blue"
                    >
                      {t.name}
                    </button>
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
                    {t.createdAt ? format(parseISO(t.createdAt), "d MMM yyyy") : "Not recorded"}
                  </Td>
                  <Td className="text-muted-foreground">
                    {t.approvedAt
                      ? format(parseISO(t.approvedAt), "d MMM yyyy")
                      : "-"}
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
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent
          side="left"
          className="w-full overflow-y-auto bg-surface p-0 sm:max-w-[520px]"
        >
          {selected && (
            <PracticeDrawer
              t={selected}
              staffCount={
                user.users.filter(
                  (u) =>
                    u.tenantId === selected.id &&
                    u.role === "receptionist" &&
                    !u.deletedAt,
                ).length
              }
              patientCount={
                patient.patients.filter(
                  (p) => !p.tenantId || p.tenantId === selected.id,
                ).length
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
}

type PracticeRow = ReturnType<typeof useData>["tenant"]["tenants"][number];

function fmt(value?: string | null, withTime = false) {
  if (!value) return "-";
  try {
    return format(parseISO(value), withTime ? "d MMM yyyy HH:mm" : "d MMM yyyy");
  } catch {
    return "-";
  }
}

function PracticeDrawer({
  t,
  staffCount,
  patientCount,
}: {
  t: PracticeRow;
  staffCount: number;
  patientCount: number;
}) {
  const owner = t.owner;
  const modules = t.enabledModules ?? [];
  const [copied, setCopied] = useState(false);
  const initials = t.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const practitioner =
    [owner?.title, owner?.firstName, owner?.lastName]
      .filter(Boolean)
      .join(" ") || "No practitioner recorded";

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(t.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-gradient-to-b from-white to-surface px-6 pb-5 pt-6">
        <div className="flex items-start gap-4 pr-8">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-navy text-[18px] font-semibold tracking-wide text-white shadow-sm">
            {initials || "P"}
          </div>
          <div className="min-w-0">
            <SheetTitle className="truncate text-[20px] font-semibold leading-tight text-navy">
              {t.name}
            </SheetTitle>
            <SheetDescription className="mt-1 flex items-start gap-1.5 text-[12.5px] leading-snug">
              <MapPin size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{t.address || "No address recorded"}</span>
            </SheetDescription>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT(t.status)}>
            {t.status.replace("_", " ")}
          </Badge>
          <span className="rounded-full border border-border bg-white px-2.5 py-0.5 text-[11.5px] font-medium text-navy">
            {t.plan} plan
          </span>
          {t.bookingEnabled && (
            <span className="rounded-full border border-border bg-white px-2.5 py-0.5 text-[11.5px] font-medium text-navy">
              Online booking
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-white px-3 py-2">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tenant ID
            </div>
            <div className="truncate font-mono text-[12px] text-navy" title={t.id}>
              {t.id}
            </div>
          </div>
          <button
            type="button"
            onClick={copyId}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-navy hover:bg-surface"
            aria-label="Copy tenant ID"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-5 px-6 py-5">
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={<Users size={16} />} label="Staff" value={String(staffCount)} />
          <StatTile
            icon={<UserRound size={16} />}
            label="Patients"
            value={String(patientCount)}
          />
          <StatTile
            icon={<CreditCard size={16} />}
            label="Per month"
            value={formatZAR(planPrice(t.plan))}
          />
        </div>

        <DrawerCard icon={<Building2 size={15} />} title="Practice details">
          <DrawerRow label="Slug" value={t.slug} mono />
          <DrawerRow label="BHF number" value={t.bhf || "Missing"} mono />
          <DrawerRow label="HPCSA" value={t.hpcsa || "-"} mono />
          <DrawerRow label="VAT" value={t.vat || "-"} mono />
          <DrawerRow label="Registered" value={fmt(t.createdAt, true)} />
          <DrawerRow label="Approved" value={fmt(t.approvedAt, true)} />
          {t.status === "rejected" && (
            <DrawerRow label="Rejection reason" value={t.rejectionReason || "-"} />
          )}
        </DrawerCard>

        <DrawerCard icon={<Stethoscope size={15} />} title="Practitioner">
          <div className="mb-2 text-[15px] font-semibold text-navy">
            {practitioner}
          </div>
          <DrawerRow label="Email" value={owner?.email || "-"} />
          <DrawerRow label="Phone" value={owner?.phone || "-"} mono />
          <DrawerRow label="HPCSA" value={owner?.hpcsa || "-"} mono />
          <DrawerRow
            label="Last login"
            value={owner?.lastLogin ? fmt(owner.lastLogin, true) : "Never"}
          />
        </DrawerCard>

        <DrawerCard icon={<LayoutGrid size={15} />} title="Enabled modules">
          {modules.length ? (
            <div className="flex flex-wrap gap-1.5">
              {modules.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-medium capitalize text-navy"
                >
                  {m.replace("_", " ")}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-[13px] text-muted-foreground">
              Using the defaults for the {t.plan} plan.
            </div>
          )}
        </DrawerCard>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-white/95 px-6 py-4 backdrop-blur">
        <Link
          to="/admin/practices/$id"
          params={{ id: t.id }}
          className="gp-button inline-flex w-full items-center justify-center gap-2"
        >
          Manage practice <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="mt-1.5 truncate text-[18px] font-semibold text-navy">
        {value}
      </div>
    </div>
  );
}

function DrawerCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="text-blue">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function DrawerRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/50 py-2 text-[13px] last:border-b-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span
        className={`break-all text-right font-medium text-navy ${mono ? "font-mono text-[12px]" : ""}`}
      >
        {value}
      </span>
    </div>
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
