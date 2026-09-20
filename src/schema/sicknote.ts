import { z } from "zod";
import { apiDateTimeSchema } from "./user";

const optionalString = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().optional(),
);

const optionalIcd10Schema = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/)
    .optional(),
);

//
// -------------------------------------------------
// Base Sick Note
// -------------------------------------------------
export const sickNoteSchema = z
  .object({
    id: z.string(),

    tenantId: z.string(),

    patientId: z.string(),
    patientName: z.string().min(1),

    appointmentId: optionalString,

    gpName: z.string().min(1),
    hpcsa: z.string().min(1),

    issuedAt: apiDateTimeSchema,

    fromDate: z.string().min(1),
    toDate: z.string().min(1),

    reason: z.string().min(1),

    // Existing API records may contain legacy free-text codes.
    icd10: optionalString,
    recommendation: optionalString,

    securityCode: optionalString,
    qrHash: optionalString,
    qrCodeDataUrl: optionalString,
  })
  .refine((data) => new Date(data.toDate) >= new Date(data.fromDate), {
    message: "toDate must be on or after fromDate",
    path: ["toDate"],
  });

//
// -------------------------------------------------
// Create Sick Note
// -------------------------------------------------
export const sickNoteCreateSchema = z
  .object({
    tenantId: optionalString,

    patientId: z.string(),
    patientName: z.string().min(1),

    appointmentId: optionalString,

    gpName: z.string().min(1),
    hpcsa: z.string().min(1),

    issuedAt: apiDateTimeSchema.optional(),

    fromDate: z.string().min(1),
    toDate: z.string().min(1),

    reason: z.string().min(1),

    icd10: optionalIcd10Schema,
    recommendation: optionalString,

    securityCode: optionalString,
  })
  .refine((data) => new Date(data.toDate) >= new Date(data.fromDate), {
    message: "toDate must be on or after fromDate",
    path: ["toDate"],
  });

//
// -------------------------------------------------
// Update Sick Note
// -------------------------------------------------
export const sickNoteUpdateSchema = z
  .object({
    tenantId: optionalString,

    patientId: z.string().optional(),
    patientName: z.string().min(1).optional(),

    appointmentId: optionalString,

    gpName: z.string().min(1).optional(),
    hpcsa: z.string().min(1).optional(),

    issuedAt: apiDateTimeSchema.optional(),

    fromDate: z.string().min(1).optional(),
    toDate: z.string().min(1).optional(),

    reason: z.string().min(1).optional(),

    icd10: optionalIcd10Schema,
    recommendation: optionalString,

    securityCode: optionalString,
  })
  .refine(
    (data) =>
      !data.fromDate ||
      !data.toDate ||
      new Date(data.toDate) >= new Date(data.fromDate),
    {
      message: "toDate must be on or after fromDate",
      path: ["toDate"],
    },
  );

//
// -------------------------------------------------
// Safe Output
// -------------------------------------------------
export const sickNoteOutSchema = sickNoteSchema;
