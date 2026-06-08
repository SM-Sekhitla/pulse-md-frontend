import { createFileRoute, useNavigate } from "@/lib/router-compat";
import { useEffect } from "react";
import { PulseLogo } from "@/components/brand";
import { currentUser, currentTenant, logout, store } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/pending")({ component: Pending });

function Pending() {
  const navigate = useNavigate();
  const { user } = useAuth()
  const tenant = currentTenant();

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (user?.role === "super-admin") {
      navigate({ to: "/admin" });
      return;
    }
    if (tenant && tenant.status === "active") navigate({ to: "/dashboard" });
    if (tenant && tenant.status === "suspended") navigate({ to: "/suspended" });
    if (tenant && tenant.status === "rejected") navigate({ to: "/rejected" });
  }, [user, tenant, navigate]);

  if (!user) return null;
  const support = store.get().settings.supportEmail;

  return (
    <Holding>
      <h1 className="text-[26px] font-semibold text-navy">
        Your application is under review
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        Thanks for registering{" "}
        <span className="font-semibold text-navy">
          {tenant?.name || user.practiceName}
        </span>
        . We typically review new practices within{" "}
        <strong>1 business day</strong>. You will receive an email at{" "}
        <span className="font-mono text-navy">{user.email}</span> once your
        account has been approved.
      </p>
      <div className="mt-6 rounded-md border border-border bg-surface px-4 py-3 text-left text-[12.5px]">
        <div className="font-semibold text-navy mb-1">Application summary</div>
        <Row label="Practice" value={tenant?.name} />
        <Row
          label="GP"
          value={`${user.title} ${user.firstName} ${user.lastName}`}
        />
        <Row label="HPCSA" value={user.hpcsa} />
        <Row label="Plan" value={tenant?.plan} />
      </div>
      <p className="mt-6 text-[12.5px] text-muted-foreground">
        Need help? Contact{" "}
        <a className="text-blue hover:underline" href={`mailto:${support}`}>
          {support}
        </a>
        .
      </p>
      <button
        onClick={() => {
          logout();
          navigate({ to: "/login" });
        }}
        className="mt-6 text-[13px] text-muted-foreground hover:text-navy underline"
      >
        Log out
      </button>
    </Holding>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-navy">{value || "—"}</span>
    </div>
  );
}

function Holding({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="px-8 py-8">
        <PulseLogo />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[520px] pulse-card p-10 text-center">
          {children}
        </div>
      </div>
    </div>
  );
}
