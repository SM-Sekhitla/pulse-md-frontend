import { z } from "zod";
import { apiDateTimeSchema, userOutSchema } from "./user";

//
// -------------------------------------------------
// Enums
// -------------------------------------------------
export const tenantStatusSchema = z.enum([
  "pending_approval",
  "active",
  "suspended",
  "rejected",
]);

export const planSchema = z.enum([
  "Starter",
  "Growth",
  "Enterprise",
]);

// If already defined elsewhere, import instead
export const moduleKeySchema = z.enum([
  "calendar",
  "appointments",
  "billing",
  "equipment",
  "patients",
  "prescriptions",
  "sick_notes",
  "inventory",
  "reports",
  "staff",
]);

export const subscriptionStatusSchema = z.enum([
  "trial",
  "trialing",
  "active",
  "expired",
  "cancelled",
  "suspended",
]);

export const workingHourSchema = z.object({
  key: z.string(),
  label: z.string(),
  short: z.string(),
  enabled: z.boolean(),
  start: z.string(),
  end: z.string(),
});

const nullableString = z.string().nullable().optional();
const nullableWorkingHours = z.array(workingHourSchema).nullable().optional();
const nullableStringArray = z.array(z.string()).nullable().optional();
const nullableModuleKeys = z.array(moduleKeySchema).nullable().optional();

export const subscriptionOutSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  plan: planSchema,
  status: subscriptionStatusSchema,
  startDate: apiDateTimeSchema,
  endDate: apiDateTimeSchema.nullable().optional(),
  trialEndsAt: apiDateTimeSchema.nullable().optional(),
  nextBillingDate: apiDateTimeSchema.nullable().optional(),
  amount: z.number(),
  currency: z.string().optional(),
  autoRenew: z.boolean().optional(),
  createdAt: apiDateTimeSchema,
  updatedAt: apiDateTimeSchema.nullable().optional(),
});

const withPlanFromSubscription = (value: unknown) => {
  if (!value || typeof value !== "object") return value;

  const tenant = value as Record<string, unknown>;
  const subscription = tenant.subscription as Record<string, unknown> | null;

  return {
    ...tenant,
    plan:
      tenant.plan ??
      subscription?.plan ??
      "Starter",
  };
};

//
// -------------------------------------------------
// Base Tenant
// -------------------------------------------------
export const tenantSchema = z.object({
  id: z.string(),

  name: z.string().min(1),
  slug: z.string().min(1),

  address: nullableString,
  province: nullableString,

  hpcsa: nullableString,
  vat: nullableString,
  companyProfile: nullableString,
  logoName: nullableString,
  logoDataUrl: nullableString,
  workingHours: nullableWorkingHours,
  bookingEnabled: z.boolean().nullable().optional(),
  bookingSlug: nullableString,
  gpBio: nullableString,
  gpLanguages: nullableStringArray,

  plan: planSchema.default("Starter"),
  gpUserId: z.string(),

  status: tenantStatusSchema,

  currentSubscriptionId: z.string().nullable().optional(),
  subscriptionStatus: subscriptionStatusSchema.optional(),
  subscription: subscriptionOutSchema.nullable().optional(),

  createdAt: apiDateTimeSchema,
  updatedAt: apiDateTimeSchema.nullable().optional(),

  approvedAt: apiDateTimeSchema.nullable().optional(),
  approvedBy: z.string().nullable().optional(),

  rejectionReason: z.string().nullable().optional(),

  suspendedAt: apiDateTimeSchema.nullable().optional(),
  suspensionReason: z.string().nullable().optional(),

  enabledModules: nullableModuleKeys,
}).passthrough();

//
// -------------------------------------------------
// Create Tenant
// -------------------------------------------------
export const tenantCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),

  address: nullableString,
  province: nullableString,

  hpcsa: nullableString,
  vat: nullableString,
  companyProfile: nullableString,
  logoName: nullableString,
  logoDataUrl: nullableString,
  workingHours: nullableWorkingHours,
  bookingEnabled: z.boolean().nullable().optional(),
  bookingSlug: nullableString,
  gpBio: nullableString,
  gpLanguages: nullableStringArray,

  plan: planSchema.default("Starter"),
  gpUserId: z.string(),

  status: tenantStatusSchema.default("pending_approval"),

  enabledModules: nullableModuleKeys,
});

//
// -------------------------------------------------
// Update Tenant
// -------------------------------------------------
export const tenantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),

  address: nullableString,
  province: nullableString,

  hpcsa: nullableString,
  vat: nullableString,
  companyProfile: nullableString,
  logoName: nullableString,
  logoDataUrl: nullableString,
  workingHours: nullableWorkingHours,
  bookingEnabled: z.boolean().nullable().optional(),
  bookingSlug: nullableString,
  gpBio: nullableString,
  gpLanguages: nullableStringArray,

  plan: planSchema.optional(),
  gpUserId: z.string().optional(),

  status: tenantStatusSchema.optional(),

  approvedAt: apiDateTimeSchema.optional(),
  approvedBy: z.string().optional(),

  rejectionReason: z.string().optional(),

  suspendedAt: apiDateTimeSchema.optional(),
  suspensionReason: z.string().optional(),

  enabledModules: nullableModuleKeys,
});

//
// -------------------------------------------------
// Safe Output
// -------------------------------------------------
export const tenantOutSchema = z.preprocess(withPlanFromSubscription, z.object({
  id: z.string(),

  name: z.string().min(1),
  slug: z.string().min(1),

  address: nullableString,
  province: nullableString,

  hpcsa: nullableString,
  vat: nullableString,
  companyProfile: nullableString,
  logoName: nullableString,
  logoDataUrl: nullableString,
  workingHours: nullableWorkingHours,
  bookingEnabled: z.boolean().nullable().optional(),
  bookingSlug: nullableString,
  gpBio: nullableString,
  gpLanguages: nullableStringArray,

  plan: planSchema.default("Starter"),
  gpUserId: z.string(),
  owner: userOutSchema.nullable().optional(),

  status: tenantStatusSchema,

  currentSubscriptionId: z.string().nullable().optional(),
  subscriptionStatus: subscriptionStatusSchema.optional(),
  subscription: subscriptionOutSchema.nullable().optional(),

  createdAt: apiDateTimeSchema.nullable().optional(),
  updatedAt: apiDateTimeSchema.nullable().optional(),

  approvedAt: apiDateTimeSchema.nullable().optional(),
  approvedBy: z.string().nullable().optional(),

  rejectionReason: z.string().nullable().optional(),

  suspendedAt: apiDateTimeSchema.nullable().optional(),
  suspensionReason: z.string().nullable().optional(),

  enabledModules: nullableModuleKeys,
}).passthrough());
