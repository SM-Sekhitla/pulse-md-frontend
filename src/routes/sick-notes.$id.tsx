import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { differenceInCalendarDays, format } from "date-fns";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DocumentQR } from "@/components/document-qr";
import { currentTenant, store } from "@/lib/store";

export const Route = createFileRoute("/sick-notes/$id")({ component: SickNoteDetail });

function SickNoteDetail() {
  const { id } = useParams({ from: "/sick-notes/$id" });
  const s = store.get();
  const tenant = currentTenant();
  const note = (s.sickNotes ?? []).find((n) => n.id === id);

  if (!note) {
    return (
      <AppShell title="Sick note">
        <div className="pulse-card p-8 text-center text-muted-foreground">
          Sick note not found.
          <div className="mt-4"><Link to="/sick-notes" className="text-blue hover:underline">Back to sick notes</Link></div>
        </div>
      </AppShell>
    );
  }

  const days = differenceInCalendarDays(new Date(note.toDate), new Date(note.fromDate)) + 1;
  const qrPayload = {
    type: "sn",
    id: note.id,
    code: note.securityCode,
    apt: note.appointmentId || null,
    iss: note.issuedAt,
    from: note.fromDate,
    to: note.toDate,
  };

  return (
    <AppShell title="Sick note">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to="/sick-notes" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-navy">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90">
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      <div className="mx-auto max-w-[820px]">
        <div className="rounded-lg border border-border bg-white p-10 shadow-sm print:border-0 print:shadow-none">
          <div className="flex items-start justify-between border-b border-border pb-5">
            <div>
              <div className="text-[20px] font-semibold text-navy">{tenant?.name ?? "PulseMD Practice"}</div>
              <div className="mt-1 text-[12.5px] text-muted-foreground">{tenant?.address}</div>
              <div className="mt-1 text-[12px] font-mono text-muted-foreground">HPCSA: {note.hpcsa}</div>
            </div>
            <div className="text-right">
              <div className="inline-block rounded-md bg-blue-tint px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-blue">Medical certificate</div>
              <div className="mt-2 text-[12px] text-muted-foreground">No. <span className="font-mono">{note.id.slice(-8).toUpperCase()}</span></div>
            </div>
          </div>

          <div className="mt-5 text-[13px] leading-relaxed text-navy">
            <p>This is to certify that <span className="font-semibold">{note.patientName}</span> was examined on{" "}
              <span className="font-semibold">{format(new Date(note.issuedAt), "d MMMM yyyy")}</span> and is medically unfit for work or school
              from <span className="font-semibold">{format(new Date(note.fromDate), "d MMMM yyyy")}</span> to{" "}
              <span className="font-semibold">{format(new Date(note.toDate), "d MMMM yyyy")}</span> ({days} day{days > 1 ? "s" : ""}).
            </p>
            <div className="mt-4 rounded-md border border-border bg-surface px-4 py-3">
              <div><span className="label-caps text-muted-foreground">Reason</span><span className="ml-2 text-navy">{note.reason}</span></div>
              {note.icd10 && <div className="mt-1"><span className="label-caps text-muted-foreground">ICD-10</span><span className="ml-2 font-mono text-navy">{note.icd10}</span></div>}
              {note.recommendation && <div className="mt-1"><span className="label-caps text-muted-foreground">Recommendation</span><span className="ml-2 text-navy">{note.recommendation}</span></div>}
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between border-t border-border pt-6">
            <div>
              <div className="h-12 border-b border-navy"></div>
              <div className="mt-1 text-[13px] font-semibold text-navy">{note.gpName}</div>
              <div className="text-[11.5px] font-mono text-muted-foreground">HPCSA {note.hpcsa}</div>
            </div>
            <div className="text-center">
              <DocumentQR payload={qrPayload} size={120} />
              <div className="mt-1 flex items-center justify-center gap-1 text-[10.5px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-teal" /> Scan to verify
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">ID: {note.id.slice(-8).toUpperCase()}</div>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-[11.5px] text-muted-foreground print:hidden">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-teal" />
          QR contains a hidden 12-character security code (not visible to staff or the patient) linked to {note.appointmentId ? "the booked appointment" : "this note record"}, the issue date and the validity period.
        </div>
      </div>
    </AppShell>
  );
}
