import { z } from "zod";
import {
  appointmentSchema,
  appointmentCreateSchema,
  appointmentUpdateSchema,
  appointmentOutSchema,
} from "@/schema/appointment";

//
// -------------------------------------------------
// Core Types
// -------------------------------------------------
export type Appointment = z.infer<typeof appointmentSchema>;
export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>;

//
// -------------------------------------------------
// Output
// -------------------------------------------------
export type AppointmentOut = z.infer<typeof appointmentOutSchema>;

//
// -------------------------------------------------
// Derived Types
// -------------------------------------------------
export type AppointmentStatus = Appointment["status"];
export type AppointmentType = Appointment["type"];