import { z } from "zod";

//
// -------------------------------------------------
// Enums
// -------------------------------------------------
export const invoiceTypeSchema = z.enum([
  "Medical aid",
  "Private",
]);

export const invoiceStatusSchema = z.enum([
  "Draft",
  "Sent",
  "Partially paid",
  "Paid",
  "Overdue",
  "Void",
]);

//
// -------------------------------------------------
// Base Invoice
// -------------------------------------------------
export const invoiceSchema = z
  .object({
    id: z.string(),

    tenantId: z.string().optional(),

    number: z.string().min(1),

    patientId: z.string(),
    patientName: z.string().min(1),

    date: z.string().date(),
    dueDate: z.string().date(),

    amount: z.number().min(0),

    type: invoiceTypeSchema,
    status: invoiceStatusSchema.default("Draft"),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.date), {
    message: "Due date must be on or after invoice date",
    path: ["dueDate"],
  });

//
// -------------------------------------------------
// Create Invoice
// -------------------------------------------------
export const invoiceCreateSchema = z
  .object({
    tenantId: z.string().optional(),

    number: z.string().min(1),

    patientId: z.string(),
    patientName: z.string().min(1),

    date: z.string().date(),
    dueDate: z.string().date(),

    amount: z.number().min(0),

    type: invoiceTypeSchema.default("Private"),
    status: invoiceStatusSchema.default("Draft"),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.date), {
    message: "Due date must be on or after invoice date",
    path: ["dueDate"],
  });

//
// -------------------------------------------------
// Update Invoice
// -------------------------------------------------
export const invoiceUpdateSchema = z
  .object({
    tenantId: z.string().optional(),

    number: z.string().min(1).optional(),

    patientId: z.string().optional(),
    patientName: z.string().min(1).optional(),

    date: z.string().date().optional(),
    dueDate: z.string().date().optional(),

    amount: z.number().min(0).optional(),

    type: invoiceTypeSchema.optional(),
    status: invoiceStatusSchema.optional(),
  })
  .refine(
    (data) =>
      !data.date ||
      !data.dueDate ||
      new Date(data.dueDate) >= new Date(data.date),
    {
      message: "Due date must be on or after invoice date",
      path: ["dueDate"],
    }
  );


export const invoiceStatusUpdateSchema = z
  .object({
    
    status: invoiceStatusSchema.optional(),
  })
  .refine(
    (data) =>
      !data.status, 
    {
      message: "Select a new status",
      path: ["status"],
    }
  );

//
// -------------------------------------------------
// Safe Output
// -------------------------------------------------
export const invoiceOutSchema = invoiceSchema;