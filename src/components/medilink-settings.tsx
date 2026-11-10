import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Link2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionButton, ActionForm } from "@/components/action-feedback";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/AppDataProvider";
import { useSearchParams } from "react-router-dom";
import type { MedicalAidScheme } from "@/lib/medical-aid";
import { getApiErrorMessage } from "@/utils/api";
import {
  medilinkService,
  type MedilinkConfig,
  type MedilinkProvider,
  type MedilinkSettings as Settings,
} from "@/services/medilink";

const input =
  "mt-1 block w-full rounded-md border border-border bg-white p-2 text-sm";

export function AdminMedilinkSettings() {
  const { user } = useAuth();
  const { tenant } = useData();
  const [params] = useSearchParams();
  const [tenantId, setTenantId] = useState(params.get("practiceId") || "");
  if (user?.role !== "super-admin") return null;
  return (
    <section className="pulse-card p-6 space-y-5">
      <div>
        <div className="label-caps">Integrations</div>
        <h2 className="text-lg font-semibold">Medilink administration</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage practice connections and routing. Integration configuration is
          restricted to super admins.
        </p>
      </div>
      <label className="block text-sm">
        Practice
        <select
          className={input}
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        >
          <option value="">Select a practice</option>
          {tenant.tenants.map((practice) => (
            <option key={practice.id} value={practice.id}>
              {practice.name}
            </option>
          ))}
        </select>
      </label>
      {tenantId && tenant.tenants.some((p) => p.id === tenantId) ? (
        <MedilinkSettings key={tenantId} tenantId={tenantId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a practice to manage its connection.
        </p>
      )}
    </section>
  );
}

function MedilinkSettings({ tenantId }: { tenantId: string }) {
  const { user } = useAuth();
  const allowed = user?.role === "super-admin" && Boolean(tenantId);
  const query = useQuery({
    queryKey: ["admin-medilink-settings", tenantId],
    queryFn: () => medilinkService.settings(tenantId),
    enabled: allowed,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const providers = useQuery({
    queryKey: ["admin-medilink-providers", tenantId],
    queryFn: () => medilinkService.providers(tenantId),
    enabled: allowed,
    retry: false,
  });
  const schemes = useQuery({
    queryKey: ["admin-medilink-schemes", tenantId],
    queryFn: () => medilinkService.schemes(tenantId),
    enabled: allowed,
    retry: false,
  });
  if (!allowed)
    return (
      <p className="text-sm">
        Integration administration requires a super-admin account.
      </p>
    );
  if (query.isPending || providers.isPending || schemes.isPending)
    return <p role="status">Loading Medilink settings…</p>;
  const error = query.error || providers.error || schemes.error;
  if (error)
    return (
      <div role="alert" className="space-y-3 text-sm">
        <p>{getApiErrorMessage(error)}</p>
        <ActionButton
          type="button"
          className="gp-button border"
          onClick={async () => {
            await Promise.all([
              query.refetch(),
              providers.refetch(),
              schemes.refetch(),
            ]);
          }}
        >
          Retry
        </ActionButton>
      </div>
    );
  if (!query.data) return null;
  return (
    <SettingsForm
      key={`${tenantId}:${query.data.revision}`}
      settings={query.data}
      providers={providers.data || []}
      schemes={schemes.data || []}
      tenantId={tenantId}
    />
  );
}

function configOnly(settings: Settings): MedilinkConfig {
  return {
    revision: settings.revision,
    environment: settings.environment,
    wireVersion: settings.wireVersion,
    membershipLookupEnabled: settings.membershipLookupEnabled,
    supplierName: settings.supplierName,
    supplierBhf: settings.supplierBhf,
    supplierHpcsa: settings.supplierHpcsa,
    placeOfService: settings.placeOfService,
    treatingProviders: settings.treatingProviders,
    schemeMappings: settings.schemeMappings,
  };
}

function SettingsForm({
  settings,
  providers,
  schemes,
  tenantId,
}: {
  settings: Settings;
  providers: MedilinkProvider[];
  schemes: Array<Pick<MedicalAidScheme, "id" | "name" | "plans" | "isActive">>;
  tenantId: string;
}) {
  const cache = useQueryClient();
  const [form, setForm] = useState<MedilinkConfig>(() => configOnly(settings));
  const dirty = JSON.stringify(form) !== JSON.stringify(configOnly(settings));
  const [testing, setTesting] = useState(false);
  const save = async () => {
    const result = await medilinkService.save(tenantId, form);
    cache.setQueryData(["admin-medilink-settings", tenantId], result);
    toast.success("Medilink settings saved.");
  };
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-navy p-5 text-white">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Link2 size={20} /> Medilink
        </div>
        <p className="mt-2 text-sm text-white/80">
          Connect your practice to the development switch. Configure your
          providers and medical aid routing before testing authentication.
        </p>
        <span className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs">
          Sandbox environment
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Server credentials</p>
          <p className="mt-1 text-muted-foreground">
            {settings.credentialsPresent
              ? "Configured for this practice"
              : "Awaiting platform administrator setup"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Passwords and tokens are managed securely on the backend.
          </p>
        </div>
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Last authentication test</p>
          <p className="mt-1 flex items-center gap-2">
            {settings.connection?.status === "authenticated" ? (
              <CheckCircle2 size={16} className="text-green-700" />
            ) : (
              <AlertCircle size={16} />
            )}
            {settings.connection
              ? settings.connection.status === "authenticated"
                ? "Authenticated"
                : "Test failed"
              : "Not tested"}
          </p>
          {settings.connection && (
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(settings.connection.checkedAt).toLocaleString()} ·{" "}
              {settings.connection.message}
            </p>
          )}
        </div>
      </div>
      <ActionForm
        className="space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          await save();
        }}
      >
        <fieldset disabled={testing} className="space-y-6">
          <section>
            <h3 className="font-semibold">Billing practice</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["supplierName", "Supplier practice name", 40],
                  ["supplierBhf", "Supplier BHF number", 7],
                  ["supplierHpcsa", "Supplier HPCSA number", 13],
                  ["wireVersion", "Medilink wire version", 4],
                ] as const
              ).map(([key, label, max]) => (
                <label key={key} className="text-sm">
                  {label}
                  <input
                    className={input}
                    maxLength={max}
                    value={form[key]}
                    pattern={
                      key === "supplierBhf"
                        ? "[0-9]{7}"
                        : key === "wireVersion"
                          ? "[A-Za-z0-9.]{1,4}"
                          : undefined
                    }
                    required={key === "wireVersion" || key === "supplierBhf"}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label className="text-sm">
                Place of service
                <select
                  className={input}
                  value={form.placeOfService}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      placeOfService: Number(e.target.value) as 11 | 12,
                    })
                  }
                >
                  <option value={11}>Consulting room (11)</option>
                  <option value={12}>Home visit (12)</option>
                </select>
              </label>
            </div>
          </section>
          <section>
            <h3 className="font-semibold">Treating doctors</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the treating practitioner’s registered identifiers, which may
              differ from the billing practice.
            </p>
            {form.treatingProviders.map((provider, index) => (
              <div
                key={index}
                className="mt-3 grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <label className="text-sm">
                  Doctor
                  <select
                    required
                    className={input}
                    value={provider.userId}
                    onChange={(e) => {
                      const doctor = providers.find(
                        (p) => p.id === e.target.value,
                      );
                      setForm({
                        ...form,
                        treatingProviders: form.treatingProviders.map((p, i) =>
                          i === index
                            ? {
                                ...p,
                                userId: e.target.value,
                                hpcsa: doctor?.hpcsa || "",
                              }
                            : p,
                        ),
                      });
                    }}
                  >
                    <option value="">Select doctor</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.id}
                      </option>
                    ))}
                  </select>
                </label>
                {(["bhf", "hpcsa"] as const).map((key) => (
                  <label className="text-sm" key={key}>
                    {key === "bhf" ? "Treating BHF" : "Treating HPCSA"}
                    <input
                      required
                      className={input}
                      value={provider[key]}
                      maxLength={key === "bhf" ? 7 : 13}
                      pattern={key === "bhf" ? "[0-9]{7}" : undefined}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          treatingProviders: form.treatingProviders.map(
                            (p, i) =>
                              i === index ? { ...p, [key]: e.target.value } : p,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <ActionButton
                  type="button"
                  aria-label="Remove treating doctor"
                  className="gp-button border"
                  onClick={() =>
                    setForm({
                      ...form,
                      treatingProviders: form.treatingProviders.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                >
                  <Trash2 size={16} />
                </ActionButton>
              </div>
            ))}
            <ActionButton
              type="button"
              className="gp-button mt-3 border"
              disabled={!providers.length}
              onClick={() =>
                setForm({
                  ...form,
                  treatingProviders: [
                    ...form.treatingProviders,
                    { userId: "", bhf: "", hpcsa: "" },
                  ],
                })
              }
            >
              <Plus size={16} /> Add doctor
            </ActionButton>
          </section>
          <section>
            <h3 className="font-semibold">Medical aid routing</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter Option codes from Medilink’s scheme list. Plan names and
              routing codes are separate values.
            </p>
            {form.schemeMappings.map((mapping, index) => (
              <div
                key={index}
                className="mt-3 grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_120px_auto]"
              >
                <label className="text-sm">
                  Scheme
                  <select
                    required
                    className={input}
                    value={mapping.schemeId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        schemeMappings: form.schemeMappings.map((m, i) =>
                          i === index
                            ? { ...m, schemeId: e.target.value, planName: "" }
                            : m,
                        ),
                      })
                    }
                  >
                    <option value="">Select scheme</option>
                    {schemes
                      .filter((s) => s.isActive)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-sm">
                  Plan
                  <select
                    className={input}
                    value={mapping.planName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        schemeMappings: form.schemeMappings.map((m, i) =>
                          i === index ? { ...m, planName: e.target.value } : m,
                        ),
                      })
                    }
                  >
                    <option value="">Scheme-wide default</option>
                    {schemes
                      .find((s) => s.id === mapping.schemeId)
                      ?.plans.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-sm">
                  Option code
                  <input
                    required
                    className={input}
                    maxLength={4}
                    pattern="[A-Za-z0-9]{1,4}"
                    value={mapping.optionCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        schemeMappings: form.schemeMappings.map((m, i) =>
                          i === index
                            ? { ...m, optionCode: e.target.value }
                            : m,
                        ),
                      })
                    }
                  />
                </label>
                <ActionButton
                  type="button"
                  aria-label="Remove scheme routing"
                  className="gp-button border"
                  onClick={() =>
                    setForm({
                      ...form,
                      schemeMappings: form.schemeMappings.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                >
                  <Trash2 size={16} />
                </ActionButton>
              </div>
            ))}
            <ActionButton
              type="button"
              className="gp-button mt-3 border"
              onClick={() =>
                setForm({
                  ...form,
                  schemeMappings: [
                    ...form.schemeMappings,
                    { schemeId: "", planName: "", optionCode: "" },
                  ],
                })
              }
            >
              <Plus size={16} /> Add routing code
            </ActionButton>
          </section>
          <section className="rounded-lg border p-4 text-sm space-y-2">
            <h3 className="font-semibold">Membership checks</h3>
            <p className="text-xs text-muted-foreground">
              {settings.membershipChecksEnabled
                ? "Ready for sandbox test memberships"
                : "Disabled or awaiting server setup"}
            </p>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={form.membershipLookupEnabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    membershipLookupEnabled: e.target.checked,
                  })
                }
              />{" "}
              Enable membership lookup for this sandbox test practice
            </label>
            <p className="text-xs text-muted-foreground">
              Use only Medilink-issued test memberships in sandbox. Server
              membership/authentication flags and credentials must also be
              configured. Clinical staff see reviewed patient suggestions, never
              connection settings.
            </p>
          </section>
          <ActionButton type="submit" className="gp-button gp-button-yellow">
            Save Medilink settings
          </ActionButton>
        </fieldset>
      </ActionForm>
      <div className="rounded-lg border bg-surface p-4 text-sm">
        {settings.missingSetup.length > 0 && (
          <>
            <p className="font-medium">Setup checklist</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {settings.missingSetup.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
        <ActionButton
          type="button"
          className="gp-button mt-4 border"
          disabled={
            dirty ||
            settings.revision === 0 ||
            !settings.credentialsPresent ||
            !settings.authenticationEnabled ||
            Boolean(settings.serverIssue)
          }
          onClick={async () => {
            setTesting(true);
            try {
              const result = await medilinkService.test(
                tenantId,
                form.revision,
              );
              toast.success(result.message);
            } finally {
              await cache.invalidateQueries({
                queryKey: ["admin-medilink-settings", tenantId],
              });
              setTesting(false);
            }
          }}
        >
          Test sandbox authentication
        </ActionButton>
        {dirty && (
          <p className="mt-2 text-muted-foreground">
            Save your changes before testing.
          </p>
        )}
        <p className="mt-3 text-muted-foreground">
          This test authenticates with the development switch. Claims, benefit
          checks and patient lookups will be connected in the next phases.
        </p>
      </div>
    </div>
  );
}
