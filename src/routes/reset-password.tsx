import { createFileRoute, useNavigate } from "@/lib/router-compat";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PulseLogo } from "@/components/brand";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { resetPasswordWeb } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset link is missing a token.");
      return;
    }
    if (password.length < 12 || !/\d/.test(password) || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Password must be at least 12 characters with 1 number, 1 uppercase letter, and 1 symbol.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const result = await resetPasswordWeb(token, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.message || "Password reset failed.");
      return;
    }

    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="px-8 py-8">
        <PulseLogo />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[460px] pulse-card p-8">
          <h1 className="text-[20px] font-semibold text-navy">Reset password</h1>
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            Choose a new password for your PulseMD account.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="New password" value={password} onChange={setPassword} />
            <Field label="Confirm password" value={confirm} onChange={setConfirm} />
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
              disabled={submitting}
              className="w-full rounded-md bg-blue px-4 py-2.5 text-[13.5px] font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-navy">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-blue"
      />
    </label>
  );
}
