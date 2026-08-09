import { createFileRoute, useNavigate, useParams } from "@/lib/router-compat";
import { useState } from "react";
import { PulseLogo } from "@/components/brand";
import { useMutation, useQuery } from "@tanstack/react-query";
import API from "@/utils/api";

export const Route = createFileRoute("/invite/$token")({ component: Invite });

function Invite() {
  const { token } = useParams({ from: "/invite/$token" });
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: invite, isLoading } = useQuery({
    queryKey: ["invite", token],
    queryFn: async () => {
      const res = await API.get(`/auth/invite/${token}`);
      return res.data as { user: any; tenant: any; inviter: any };
    },
    retry: false,
  });

  const accept = useMutation({
    mutationFn: async () => {
      await API.post("/auth/invite/accept", { token, password: pw });
    },
    onSuccess: () => navigate({ to: "/dashboard" }),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 12 || !/\d/.test(pw) || !/[A-Z]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
      setError(
        "Password must be at least 12 characters with 1 number, 1 uppercase letter, and 1 symbol.",
      );
      return;
    }
    if (pw !== pw2) {
      setError("Passwords don't match.");
      return;
    }
    try {
      await accept.mutateAsync();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid or expired invite.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="px-8 py-8">
        <PulseLogo />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[460px] pulse-card p-8">
          {isLoading ? (
            <>
              <h1 className="text-[20px] font-semibold text-navy">
                Checking invite
              </h1>
              <p className="mt-3 text-[13.5px] text-muted-foreground">
                Please wait while we verify your invitation.
              </p>
            </>
          ) : !invite?.user ? (
            <>
              <h1 className="text-[20px] font-semibold text-navy">
                Invite invalid
              </h1>
              <p className="mt-3 text-[13.5px] text-muted-foreground">
                This invite link has expired or is invalid. Ask your practice
                manager to resend the invitation.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[20px] font-semibold text-navy">
                You've been invited to join {invite.tenant?.name || "PulseMD"} on PulseMD
              </h1>
              <p className="mt-2 text-[13.5px] text-muted-foreground">
                Role:{" "}
                <span className="font-medium text-navy">Receptionist</span>
                <br />
                Invited by:{" "}
                <span className="font-medium text-navy">
                  {invite.inviter?.title} {invite.inviter?.firstName} {invite.inviter?.lastName}
                </span>
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <Field
                  label="Password"
                  type="password"
                  value={pw}
                  onChange={setPw}
                />
                <Field
                  label="Confirm password"
                  type="password"
                  value={pw2}
                  onChange={setPw2}
                />
                <p className="text-[11.5px] text-muted-foreground">
                  Min. 12 characters, 1 number, 1 uppercase letter, 1 symbol.
                </p>
                {error && (
                  <div className="rounded-md bg-[#FEE2E2] px-3 py-2 text-[12.5px] text-[#991B1B]">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full rounded-md bg-blue px-4 py-2.5 text-[13.5px] font-medium text-white hover:opacity-90"
                >
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

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-navy">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-blue"
      />
    </label>
  );
}
