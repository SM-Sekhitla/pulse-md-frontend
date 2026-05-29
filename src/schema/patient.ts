import { z } from "zod";

//
// -------------------------------------------------
// Enums
// -------------------------------------------------
export const patientGenderSchema = z.enum(["M", "F"]);

//
// -------------------------------------------------
// Base Patient
// -------------------------------------------------
export const patientSchema = z.object({
  id: z.string(),

  tenantId: z.string().optional(),

  firstName: z.string().min(1),
  lastName: z.string().min(1),

  dob: z.string().datetime(),

  gender: patientGenderSchema,

  idNumber: z.string().min(1),

  phone: z.string().min(1),
  email: z.string().email(),

  medicalAid: z.string().min(1),
  medicalAidNumber: z.string().min(1),

  allergies: z.array(z.string()).default([]),
  chronic: z.array(z.string()).default([]),

  lastVisit: z.string().datetime(),

  active: z.boolean(),
});

//
// -------------------------------------------------
// Create Patient
// -------------------------------------------------
export const patientCreateSchema = z.object({
  tenantId: z.string().optional(),

  firstName: z.string().min(1),
  lastName: z.string().min(1),

  dob: z.string().datetime(),

  gender: patientGenderSchema,

  idNumber: z.string().min(1),

  phone: z.string().min(1),
  email: z.string().email(),

  medicalAid: z.string().min(1),
  medicalAidNumber: z.string().min(1),

  allergies: z.array(z.string()).default([]),
  chronic: z.array(z.string()).default([]),

  active: z.boolean().default(true),
});

//
// -------------------------------------------------
// Update Patient
// -------------------------------------------------
export const patientUpdateSchema = z.object({
  tenantId: z.string().optional(),

  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),

  dob: z.string().datetime().optional(),

  gender: patientGenderSchema.optional(),

  idNumber: z.string().min(1).optional(),

  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),

  medicalAid: z.string().min(1).optional(),
  medicalAidNumber: z.string().min(1).optional(),

  allergies: z.array(z.string()).optional(),
  chronic: z.array(z.string()).optional(),

  lastVisit: z.string().datetime().optional(),

  active: z.boolean().optional(),
});


export const patientStatusUpdateSchema = z.object({
  active: z.boolean(),
});

//
// -------------------------------------------------
// Safe Output
// -------------------------------------------------
export const patientOutSchema = patientSchema;