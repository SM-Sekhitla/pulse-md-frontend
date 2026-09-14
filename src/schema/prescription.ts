import { z } from "zod";
import { apiDateTimeSchema } from "./user";

const optionalString = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().optional(),
);

//
// -------------------------------------------------
// Prescription Item
// -------------------------------------------------
export const prescriptionItemSchema = z.object({
  drug: z.string().min(1),
  dose: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  notes: optionalString,
});

//
// -------------------------------------------------
// Base Prescription
// -------------------------------------------------
export const prescriptionSchema = z.object({
  id: z.string(),

  tenantId: z.string(),

  patientId: optionalString,
  patientName: z.string().min(1),

  appointmentId: optionalString,

  gpName: z.string().min(1),
  hpcsa: z.string().min(1),

  issuedAt: apiDateTimeSchema,
  fromDate: optionalString,
  toDate: optionalString,

  validDays: z.number().int().min(1),

  diagnosis: optionalString,
  icd10: optionalString,

  items: z.array(prescriptionItemSchema).min(1),

  securityCode: optionalString,
  qrToken: optionalString,
  qrHash: optionalString,
  qrCodeDataUrl: optionalString,
});
