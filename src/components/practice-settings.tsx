import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ActionButton, ActionForm } from "@/components/action-feedback";
import API from "@/utils/api";
import { toast } from "sonner";
import type { TenantOut } from "@/types/tenant";
export function PracticeSettings({
  tenant,
  hoursOnly = false,
}: {
  tenant: TenantOut;
  hoursOnly?: boolean;
}) {
  const cache = useQueryClient();
  const [form, setForm] = useState({
    name: tenant.name,
    address: tenant.address || "",
    province: tenant.province || "",
    hpcsa: tenant.hpcsa || "",
    bhf: tenant.bhf || "",
    vat: tenant.vat || "",
    companyProfile: tenant.companyProfile || "",
  });
  const [hours, setHours] = useState(
    tenant.workingHours?.length === 7
      ? tenant.workingHours
      : [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ].map((key, i) => ({
          key,
          label: key[0].toUpperCase() + key.slice(1),
          short: key.slice(0, 3),
          enabled: i < 5,
          start: "08:00",
          end: "17:00",
        })),
  );
  return (
    <ActionForm
      className="md:col-span-2 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (hours.some((h) => h.enabled && h.start >= h.end))
          throw new Error("Closing time must be after opening time.");
        await API.patch(
          `/tenants/${tenant.id}/profile`,
          hoursOnly ? { workingHours: hours } : form,
        );
        await cache.invalidateQueries({ queryKey: ["tenants"] });
        toast.success("Practice settings saved.");
      }}
    >
      {hoursOnly ? (
        hours.map((h, index) => (
          <div className="flex flex-wrap items-center gap-3" key={h.key}>
            <label className="w-32 text-sm">
              <input
                type="checkbox"
                checked={h.enabled}
                onChange={(e) =>
                  setHours((v) =>
                    v.map((d, i) =>
                      i === index ? { ...d, enabled: e.target.checked } : d,
                    ),
                  )
                }
              />{" "}
              {h.label}
            </label>
            {(["start", "end"] as const).map((k) => (
              <input
                key={k}
                aria-label={`${h.label} ${k}`}
                type="time"
                value={h[k]}
                disabled={!h.enabled}
                onChange={(e) =>
                  setHours((v) =>
                    v.map((d, i) =>
                      i === index ? { ...d, [k]: e.target.value } : d,
                    ),
                  )
                }
                className="rounded border p-2"
              />
            ))}
          </div>
        ))
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(form) as Array<keyof typeof form>).map((key) => (
            <label className="text-sm" key={key}>
              {
                {
                  name: "Practice name",
                  address: "Physical address",
                  province: "Province",
                  hpcsa: "HPCSA practice number",
                  bhf: "BHF number (optional)",
                  vat: "VAT number",
                  companyProfile: "Practice description",
                }[key]
              }
              <input
                required={key === "name"}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border p-2"
              />
            </label>
          ))}
        </div>
      )}
      <ActionButton type="submit" className="gp-button gp-button-yellow">
        Save changes
      </ActionButton>
    </ActionForm>
  );
}
