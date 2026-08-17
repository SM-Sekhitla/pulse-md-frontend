import { createFileRoute } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { medicalAidSchemes, updateMedicalAidScheme } from "@/lib/store";
import type { MedicalAidScheme } from "@/lib/medical-aid";

export const Route = createFileRoute("/settings")({ component: Settings });

const TABS = [
  "Practice profile",
  "Working hours",
  "Appointment types",
  "Notifications",
  "Medical aid schemes",
  "Billing defaults",
  "Integrations",
  "Subscription",
  "Security",
  "Data & compliance",
] as const;

function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Practice profile");
  const [schemes, setSchemes] = useState(() => medicalAidSchemes());
  const [editingScheme, setEditingScheme] = useState<MedicalAidScheme | null>(null);

  const refreshSchemes = () => setSchemes(medicalAidSchemes());

  return (
    <AppShell title="Settings">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="pulse-card p-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`block w-full rounded-md px-3 py-2 text-left text-[13px] transition-colors ${tab === t ? "bg-blue-tint text-blue font-medium" : "text-navy hover:bg-surface"}`}
            >
              {t}
            </button>
          ))}
        </nav>
        <div className="pulse-card p-6">
          <h2 className="text-[18px] font-semibold text-navy">{tab}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Configure your practice settings for {tab.toLowerCase()}.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {tab === "Practice profile" && (
              <>
                <Field
                  label="Practice name"
                  defaultValue="Northcliff Family Practice"
                />
                <Field label="HPCSA practice number" defaultValue="MP0712345" />
                <Field label="VAT number" defaultValue="4123456789" />
                <Field label="Phone" defaultValue="+27 11 555 0100" />
                <Field
                  label="Email"
                  defaultValue="reception@northcliff.health"
                />
                <Field label="Website" defaultValue="northcliff.health" />
                <Field
                  full
                  label="Physical address"
                  defaultValue="14 Riverside Drive, Northcliff, Johannesburg"
                />
              </>
            )}
            {tab === "Medical aid schemes" && (
              <MedicalAidSchemesPanel
                schemes={schemes}
                onToggle={(scheme) => {
                  const next = !scheme.acceptedByPractice;
                  updateMedicalAidScheme(scheme.id, { acceptedByPractice: next });
                  refreshSchemes();
                  toast.success(
                    next
                      ? "Scheme accepted by your practice."
                      : "Scheme hidden from patient portal and new invoice dropdown. Existing patient records are not affected.",
                  );
                }}
                onManagePlans={setEditingScheme}
              />
            )}
            {tab !== "Practice profile" && tab !== "Medical aid schemes" && (
              <div className="md:col-span-2 text-[13px] text-muted-foreground">
                Settings for {tab} will appear here.
              </div>
            )}
          </div>
          {tab !== "Medical aid schemes" && <div className="mt-6 flex justify-end">
            <button className="rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">
              Save changes
            </button>
          </div>}
        </div>
      </div>
      {editingScheme && (
        <PlanModal
          scheme={editingScheme}
          onClose={() => setEditingScheme(null)}
          onSaved={() => {
            refreshSchemes();
            setEditingScheme((current) =>
              current ? medicalAidSchemes().find((scheme) => scheme.id === current.id) ?? current : current,
            );
          }}
        />
      )}
    </AppShell>
  );
}

