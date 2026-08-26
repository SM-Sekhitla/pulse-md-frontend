import { createFileRoute, useNavigate } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { PulseLogo } from "@/components/brand";
import { useAuth } from "@/context/AuthContext";
import API from "@/utils/api";
import { tenantOutSchema } from "@/schema/tenant";
import type { TenantOut } from "@/types/tenant";

export const Route = createFileRoute("/rejected")({ component: Rejected });

function Rejected() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tenant, setTenant] = useState<TenantOut | null>(null);
  const support = "support@pulsemd.co.za";

  useEffect(() => {
    const loadTenant = async () => {
      if (!user?.tenantId) return;
      const res = await API.get("/tenants");
      const result = tenantOutSchema.array().safeParse(res.data);
      if (!result.success) return;
      setTenant(result.data.find((item) => item.id === user.tenantId) ?? null);
    };

    loadTenant().catch(() => setTenant(null));
  }, [user?.tenantId]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="px-8 py-8">
        <PulseLogo />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[520px] pulse-card p-10 text-center">
          <h1 className="text-[24px] font-semibold text-navy">
            Your application was not approved
          </h1>
          <p className="mt-3 text-[14px] text-muted-foreground">
            We're unable to activate{" "}
            <span className="font-semibold text-navy">
              {tenant?.name || user?.practiceName}
            </span>{" "}
            at this time.
          </p>
          {tenant?.rejectionReason && (
            <div className="mt-4 rounded-md border border-border bg-surface px-4 py-3 text-left text-[12.5px]">
              <div className="font-semibold text-navy mb-1">
                Reason provided
              </div>
              <div className="text-muted-foreground">
                {tenant.rejectionReason}
              </div>
            </div>
          )}
          <p className="mt-6 text-[13px] text-muted-foreground">
            Contact{" "}
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
        </div>
      </div>
    </div>
  );
}
