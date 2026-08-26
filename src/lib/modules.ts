import type { ModuleKey, Plan, TenantOut } from "@/types/tenant";

export const MODULE_KEYS = [
  "calendar",
  "patients",
  "appointments",
  "prescriptions",
  "sick_notes",
  "inventory",
  "equipment",
  "billing",
  "reports",
  "staff",
] as const satisfies readonly ModuleKey[];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  calendar: "Calendar",
  patients: "Patients",
  appointments: "Appointments",
  prescriptions: "Prescriptions",
  sick_notes: "Sick notes",
  inventory: "Medical inventory",
  equipment: "Equipment",
  billing: "Billing & invoices",
  reports: "Financial reports",
  staff: "Staff & roles",
};

export const PLAN_MODULES: Record<Plan, ModuleKey[]> = {
  Starter: ["patients", "appointments", "reports", "calendar"],
  Growth: ["patients", "appointments", "billing", "inventory", "reports", "staff"],
  Enterprise: [...MODULE_KEYS],
};

export function tenantEnabledModules(tenant: TenantOut | null | undefined): ModuleKey[] {
  if (!tenant) return [...MODULE_KEYS];
  const planModules = PLAN_MODULES[tenant.plan];
  if (!tenant.enabledModules) return planModules;
  return planModules.filter((module) => tenant.enabledModules?.includes(module));
}
