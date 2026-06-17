import { createFileRoute, Link } from "@/lib/router-compat";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import { currentTenant, publicBookingsForTenant, setAppointmentStatus, store, type AppointmentStatus } from "@/lib/store";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Globe, CheckCircle2, XCircle, Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/booking/inbox")({ component: BookingInbox });

const STATUS_VARIANT = (s: AppointmentStatus) =>
  s === "Confirmed" ? "success" : s === "Cancelled" || s === "No-show" ? "danger" : s === "Completed" ? "neutral" : "blue";

function BookingInbox() {
  const [, refresh] = useState(0);
  const reload = () => refresh((x) => x + 1);
  const tenant = currentTenant();
  if (!tenant) return null;
  const bookings = publicBookingsForTenant(tenant.id);
  const s = store.get();

  const upcoming = bookings.filter((b) => new Date(b.start) >= new Date(new Date().setHours(0, 0, 0, 0)));
  const past = bookings.filter((b) => new Date(b.start) < new Date(new Date().setHours(0, 0, 0, 0)));

  const onConfirm = (id: string) => { setAppointmentStatus(id, "Confirmed"); toast.success("Booking confirmed"); reload(); };
  const onCancel = (id: string) => { if (window.confirm("Cancel this booking? The patient should be notified separately.")) { setAppointmentStatus(id, "Cancelled"); toast.success("Booking cancelled"); reload(); } };

  return (
    <AppShell title="Public bookings inbox">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue" />
            <h2 className="text-[15px] font-semibold text-navy">Incoming bookings from patients</h2>
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Patients who booked through your public profile at <span className="font-mono">/book/{tenant.bookingSlug || tenant.slug}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/booking/availability" className="rounded-md border border-border bg-white px-3 py-2 text-[12.5px] font-medium text-navy hover:bg-surface">Edit availability</Link>
        </div>
      </div>

      <Section title="Upcoming" count={upcoming.length}>
        {upcoming.length === 0 ? (
          <Empty />
        ) : (
          <div className="divide-y divide-border">
            {upcoming.map((b) => {
              const p = s.patients.find((x) => x.id === b.patientId);
              return (
                <Row key={b.id} appt={b} patient={p} onConfirm={() => onConfirm(b.id)} onCancel={() => onCancel(b.id)} />
              );
            })}
          </div>
        )}
      </Section>

      {past.length > 0 && (
        <div className="mt-6">
          <Section title="Past" count={past.length}>
            <div className="divide-y divide-border">
              {past.slice(0, 20).map((b) => {
                const p = s.patients.find((x) => x.id === b.patientId);
                return <Row key={b.id} appt={b} patient={p} readOnly />;
              })}
            </div>
          </Section>
        </div>
      )}
    </AppShell>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="pulse-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="text-[13px] font-semibold text-navy">{title}</div>
        <Badge variant="neutral">{count}</Badge>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">No bookings yet. Share your public link with patients.</div>;
}

function Row({ appt, patient, onConfirm, onCancel, readOnly }: any) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-[13.5px] font-semibold text-navy truncate">{appt.patientName}</div>
          <Badge variant={STATUS_VARIANT(appt.status)}>{appt.status}</Badge>
          <Badge variant="blue">{appt.type}</Badge>
        </div>
        <div className="mt-0.5 text-[12px] text-muted-foreground truncate">{appt.reason}</div>
        {patient && (
          <div className="mt-1 flex items-center gap-4 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {patient.phone}</span>
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {patient.email}</span>
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="text-[12.5px] font-medium text-navy">{format(parseISO(appt.start), "EEE d MMM")}</div>
        <div className="text-[11.5px] text-muted-foreground">{format(parseISO(appt.start), "HH:mm")}</div>
      </div>
      {!readOnly && appt.status !== "Cancelled" && appt.status !== "Completed" && (
        <div className="flex gap-1.5">
          {appt.status !== "Confirmed" && (
            <button onClick={onConfirm} className="inline-flex items-center gap-1 rounded-md bg-success px-2.5 py-1.5 text-[11.5px] font-medium text-white hover:opacity-90">
              <CheckCircle2 className="h-3 w-3" /> Confirm
            </button>
          )}
          <button onClick={onCancel} className="inline-flex items-center gap-1 rounded-md border border-[#FCA5A5] bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-[#991B1B] hover:bg-[#FEF2F2]">
            <XCircle className="h-3 w-3" /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}
