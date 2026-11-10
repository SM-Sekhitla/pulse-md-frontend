import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/action-feedback";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import {
  membershipService,
  type MembershipResult,
  type MembershipValues,
} from "@/services/membership";

type Props = {
  schemeId: string;
  planName: string;
  memberNumber: string;
  patientId?: string;
  current: MembershipValues;
  onApply: (values: MembershipValues, lookupId: string) => void;
};

const labels: Record<keyof MembershipValues, string> = {
  firstName: "First name",
  lastName: "Surname",
  dob: "Date of birth",
  gender: "Gender",
  idNumber: "ID number",
  phone: "Membership contact phone (review)",
  address: "Membership address (review)",
  medicalAid: "Medical aid",
  medicalAidSchemeId: "Scheme",
  medicalAidSchemeName: "Scheme name",
  medicalAidPlan: "Plan",
  medicalAidNumber: "Member number",
  dependantCode: "Dependant code",
  isMainMember: "Patient is main member",
  mainMemberName: "Main member name",
  mainMemberNumber: "Main member number",
  relationshipToMain: "Relationship to main member",
};
const shown = Object.keys(labels).filter(
  (key) => !["medicalAid", "medicalAidSchemeId"].includes(key),
) as Array<keyof MembershipValues>;
const display = (value: string | boolean | undefined) =>
  value === undefined || value === ""
    ? "Not recorded"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : value;

export function MembershipLookup(props: Props) {
  return (
    <LookupSession
      key={JSON.stringify([
        props.patientId,
        props.schemeId,
        props.planName,
        props.memberNumber,
      ])}
      {...props}
    />
  );
}

