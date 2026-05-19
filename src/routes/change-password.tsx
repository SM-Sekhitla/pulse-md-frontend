import { createFileRoute, useNavigate } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { PulseLogo } from "@/components/brand";
import { changePassword, currentUser, logout } from "@/lib/store";

export const Route = createFileRoute("/change-password")({
  component: ChangePassword,
});

function ChangePassword() {
  const navigate = useNavigate();
  const [user, setUser] = useState(currentUser());
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = currentUser();
    if (!u) {
      navigate({ to: "/login" });
      return;
    }
    setUser(u);
  }, [navigate]);

  if (!user) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw !== pw2) {
      setError("Passwords don't match.");
      return;
    }
    const r = changePassword(user.id, pw);
    if (!r.ok) {
      setError(r.error || "Failed");
      return;
    }
    if (user.role === "super_admin") navigate({ to: "/admin" });
    else navigate({ to: "/dashboard" });
  };

  const required = !!user.mustChangePassword;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="px-8 py-8">
        <PulseLogo />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[460px] pulse-card p-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue/10 text-blue">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[18px] font-semibold text-navy">
                Set a new password
              </h1>
              {required && (
                <p className="text-[12px] text-muted-foreground">
                  Required before accessing your dashboard.
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 text-[13px] text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-navy">{user.email}</span>. Choose
            a password you'll remember — your temporary password will no longer
            work.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <PwField
              label="New password"
              value={pw}
              onChange={setPw}
              show={show1}
              toggle={() => setShow1((v) => !v)}
            />
            <PwField
              label="Confirm new password"
              value={pw2}
              onChange={setPw2}
              show={show2}
              toggle={() => setShow2((v) => !v)}
            />
            <p className="text-[11.5px] text-muted-foreground">
              Min. 8 characters, 1 number, 1 uppercase letter.
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
              Update password & continue
            </button>
          </form>

          {required && (
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="mt-5 block w-full text-center text-[12.5px] text-muted-foreground hover:text-navy underline"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PwField({
  label,
  value,
  onChange,
  show,
  toggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-navy">{label}</span>
      <div className="relative mt-1.5">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border border-border bg-white px-3 py-2.5 pr-10 text-[13.5px] outline-none focus:border-blue"
        />
        <button
          type="button"
          onClick={toggle}
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-navy"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
