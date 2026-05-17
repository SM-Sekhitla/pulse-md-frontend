import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/badge-pill";
import { store, planPrice, formatZAR } from "@/lib/store";

export const Route = createFileRoute("/admin/subscriptions")({ component: Subs });

function Subs() {
  const s = store.get();
  const active = s.tenants.filter(t => t.status === "active");
  const monthly = active.reduce((sum, t) => sum + planPrice(t.plan), 0);
  return (
    <AdminShell title="Subscriptions">
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="pulse-card p-5"><div className="label-caps">MRR</div><div className="text-[26px] font-bold text-navy">{formatZAR(monthly)}</div></div>
        <div className="pulse-card p-5"><div className="label-caps">Active subs</div><div className="text-[26px] font-bold text-navy">{active.length}</div></div>
        <div className="pulse-card p-5"><div className="label-caps">Avg per practice</div><div className="text-[26px] font-bold text-navy">{formatZAR(active.length ? monthly / active.length : 0)}</div></div>
      </div>
      <div className="pulse-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-surface text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-5 py-3 text-left">Practice</th><th className="px-5 py-3 text-left">Plan</th><th className="px-5 py-3 text-right">Monthly</th><th className="px-5 py-3 text-left">Status</th></tr>
          </thead>
          <tbody>
            {s.tenants.map(t => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-5 py-3 font-medium text-navy">{t.name}</td>
                <td className="px-5 py-3"><Badge variant="blue">{t.plan}</Badge></td>
                <td className="px-5 py-3 text-right font-mono">{formatZAR(planPrice(t.plan))}</td>
                <td className="px-5 py-3 capitalize">{t.status.replace("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
