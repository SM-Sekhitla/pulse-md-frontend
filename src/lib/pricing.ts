import type { Plan } from "@/types/tenant";

export function formatZAR(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function planPrice(plan: Plan): number {
  if (plan === "Growth") return 1499;
  if (plan === "Enterprise") return 3499;
  return 699;
}
