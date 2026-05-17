import { Activity } from "lucide-react";

export function PulseLogo({ size = 36, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center bg-navy"
        style={{ width: size, height: size, borderRadius: 14 }}
      >
        <svg viewBox="0 0 36 36" width={size * 0.7} height={size * 0.7} fill="none">
          <path
            d="M3 18 H10 L13 11 L18 25 L22 15 L25 19 H33"
            stroke="#3B7BF8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="25" r="2" fill="#5DEBD7" />
        </svg>
      </div>
      {withWordmark && (
        <div className="flex items-baseline">
          <span className="text-[20px] font-bold tracking-tight text-navy">Pulse</span>
          <span className="text-[20px] font-light text-blue">MD</span>
        </div>
      )}
    </div>
  );
}

export function PulseLogoOnDark({ size = 36, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size, borderRadius: 14, background: "rgba(255,255,255,0.06)" }}
      >
        <svg viewBox="0 0 36 36" width={size * 0.7} height={size * 0.7} fill="none">
          <path
            d="M3 18 H10 L13 11 L18 25 L22 15 L25 19 H33"
            stroke="#3B7BF8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="25" r="2" fill="#5DEBD7" />
        </svg>
      </div>
      {withWordmark && (
        <div className="flex items-baseline">
          <span className="text-[20px] font-bold tracking-tight text-white">Pulse</span>
          <span className="text-[20px] font-light text-blue">MD</span>
        </div>
      )}
    </div>
  );
}

export function PulseIcon({ className = "" }: { className?: string }) {
  return <Activity className={className} />;
}
