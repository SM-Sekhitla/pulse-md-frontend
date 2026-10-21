import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import API from "@/utils/api";
import { invoiceSchema } from "@/schema/invoice";
import type { Invoice } from "@/types/invoice";
import { ActionForm, ActionButton } from "@/components/action-feedback";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatZAR } from "@/lib/pricing";

type Entry = {
  id: string;
  amountCents: number;
  payer: string;
  kind: string;
  method: string;
  receivedDate: string;
  reference: string;
  reason: string;
  recordedBy: string;
  recordedAt: string;
};
export function InvoicePayments({
  invoice,
  onSaved,
}: {
  invoice: Invoice;
  onSaved: (i: Invoice) => void;
}) {
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [receipt, setReceipt] = useState<Entry | null>(null);
  const [requestId, setRequestId] = useState(crypto.randomUUID());
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState("payment");
  const [payer, setPayer] = useState("patient");
  const [method, setMethod] = useState("eft");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const paid = invoice.totalPaidAmount ?? invoice.schemePaidAmount ?? 0;
  const balance = invoice.balanceAmount ?? Math.max(0, invoice.amount - paid);
  const entries = (invoice.payments || []) as Entry[];
  return (
    <section className="rounded-lg border border-border p-4">
      <h3 className="font-semibold">Payments & receipts</h3>
      <p className="my-2 text-sm">
        Received: {formatZAR(paid)} · Outstanding: {formatZAR(balance)}
      </p>
      {invoice.schemePaidAmount > 0 && !entries.length && (
        <p className="mb-2 text-xs text-muted-foreground">
          Includes a scheme payment total recorded before the payment ledger.
          Verify opening balances during reconciliation.
        </p>
      )}
      {invoice.status !== "Void" && (
        <ActionButton
          className="gp-button gp-button-yellow"
          onClick={() => {
            setRequestId(crypto.randomUUID());
            setAmount("");
            setReference("");
            setReason("");
            setOpen(true);
          }}
        >
          Record payment / refund
        </ActionButton>
      )}
      {invoice.status !== "Void" && paid === 0 && (
        <ActionButton
          className="gp-button border ml-2"
          onClick={() => setVoidOpen(true)}
        >
          Void invoice
        </ActionButton>
      )}
      {invoice.status === "Void" && (
        <p className="text-sm">
          Voided:{" "}
          {invoice.voidReason || "Reason not recorded on this legacy invoice"}
        </p>
      )}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent>
          <DialogTitle>Void invoice</DialogTitle>
          <DialogDescription>
            The invoice and all receipts remain in history. Refund received
            payments first.
          </DialogDescription>
          <ActionForm
            onSubmit={async (e) => {
              e.preventDefault();
              const response = await API.post(`/invoices/${invoice.id}/void`, {
                reason: voidReason,
              });
              onSaved(invoiceSchema.parse(response.data));
              await cache.invalidateQueries({ queryKey: ["invoices"] });
              setVoidOpen(false);
              toast.success("Invoice voided.");
            }}
          >
            <label className="block text-sm">
              Cancellation reason
              <textarea
                required
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="my-2 block w-full rounded border p-2"
              />
            </label>
            <ActionButton type="submit" className="gp-button gp-button-yellow">
              Confirm cancellation
            </ActionButton>
          </ActionForm>
        </DialogContent>
      </Dialog>
      <div className="mt-3 space-y-2">
        {entries.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap justify-between gap-2 border-t border-border pt-2 text-sm"
          >
            <span>
              {p.receivedDate} · {p.kind} · {p.payer} ·{" "}
              {formatZAR(p.amountCents / 100)} · {p.reference}
            </span>
            <ActionButton
              className="text-blue underline"
              onClick={() => setReceipt(p)}
            >
              Receipt
            </ActionButton>
          </div>
        ))}
      </div>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!saving) setOpen(v);
        }}
      >
        <DialogContent>
          <DialogTitle>Record payment or refund</DialogTitle>
          <DialogDescription>
            Each transaction is retained. Correct a receipt by recording a
            refund with a reason.
          </DialogDescription>
          <ActionForm
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                const res = await API.post(`/invoices/${invoice.id}/payments`, {
                  requestId,
                  amount: Number(amount),
                  payer,
                  kind,
                  method,
                  receivedDate: date,
                  reference,
                  reason,
                });
                const saved = invoiceSchema.parse(res.data);
                onSaved(saved);
                await cache.invalidateQueries({ queryKey: ["invoices"] });
                toast.success(
                  kind === "refund" ? "Refund recorded." : "Payment recorded.",
                );
                setOpen(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            <label className="block text-sm">
              Transaction
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="ml-2 rounded border p-2"
              >
                <option value="payment">Payment received</option>
                <option value="refund">Refund / correction</option>
              </select>
            </label>
            <label className="block text-sm">
              Payer
              <select
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                className="ml-2 rounded border p-2"
              >
                <option value="patient">Patient</option>
                {invoice.billingType === "medical_aid" && (
                  <option value="scheme">Medical aid</option>
                )}
              </select>
            </label>
            <label className="block text-sm">
              Amount (R)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded border p-2"
              />
            </label>
            <label className="block text-sm">
              Date received
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded border p-2"
              />
            </label>
            <label className="block text-sm">
              Method
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="ml-2 rounded border p-2"
              >
                <option value="eft">EFT</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="medical_aid">Medical aid</option>
              </select>
            </label>
            <label className="block text-sm">
              Reference
              <input
                required
                maxLength={150}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1 block w-full rounded border p-2"
              />
            </label>
            {kind === "refund" && (
              <label className="block text-sm">
                Refund reason
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 block w-full rounded border p-2"
                />
              </label>
            )}
            <ActionButton
              type="submit"
              disabled={saving}
              className="gp-button gp-button-yellow"
            >
              Save transaction
            </ActionButton>
          </ActionForm>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!receipt}
        onOpenChange={(v) => {
          if (!v) setReceipt(null);
        }}
      >
        <DialogContent className="payment-receipt">
          <DialogTitle>
            {receipt?.kind === "refund" ? "Refund receipt" : "Payment receipt"}
          </DialogTitle>
          {receipt && (
            <>
              <p>Patient: {invoice.patientName}</p>
              <p>Invoice: {invoice.number}</p>
              <p>Receipt: {receipt.id}</p>
              <p>Date: {receipt.receivedDate}</p>
              <p>
                Amount: {formatZAR(receipt.amountCents / 100)} · {receipt.payer}{" "}
                · {receipt.method}
              </p>
              <p>Reference: {receipt.reference}</p>
              {receipt.reason && <p>Reason: {receipt.reason}</p>}
              <p className="text-xs">Recorded by {receipt.recordedBy}</p>
              <ActionButton
                className="gp-button print:hidden"
                onClick={() => window.print()}
              >
                Print receipt / save PDF
              </ActionButton>
              <style>{`@media print {body:has(.payment-receipt) *{visibility:hidden!important}.payment-receipt,.payment-receipt *{visibility:visible!important}.payment-receipt{position:fixed!important;left:0!important;top:0!important;transform:none!important;width:100%!important;border:0!important;box-shadow:none!important}.payment-receipt button{display:none!important}}`}</style>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
