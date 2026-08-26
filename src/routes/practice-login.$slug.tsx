import { createFileRoute, Link, useNavigate, useParams } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { PulseLogo } from "@/components/brand";
import { isSuperAdminRole, useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/practice/$slug/login")({
  component: PracticeLoginPage,
});

function PracticeLoginPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const practiceName = useMemo(() => titleFromSlug(slug), [slug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const result = await login(email, password);
    if (!result.success || !result.user) {
      setError(result.message || "Sign-in failed");
      return;
    }

    const user = result.user;
    if (isSuperAdminRole(user.role)) {
      navigate({ to: "/admin" });
      return;
    }

    if (user.practiceSlug && user.practiceSlug !== slug) {
      setError(`This account belongs to ${user.practiceName || user.practiceSlug}.`);
      return;
    }

    if (user.mustChangePassword) {
      navigate({ to: "/change-password" });
      return;
    }

    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="px-8 py-6">
        <Link to="/">
          <PulseLogo />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[440px] pulse-card p-8">
          <div className="label-caps">Practice workspace</div>
          <h1 className="mt-2 text-[22px] font-semibold text-navy">
            {practiceName}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Sign in with your practice account.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-[12.5px] font-medium text-navy">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                  onChange={(event) => setPassword(event.target.value)}
                  className="block w-full rounded-md border border-border bg-white px-3 py-2.5 pr-10 text-[13.5px] outline-none focus:border-blue"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((value) => !value)}
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

          <div className="mt-6 flex items-center justify-between text-[12.5px]">
            <Link to="/login" className="text-muted-foreground hover:text-navy">
              General login
            </Link>
            <Link to={`/book/${slug}`} className="font-medium text-blue hover:underline">
              Public booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
