import { createFileRoute, useParams, Link } from "@/lib/router-compat";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/badge-pill";
import {
  approveTenant,
  rejectTenant,
  suspendTenant,
  reinstateTenant,
  store,
  planPrice,
  formatZAR,
  setTenantBookingEnabled,
  type TenantStatus,
} from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import {toast} from "sonner";
import {Copy, Check,Globe,NotebookPen} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useData } from "@/context/AppDataProvider";
import { te } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/admin/practices/$id")({
  component: PracticeDetail,
});

const STATUS_VARIANT = (s: TenantStatus) =>
  s === "active"
    ? "success"
    : s === "pending_approval"
      ? "warning"
      : s === "suspended"
        ? "danger"
        : "neutral";

function PracticeDetail() {
  const { id } = useParams({ from: "/admin/practices/$id" });
  const [, refresh] = useState(0);
  const reload = () => refresh((x) => x + 1);
  const { tenant, patient, user, } = useData();
  const { user: currentUser} = useAuth();

  
  const me = currentUser!;
  const t = tenant.tenants.find((x) => x.id === id);
  if (!t)
    return (
      <AdminShell title="Practice not found">
        <div className="pulse-card p-8">
          Not found.{" "}
          <Link to="/admin/practices" className="text-blue">
            Back
          </Link>
        </div>
      </AdminShell>
    );

  const owner = user.users.find((u) => u.id === t.gpUserId);
  const staffCount = user.users.filter(
    (u) => u.tenantId === t.id && u.role === "receptionist" && !u.deletedAt,
  ).length;
  const patientCount = patient.patients.filter(
    (p) => !p.tenantId || p.tenantId === t.id,
  ).length;

  const approve = async () => {
    if (
      confirm(`Approve ${t.name} and send access email to ${owner?.email}?`)
    ) {
      //approveTenant(t.id, me);
      await tenant.approveTenant(t.id)
      reload();
    }
  };
  const reject = async () => {
    const r = prompt("Reason for rejection:");
    if (r) {
      //rejectTenant(t.id, r, me);
      await tenant.rejectTenant(t.id, r)

      reload();
    }
  };
  const suspend = async () => {
    const r = prompt("Reason for suspension:");
    if (r) {
      //suspendTenant(t.id, r, me);
      await tenant.suspendTenant(t.id, r)

      reload();
    }
  };
  const reinstate = () => {
    if (confirm("Reinstate this practice?")) {
      reinstateTenant(t.id, me);
      //await tenant.rejectTenant(t.id, r)

      reload();
    }
  };

  return (
    <AdminShell title={t.name}>
      <div className="mb-4">
        <Link
          to="/admin/practices"
          className="text-[12.5px] text-muted-foreground hover:text-navy"
        >
          ← All practices
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="pulse-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="label-caps">Practice</div>
                <h2 className="text-[20px] font-semibold text-navy">
                  {t.name}
                </h2>
                <div className="text-[12.5px] text-muted-foreground">
                  {t.address || "—"}
                </div>
              </div>
              <Badge variant={STATUS_VARIANT(t.status)}>
                {t.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 text-[13px]">
              <Row label="Slug" value={t.slug} mono />
              <Row label="Plan" value={t.plan} />
              <Row label="HPCSA" value={t.hpcsa || "—"} mono />
              <Row label="VAT" value={t.vat || "—"} mono />
              <Row
                label="Registered"
                value={format(parseISO(t.createdAt), "d MMM yyyy HH:mm")}
              />
              <Row
                label="Approved"
                value={
                  t.approvedAt
                    ? format(parseISO(t.approvedAt), "d MMM yyyy HH:mm")
                    : "—"
                }
              />
            </div>
          </div>

          <div className="pulse-card p-6">
            <div className="label-caps">Practitioner</div>
            <h3 className="text-[16px] font-semibold text-navy">
              {owner?.title} {owner?.firstName} {owner?.lastName}
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 text-[13px]">
              <Row label="Email" value={owner?.email || "—"} />
              <Row label="Phone" value={owner?.phone || "—"} mono />
              <Row label="HPCSA" value={owner?.hpcsa || "—"} mono />
              <Row
                label="Last login"
                value={
                  owner?.lastLogin
                    ? format(parseISO(owner.lastLogin), "d MMM yyyy HH:mm")
                    : "Never"
                }
              />
            </div>
          </div>

           <FeaturesCard tenantId={t.id} bookingEnabled={!!t.bookingEnabled} bookingSlug={t.bookingSlug || t.slug} onChange={reload} />
        </div>

        <div className="space-y-4">
          <div className="pulse-card p-6">
            <div className="label-caps mb-3">Actions</div>
            {t.status === "pending_approval" && (
              <>
                <button
                  onClick={approve}
                  className="w-full rounded-md bg-success px-4 py-2.5 text-[13px] font-medium text-white hover:opacity-90"
                >
                  Approve practice
                </button>
                <button
                  onClick={reject}
                  className="mt-2 w-full rounded-md border border-[#FCA5A5] bg-white px-4 py-2.5 text-[13px] font-medium text-[#991B1B] hover:bg-[#FEF2F2]"
                >
                  Reject application
                </button>
              </>
            )}
            {t.status === "active" && (
              <button
                onClick={suspend}
                className="w-full rounded-md bg-[#E53E3E] px-4 py-2.5 text-[13px] font-medium text-white hover:opacity-90"
              >
                Suspend practice
              </button>
            )}
            {t.status === "suspended" && (
              <button
                onClick={reinstate}
                className="w-full rounded-md bg-success px-4 py-2.5 text-[13px] font-medium text-white hover:opacity-90"
              >
                Reinstate practice
              </button>
            )}
            {t.status === "rejected" && (
              <div className="text-[12.5px] text-muted-foreground">
                Application rejected. Reason: {t.rejectionReason || "—"}
              </div>
            )}
          </div>

          <div className="pulse-card p-6">
            <div className="label-caps mb-3">At a glance</div>
            <div className="space-y-2 text-[13px]">
              <Row label="Staff" value={String(staffCount)} />
              <Row label="Patients" value={String(patientCount)} />
              <Row
                label="Plan price"
                value={formatZAR(planPrice(t.plan)) + "/mo"}
              />
              <Row label="Billing" value="Active" />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
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
    <div className="flex justify-between border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-medium text-navy ${mono ? "font-mono text-[12px]" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function FeaturesCard({ tenantId, bookingEnabled, bookingSlug, onChange }: { tenantId: string; bookingEnabled: boolean; bookingSlug: string; onChange: () => void }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://app.pulsemd.co.za";
  const link = `${origin}/book`;

  const toggle = (on: boolean) => {
    setTenantBookingEnabled(tenantId, on);
    toast.success(on ? "Public booking enabled" : "Public booking disabled");
    onChange();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  return (
    <div className="pulse-card p-6">
      <div className="label-caps mb-3">Features</div>
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-blue/10 p-2 text-navy"><NotebookPen className="h-4 w-4" /></div>
          <div>
            <div className="text-[13.5px] font-semibold text-navy">Public booking page</div>
            <div className="text-[12px] text-muted-foreground mt-0.5 max-w-md">
              Allows patients to find and book this GP directly from the PulseMD public booking portal.
            </div>
          </div>
        </div>
        <Switch checked={bookingEnabled} onCheckedChange={toggle} aria-label="Toggle public booking" />
      </div>

      {bookingEnabled && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-surface px-4 py-3">
          <div className="min-w-0">
            <div className="label-caps">Public link</div>
            <div className="font-mono text-[12.5px] text-navy truncate">{link}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Slug: <span className="font-mono">{bookingSlug}</span></div>
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-navy hover:bg-surface"
          >
            {copied ? <><Check className="h-3.5 w-3.5 text-success" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
          </button>
        </div>
      )}
    </div>
  );
}

