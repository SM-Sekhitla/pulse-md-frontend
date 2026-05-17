import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { PulseLogo } from "@/components/brand";
import { acceptInvite, store } from "@/lib/store";

export const Route = createFileRoute("/invite/$token")({ component: Invite });

function Invite() {
  const { token } = useParams({ from: "/invite/$token" });
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);

  const s = store.get();
  const inv = s.users.find(u => u.inviteToken === token && u.status === "invited");
  const tenant = inv?.tenantId ? s.tenants.find(t => t.id === inv.tenantId) : null;
  const inviter = inv?.invitedBy ? s.users.find(u => u.id === inv.invitedBy) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 8 || !/\d/.test(pw) || !/[A-Z]/.test(pw)) {
      setError("Password must be at least 8 characters with 1 number and 1 uppercase letter.");
      return;
    }
    if (pw !== pw2) { setError("Passwords don't match."); return; }
    const r = acceptInvite(token, pw);
    if (!r.ok) { setError(r.error || "Invalid token"); return; }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="px-8 py-8"><PulseLogo /></div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[460px] pulse-card p-8">
          {!inv ? (
            <>
              <h1 className="text-[20px] font-semibold text-navy">Invite invalid</h1>
              <p className="mt-3 text-[13.5px] text-muted-foreground">
                This invite link has expired or is invalid. Ask your practice manager to resend the invitation.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[20px] font-semibold text-navy">
                You've been invited to join {tenant?.name} on PulseMD
              </h1>
              <p className="mt-2 text-[13.5px] text-muted-foreground">
                Role: <span className="font-medium text-navy">Receptionist</span><br />
                Invited by: <span className="font-medium text-navy">{inviter?.title} {inviter?.firstName} {inviter?.lastName}</span>
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <Field label="Password" type="password" value={pw} onChange={setPw} />
                <Field label="Confirm password" type="password" value={pw2} onChange={setPw2} />
                <p className="text-[11.5px] text-muted-foreground">Min. 8 characters, 1 number, 1 uppercase letter.</p>
                {error && <div className="rounded-md bg-[#FEE2E2] px-3 py-2 text-[12.5px] text-[#991B1B]">{error}</div>}
                <button type="submit" className="w-full rounded-md bg-blue px-4 py-2.5 text-[13.5px] font-medium text-white hover:opacity-90">
                  Create account
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-navy">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-blue" />
    </label>
  );
}
