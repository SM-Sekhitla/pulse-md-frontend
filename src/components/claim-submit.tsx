import { useState } from "react";
import { toast } from "sonner";
import { ActionButton } from "@/components/action-feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { claimsService, type Claim, type SwitchInfo } from "@/services/claims";
import {
  canSubmit,
  submitIssues,
  switchLabels,
  switchStateOf,
  type SubmitIssue,
} from "@/lib/claim-switch";
import { formatZAR } from "@/lib/pricing";
import { getApiErrorMessage } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

const notes: Partial<Record<string, string>> = {
  unknown_outcome:
    "We could not confirm what Medilink did with this claim. Do not send it again, it may already have been received. Contact support to check its status.",
  failed_to_send:
    "Medilink did not receive this claim. You can try sending it again.",
  accepted:
    "Medilink accepted the claim. This is not a payment. Record payment when the scheme pays.",
  partially_accepted:
    "Medilink accepted part of the claim. This is not a payment. Review the messages below.",
  reversal_pending:
    "A reversal was requested but Medilink has not confirmed it yet. Do not request it again; its status is being checked.",
  reversed:
    "Medilink reversed this claim. The invoice is free to be claimed again.",
  rejected:
    "Medilink rejected the claim. Review the messages below. Rejected claims cannot be resent from here yet.",
};

type Props = {
  claim: Claim;
  info?: SwitchInfo;
  canSend: boolean;
  onChanged: (saved: Claim) => Promise<void> | void;
};

