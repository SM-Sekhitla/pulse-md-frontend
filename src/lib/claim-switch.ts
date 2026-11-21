import type { Claim, SwitchStatus } from "@/services/claims";

export const switchLabels: Record<SwitchStatus, string> = {
  not_sent: "Not sent",
  queued: "Queued",
  sending: "Sending",
  unknown_outcome: "Unconfirmed",
  accepted: "Accepted",
  partially_accepted: "Partly accepted",
  rejected: "Rejected",
  reversal_pending: "Reversal pending",
  reversed: "Reversed",
  failed_to_send: "Not sent, try again",
};

export const switchStateOf = (claim: Pick<Claim, "switchStatus">): SwitchStatus =>
  claim.switchStatus || "not_sent";

/** Claims past these states can be sent; anything else is locked or in flight. */
export const canSubmit = (claim: Claim) =>
  claim.status === "prepared" &&
  ["not_sent", "failed_to_send"].includes(switchStateOf(claim));

export type SubmitIssue = { code: string; message: string };

/** Pulls the per item list the server returns when a claim cannot be sent yet. */
export const submitIssues = (error: any): SubmitIssue[] => {
  const issues = error?.response?.data?.detail?.issues;
  return Array.isArray(issues)
    ? issues.filter((i) => i && typeof i.message === "string")
    : [];
};
