import { createFileRoute, Link, useParams } from "@/lib/router-compat";
import { addDays, format } from "date-fns";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DocumentQR } from "@/components/document-qr";
import { currentTenant, store } from "@/lib/store";

export const Route = createFileRoute("/prescriptions/$id")({
  component: PrescriptionDetail,
});

function PrescriptionDetail() {
  const { id } = useParams({ from: "/prescriptions/$id" });
  const s = store.get();
  const tenant = currentTenant();
  const rx = (s.prescriptions ?? []).find((p) => p.id === id);

  if (!rx) {
    return (
      <AppShell title="Prescription">
        <div className="pulse-card p-8 text-center text-muted-foreground">
          Prescription not found.
          <div className="mt-4">
            <Link to="/prescriptions" className="text-blue hover:underline">
              Back to prescriptions
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const issued = new Date(rx.issuedAt);
  const expires = addDays(issued, rx.validDays);

  const qrPayload = {
    type: "rx",
    id: rx.id,
    code: rx.securityCode,
    apt: rx.appointmentId || null,
    iss: rx.issuedAt,
    exp: expires.toISOString(),
    valid_days: rx.validDays,
  };

  return (
    <AppShell title="Prescription">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          to="/prescriptions"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      <div className="mx-auto max-w-[820px]">
        <div className="rounded-lg border border-border bg-white p-10 shadow-sm print:border-0 print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border pb-5">
            <div>
              <div className="text-[20px] font-semibold text-navy">
                {tenant?.name ?? "PulseMD Practice"}
              </div>
              <div className="mt-1 text-[12.5px] text-muted-foreground">
                {tenant?.address}
              </div>
              <div className="mt-1 text-[12px] font-mono text-muted-foreground">
                HPCSA: {rx.hpcsa}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block rounded-md bg-blue-tint px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-blue">
                Prescription
              </div>
              <div className="mt-2 text-[12px] text-muted-foreground">
                No.{" "}
                <span className="font-mono">
                  {rx.id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Patient & metadata */}
          <div className="mt-5 grid grid-cols-2 gap-6 text-[13px]">
            <div>
              <div className="label-caps text-muted-foreground">Patient</div>
              <div className="mt-0.5 font-semibold text-navy">
                {rx.patientName}
              </div>
            </div>
            <div className="text-right">
              <div className="label-caps text-muted-foreground">Issued</div>
              <div className="mt-0.5 text-navy">
                {format(issued, "d MMMM yyyy")}
              </div>
              <div className="mt-1 label-caps text-muted-foreground">
                Valid until
              </div>
              <div className="text-navy">
                {format(expires, "d MMMM yyyy")} ({rx.validDays} days)
              </div>
            </div>
          </div>

          {(rx.diagnosis || rx.icd10) && (
            <div className="mt-5 rounded-md border border-border bg-surface px-4 py-3 text-[13px]">
              {rx.diagnosis && (
                <div>
                  <span className="label-caps text-muted-foreground">
                    Diagnosis
                  </span>
                  <span className="ml-2 text-navy">{rx.diagnosis}</span>
                </div>
              )}
              {rx.icd10 && (
                <div className="mt-0.5">
                  <span className="label-caps text-muted-foreground">
                    ICD-10
                  </span>
                  <span className="ml-2 font-mono text-navy">{rx.icd10}</span>
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="mt-6">
            <div className="label-caps text-muted-foreground">Rx</div>
            <ol className="mt-2 space-y-3">
              {rx.items.map((it, i) => (
                <li
                  key={i}
                  className="rounded-md border border-border px-4 py-3"
                >
                  <div className="text-[14px] font-semibold text-navy">
                    {i + 1}. {it.drug}
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted-foreground">
                    {[it.dose, it.frequency, it.duration]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {it.notes && (
                    <div className="mt-1 text-[12px] italic text-muted-foreground">
                      {it.notes}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Signature + QR */}
          <div className="mt-8 flex items-end justify-between border-t border-border pt-6">
            <div>
              <div className="h-12 border-b border-navy"></div>
              <div className="mt-1 text-[13px] font-semibold text-navy">
                {rx.gpName}
              </div>
              <div className="text-[11.5px] font-mono text-muted-foreground">
                HPCSA {rx.hpcsa}
              </div>
            </div>
            <div className="text-center">
              <DocumentQR payload={qrPayload} size={120} />
              <div className="mt-1 flex items-center justify-center gap-1 text-[10.5px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-teal" /> Scan to verify
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                ID: {rx.id.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-[11.5px] text-muted-foreground print:hidden">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-teal" />
          QR contains a hidden 12-character security code (not visible to staff
          or the patient) linked to{" "}
          {rx.appointmentId
            ? "the booked appointment"
            : "this prescription record"}
          , the issue date, and expiry. Pharmacies scan it to verify
          authenticity.
        </div>
      </div>
    </AppShell>
  );
}
