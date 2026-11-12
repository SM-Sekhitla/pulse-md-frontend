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
          Test the platform’s development token connection. No practice setup is
          needed.
        </p>
      </div>
      <PlatformConnection />
      <details className="rounded-xl border p-5">
        <summary className="cursor-pointer font-semibold">
          Practice membership &amp; claims setup — later
        </summary>
        <label className="mt-4 block text-sm">
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
            Select a practice only when setting up membership queries or claims.
          </p>
        )}
      </details>
    </section>
  );
}

function PlatformConnection() {
  const query = useQuery({
    queryKey: ["admin-medilink-platform-status"],
    queryFn: medilinkService.platformStatus,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [testing, setTesting] = useState(false);
  if (query.isPending) return <p role="status">Checking platform setup…</p>;
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 text-sm">
        <p>{getApiErrorMessage(query.error)}</p>
        <ActionButton
          type="button"
          className="gp-button border"
          onClick={async () => {
            await query.refetch();
          }}
        >
          Retry setup check
        </ActionButton>
      </div>
    );
  const status = query.data;
  const blocker =
    status.serverIssue ||
    (!status.credentialsPresent
      ? "Add your development username and password to the backend environment."
      : "") ||
    (!status.authenticationEnabled
      ? "Set MEDILINK_SANDBOX_AUTH_ENABLED=true on the backend and redeploy."
      : "");
  return (
    <section className="rounded-xl border bg-surface p-5 space-y-4">
      <div>
        <div className="label-caps">Development only</div>
        <h3 className="mt-1 text-lg font-semibold">Platform connection</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Click to request a development access token from Medilink. No practice
          ID, BHF or routing code is needed.
        </p>
      </div>
      {blocker && (
        <p role="status" className="text-sm text-amber-800">
          {blocker}
        </p>
      )}
      <ActionButton
        type="button"
        className="gp-button gp-button-yellow"
        disabled={Boolean(blocker) || testing}
        onClick={async () => {
          setTesting(true);
          setResult(null);
          try {
            const response = await medilinkService.testPlatform();
            setResult({ ok: true, message: response.message });
            toast.success("Development token received.");
          } catch (error) {
            setResult({ ok: false, message: getApiErrorMessage(error) });
            throw error;
          } finally {
            setTesting(false);
          }
        }}
      >
        {testing ? "Requesting token…" : "Test platform connection"}
      </ActionButton>
      {result && (
        <div
          role={result.ok ? "status" : "alert"}
          className={`rounded-lg border p-4 text-sm ${result.ok ? "text-green-800" : "text-red-700"}`}
        >
          <p className="font-semibold">
            {result.ok ? "Token received" : "Token request failed"}
          </p>
          <p className="mt-1">{result.message}</p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        This tests authentication only. Tokens stay on the backend. No patient
        data or claims are sent.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">
          Connection setup help
        </summary>
        <p className="mt-2">
          If you already configured one development account in
          MEDILINK_SANDBOX_CREDENTIALS_JSON, it can be tested here as-is. No
          practice selection is required.
        </p>
        <p className="mt-2">
          Alternatively, set MEDILINK_SANDBOX_USERNAME and
          MEDILINK_SANDBOX_PASSWORD on the backend. These take priority for this
          platform test. Enable MEDILINK_SANDBOX_AUTH_ENABLED=true and redeploy
          after changing environment variables.
        </p>
      </details>
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
  if (query.isPending) return <p role="status">Loading Medilink settings…</p>;
  const error = query.error;
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
      cataloguesLoading={providers.isPending || schemes.isPending}
      catalogueError={Boolean(providers.error || schemes.error)}
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
  cataloguesLoading,
  catalogueError,
}: {
  settings: Settings;
  providers: MedilinkProvider[];
  schemes: Array<Pick<MedicalAidScheme, "id" | "name" | "plans" | "isActive">>;
  tenantId: string;
  cataloguesLoading: boolean;
  catalogueError: boolean;
}) {
  const cache = useQueryClient();
  const { tenant } = useData();
  const practice = tenant.tenants.find((item) => item.id === tenantId);
  const [form, setForm] = useState<MedilinkConfig>(() => ({
    ...configOnly(settings),
    supplierName: settings.supplierName || (practice?.name || "").slice(0, 40),
    supplierBhf: settings.supplierBhf || practice?.bhf || "",
    supplierHpcsa: settings.supplierHpcsa || practice?.hpcsa || "",
  }));
  const [connection, setConnection] = useState(settings.connection);
  const connectionBlocker =
    settings.serverIssue ||
    (!settings.credentialsPresent
      ? "Add this practice’s development credentials to the backend environment, then restart the backend."
      : "") ||
    (!settings.authenticationEnabled
      ? "Set MEDILINK_SANDBOX_AUTH_ENABLED=true on the backend, then restart it."
      : "");
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
          Start with one connection test. No BHF, scheme routing codes or doctor
          profiles are needed for this step.
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
            {connection?.status === "authenticated" ? (
              <CheckCircle2 size={16} className="text-green-700" />
            ) : (
              <AlertCircle size={16} />
            )}
            {connection
              ? connection.status === "authenticated"
                ? "Authenticated"
                : "Test failed"
              : "Not tested"}
          </p>
          {connection && (
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(connection.checkedAt).toLocaleString()} ·{" "}
              {connection.message}
            </p>
          )}
        </div>
      </div>
      <section className="rounded-xl border bg-surface p-5 space-y-4">
        <div>
          <h3 className="font-semibold">1. Test connection</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Checks that your backend can authenticate with Medilink development.
            This sends no patient information and submits no claims.
          </p>
        </div>
        {connectionBlocker && (
          <p role="status" className="text-sm text-amber-800">
            {connectionBlocker}
          </p>
        )}
        <ActionButton
          type="button"
          className="gp-button gp-button-yellow"
          disabled={Boolean(connectionBlocker) || testing}
          onClick={async () => {
            setTesting(true);
            setConnection(null);
            try {
              const result = await medilinkService.test(
                tenantId,
                settings.revision,
              );
              setConnection({
                status: "authenticated",
                message: result.message,
                checkedAt: new Date().toISOString(),
              });
              toast.success("Development connection is working.");
            } catch (error) {
              setConnection({
                status: "failed",
                message: getApiErrorMessage(error),
                checkedAt: new Date().toISOString(),
              });
              throw error;
            } finally {
              setTesting(false);
            }
          }}
        >
          {testing ? "Testing connection…" : "Test connection"}
        </ActionButton>
        <p className="text-xs text-muted-foreground">
          Uses the saved server connection settings. You do not need to save the
          form below first.
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Backend setup help
          </summary>
          <p className="mt-2">
            In the backend environment, add Medilink’s issued development
            credentials under this practice ID:
          </p>
          <code className="mt-2 block break-all select-all">{tenantId}</code>
          <p className="mt-2">
            Set MEDILINK_SANDBOX_AUTH_ENABLED=true. Keep the development base
            URL and token path supplied by Medilink. Restart the backend after
            changing its environment. Passwords stay on the backend.
          </p>
        </details>
      </section>
      <section className="rounded-xl border p-5 text-sm space-y-2">
        <h3 className="font-semibold">2. Test a membership (when ready)</h3>
        <p className="text-muted-foreground">
          After the connection works, Medilink must provide an authorised test
          BHF, one scheme Option code and a matching test membership. You can
          finish the connection test without these.
        </p>
        <p className="text-muted-foreground">
          Configure them below, then use Patients → New patient → Medical aid →
          Check membership. A connection success alone does not test membership
          or claims.
        </p>
      </section>
      <details className="rounded-xl border p-5">
        <summary className="cursor-pointer font-semibold">
          Membership &amp; claims settings — set up later
        </summary>
        <p className="my-4 text-sm text-muted-foreground">
          Practice details are filled from registration where available. Use
          identifiers and routing codes confirmed by Medilink; no dummy values
          are generated.
        </p>
        {cataloguesLoading && (
          <p role="status" className="my-3 text-sm">
            Loading doctors and schemes…
          </p>
        )}
        {catalogueError && (
          <p role="alert" className="my-3 text-sm text-amber-800">
            Doctors or schemes could not be loaded. Reload this page before
            editing these settings. You can still test the connection above.
          </p>
        )}
        <ActionForm
          className="space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();
            await save();
          }}
        >
          <fieldset
            disabled={testing || cataloguesLoading || catalogueError}
            className="space-y-6"
          >
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
                Use the treating practitioner’s registered identifiers, which
                may differ from the billing practice.
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
                          treatingProviders: form.treatingProviders.map(
                            (p, i) =>
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
                                i === index
                                  ? { ...p, [key]: e.target.value }
                                  : p,
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
                            i === index
                              ? { ...m, planName: e.target.value }
                              : m,
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
                configured. Clinical staff see reviewed patient suggestions,
                never connection settings.
              </p>
            </section>
            <ActionButton type="submit" className="gp-button gp-button-yellow">
              Save Medilink settings
            </ActionButton>
          </fieldset>
        </ActionForm>
      </details>
    </div>
  );
}
