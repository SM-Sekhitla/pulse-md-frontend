import { useState } from "react";
import { ActionButton, ActionForm } from "@/components/action-feedback";
import { SearchableSelect } from "@/components/searchable-select";
import { ICD10_CODES } from "@/lib/medical-aid";
import { claimsService, type Claim } from "@/services/claims";
import { getApiErrorMessage } from "@/utils/api";

export function ClaimDraftEditor({
  claim,
  onSaved,
  onCancel,
}: {
  claim: Claim;
  onSaved: (claim: Claim) => Promise<void>;
  onCancel: () => void;
}) {
  const [member, setMember] = useState(claim.memberNumber);
  const [dependant, setDependant] = useState(claim.dependantCode);
  const [service, setService] = useState(claim.dateOfService);
  const [diagnoses, setDiagnoses] = useState(claim.diagnoses);
  const [mapping, setMapping] = useState(
    claim.lines.map((line) => line.diagnosisCodes || []),
  );
  const [error, setError] = useState("");
  const addCode = (code: string) => {
    if (!code || diagnoses.some((d) => d.code === code)) return;
    if (!/^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/.test(code)) {
      setError(
        "Enter a diagnosis code without its description, for example J02.9.",
      );
      return;
    }
    setError("");
    setDiagnoses((items) => [
      ...items,
      {
        code,
        description:
          ICD10_CODES.find((d) => d.code === code)?.description || "",
      },
    ]);
  };
  return (
    <ActionForm
      className="claims-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        try {
          const saved = await claimsService.correct(claim, {
            memberNumber: member,
            dependantCode: dependant,
            dateOfService: service,
            diagnoses,
            lineDiagnoses: mapping,
          });
          await onSaved(saved);
        } catch (error) {
          setError(getApiErrorMessage(error));
        }
      }}
    >
      <h3>Correct draft</h3>
      <p>
        These changes apply to this claim only. Invoice charges and patient
        records remain unchanged.
      </p>
      <div className="claims-editor-grid">
        <label>
          Membership number
          <input
            value={member}
            maxLength={100}
            onChange={(e) => setMember(e.target.value)}
          />
        </label>
        <label>
          Dependant code
          <input
            value={dependant}
            maxLength={20}
            onChange={(e) => setDependant(e.target.value)}
          />
        </label>
        <label>
          Date of service
          <input
            type="date"
            required
            value={service}
            onChange={(e) => setService(e.target.value)}
          />
        </label>
      </div>
      <h4>Claim diagnoses</h4>
      <SearchableSelect
        label="Add claim diagnosis"
        value=""
        onChange={addCode}
        allowCustom
        className="w-full"
        options={ICD10_CODES.map((d) => ({
          value: d.code,
          label: `${d.code} — ${d.description}`,
        }))}
      />
      <ul className="claims-editor-diagnoses">
        {diagnoses.map((d) => (
          <li key={d.code}>
            <span>
              <strong>{d.code}</strong> {d.description}
            </span>
            <ActionButton
              type="button"
              aria-label={`Remove ${d.code}`}
              onClick={() => {
                setDiagnoses((items) =>
                  items.filter((item) => item.code !== d.code),
                );
                setMapping((rows) =>
                  rows.map((row) => row.filter((code) => code !== d.code)),
                );
              }}
            >
              Remove
            </ActionButton>
          </li>
        ))}
      </ul>
      <h4>Diagnoses for each tariff line</h4>
      <p>
        Select only the diagnoses applicable to that service. Codes are not
        copied automatically.
      </p>
      {!claim.lines.length && (
        <p>No tariff lines were captured on the invoice.</p>
      )}
      {claim.lines.map((line, index) => (
        <fieldset key={index}>
          <legend>
            {line.code} · {line.description}
          </legend>
          {diagnoses.length ? (
            diagnoses.map((d) => (
              <label className="claims-code-option" key={d.code}>
                <input
                  type="checkbox"
                  checked={mapping[index].includes(d.code)}
                  onChange={(e) =>
                    setMapping((rows) =>
                      rows.map((row, i) =>
                        i !== index
                          ? row
                          : e.target.checked
                            ? [...row, d.code]
                            : row.filter((code) => code !== d.code),
                      ),
                    )
                  }
                />
                {d.code} — {d.description || "Manually entered code"}
              </label>
            ))
          ) : (
            <p>Add a diagnosis above before linking it.</p>
          )}
        </fieldset>
      ))}
      {error && (
        <p className="claims-editor-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <ActionButton type="submit" className="gp-button gp-button-yellow">
          Save corrections
        </ActionButton>
        <ActionButton type="button" onClick={onCancel} className="gp-button">
          Cancel
        </ActionButton>
      </div>
    </ActionForm>
  );
}