export function ClaimSubmitPanel({ claim, info, canSend, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("");
  const [issues, setIssues] = useState<SubmitIssue[]>([]);
  const [error, setError] = useState("");
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reverseError, setReverseError] = useState("");
  const state = switchStateOf(claim);
  const sandbox = info?.environment !== "live";
  const needsDoctor = (info?.providers.length || 0) > 1;
  const attempts = useQuery({
    queryKey: ["claim-attempts", claim.id, claim.revision],
    queryFn: () => claimsService.attempts(claim.id),
    enabled: state !== "not_sent",
  });
  const assessment = claim.lastAssessment;
  const checkable =
    canSend && [
      "unknown_outcome",
      "accepted",
      "partially_accepted",
      "reversal_pending",
    ].includes(state);
  const canReverse =
    canSend && ["accepted", "partially_accepted"].includes(state);
  const reverse = async () => {
    setReverseError("");
    try {
      const saved = await claimsService.reverse(claim, reason.trim());
      await onChanged(saved);
      setReverseOpen(false);
      setReason("");
      const next = switchStateOf(saved);
      if (next === "reversed") toast.success("Medilink reversed the claim");
      else if (next === "reversal_pending")
        toast.warning("Medilink did not confirm the reversal yet. Do not request it again.");
      else toast.error("The reversal did not go through. The claim is unchanged.");
    } catch (e: any) {
      setReverseError(getApiErrorMessage(e));
    }
  };
  const check = async () => {
    try {
      const saved = await claimsService.checkStatus(claim);
      await onChanged(saved);
      const next = switchStateOf(saved);
      toast.success(
        next === state
          ? "Checked with Medilink. No change."
          : `Medilink now shows this claim as ${switchLabels[next].toLowerCase()}`,
      );
    } catch (e: any) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const send = async () => {
    setIssues([]);
    setError("");
    try {
      const saved = await claimsService.submit(claim, provider || undefined);
      await onChanged(saved);
      setOpen(false);
      const next = switchStateOf(saved);
      if (next === "unknown_outcome") toast.warning("Medilink did not confirm this claim. Do not send it again.");
      else if (next === "failed_to_send") toast.error("Medilink did not receive the claim. Nothing was sent.");
      else if (next === "rejected") toast.error("Medilink rejected the claim");
      else toast.success(`Medilink ${switchLabels[next].toLowerCase()} the claim`);
    } catch (e: any) {
      if (e?.response?.status === 409) {
        // The claim may have changed under us; show the reason and keep the dialog open.
        setIssues(submitIssues(e));
      }
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <section className="claims-switch" aria-label="Electronic submission">
      <div className="claims-switch-head">
        <h3>Medilink submission</h3>
        <span className={`claims-delivery ${state}`}>{switchLabels[state]}</span>
        {info && (
          <span className={`claims-env ${info.environment}`}>
            {info.environment === "live" ? "LIVE" : "SANDBOX"}
          </span>
        )}
      </div>
      {notes[state] && <p className="claims-switch-note">{notes[state]}</p>}
      {assessment?.dueByScheme && (
        <p className="claims-switch-note">
          Scheme assessment: {formatZAR(Number(assessment.dueByScheme))} due by
          scheme. Not a payment.
        </p>
      )}
      {assessment?.messages?.length ? (
        <ul className="claims-switch-messages">
          {assessment.messages.map((m, i) => (
            <li key={i}>
              <strong>{m.type}:</strong> {m.message}
            </li>
          ))}
        </ul>
      ) : null}
      {claim.needsHuman && (
        <p className="claims-switch-error" role="alert">
          This claim needs support to resolve with Medilink. Please contact
          platform support and do not send it again.
        </p>
      )}
      {checkable && !claim.needsHuman && (
        <ActionButton className="gp-button" onClick={check}>
          Check status with Medilink
        </ActionButton>
      )}
      {canReverse && (
        <ActionButton className="gp-button" onClick={() => setReverseOpen(true)}>
          Reverse claim
        </ActionButton>
      )}
      {assessment?.checkedAt && (
        <p className="claims-switch-note">
          Last checked {new Date(assessment.checkedAt).toLocaleString("en-ZA")}.
        </p>
      )}
      {canSubmit(claim) && canSend && (
        <ActionButton
          className="gp-button gp-button-yellow"
          disabled={!info?.available}
          onClick={() => setOpen(true)}
        >
          Send to Medilink
        </ActionButton>
      )}
      {canSubmit(claim) && canSend && info && !info.available && (
        <p className="claims-switch-note">
          Electronic submission is not available for this practice yet. Contact
          platform support.
        </p>
      )}
      {canSubmit(claim) && !canSend && (
        <p className="claims-switch-note">
          Only the practice owner or manager can send claims.
        </p>
      )}
      {claim.status !== "prepared" && state === "not_sent" && (
        <p className="claims-switch-note">
          Validate the draft and clear any issues to enable sending.
        </p>
      )}
      {attempts.data?.length ? (
        <details className="claims-switch-history">
          <summary>Submission history ({attempts.data.length})</summary>
          <ul>
            {attempts.data.map((a) => (
              <li key={a.id}>
                {new Date(a.createdAt).toLocaleString("en-ZA")} · {a.operation}{" "}
                · {a.state}
                {a.httpStatus ? ` · HTTP ${a.httpStatus}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <Dialog
        open={reverseOpen}
        onOpenChange={(o) => !o && setReverseOpen(false)}
      >
        <DialogContent>
          <DialogTitle>Reverse this claim?</DialogTitle>
          <DialogDescription>
            {sandbox
              ? "This is the Medilink test environment. "
              : "This asks the medical aid switch to reverse a real claim. "}
            The reversal is requested once. If Medilink does not confirm it,
            it is checked later and never sent twice. The invoice is freed only
            after Medilink confirms.
          </DialogDescription>
          <label className="block text-sm">
            Reason (kept for the record, not sent to Medilink)
            <textarea
              className="mt-1 w-full rounded-md border p-2"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          {reverseError && (
            <div role="alert" className="claims-switch-error">
              <p>{reverseError}</p>
            </div>
          )}
          <div className="flex gap-3">
            <ActionButton className="gp-button" onClick={() => setReverseOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton
              className="gp-button gp-button-yellow"
              disabled={reason.trim().length < 5}
              onClick={reverse}
            >
              Reverse claim
            </ActionButton>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogTitle>Send claim to Medilink?</DialogTitle>
          <DialogDescription>
            {sandbox
              ? "This is the Medilink test environment. No real claim is created."
              : "This sends a real claim to the medical aid switch."}{" "}
            Amount {formatZAR(claim.billedCents / 100)}. Once sent, the claim
            and its invoice are locked and cannot be sent a second time.
          </DialogDescription>
          {needsDoctor && (
            <label className="block text-sm">
              Treating doctor
              <select
                className="mt-1 w-full rounded-md border p-2"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="">Choose a doctor</option>
                {info!.providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {error && (
            <div role="alert" className="claims-switch-error">
              <p>{error}</p>
              {issues.length > 0 && (
                <ul>
                  {issues.map((i) => (
                    <li key={i.code}>{i.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <ActionButton className="gp-button" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton
              className="gp-button gp-button-yellow"
              disabled={needsDoctor && !provider}
              onClick={send}
            >
              Send claim
            </ActionButton>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
