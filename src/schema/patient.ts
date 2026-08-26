import { z } from "zod";
import { apiDateTimeSchema } from "./user";

//
// -------------------------------------------------
// Enums
// -------------------------------------------------
export const patientGenderSchema = z.enum(["M", "F"]);
export const billingTypeSchema = z.enum(["private", "medical_aid"]);
export const relationshipToMainSchema = z.enum(["self", "spouse", "child", "parent", "other"]);

const optionalString = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().optional(),
);

const medicalAidFields = {
  billingType: billingTypeSchema.default("private"),
  medicalAidSchemeId: optionalString,
  medicalAidSchemeName: optionalString,
  medicalAidPlan: optionalString,
  medicalAidNumber: optionalString.default(""),
  isMainMember: z.boolean().default(true),
  mainMemberName: optionalString,
  mainMemberNumber: optionalString,
  dependantCode: optionalString,
  relationshipToMain: relationshipToMainSchema.default("self"),
};

//
// -------------------------------------------------
// Base Patient
// -------------------------------------------------
export const patientSchema = z.object({
  id: z.string(),

  tenantId: optionalString,

  firstName: z.string().min(1),
  lastName: z.string().min(1),

  dob: apiDateTimeSchema,

  gender: patientGenderSchema,

  idNumber: z.string().min(1),

  phone: z.string().min(1),
  email: z.string().email(),

  medicalAid: optionalString.default("Private"),
  ...medicalAidFields,

  allergies: z.array(z.string()).default([]),
  chronic: z.array(z.string()).default([]),

  lastVisit: apiDateTimeSchema.nullable().optional(),

  active: z.boolean(),
});

//
// -------------------------------------------------
// Create Patient
// -------------------------------------------------
export const patientCreateSchema = z.object({
  tenantId: optionalString,

  firstName: z.string().min(1),
  lastName: z.string().min(1),

  dob: apiDateTimeSchema,

  gender: patientGenderSchema,

  idNumber: z.string().min(1),

  phone: z.string().min(1),
  email: z.string().email(),

  medicalAid: optionalString.default("Private"),
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
  tenantId: optionalString,

  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),

  dob: apiDateTimeSchema.optional(),

  gender: patientGenderSchema.optional(),

  idNumber: z.string().min(1).optional(),

  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),

  medicalAid: optionalString,
  billingType: billingTypeSchema.optional(),
  medicalAidSchemeId: optionalString,
  medicalAidSchemeName: optionalString,
  medicalAidPlan: optionalString,
  medicalAidNumber: optionalString,
  isMainMember: z.boolean().optional(),
  mainMemberName: optionalString,
  mainMemberNumber: optionalString,
  dependantCode: optionalString,
  relationshipToMain: relationshipToMainSchema.optional(),

  allergies: z.array(z.string()).optional(),
  chronic: z.array(z.string()).optional(),

  lastVisit: apiDateTimeSchema.nullable().optional(),

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
