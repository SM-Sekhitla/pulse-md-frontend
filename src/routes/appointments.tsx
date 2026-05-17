import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AppointmentForm } from "@/components/appointment-form";

export const Route = createFileRoute("/appointments")({
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const navigate = useNavigate();
  return (
    <AppShell title="Schedule appointment">
      <div className="mx-auto max-w-[720px]">
        <div className="pulse-card p-6">
          <h2 className="text-[16px] font-semibold text-navy">New appointment</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Book a new visit for any patient. Open the{" "}
            <button onClick={() => navigate({ to: "/calendar" })} className="text-blue underline">calendar</button>
            {" "}to see day, week, month, and agenda views.
          </p>
          <div className="mt-6">
            <AppointmentForm
              onCreated={() => navigate({ to: "/calendar" })}
              onCancel={() => navigate({ to: "/calendar" })}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
