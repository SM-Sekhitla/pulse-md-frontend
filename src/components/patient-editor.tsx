import { useQuery } from "@tanstack/react-query";
import { getMedicalAidSchemes } from "@/lib/medical-aid-api";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ActionForm, ActionButton } from "@/components/action-feedback";
import { useData } from "@/context/AppDataProvider";
import { useAuth } from "@/context/AuthContext";
import type { Patient } from "@/types/patient";
import { toast } from "sonner";

export function PatientEditor({
  patient: p,
  onClose,
  onSaved,
}: {
  patient: Patient;
  onClose: () => void;
  onSaved: (p: Patient) => void;
}) {
  const { data: schemes = [] } = useQuery({
    queryKey: ["medical-aid-schemes"],
    queryFn: getMedicalAidSchemes,
  });
  const { patient } = useData();
  const { user } = useAuth();
  const clinical = ["owner", "doctor"].includes(user?.role || "");
  const [form, setForm] = useState({ ...p, dob: p.dob.slice(0, 10) });
  const [allergies, setAllergies] = useState(p.allergies.join("\n"));
  const [chronic, setChronic] = useState(p.chronic.join("\n"));
  const [vaccinations, setVaccinations] = useState(p.vaccinations.join("\n"));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const close = () => {
    if (
      !saving &&
      (!dirty || window.confirm("Discard unsaved patient changes?"))
    )
      onClose();
  };
  const set = (key: keyof typeof form, value: string | boolean) => {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const lines = (s: string) =>
    s
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
        <DialogTitle>Edit patient</DialogTitle>
        <DialogDescription>
          Update this patient's details. Clinical changes are recorded with the
          updating account.
        </DialogDescription>
        <ActionForm
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const updated = await patient.updatePatient(p.id, {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                dob: form.dob + "T00:00:00Z",
                gender: form.gender,
                idNumber: form.idNumber.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                address: form.address,
                emergencyContactName: form.emergencyContactName,
                emergencyContactPhone: form.emergencyContactPhone,
                consentGiven: form.consentGiven,
                billingType: form.billingType,
                medicalAid:
                  form.billingType === "private" ? "Private" : form.medicalAid,
                medicalAidSchemeId:
                  form.billingType === "private" ? "" : form.medicalAidSchemeId,
                medicalAidSchemeName:
                  form.billingType === "private" ? "" : form.medicalAid,
                medicalAidPlan:
                  form.billingType === "private" ? "" : form.medicalAidPlan,
                medicalAidNumber:
                  form.billingType === "private" ? "" : form.medicalAidNumber,
                isMainMember: form.isMainMember,
                mainMemberName: form.mainMemberName,
                mainMemberNumber: form.mainMemberNumber,
                dependantCode: form.dependantCode,
                relationshipToMain: form.relationshipToMain,
                ...(clinical
                  ? {
                      allergies: lines(allergies),
                      chronic: lines(chronic),
                      vaccinations: lines(vaccinations),
                    }
                  : {}),
              });
              if (!updated)
                throw new Error(
                  "Could not save the patient. Check medical aid details and try again.",
                );
              toast.success("Patient details saved.");
              onSaved(updated);
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["firstName", "First name"],
                ["lastName", "Surname"],
                ["dob", "Date of birth"],
                ["idNumber", "ID / passport (optional)"],
                ["phone", "Phone"],
                ["email", "Email (optional)"],
                ["address", "Address"],
                ["emergencyContactName", "Emergency contact name"],
                ["emergencyContactPhone", "Emergency contact phone"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-sm">
                {label}
                <input
                  required={["firstName", "lastName", "dob", "phone"].includes(
                    key,
                  )}
                  type={
                    key === "dob" ? "date" : key === "email" ? "email" : "text"
                  }
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="mt-1 block w-full rounded-md border border-border p-2"
                />
              </label>
            ))}
          </div>
          <label className="block text-sm">
            Gender
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              className="mt-1 rounded-md border p-2"
            >
              <option value="F">Female</option>
              <option value="M">Male</option>
            </select>
          </label>
          <label className="block text-sm">
            Billing type
            <select
              value={form.billingType}
              onChange={(e) => set("billingType", e.target.value)}
              className="ml-3 rounded-md border p-2"
            >
              <option value="private">Private</option>
              <option value="medical_aid">Medical aid</option>
            </select>
          </label>
          {form.billingType === "medical_aid" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Medical aid scheme
                <select
                  value={form.medicalAidSchemeId || ""}
                  required
                  onChange={(e) => {
                    const scheme = schemes.find((s) => s.id === e.target.value);
                    if (scheme) {
                      set("medicalAidSchemeId", scheme.id);
                      set("medicalAid", scheme.name);
                      set("medicalAidPlan", "");
                    }
                  }}
                  className="mt-1 block w-full rounded border p-2"
                >
                  <option value={form.medicalAidSchemeId || ""}>
                    {form.medicalAid || "Select scheme"}
                  </option>
                  {schemes
                    .filter(
                      (s) =>
                        s.isActive &&
                        s.acceptedByPractice &&
                        s.id !== form.medicalAidSchemeId,
                    )
                    .map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              {(
                [
                  ["medicalAidPlan", "Plan"],
                  ["medicalAidNumber", "Member number"],
                  ["mainMemberName", "Main member name"],
                  ["mainMemberNumber", "Main member number"],
                  ["dependantCode", "Dependant code"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-sm">
                  {label}
                  <input
                    value={form[key] || ""}
                    onChange={(e) => set(key, e.target.value)}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </label>
              ))}
              <label className="text-sm">
                <input
                  type="checkbox"
                  checked={form.isMainMember}
                  onChange={(e) => set("isMainMember", e.target.checked)}
                />{" "}
                Patient is main member
              </label>
            </div>
          )}
          {clinical && (
            <div className="grid gap-3">
              {[
                ["Allergies", allergies, setAllergies],
                ["Chronic conditions", chronic, setChronic],
                [
                  "Vaccinations (include administration dates)",
                  vaccinations,
                  setVaccinations,
                ],
              ].map(([label, value, change]) => (
                <label key={label as string} className="text-sm">
                  {label as string}
                  <textarea
                    rows={3}
                    value={value as string}
                    onChange={(e) => {
                      setDirty(true);
                      (change as (s: string) => void)(e.target.value);
                    }}
                    placeholder="One entry per line"
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </label>
              ))}
            </div>
          )}
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.consentGiven}
              onChange={(e) => set("consentGiven", e.target.checked)}
            />{" "}
            Patient consent recorded
          </label>
          <div className="flex justify-end gap-2">
            <ActionButton
              type="button"
              onClick={close}
              disabled={saving}
              className="gp-button border"
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              disabled={saving}
              className="gp-button gp-button-yellow"
            >
              Save patient
            </ActionButton>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
