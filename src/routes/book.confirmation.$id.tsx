import { createFileRoute, Link, useParams } from "@/lib/router-compat";
import { Check, CalendarDays, MapPin, User as UserIcon, Building2, ArrowRight, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { getPublicAppointment } from "@/lib/public-booking-api";
import { PulseLogoOnDark } from "@/components/brand";

export const Route = createFileRoute("/book/confirmation/$id")({ component: Confirmation });

function Confirmation() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["public-booking", "confirmation", id],
    queryFn: () => getPublicAppointment(id),
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="rounded-xl border border-border bg-white p-10 text-center">
          <div className="text-[15px] font-semibold text-navy">Loading booking...</div>
        </div>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <div className="rounded-xl border border-border bg-white p-10 text-center">
          <div className="text-[15px] font-semibold text-navy">Booking not found</div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">This booking reference is invalid or has expired.</p>
          <Link to="/book" className="mt-4 inline-flex rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white">Find a GP</Link>
        </div>
      </Shell>
    );
  }

  const { appointment, patient, tenant, gp, reference } = data;
  const start = parseISO(appointment.start);

  return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-[22px] font-semibold text-navy">Your booking is confirmed</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            The booking is reserved for <span className="font-medium text-navy">{patient.email}</span>. The practice can contact you on <span className="font-medium text-navy">{patient.phone}</span>.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-[12px] font-mono text-navy">
            Reference: <span className="font-semibold">{reference}</span>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-white p-6">
          <Row icon={<CalendarDays className="h-4 w-4" />} label="When">
            <div className="font-medium text-navy">{format(start, "EEEE d MMMM yyyy")}</div>
            <div className="text-muted-foreground">at {format(start, "HH:mm")} · {appointment.type}</div>
          </Row>
          <Row icon={<UserIcon className="h-4 w-4" />} label="GP">
            <div className="font-medium text-navy">{gp ? `${gp.title} ${gp.firstName} ${gp.lastName}` : appointment.gp}</div>
          </Row>
          <Row icon={<Building2 className="h-4 w-4" />} label="Practice">
            <div className="font-medium text-navy">{tenant.name}</div>
          </Row>
          {tenant.address && (
            <Row icon={<MapPin className="h-4 w-4" />} label="Address">
              <div className="text-navy">{tenant.address}</div>
            </Row>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-border bg-white p-6">
          <h3 className="text-[14px] font-semibold text-navy">What happens next</h3>
          <ul className="mt-3 space-y-2 text-[13px] text-navy/80">
            <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" /> Please arrive 10 minutes early with your ID and medical aid card (if applicable).</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" /> The practice may contact you if any booking details need to be confirmed.</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" /> To cancel or reschedule, reply to the confirmation email with your reference.</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-navy hover:bg-surface">
            <Printer className="h-3.5 w-3.5" /> Print confirmation
          </button>
          <Link to="/book" className="inline-flex items-center gap-1.5 rounded-md bg-blue px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue/90">
            Find another GP <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-border py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-[13px]">{children}</div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[url('/images/booking-hero.jpg')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-navy/95 to-blue/75" />

        <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <PulseLogoOnDark size={38} />
            </Link>

            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[12.5px] font-medium text-white/90 backdrop-blur">
              Booking confirmed
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-10 pt-10">
          <div className="max-w-3xl">

            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Your booking is confirmed.
            </h1>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/70">
              Your appointment has been reserved. Please keep your booking reference for
              check-in, rescheduling, or cancellation.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
