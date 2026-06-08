import { createFileRoute, useNavigate } from "@/lib/router-compat";
import { PulseLogo } from "@/components/brand";
import { currentUser, currentTenant, logout, } from "@/lib/store";
import { useData } from "@/context/AppDataProvider";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/suspended")({ component: Suspended });

function Suspended() {
  const navigate = useNavigate();
  const { platformSetting: settings} = useData();
  const { user } = useAuth();
  
  const tenant = currentTenant();
  const support = settings.platformSettings?.supportEmail;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="px-8 py-8">
        <PulseLogo />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[520px] pulse-card p-10 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE2E2] text-[#991B1B]">
            !
          </div>
          <h1 className="text-[24px] font-semibold text-navy">
            Your account has been suspended
          </h1>
          <p className="mt-3 text-[14px] text-muted-foreground">
            Access to{" "}
            <span className="font-semibold text-navy">
              {tenant?.name || user?.practiceName}
            </span>{" "}
            is currently restricted.
          </p>
          {tenant?.suspensionReason && (
            <div className="mt-4 rounded-md border border-border bg-surface px-4 py-3 text-left text-[12.5px]">
              <div className="font-semibold text-navy mb-1">Reason</div>
              <div className="text-muted-foreground">
                {tenant.suspensionReason}
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
