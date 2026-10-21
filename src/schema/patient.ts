import { z } from "zod";
import { apiDateTimeSchema } from "./user";

//
// -------------------------------------------------
// Enums
// -------------------------------------------------
export const patientGenderSchema = z.enum(["M", "F"]);
export const billingTypeSchema = z.enum(["private", "medical_aid"]);
export const relationshipToMainSchema = z.enum([
  "self",
  "spouse",
  "child",
  "parent",
  "other",
]);

const optionalString = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().optional(),
);

const recordFields = {
  title: optionalString.default(""),
  address: optionalString.default(""),
  emergencyContactName: optionalString.default(""),
  emergencyContactPhone: optionalString.default(""),
  vaccinations: z.array(z.string()).default([]),
  consentGiven: z.boolean().default(false),
  consentRecordedAt: apiDateTimeSchema.nullable().optional(),
  consentRecordedBy: optionalString,
  consentVersion: optionalString,
};
const patientEmail = z.preprocess(
  (value) => (value == null ? "" : value),
  z.union([z.string().email(), z.literal("")]),
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

  idNumber: z.string().default(""),

  phone: z.string().min(1),
  email: patientEmail,

  medicalAid: optionalString.default("Private"),
  ...medicalAidFields,
  ...recordFields,

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

  idNumber: z.string().default(""),

  phone: z.string().min(1),
  email: patientEmail,

  medicalAid: optionalString.default("Private"),
  ...medicalAidFields,
  ...recordFields,

  allergies: z.array(z.string()).default([]),
  chronic: z.array(z.string()).default([]),

  active: z.boolean().default(true),
});

//
// -------------------------------------------------
// Update Patient
// -------------------------------------------------
export const patientUpdateSchema = z.object({
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  vaccinations: z.array(z.string()).optional(),
  consentGiven: z.boolean().optional(),
  tenantId: optionalString,

  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),

  dob: apiDateTimeSchema.optional(),

  gender: patientGenderSchema.optional(),

  idNumber: z.string().optional(),

  phone: z.string().min(1).optional(),
  email: patientEmail.optional(),

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
