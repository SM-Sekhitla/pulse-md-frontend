import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import { Route as Landing } from "./routes/index";
import { Route as Login } from "./routes/login";
import { Route as Register } from "./routes/register";
import { Route as Pending } from "./routes/pending";
import { Route as Rejected } from "./routes/rejected";
import { Route as Suspended } from "./routes/suspended";
import { Route as ChangePassword } from "./routes/change-password";
import { Route as Invite } from "./routes/invite.$token";

import { Route as Dashboard } from "./routes/dashboard";
import { Route as Calendar } from "./routes/calendar";
import { Route as Appointments } from "./routes/appointments";
import { Route as AppointmentNew } from "./routes/appointments.new";

import { Route as PatientsList } from "./routes/patients.index";
import { Route as PatientNew } from "./routes/patients.new";
import { Route as PatientDetail } from "./routes/patients.$id";

import { Route as PrescriptionsList } from "./routes/prescriptions.index";
import { Route as PrescriptionNew } from "./routes/prescriptions.new";
import { Route as PrescriptionDetail } from "./routes/prescriptions.$id";

import { Route as SickNotesList } from "./routes/sick-notes.index";
import { Route as SickNoteNew } from "./routes/sick-notes.new";
import { Route as SickNoteDetail } from "./routes/sick-notes.$id";

import { Route as Billing } from "./routes/billing";
import { Route as Inventory } from "./routes/inventory";
import { Route as Equipment } from "./routes/equipment";
import { Route as Reports } from "./routes/reports";
import { Route as Staff } from "./routes/staff";
import { Route as Settings } from "./routes/settings";

import { Route as AdminIndex } from "./routes/admin.index";
import { Route as AdminPracticesIndex } from "./routes/admin.practices.index";
import { Route as AdminPracticesPending } from "./routes/admin.practices.pending";
import { Route as AdminPracticeDetail } from "./routes/admin.practices.$id";
import { Route as AdminUsers } from "./routes/admin.users";
import { Route as AdminSubscriptions } from "./routes/admin.subscriptions";
import { Route as AdminModules } from "./routes/admin.modules";
import { Route as AdminAudit } from "./routes/admin.audit";
import { Route as AdminOutbox } from "./routes/admin.outbox";
import { Route as AdminSettings } from "./routes/admin.settings";

import VersionBadge from "./components/common/VersionBadge";

import { Link } from "react-router-dom";

const C = (r: { component?: React.ComponentType<any> }) => {
  const Cmp = r.component!;
  return <Cmp />;
};

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster />
      <VersionBadge/>
      <Routes>
        <Route path="/" element={<C {...Landing} />} />
        <Route path="/login" element={<C {...Login} />} />
        <Route path="/register" element={<C {...Register} />} />
        <Route path="/pending" element={<C {...Pending} />} />
        <Route path="/rejected" element={<C {...Rejected} />} />
        <Route path="/suspended" element={<C {...Suspended} />} />
        <Route path="/change-password" element={<C {...ChangePassword} />} />
        <Route path="/invite/:token" element={<C {...Invite} />} />

        <Route path="/dashboard" element={<C {...Dashboard} />} />
        <Route path="/calendar" element={<C {...Calendar} />} />
        <Route path="/appointments" element={<C {...Appointments} />} />
        <Route path="/appointments/new" element={<C {...AppointmentNew} />} />

        <Route path="/patients" element={<C {...PatientsList} />} />
        <Route path="/patients/new" element={<C {...PatientNew} />} />
        <Route path="/patients/:id" element={<C {...PatientDetail} />} />

        <Route path="/prescriptions" element={<C {...PrescriptionsList} />} />
        <Route path="/prescriptions/new" element={<C {...PrescriptionNew} />} />
        <Route path="/prescriptions/:id" element={<C {...PrescriptionDetail} />} />

        <Route path="/sick-notes" element={<C {...SickNotesList} />} />
        <Route path="/sick-notes/new" element={<C {...SickNoteNew} />} />
        <Route path="/sick-notes/:id" element={<C {...SickNoteDetail} />} />

        <Route path="/billing" element={<C {...Billing} />} />
        <Route path="/inventory" element={<C {...Inventory} />} />
        <Route path="/equipment" element={<C {...Equipment} />} />
        <Route path="/reports" element={<C {...Reports} />} />
        <Route path="/staff" element={<C {...Staff} />} />
        <Route path="/settings" element={<C {...Settings} />} />

        <Route path="/admin" element={<C {...AdminIndex} />} />
        <Route path="/admin/practices" element={<C {...AdminPracticesIndex} />} />
        <Route path="/admin/practices/pending" element={<C {...AdminPracticesPending} />} />
        <Route path="/admin/practices/:id" element={<C {...AdminPracticeDetail} />} />
        <Route path="/admin/users" element={<C {...AdminUsers} />} />
        <Route path="/admin/subscriptions" element={<C {...AdminSubscriptions} />} />
        <Route path="/admin/modules" element={<C {...AdminModules} />} />
        <Route path="/admin/audit" element={<C {...AdminAudit} />} />
        <Route path="/admin/outbox" element={<C {...AdminOutbox} />} />
        <Route path="/admin/settings" element={<C {...AdminSettings} />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
