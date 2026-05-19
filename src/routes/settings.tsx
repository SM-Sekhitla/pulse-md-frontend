import { createFileRoute } from "@/lib/router-compat";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/settings")({ component: Settings });

const TABS = [
  "Practice profile",
  "Working hours",
  "Appointment types",
  "Notifications",
  "Medical aids",
  "Billing defaults",
  "Integrations",
  "Subscription",
  "Security",
  "Data & compliance",
] as const;

function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Practice profile");
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
            {tab !== "Practice profile" && (
              <div className="md:col-span-2 text-[13px] text-muted-foreground">
                Settings for {tab} will appear here.
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button className="rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </AppShell>
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
