import { createFileRoute, Link } from "@/lib/router-compat";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/badge-pill";
import { store, formatZAR, planPrice, tenantPatientCount } from "@/lib/store";
import { format, parseISO, isThisMonth } from "date-fns";
import { useData } from "@/context/AppDataProvider";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const { tenant, patient, user, audit } = useData();
  
  const active = tenant.tenants.filter((t) => t.status === "active");
  const pending = tenant.tenants.filter((t) => t.status === "pending_approval");
  const totalPatients = patient.patients.length;
  const monthRev = active.reduce((sum, t) => sum + planPrice(t.plan), 0);

  return (
    <AdminShell title="Platform overview">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPI label="Active practices" value={active.length} />
        <KPI
          label="Pending approval"
          value={pending.length}
          amber={pending.length > 0}
        />
        <KPI label="Patients (platform)" value={totalPatients} />
        <KPI label="Revenue this month" value={formatZAR(monthRev)} />
      </div>

      {pending.length > 0 && (
        <div className="mt-6 rounded-lg border-2 border-[#FCD34D] bg-[#FFFBEB] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-caps">Action required</div>
              <div className="text-[16px] font-semibold text-navy">
                {pending.length} practice{pending.length === 1 ? "" : "s"}{" "}
                awaiting review
              </div>
            </div>
            <Link
              to="/admin/practices/pending"
              className="rounded-md bg-navy px-3 py-1.5 text-[12.5px] font-medium text-white"
            >
              View queue →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-[#FCD34D]/40">
            {pending.map((t) => {
              const owner = user.users.find((u) => u.id === t.gpUserId);
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 text-[13px]"
                >
                  <div>
                    <div className="font-semibold text-navy">{t.name}</div>
                    <div className="text-muted-foreground">
                      {owner?.title} {owner?.firstName} {owner?.lastName} ·
                      HPCSA {t.hpcsa} · {t.plan}
                    </div>
                  </div>
                  <Link
                    to="/admin/practices/$id"
                    params={{ id: t.id }}
                    className="rounded-md bg-blue px-3 py-1.5 text-white text-[12.5px] font-medium"
                  >
                    Review
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="pulse-card">
          <div className="border-b border-border px-5 py-3.5 text-[14px] font-semibold text-navy">
            Recent activity
          </div>
          <div className="divide-y divide-border">
            {audit.audits.slice(0, 20).map((e) => (
              <div key={e.id} className="px-5 py-3 text-[12.5px]">
                <div className="text-navy">{e.message}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {format(parseISO(e.ts), "d MMM yyyy HH:mm")} · {e.type}
                  {e.actorEmail ? ` · ${e.actorEmail}` : ""}
                </div>
              </div>
            ))}
            {audit.audits.length === 0 && (
              <div className="px-5 py-6 text-center text-[12.5px] text-muted-foreground">
                No activity yet.
              </div>
            )}
          </div>
        </div>

        <div className="pulse-card">
          <div className="border-b border-border px-5 py-3.5 text-[14px] font-semibold text-navy">
            Practices by plan
          </div>
          <div className="p-5 space-y-3">
            {(["Starter", "Growth", "Enterprise"] as const).map((plan) => {
              const c = active.filter((t) => t.plan === plan).length;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-navy">{plan}</span>
                    <span className="font-mono text-muted-foreground">{c}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-blue"
                      style={{
                        width: `${active.length ? (c / active.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function KPI({
  label,
  value,
  amber,
}: {
  label: string;
  value: string | number;
  amber?: boolean;
}) {
  return (
    <div
      className={`pulse-card p-5 ${amber ? "border-2 border-[#FCD34D] bg-[#FFFBEB]" : ""}`}
    >
      <div className="label-caps">{label}</div>
      <div className="mt-2 text-[26px] font-bold text-navy">{value}</div>
    </div>
  );
}
