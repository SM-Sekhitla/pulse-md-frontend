import { z } from "zod";
import { userOutSchema } from "./user";

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
  "appointments",
  "billing",
  "patients",
  "inventory",
  "reports",
  "staff",
]);

//
// -------------------------------------------------
// Base Tenant
// -------------------------------------------------
export const tenantSchema = z.object({
  id: z.string(),

  name: z.string().min(1),
  slug: z.string().min(1),

  address: z.string().optional(),
  province: z.string().optional(),

  hpcsa: z.string().optional(),
  vat: z.string().optional(),

  plan: planSchema,
  gpUserId: z.string(),

  status: tenantStatusSchema,

  createdAt: z.string().datetime(),

  approvedAt: z.string().datetime().optional(),
  approvedBy: z.string().optional(),

  rejectionReason: z.string().optional(),

  suspendedAt: z.string().datetime().optional(),
  suspensionReason: z.string().optional(),

  enabledModules: z.array(moduleKeySchema).optional(),
});

//
// -------------------------------------------------
// Create Tenant
// -------------------------------------------------
export const tenantCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),

  address: z.string().optional(),
  province: z.string().optional(),

  hpcsa: z.string().optional(),
  vat: z.string().optional(),

  plan: planSchema.default("Starter"),
  gpUserId: z.string(),

  status: tenantStatusSchema.default("pending_approval"),

  enabledModules: z.array(moduleKeySchema).optional(),
});

//
// -------------------------------------------------
// Update Tenant
// -------------------------------------------------
export const tenantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),

  address: z.string().optional(),
  province: z.string().optional(),

  hpcsa: z.string().optional(),
  vat: z.string().optional(),

  plan: planSchema.optional(),
  gpUserId: z.string().optional(),

  status: tenantStatusSchema.optional(),

  approvedAt: z.string().datetime().optional(),
  approvedBy: z.string().optional(),

  rejectionReason: z.string().optional(),

  suspendedAt: z.string().datetime().optional(),
  suspensionReason: z.string().optional(),

  enabledModules: z.array(moduleKeySchema).optional(),
});

//
// -------------------------------------------------
// Safe Output
// -------------------------------------------------
export const tenantOutSchema = z.object({
  id: z.string(),

  name: z.string().min(1),
  slug: z.string().min(1),

  address: z.string().optional(),
  province: z.string().optional(),

  hpcsa: z.string().optional(),
  vat: z.string().optional(),

  plan: planSchema,
  gpUserId: z.string(),
  owner: userOutSchema,

  status: tenantStatusSchema,

  createdAt: z.string().datetime(),

  approvedAt: z.string().datetime().optional(),
  approvedBy: z.string().optional(),

  rejectionReason: z.string().optional(),

  suspendedAt: z.string().datetime().optional(),
  suspensionReason: z.string().optional(),

  enabledModules: z.array(moduleKeySchema).optional(),
});