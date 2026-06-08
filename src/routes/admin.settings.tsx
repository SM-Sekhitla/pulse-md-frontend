import { createFileRoute } from "@/lib/router-compat";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { store, updateSettings } from "@/lib/store";
import { useData } from "@/context/AppDataProvider";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { tenant, patient, user, platformSetting} = useData();
  
  const [superEmail, setSuperEmail] = useState(platformSetting?.platformSettings?.superAdminEmail!);
  const [supportEmail, setSupportEmail] = useState(platformSetting?.platformSettings?.supportEmail);
  const [maint, setMaint] = useState(platformSetting?.platformSettings?.maintenanceMode);
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateSettings({
      superAdminEmail: superEmail,
      supportEmail,
      maintenanceMode: maint,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminShell title="Platform settings">
      <div className="max-w-[640px] space-y-6">
        <div className="pulse-card p-6 space-y-4">
          <div>
            <div className="label-caps">Notifications</div>
            <h2 className="text-[16px] font-semibold text-navy">
              Admin contact addresses
            </h2>
          </div>
          <Field
            label="Super Admin email (receives new registration alerts)"
            value={superEmail}
            onChange={setSuperEmail}
          />
          <Field
            label="Support email (shown to users)"
            value={supportEmail || ""}
            onChange={setSupportEmail}
          />
        </div>

        <div className="pulse-card p-6">
          <div className="label-caps">Maintenance</div>
          <h2 className="text-[16px] font-semibold text-navy">
            Maintenance mode
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            When enabled, GP users see a maintenance page. Super Admin retains
            access.
          </p>
          <label className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={maint}
              onChange={(e) => setMaint(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-[13px] text-navy">
              Maintenance mode {maint ? "ON" : "OFF"}
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            className="rounded-md bg-blue px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90"
          >
            Save settings
          </button>
          {saved && <span className="text-[13px] text-success">Saved.</span>}
        </div>
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-navy">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-blue"
      />
    </label>
  );
}