function LookupSession({
  schemeId,
  planName,
  memberNumber,
  patientId,
  current,
  onApply,
}: Props) {
  const alive = useRef(true);
  const selectionVersion = useRef(0);
  const latestCurrent = useRef("");
  latestCurrent.current = JSON.stringify(current);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const tenant = useCurrentTenant();
  const cache = useQueryClient();
  const status = useQuery({
    queryKey: ["membership-availability", tenant?.id],
    queryFn: membershipService.status,
    retry: false,
    staleTime: 30000,
  });
  const history = useQuery({
    queryKey: ["membership-history", tenant?.id, patientId],
    queryFn: () => membershipService.history(patientId!),
    enabled: Boolean(patientId),
    retry: false,
  });
  const [authorized, setAuthorized] = useState(false);
  const [result, setResult] = useState<MembershipResult | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const row = result?.dependants.find((d) => d.index === selected);
  const choose = (index: number) => {
    selectionVersion.current += 1;
    const selectedRow = result?.dependants.find((d) => d.index === index);
    setSelected(index);
    setApplied(false);
    setError("");
    setFields(
      shown.filter(
        (key) =>
          selectedRow?.values[key] !== undefined &&
          !["phone", "address"].includes(key),
      ),
    );
  };
  return (
    <section className="col-span-full space-y-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 font-semibold text-navy">
        <ShieldCheck size={18} /> Check medical aid membership
      </div>
      <p className="text-xs text-muted-foreground">
        Find members and dependants using the selected scheme and membership
        number. Review returned details before applying them. A membership match
        does not confirm available benefits.
      </p>
      {status.isPending ? (
        <p role="status" className="text-sm">
          Checking availability…
        </p>
      ) : !status.data?.available ? (
        <p className="text-sm text-muted-foreground">
          Membership checks are currently unavailable. You can enter the details
          manually.
        </p>
      ) : (
        <>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
            />
            I am authorized to check this membership for patient registration or
            care.
          </label>
          <ActionButton
            type="button"
            className="gp-button border"
            disabled={
              !authorized ||
              !schemeId ||
              !memberNumber.trim() ||
              memberNumber.trim().length > 50
            }
            onClick={async () => {
              setError("");
              setResult(null);
              setSelected(null);
              setApplied(false);
              try {
                const response = await membershipService.query({
                  schemeId,
                  planName,
                  memberNumber: memberNumber.trim(),
                  patientId,
                  authorized: true,
                });
                if (!alive.current) return;
                setResult(response);
              } catch {
                setError(
                  "Could not check this membership. Confirm the scheme, plan and member number, or continue manually.",
                );
              } finally {
                if (alive.current && patientId)
                  await cache.invalidateQueries({
                    queryKey: ["membership-history", tenant?.id, patientId],
                  });
              }
            }}
          >
            <Search size={16} /> Check membership
          </ActionButton>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {result && (
        <div className="space-y-3 rounded-lg border bg-white p-3">
          <p className="text-sm">{result.message}</p>
          <p className="text-xs text-muted-foreground">
            Checked {new Date(result.checkedAt).toLocaleString()} · Suggestions
            expire after 15 minutes.
          </p>
          {result.dependants.map((d) => (
            <label
              key={d.index}
              className={`flex items-center gap-3 rounded-md border p-3 text-sm ${selected === d.index ? "border-blue bg-blue-tint" : ""}`}
            >
              <input
                type="radio"
                name={`dependant-${result.lookupId}`}
                disabled={!d.canApply}
                checked={selected === d.index}
                onChange={() => choose(d.index)}
              />
              <span>
                <strong>{d.name}</strong> · Dependant{" "}
                {d.dependantCode || "not returned"}
                {d.values.dob ? ` · ${d.values.dob}` : ""}
                {d.membershipStatus ? ` · ${d.membershipStatus}` : ""}
              </span>
            </label>
          ))}
          {row && (
            <>
              {row.values.isMainMember === undefined && (
                <p className="text-xs text-amber-800">
                  The relationship to the main member was not returned. Confirm
                  the main-member selection and relationship in the patient
                  form.
                </p>
              )}
              {["firstName", "lastName", "dob", "gender"].some(
                (key) =>
                  row.values[key as keyof MembershipValues] === undefined,
              ) && (
                <p className="text-xs text-amber-800">
                  Some personal details were not returned. Confirm all required
                  fields in the patient form manually.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Only checked fields will replace values in this form. Address
                and phone may belong to the main member; review them carefully.
                Nothing is saved to the patient record until you save the form.
              </p>
              <div className="max-h-80 space-y-2 overflow-auto">
                {shown
                  .filter((key) => row.values[key] !== undefined)
                  .map((key) => (
                    <label
                      key={key}
                      className="grid grid-cols-[auto_1fr] items-start gap-2 border-b pb-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={fields.includes(key)}
                        onChange={(e) => {
                          selectionVersion.current += 1;
                          setApplied(false);
                          setFields((previous) =>
                            e.target.checked
                              ? [...previous, key]
                              : previous.filter((f) => f !== key),
                          );
                        }}
                      />
                      <span>
                        <span className="block font-medium">{labels[key]}</span>
                        <span className="text-xs text-muted-foreground">
                          Current: {display(current[key])}
                        </span>
                        <span className="block break-words">
                          Suggested: {display(row.values[key])}
                        </span>
                      </span>
                    </label>
                  ))}
              </div>
              <ActionButton
                type="button"
                className="gp-button gp-button-yellow"
                disabled={applied || fields.length === 0}
                onClick={async () => {
                  setError("");
                  const version = selectionVersion.current;
                  const snapshot = latestCurrent.current;
                  try {
                    const reviewed = await membershipService.review(
                      result.lookupId,
                      row.index,
                      fields,
                    );
                    if (!alive.current) return;
                    if (
                      selectionVersion.current !== version ||
                      latestCurrent.current !== snapshot
                    ) {
                      setError(
                        "The form or selection changed. Review the suggestions and apply again.",
                      );
                      return;
                    }
                    onApply(reviewed.values, reviewed.lookupId);
                    setApplied(true);
                    toast.success(
                      "Selected details applied to the form. Review and save the patient.",
                    );
                    if (patientId)
                      await cache.invalidateQueries({
                        queryKey: ["membership-history", tenant?.id, patientId],
                      });
                  } catch {
                    setError(
                      "Could not apply these suggestions. They may have expired; run another membership check.",
                    );
                  }
                }}
              >
                Apply selected details
              </ActionButton>
            </>
          )}
        </div>
      )}
      {patientId && Boolean(history.data?.length) && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">
            Recent membership checks
          </summary>
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            {history.data!.map((item) => (
              <li key={item.id}>
                {new Date(item.checkedAt).toLocaleString()} · {item.schemeName}{" "}
                ·{" "}
                {item.outcome === "match_found"
                  ? "Match found"
                  : item.outcome === "no_match"
                    ? "No match"
                    : item.outcome === "pending"
                      ? "Pending"
                      : "Unable to check"}
                {item.reviewed ? " · Reviewed for form" : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
