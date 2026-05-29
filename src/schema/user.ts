import { z } from "zod";

//
// -------------------------------------------------
// Enums
// -------------------------------------------------
export const userRoleSchema = z.enum([
  "super-admin",
  "manager",
  "owner",
  "receptionist",
  "nurse",
  "patient",
]);

export const userStatusSchema = z.enum([
  "invited",
  "active",
  "inactive",
]);

export type Role = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;

//
// -------------------------------------------------
// Base User (DB shape)
// -------------------------------------------------
export const userSchema = z.object({
  id: z.string(),

  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().min(1),

  role: userRoleSchema.default("owner"),
  tenantId: z.string().nullable(),

  status: userStatusSchema.default("active"),

  phone: z.string().optional(),

  practiceName: z.string().optional(),
  practiceSlug: z.string().optional(),
  hpcsa: z.string().optional(),

  invitedBy: z.string().optional(),
  inviteSentAt: z.string().datetime().optional(),
  inviteToken: z.string().optional(),

  deletedAt: z.string().datetime().optional(),
  lastLogin: z.string().datetime().optional(),

  passwordSet: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),

  tempPassword: z.string().optional(),
  password: z.string().min(8).optional(),

  createdAt: z.string().datetime(),
});

//
// -------------------------------------------------
// Create User
// -------------------------------------------------
export const userCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().min(1),

  role: userRoleSchema.default("owner"),
  tenantId: z.string().nullable().optional(),

  status: userStatusSchema.default("invited"),

  phone: z.string().optional(),

  practiceName: z.string().optional(),
  practiceSlug: z.string().optional(),
  hpcsa: z.string().optional(),

  invitedBy: z.string().optional(),
  tempPassword: z.string().optional(),
  mustChangePassword: z.boolean().optional(),
});

//
// -------------------------------------------------
// Update User (PATCH)
// -------------------------------------------------
export const userUpdateSchema = z.object({
  email: z.string().email().optional(),

  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  title: z.string().min(1).optional(),

  role: userRoleSchema.optional(),
  tenantId: z.string().nullable().optional(),

  status: userStatusSchema.optional(),

  phone: z.string().optional(),

  practiceName: z.string().optional(),
  practiceSlug: z.string().optional(),
  hpcsa: z.string().optional(),

  password: z.string().min(8).optional(),
  mustChangePassword: z.boolean().optional(),
  passwordSet: z.boolean().optional(),
});

//
// -------------------------------------------------
// Role Update Only
// -------------------------------------------------
export const roleUpdateSchema = z.object({
  role: userRoleSchema,
});

//
// -------------------------------------------------
// Safe Output (NO PASSWORD)
// -------------------------------------------------
export const userOutSchema = userSchema.omit({
  password: true,
  tempPassword: true,
  inviteToken: true,
});

//
// -------------------------------------------------
// Output WITH password (rare use)
// -------------------------------------------------
export const userOutWithPasswordSchema = userOutSchema.extend({
  password: z.string().optional(),
});

//
// -------------------------------------------------
// Auth / Utility Models
// -------------------------------------------------
export const changePasswordSchema = z.object({
  new_password: z.string().min(8),
});

export const emailRequestSchema = z.object({
  email: z.string().email(),
});

export const otpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string(),
});

export const resetPasswordSchema = z.object({
  reset_token: z.string(),
  new_password: z.string().min(8),
});

//
// -------------------------------------------------
// TS Types
// -------------------------------------------------
export type User = z.infer<typeof userSchema>;