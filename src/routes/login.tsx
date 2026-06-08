import { createFileRoute, Link, useNavigate } from "@/lib/router-compat";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { PulseLogo } from "@/components/brand";
import { loginByEmail, store } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("dr.naidoo@northcliff.health");
  const [password, setPassword] = useState("demo");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const r = await login(email, password);
    console.log(r)
    if (!r.success || !r.user) {
      setError(r.message || "Sign-in failed");
      return;
    }
    const u = r.user;
    if (u.mustChangePassword) {
      navigate({ to: "/change-password" });
      return;
    }
    if (u.role === "super-admin") {
      navigate({ to: "/admin" });
      return;
    }
    const tenant = store.get().tenants.find((t) => t.id === u.tenantId);
    if (!tenant) {
      navigate({ to: "/dashboard" });
      return;
    }
    if (tenant.status === "pending_approval") navigate({ to: "/pending" });
    else if (tenant.status === "suspended") navigate({ to: "/suspended" });
    else if (tenant.status === "rejected") navigate({ to: "/rejected" });
    else navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="px-8 py-6">
        <Link to="/">
          <PulseLogo />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[420px] pulse-card p-8">
          <h1 className="text-[22px] font-semibold text-navy">
            Sign in to PulseMD
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Welcome back. Let's get your practice moving.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-[12.5px] font-medium text-navy">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-blue"
              />
            </label>
            <label className="block">
              <span className="text-[12.5px] font-medium text-navy">
                Password
              </span>
              <div className="relative mt-1.5">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-border bg-white px-3 py-2.5 pr-10 text-[13.5px] outline-none focus:border-blue"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-navy"
                  tabIndex={-1}
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
            {error && (
              <div className="rounded-md bg-[#FEE2E2] px-3 py-2 text-[12.5px] text-[#991B1B]">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="mt-2 w-full rounded-md bg-blue px-4 py-2.5 text-[13.5px] font-medium text-white hover:opacity-90"
            >
              Sign in
            </button>
          </form>

          <div className="mt-6 rounded-md border border-border bg-surface p-3 text-[11.5px] text-muted-foreground">
            <div className="font-semibold text-navy mb-1">
              Demo accounts (password: <span className="font-mono">demo</span>)
            </div>
            <div>
              GP Owner:{" "}
              <span className="font-mono">dr.naidoo@northcliff.health</span>
            </div>
            <div>
              Super Admin:{" "}
              <span className="font-mono">admin@pulsemd.co.za</span>
            </div>
            <div>
              Pending GP:{" "}
              <span className="font-mono">dr.adams@sandtonmed.co.za</span>
            </div>
            <div>
              Receptionist:{" "}
              <span className="font-mono">lebo@northcliff.health</span>
            </div>
          </div>

          <p className="mt-7 text-center text-[13px] text-muted-foreground">
            New to PulseMD?{" "}
            <Link
              to="/register"
              className="font-medium text-blue hover:underline"
            >
              Start your free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