function MedicalAidSchemesPanel({
  schemes,
  onToggle,
  onManagePlans,
}: {
  schemes: MedicalAidScheme[];
  onToggle: (scheme: MedicalAidScheme) => void;
  onManagePlans: (scheme: MedicalAidScheme) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return schemes.filter((scheme) => {
      const matchesQuery =
        !needle ||
        scheme.name.toLowerCase().includes(needle) ||
        scheme.administrator.toLowerCase().includes(needle);
      const matchesType = type === "all" || scheme.type === type;
      const matchesStatus =
        status === "all" ||
        (status === "accepted" && scheme.acceptedByPractice) ||
        (status === "not_accepted" && !scheme.acceptedByPractice);
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [query, schemes, status, type]);

  const accepted = schemes.filter((scheme) => scheme.acceptedByPractice).length;
  const openAccepted = schemes.filter((scheme) => scheme.acceptedByPractice && scheme.type === "open").length;

  return (
    <div className="md:col-span-2">
      <div>
        <h3 className="text-[18px] font-semibold text-navy">Medical aid schemes</h3>
        <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
          Configure which medical aid schemes your practice accepts. These appear on patient registration, the public booking portal, and all invoices.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="Total schemes" value={schemes.length} />
        <Metric label="Accepted by your practice" value={accepted} />
        <Metric label="Open schemes" value={openAccepted} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search schemes..."
            className="h-9 w-full rounded-md border border-border bg-white pl-9 pr-3 text-[13px] outline-none focus:border-blue"
          />
        </div>
        <select value={type} onChange={(event) => setType(event.target.value)} className="h-9 rounded-md border border-border bg-white px-3 text-[13px]">
          <option value="all">All types</option>
          <option value="open">Open</option>
          <option value="restricted">Restricted</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border border-border bg-white px-3 text-[13px]">
          <option value="all">All</option>
          <option value="accepted">Accepted</option>
          <option value="not_accepted">Not accepted</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="min-w-full text-[13px]">
          <thead className="bg-surface text-left">
            <tr>
              {["", "Scheme name", "Type", "Administrator", "Plans configured"].map((heading) => (
                <th key={heading} className="px-4 py-2.5 label-caps font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((scheme) => (
              <tr key={scheme.id} className="border-t border-border">
                <td className="w-16 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onToggle(scheme)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${scheme.acceptedByPractice ? "bg-blue" : "bg-muted"}`}
                    aria-label={`${scheme.acceptedByPractice ? "Disable" : "Enable"} ${scheme.name}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${scheme.acceptedByPractice ? "left-4" : "left-0.5"}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-[14px] font-medium text-navy">{scheme.name}</td>
                <td className="px-4 py-3">
                  <span className={`pulse-badge ${scheme.type === "open" ? "bg-teal/20 text-[#04756F]" : "bg-muted text-muted-foreground"}`}>
                    {scheme.type === "open" ? "Open" : "Restricted"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] text-muted-foreground">{scheme.administrator}</td>
                <td className="px-4 py-3">
                  <span className="text-muted-foreground">{scheme.plans.length} plans</span>
                  <button type="button" onClick={() => onManagePlans(scheme)} className="ml-2 text-[12.5px] font-medium text-blue hover:underline">
                    Manage plans
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="label-caps">{label}</div>
      <div className="mt-1 text-[22px] font-semibold text-navy">{value}</div>
    </div>
  );
}

function PlanModal({ scheme, onClose, onSaved }: { scheme: MedicalAidScheme; onClose: () => void; onSaved: () => void }) {
  const [plans, setPlans] = useState(scheme.plans);
  const [planName, setPlanName] = useState("");
  const [saved, setSaved] = useState(true);

  const save = (nextPlans = plans) => {
    updateMedicalAidScheme(scheme.id, { plans: nextPlans });
    setSaved(true);
    onSaved();
  };

  const updatePlans = (nextPlans: string[]) => {
    setPlans(nextPlans);
    setSaved(false);
    window.setTimeout(() => save(nextPlans), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-semibold text-navy">{scheme.name} - plan options</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Add the plans your patients most commonly hold. These appear as suggestions when registering patients.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-success">{saved ? "Saved" : "Saving..."}</span>
            <button type="button" onClick={onClose} className="rounded-md border border-border p-1.5 text-navy hover:bg-surface" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {plans.length === 0 && <span className="text-[13px] text-muted-foreground">No plans configured yet.</span>}
          {plans.map((plan) => (
            <span key={plan} className="inline-flex items-center gap-1 rounded-full border border-blue/20 bg-blue-tint px-3 py-1 text-[12.5px] font-medium text-blue">
              {plan}
              <button type="button" onClick={() => updatePlans(plans.filter((item) => item !== plan))} aria-label={`Remove ${plan}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <input
            value={planName}
            onChange={(event) => setPlanName(event.target.value)}
            placeholder="Plan / option name"
            className="h-10 flex-1 rounded-md border border-border bg-white px-3 text-[13px] outline-none focus:border-blue"
          />
          <button
            type="button"
            onClick={() => {
              const clean = planName.trim();
              if (!clean || plans.includes(clean)) return;
              updatePlans([...plans, clean]);
              setPlanName("");
            }}
            className="rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
          >
            Add plan
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={() => save()} className="rounded-md bg-navy px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">
            Save plans
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  full,
}: {
  label: string;
  defaultValue?: string;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-[12.5px] font-medium text-navy">{label}</span>
      <input
        defaultValue={defaultValue}
        className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue"
      />
    </label>
  );
}
