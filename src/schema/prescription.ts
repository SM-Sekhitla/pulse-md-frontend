import { z } from "zod";

//
// -------------------------------------------------
// Prescription Item
// -------------------------------------------------
export const prescriptionItemSchema = z.object({
  drug: z.string().min(1),
  dose: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  notes: z.string().optional(),
});

//
// -------------------------------------------------
// Base Prescription
// -------------------------------------------------
export const prescriptionSchema = z.object({
  id: z.string(),

  tenantId: z.string(),

  patientId: z.string(),
  patientName: z.string().min(1),

  appointmentId: z.string().optional(),

  gpName: z.string().min(1),
  hpcsa: z.string().min(1),

  issuedAt: z.string().datetime(),

  validDays: z.number().int().min(1),

  diagnosis: z.string().optional(),
  icd10: z.string().optional(),

  items: z.array(prescriptionItemSchema).min(1),

  securityCode: z.string().min(1),
  qrToken: z.string().min(1),
  qrHash: z.string().min(1),
});