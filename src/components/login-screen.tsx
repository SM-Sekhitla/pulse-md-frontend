import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "@/lib/router-compat";
import { PulseLogo } from "@/components/brand";
import { ActionButton, ActionForm } from "@/components/action-feedback";
import { useAuth } from "@/context/AuthContext";
import { getPostAuthRoute } from "@/lib/auth-routing";
import { toast } from "sonner";
import "./login.css";

export function LoginScreen({ practiceSlug }: { practiceSlug?: string }) {
  const { login, requestResetWeb } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const practiceName = practiceSlug
    ?.split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await login(email, password, practiceSlug);
    if (!result.success || !result.user) {
      setError(result.message || "Invalid credentials, email or password.");
      return;
    }
    if (
      practiceSlug &&
      result.user.practiceSlug &&
      result.user.practiceSlug !== practiceSlug
    ) {
      setError("Invalid credentials, email or password.");
      return;
    }
    navigate({ to: getPostAuthRoute(result.user) });
  };
  const reset = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    const result = await requestResetWeb(email);
    if (!result.success) {
      setError(result.message || "Could not send reset email.");
      return;
    }
    toast.success("If the account exists, a reset link has been emailed.");
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" aria-label="PulseMD home">
          <PulseLogo />
        </Link>
        <Link to="/" className="login-back">
          <ArrowLeft size={15} /> Back to home
        </Link>
      </header>
      <main className="login-main">
        <section className="login-form-panel" aria-labelledby="login-title">
          <div className="login-form-inner">
            <div className="login-context">
              <span />
              {practiceSlug ? "PRACTICE WORKSPACE" : "PLATFORM ADMINISTRATION"}
            </div>
            <h1 id="login-title">
              Welcome back<span>.</span>
            </h1>
            <p className="login-intro">
              {practiceSlug
                ? "Sign in to your practice workspace."
                : "Sign in to manage the PulseMD platform."}
            </p>
            <div className="login-workspace">
              <span className="login-workspace-icon">
                {practiceSlug ? <Plus size={20} /> : <ShieldCheck size={20} />}
              </span>
              <div>
                <small>
                  {practiceSlug ? "YOU’RE SIGNING IN TO" : "ADMIN WORKSPACE"}
                </small>
                <strong>{practiceName || "PulseMD platform"}</strong>
              </div>
            </div>
            <ActionForm onSubmit={submit} className="login-form">
              <label htmlFor="login-email">Email address</label>
              <div className="login-input">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="login-password-label">
                <label htmlFor="login-password">Password</label>
                <ActionButton
                  type="button"
                  onClick={reset}
                  className="login-text-button"
                >
                  Forgot password?
                </ActionButton>
              </div>
              <div className="login-input">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <ActionButton
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="login-password-toggle"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </ActionButton>
              </div>
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}
              <ActionButton type="submit" className="login-submit">
                Sign in <ArrowUpRight size={19} aria-hidden="true" />
              </ActionButton>
            </ActionForm>
            {!practiceSlug && (
              <p className="login-help">
                For platform administrators only. Practice teams should use
                their practice’s unique login link.
              </p>
            )}
          </div>
        </section>
      </main>
      <footer className="login-footer">
        <span>© {new Date().getFullYear()} PulseMD</span>
        <span>Connected care starts here.</span>
      </footer>
    </div>
  );
}
