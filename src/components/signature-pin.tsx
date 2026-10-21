import { documentValidationMessage } from "@/lib/document-validation";
import { isAxiosError } from "axios";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ActionButton } from "@/components/action-feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import API, { getApiErrorMessage } from "@/utils/api";

// Keep the PIN only in this short-lived dialog; never persist it or cache it.
export function useSignaturePin(onFormError?: (message: string) => void) {
  const { user } = useAuth();
  const [action, setAction] = useState<((pin: string) => Promise<void>) | null>(
    null,
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function authorize(next: (pin?: string) => Promise<void>) {
    if (user?.role !== "owner") {
      await next();
      return;
    }
    const { data } = await API.get<{
      hasTemplate: boolean;
      pinConfigured: boolean;
    }>("/signature-template/status");
    if (!data.hasTemplate) {
      await next();
      return;
    }
    if (!data.pinConfigured)
      throw new Error(
        "Add a signature PIN in Settings → Signature before signing documents.",
      );
    setPin("");
    setError("");
    setAction(() => next);
  }
  const dialog = (
    <Dialog
      open={!!action}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setAction(null);
          setPin("");
          setError("");
        }
      }}
    >
      <DialogContent
        className="sm:max-w-sm"
        onInteractOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogTitle>Authorise your signature</DialogTitle>
        <DialogDescription>
          Enter your six-digit signature PIN to continue. Your PIN is required
          each time your signature is used.
        </DialogDescription>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || !action) return;
            if (!/^\d{6}$/.test(pin)) {
              setError("Enter your six-digit signature PIN.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              await action(pin);
              setAction(null);
            } catch (e) {
              const detail = isAxiosError(e)
                ? e.response?.data?.detail
                : undefined;
              const pinError =
                Array.isArray(detail) &&
                detail.some(
                  (issue) =>
                    Array.isArray(issue?.loc) &&
                    issue.loc.includes("signaturePin"),
                );
              if (
                isAxiosError(e) &&
                e.response?.status === 422 &&
                !pinError &&
                onFormError
              ) {
                setAction(null);
                onFormError(documentValidationMessage(detail));
              } else {
                setError(getApiErrorMessage(e));
              }
            } finally {
              setPin("");
              setBusy(false);
            }
          }}
          className="space-y-4"
        >
          <label className="block text-sm">
            Signature PIN
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="mt-2 block w-full rounded-md border border-border p-3"
              disabled={busy}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <ActionButton
              type="button"
              disabled={busy}
              onClick={() => {
                setAction(null);
                setPin("");
              }}
              className="rounded-md border px-4 py-2"
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              disabled={busy}
              className="gp-button gp-button-yellow"
            >
              {busy && (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
              {busy ? "Authorising…" : "Confirm PIN"}
            </ActionButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
  return { authorize, dialog };
}
