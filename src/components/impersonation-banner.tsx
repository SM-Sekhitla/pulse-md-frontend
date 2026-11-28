import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function remaining(expiresAt: string) {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

// Always visible while a super admin is acting as a practice owner.
export function ImpersonationBanner() {
  const { impersonation, user, endImpersonation } = useAuth();
  const [seconds, setSeconds] = useState(() =>
    impersonation ? remaining(impersonation.expiresAt) : 0,
  );
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!impersonation) return;
    setSeconds(remaining(impersonation.expiresAt));
    const timer = window.setInterval(
      () => setSeconds(remaining(impersonation.expiresAt)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [impersonation]);

  useEffect(() => {
    if (impersonation && seconds === 0 && !ending) {
      setEnding(true);
      void endImpersonation();
    }
  }, [impersonation, seconds, ending, endImpersonation]);

  if (!impersonation) return null;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const owner = [user?.title, user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div
      role="alert"
      className="gp-support-banner fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-3 bg-[#B91C1C] px-4 text-[13px] text-white"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} aria-hidden="true" />
        <span>
          <strong>Support session.</strong> Viewing{" "}
          {impersonation.practiceName || "this practice"} as {owner || "the owner"}.
          Everything you do is logged under {impersonation.actorEmail}.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[12px]" aria-label="Time left">
          {mm}:{ss}
        </span>
        <button
          type="button"
          disabled={ending}
          onClick={() => {
            setEnding(true);
            void endImpersonation();
          }}
          className="rounded-md border border-white/60 px-3 py-1 text-[12px] font-semibold hover:bg-white/10 disabled:opacity-60"
        >
          {ending ? "Ending…" : "Exit support session"}
        </button>
      </div>
    </div>
  );
}
