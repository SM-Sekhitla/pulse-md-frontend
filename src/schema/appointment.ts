import { z } from "zod";
import { apiDateTimeSchema } from "./user";

//
// -------------------------------------------------
// Enums
// -------------------------------------------------
export const appointmentStatusSchema = z.enum([
  "Booked",
  "Confirmed",
  "Checked-in",
  "In progress",
  "Completed",
  "No-show",
  "Cancelled",
]);

export const appointmentTypeSchema = z.enum([
  "Consultation",
  "Follow-up",
  "Procedure",
  "Telehealth",
  "Emergency",
  "Walk-in",
]);

//
// -------------------------------------------------
// Base Appointment
// -------------------------------------------------
export const appointmentSchema = z
  .object({
    id: z.string(),

    tenantId: z.string().optional(),

    patientId: z.string(),
    patientName: z.string().min(1),

    type: appointmentTypeSchema,

    start: apiDateTimeSchema,
    end: apiDateTimeSchema,

    status: appointmentStatusSchema.default("Booked"),

    reason: z.string().min(1),

    room: z.string().min(1),
    gp: z.string().min(1),
  })
  .refine((data) => new Date(data.end) > new Date(data.start), {
    message: "End time must be after start time",
    path: ["end"],
  });

//
// -------------------------------------------------
// Create Appointment
// -------------------------------------------------
export const appointmentCreateSchema = z
  .object({
    tenantId: z.string().optional(),

    patientId: z.string(),
    patientName: z.string().min(1),

    type: appointmentTypeSchema.default("Consultation"),

    start: apiDateTimeSchema,
    end: apiDateTimeSchema,

    status: appointmentStatusSchema.default("Booked"),

    reason: z.string().min(1),

    room: z.string().min(1),
    gp: z.string().min(1),
  })
  .refine((data) => new Date(data.end) > new Date(data.start), {
    message: "End time must be after start time",
    path: ["end"],
  });

//
// -------------------------------------------------
// Update Appointment
// -------------------------------------------------
export const appointmentUpdateSchema = z
  .object({
    tenantId: z.string().optional(),

    patientId: z.string().optional(),
    patientName: z.string().min(1).optional(),

    type: appointmentTypeSchema.optional(),

    start: apiDateTimeSchema.optional(),
    end: apiDateTimeSchema.optional(),

    status: appointmentStatusSchema.optional(),

    reason: z.string().min(1).optional(),

    room: z.string().min(1).optional(),
    gp: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      !data.start ||
      !data.end ||
      new Date(data.end) > new Date(data.start),
    {
      message: "End time must be after start time",
      path: ["end"],
    }
  );

//
// -------------------------------------------------
// Safe Output
// -------------------------------------------------
export const appointmentOutSchema = appointmentSchema;
