import { z } from "zod";
import {
  invoiceSchema,
  invoiceCreateSchema,
  invoiceUpdateSchema,
  invoiceOutSchema,
  invoiceStatusUpdateSchema,
} from "@/schema/invoice";

//
// -------------------------------------------------
// Core Types
// -------------------------------------------------
export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceCreate = z.infer<typeof invoiceCreateSchema>;
export type InvoiceUpdate = z.infer<typeof invoiceUpdateSchema>;
export type InvoiceStatusUpdate = z.infer<typeof invoiceStatusUpdateSchema>;

//
// -------------------------------------------------
// Output
// -------------------------------------------------
export type InvoiceOut = z.infer<typeof invoiceOutSchema>;

//
// -------------------------------------------------
// Derived Types
// -------------------------------------------------
export type InvoiceType = Invoice["type"];
export type InvoiceStatus = Invoice["status"];