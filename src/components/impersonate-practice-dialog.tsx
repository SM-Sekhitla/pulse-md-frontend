import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { ActionButton, ActionForm } from "@/components/action-feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/utils/api";

type PracticeLike = {
  id: string;
  name: string;
  status: string;
  owner?: {
    title?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
};

// Button plus confirmation dialog. Only super admins see it.
export function ImpersonatePracticeButton({
  practice,
  landing = "/dashboard",
  label = "View as practice owner",
  className = "gp-button border inline-flex items-center justify-center gap-2",
}: {
  practice: PracticeLike;
  landing?: string;
  label?: string;
  className?: string;
}) {
  const { user, startImpersonation } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (user?.role !== "super-admin") return null;

  const active = practice.status === "active";
  const owner = practice.owner;
  const ownerName = [owner?.title, owner?.firstName, owner?.lastName]
    .filter(Boolean)
    .join(" ");
  const valid = reason.trim().length >= 10;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        disabled={!active}
        title={active ? undefined : "Only active practices can be opened"}
      >
        <ShieldAlert size={15} aria-hidden="true" />
        {label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open {practice.name} as its owner</DialogTitle>
            <DialogDescription>
              You will see this practice exactly as{" "}
              {ownerName || "its owner"}
              {owner?.email ? ` (${owner.email})` : ""} does, including patient
              records. Everything you do is logged under your own name, the
              session lasts 15 minutes, and some actions (passwords, team
              changes, signing documents) stay blocked.
            </DialogDescription>
          </DialogHeader>
          <ActionForm
            onSubmit={async () => {
              try {
                await startImpersonation(practice.id, reason.trim(), landing);
              } catch (error) {
                toast.error(getApiErrorMessage(error));
              }
            }}
            className="space-y-4"
          >
            <label className="block text-sm">
              Reason for this support session
              <textarea
                required
                minLength={10}
                maxLength={500}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="For example: investigating why claim PMD-CLM-00012 will not validate"
                className="mt-1 block w-full rounded-md border border-border bg-white p-2 text-sm"
              />
              <span className="mt-1 block text-[11.5px] text-muted-foreground">
                Recorded in the audit log. At least 10 characters.
              </span>
            </label>
            <DialogFooter>
              <button
                type="button"
                className="gp-button border"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <ActionButton
                type="submit"
                disabled={!valid}
                className="gp-button gp-button-yellow"
              >
                Start support session
              </ActionButton>
            </DialogFooter>
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
