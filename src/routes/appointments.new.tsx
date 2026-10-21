import { createFileRoute, useNavigate } from "@/lib/router-compat";
import { AppShell } from "@/components/app-shell";
import { AppointmentForm } from "@/components/appointment-form";

export const Route = createFileRoute("/appointments/new")({
  component: NewAppointment,
});

function NewAppointment() {
  const navigate = useNavigate();
  const patientId =
    new URLSearchParams(window.location.search).get("patientId") || undefined;
  const returnTo = patientId
    ? `/patients/${encodeURIComponent(patientId)}`
    : "/calendar";
  return (
    <AppShell title="Schedule appointment">
      <div className="mx-auto max-w-[720px]">
        <div className="pulse-card p-6">
          <h2 className="text-[16px] font-semibold text-navy">
            New appointment
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Book a new visit for any patient on the practice schedule.
          </p>
          <div className="mt-6">
            <AppointmentForm
              defaultPatientId={patientId}
              onCreated={() => navigate({ to: returnTo })}
              onCancel={() => navigate({ to: returnTo })}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
