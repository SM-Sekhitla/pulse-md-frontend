import { createFileRoute } from "@/lib/router-compat";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/badge-pill";
import {
  MODULE_KEYS,
  MODULE_LABELS,
  setTenantModules,
  store,
  type ModuleKey,
} from "@/lib/store";

export const Route = createFileRoute("/admin/module")({
  component: ModulesPage,
});

function ModulesPage() {
  const [, refresh] = useState(0);
  const reload = () => refresh((x) => x + 1);
  const s = store.get();
  const tenants = s.tenants.filter(
    (t) => t.status === "active" || t.status === "suspended",
  );

  const toggle = (tenantId: string, key: ModuleKey, on: boolean) => {
    const t = s.tenants.find((x) => x.id === tenantId);
    const current = new Set<ModuleKey>(t?.enabledModules ?? [...MODULE_KEYS]);
    if (on) current.add(key);
    else current.delete(key);
    setTenantModules(tenantId, Array.from(current));
    reload();
  };

  const setAll = (tenantId: string, on: boolean) => {
    setTenantModules(tenantId, on ? [...MODULE_KEYS] : []);
    reload();
  };

  return (
    <AdminShell title="Module access">
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        Control which sidebar modules each practice can see. Dashboard and
        Settings are always available.
      </p>

      <div className="space-y-4">
        {tenants.map((t) => {
          const enabled = new Set<ModuleKey>(
            t.enabledModules ?? [...MODULE_KEYS],
          );
          return (
            <div key={t.id} className="pulse-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-[15px] font-semibold text-navy">
                      {t.name}
                    </div>
                    <Badge variant={t.status === "active" ? "blue" : "amber"}>
                      {t.status}
                    </Badge>
                    <Badge variant="purple">{t.plan}</Badge>
                  </div>
                  <div className="text-[11.5px] text-muted-foreground mt-0.5">
                    {enabled.size} of {MODULE_KEYS.length} modules enabled
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAll(t.id, true)}
                    className="rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-navy hover:bg-surface"
                  >
                    Enable all
                  </button>
                  <button
                    onClick={() => setAll(t.id, false)}
                    className="rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-navy hover:bg-surface"
                  >
                    Disable all
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                {MODULE_KEYS.map((k) => {
                  const on = enabled.has(k);
                  return (
                    <label
                      key={k}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[12.5px] transition-colors ${on ? "border-blue bg-blue/5 text-navy" : "border-border bg-white text-muted-foreground hover:bg-surface"}`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => toggle(t.id, k, e.target.checked)}
                        className="h-3.5 w-3.5 accent-[#3B7BF8]"
                      />
                      <span className="font-medium">{MODULE_LABELS[k]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
        {tenants.length === 0 && (
          <div className="pulse-card p-10 text-center text-muted-foreground">
            No active practices.
          </div>
        )}
      </div>
    </AdminShell>
  );
}
