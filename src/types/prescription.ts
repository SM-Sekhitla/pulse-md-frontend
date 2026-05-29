import { z } from "zod";
import {
  prescriptionSchema,
  prescriptionItemSchema,
} from "@/schema/prescription";

//
// -------------------------------------------------
// Core Types
// -------------------------------------------------
export type Prescription = z.infer<typeof prescriptionSchema>;
export type PrescriptionItem = z.infer<typeof prescriptionItemSchema>;

//
// -------------------------------------------------
// Derived Types
// -------------------------------------------------
export type PrescriptionId = Prescription["id"];