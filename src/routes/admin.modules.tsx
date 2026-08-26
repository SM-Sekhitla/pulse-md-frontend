import { createFileRoute } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/badge-pill";
import { useData } from "@/context/AppDataProvider";
import { cn } from "@/lib/utils";
import { MODULE_KEYS, MODULE_LABELS, PLAN_MODULES, tenantEnabledModules } from "@/lib/modules";
import type { ModuleKey, TenantOut } from "@/types/tenant";

export const Route = createFileRoute("/admin/modules")({
  component: ModulesPage,
});

type Drafts = Record<string, ModuleKey[]>;

function ModulesPage() {
  const { tenant } = useData();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Drafts>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const tenants = useMemo(
    () =>
      tenant.tenants
        .filter((item) => item.status === "active" || item.status === "suspended")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tenant.tenants],
  );

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      for (const practice of tenants) {
        if (!next[practice.id]) {
          next[practice.id] = modulesFor(practice);
        }
      }
      for (const tenantId of Object.keys(next)) {
        if (!tenants.some((practice) => practice.id === tenantId)) {
          delete next[tenantId];
        }
      }
      return next;
    });

    setOpen((current) => {
      const next = { ...current };
      tenants.forEach((practice, index) => {
        if (next[practice.id] === undefined) {
          next[practice.id] = index === 0;
        }
      });
      return next;
    });
  }, [tenants]);

  const toggleModule = (tenantId: string, key: ModuleKey, enabled: boolean) => {
    setDrafts((current) => {
      const set = new Set(current[tenantId] ?? []);
      if (enabled) set.add(key);
      else set.delete(key);
      return { ...current, [tenantId]: orderedModules(set) };
    });
  };

  const setAll = (tenantId: string, enabled: boolean) => {
    const practice = tenants.find((item) => item.id === tenantId);
    setDrafts((current) => ({
      ...current,
      [tenantId]: enabled && practice ? [...PLAN_MODULES[practice.plan]] : [],
    }));
  };

  const reset = (practice: TenantOut) => {
    setDrafts((current) => ({
      ...current,
      [practice.id]: modulesFor(practice),
    }));
  };

  const save = async (practice: TenantOut) => {
    const planModules = PLAN_MODULES[practice.plan];
    const enabledModules = orderedModules(drafts[practice.id] ?? []).filter((key) =>
      planModules.includes(key),
    );
    setSavingId(practice.id);
    const updated = await tenant.updateTenant(practice.id, { enabledModules });
    setSavingId(null);

    if (!updated) {
      toast.error("Could not save module access.");
      return;
    }

    setDrafts((current) => ({
      ...current,
      [practice.id]: modulesFor(updated),
    }));
    toast.success(`Module access saved for ${practice.name}.`);
  };

  return (
    <AdminShell title="Module access">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[12.5px] text-muted-foreground">
            Control which practice modules are visible and accessible. Dashboard and settings remain available.
          </p>
        </div>
        <Badge variant="purple">{tenants.length} practices</Badge>
      </div>

      <div className="space-y-3">
        {tenants.map((practice) => {
          const saved = modulesFor(practice);
          const draft = drafts[practice.id] ?? saved;
          const dirty = !sameModules(saved, draft);
          const expanded = open[practice.id] ?? false;
          const planModules = PLAN_MODULES[practice.plan];

          return (
            <section key={practice.id} className="pulse-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen((current) => ({ ...current, [practice.id]: !expanded }))}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[15px] font-semibold text-navy">{practice.name}</span>
                    <Badge variant={practice.status === "active" ? "blue" : "amber"}>{practice.status}</Badge>
                    <Badge variant="purple">{practice.plan}</Badge>
                    {dirty && <Badge variant="amber">Unsaved</Badge>}
                  </div>
                  <div className="mt-1 text-[11.5px] text-muted-foreground">
                    {draft.length} of {MODULE_KEYS.length} modules enabled
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>

              {expanded && (
                <div className="border-t border-border px-5 py-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[12.5px] font-medium text-navy">
                      <SlidersHorizontal className="h-4 w-4 text-blue" />
                      Module switches
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAll(practice.id, true)}
                        className="rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-navy hover:bg-surface"
                      >
                        Enable all
                      </button>
                      <button
                        type="button"
                        onClick={() => setAll(practice.id, false)}
                        className="rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-navy hover:bg-surface"
                      >
                        Disable all
                      </button>
                      <button
                        type="button"
                        onClick={() => reset(practice)}
                        disabled={!dirty || savingId === practice.id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-navy hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => save(practice)}
                        disabled={!dirty || savingId === practice.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {savingId === practice.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {MODULE_KEYS.map((key) => {
                      const availableOnPlan = planModules.includes(key);
                      const enabled = draft.includes(key);
                      return (
                        <label
                          key={key}
                          className={cn(
                            "flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 text-[12.5px] transition-colors",
                            availableOnPlan ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                            enabled
                              ? "border-blue bg-blue/5 text-navy"
                              : "border-border bg-white text-muted-foreground hover:bg-surface",
                          )}
                        >
                          <span className="font-medium">
                            {MODULE_LABELS[key]}
                            {!availableOnPlan && (
                              <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                                Plan locked
                              </span>
                            )}
                          </span>
                          <input
                            type="checkbox"
                            checked={enabled}
                            disabled={!availableOnPlan}
                            onChange={(event) => toggleModule(practice.id, key, event.target.checked)}
                            className="h-4 w-4 shrink-0 accent-[#3B7BF8]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {tenants.length === 0 && (
          <div className="pulse-card p-10 text-center text-[13px] text-muted-foreground">
            No active or suspended practices.
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function modulesFor(tenant: TenantOut): ModuleKey[] {
  return orderedModules(tenantEnabledModules(tenant));
}

function orderedModules(values: Iterable<ModuleKey>): ModuleKey[] {
  const set = new Set(values);
  return MODULE_KEYS.filter((key) => set.has(key));
}

function sameModules(a: ModuleKey[], b: ModuleKey[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}
