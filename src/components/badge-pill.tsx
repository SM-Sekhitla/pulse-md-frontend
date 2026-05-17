import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "neutral" | "blue" | "teal" | "success" | "warning" | "danger" | "indigo" | "purple" | "amber";

const styles: Record<Variant, string> = {
  neutral: "bg-[#F1F3F8] text-[#475467]",
  blue: "bg-blue-tint text-blue",
  teal: "bg-[#DEFBF5] text-[#0E7C6B]",
  success: "bg-[#DCFCE7] text-[#166534]",
  warning: "bg-[#FEF3C7] text-[#92400E]",
  danger: "bg-[#FEE2E2] text-[#991B1B]",
  indigo: "bg-[#E0E7FF] text-[#3730A3]",
  purple: "bg-[#F3E8FF] text-[#6B21A8]",
  amber: "bg-[#FEF3C7] text-[#92400E]",
};

export function Badge({ children, variant = "neutral", className }: { children: ReactNode; variant?: Variant; className?: string }) {
  return (
    <span className={cn("pulse-badge", styles[variant], className)}>{children}</span>
  );
}

export function StatusDot({ variant = "success" }: { variant?: "success" | "warning" | "danger" | "neutral" }) {
  const c = {
    success: "bg-[#16A34A]",
    warning: "bg-[#D97706]",
    danger: "bg-[#E53E3E]",
    neutral: "bg-[#94A3B8]",
  }[variant];
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", c)} />;
}
