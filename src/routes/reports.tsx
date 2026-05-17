import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { BarChart3, TrendingUp, Users, Package, Wrench, Receipt, Activity, UserCog } from "lucide-react";

export const Route = createFileRoute("/reports")({ component: Reports });

const REPORTS = [
  { icon: BarChart3, name: "Appointment summary", desc: "By status, type, GP, and date range." },
  { icon: TrendingUp, name: "Patient growth", desc: "New registrations per month and cohort retention." },
  { icon: Receipt, name: "Revenue report", desc: "Period breakdown by payment type." },
  { icon: Activity, name: "No-show analysis", desc: "Cancellation and no-show rates over time." },
  { icon: Package, name: "Inventory usage", desc: "Most dispensed products and value consumed." },
  { icon: Wrench, name: "Equipment compliance", desc: "Percentage serviced on time." },
  { icon: Users, name: "Medical aid vs private", desc: "Billing ratio by payment type." },
  { icon: UserCog, name: "Staff activity", desc: "Appointments managed per staff member." },
];

function Reports() {
  return (
    <AppShell title="Reports">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(r => (
          <button key={r.name} className="pulse-card p-5 text-left transition-colors hover:bg-blue-tint">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-tint"><r.icon className="h-5 w-5 text-blue" /></div>
            <div className="mt-4 text-[14.5px] font-semibold text-navy">{r.name}</div>
            <div className="mt-1 text-[12.5px] text-muted-foreground">{r.desc}</div>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
