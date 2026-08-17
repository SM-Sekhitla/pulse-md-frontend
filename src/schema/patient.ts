import { z } from "zod";

//
// -------------------------------------------------
// Enums
// -------------------------------------------------
export const patientGenderSchema = z.enum(["M", "F"]);
export const billingTypeSchema = z.enum(["private", "medical_aid"]);
export const relationshipToMainSchema = z.enum(["self", "spouse", "child", "parent", "other"]);

const medicalAidFields = {
  billingType: billingTypeSchema.default("private"),
  medicalAidSchemeId: z.string().optional(),
  medicalAidSchemeName: z.string().optional(),
  medicalAidPlan: z.string().optional(),
  medicalAidNumber: z.string().optional().default(""),
  isMainMember: z.boolean().default(true),
  mainMemberName: z.string().optional(),
  mainMemberNumber: z.string().optional(),
  dependantCode: z.string().optional(),
  relationshipToMain: relationshipToMainSchema.default("self"),
};

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

  medicalAid: z.string().optional().default("Private"),
  ...medicalAidFields,

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

  medicalAid: z.string().optional().default("Private"),
  ...medicalAidFields,

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

  medicalAid: z.string().optional(),
  billingType: billingTypeSchema.optional(),
  medicalAidSchemeId: z.string().optional(),
  medicalAidSchemeName: z.string().optional(),
  medicalAidPlan: z.string().optional(),
  medicalAidNumber: z.string().optional(),
  isMainMember: z.boolean().optional(),
  mainMemberName: z.string().optional(),
  mainMemberNumber: z.string().optional(),
  dependantCode: z.string().optional(),
  relationshipToMain: relationshipToMainSchema.optional(),

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
