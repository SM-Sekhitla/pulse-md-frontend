import { z } from "zod";

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

    appointmentId: z.string().optional(),

    gpName: z.string().min(1),
    hpcsa: z.string().min(1),

    issuedAt: z.string().datetime(),

    fromDate: z.string().date(),
    toDate: z.string().date(),

    reason: z.string().min(1),

    icd10: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-TV-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/),
    recommendation: z.string().optional(),

    securityCode: z.string().min(1),
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
    tenantId: z.string(),

    patientId: z.string(),
    patientName: z.string().min(1),

    appointmentId: z.string().optional(),

    gpName: z.string().min(1),
    hpcsa: z.string().min(1),

    issuedAt: z.string().datetime().optional(),

    fromDate: z.string().date(),
    toDate: z.string().date(),

    reason: z.string().min(1),

    icd10: z.string().optional(),
    recommendation: z.string().optional(),

    securityCode: z.string().min(1),
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
    tenantId: z.string().optional(),

    patientId: z.string().optional(),
    patientName: z.string().min(1).optional(),

    appointmentId: z.string().optional(),

    gpName: z.string().min(1).optional(),
    hpcsa: z.string().min(1).optional(),

    issuedAt: z.string().datetime().optional(),

    fromDate: z.string().date().optional(),
    toDate: z.string().date().optional(),

    reason: z.string().min(1).optional(),

    icd10: z.string().optional(),
    recommendation: z.string().optional(),

    securityCode: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      !data.fromDate ||
      !data.toDate ||
      new Date(data.toDate) >= new Date(data.fromDate),
    {
      message: "toDate must be on or after fromDate",
      path: ["toDate"],
    }
  );

//
// -------------------------------------------------
// Safe Output
// -------------------------------------------------
export const sickNoteOutSchema = sickNoteSchema;