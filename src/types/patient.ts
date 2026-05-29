import { z } from "zod";
import {
  patientSchema,
  patientCreateSchema,
  patientUpdateSchema,
  patientOutSchema,
  patientStatusUpdateSchema
} from "@/schema/patient";

//
// -------------------------------------------------
// Core Types
// -------------------------------------------------
export type Patient = z.infer<typeof patientSchema>;
export type PatientCreate = z.infer<typeof patientCreateSchema>;
export type PatientUpdate = z.infer<typeof patientUpdateSchema>;
export type PatientStatusUpdate = z.infer<typeof patientStatusUpdateSchema>;

//
// -------------------------------------------------
// Output
// -------------------------------------------------
export type PatientOut = z.infer<typeof patientOutSchema>;

//
// -------------------------------------------------
// Derived Types
// -------------------------------------------------
export type PatientGender = Patient["gender"];