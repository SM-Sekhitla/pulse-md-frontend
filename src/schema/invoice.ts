import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().optional(),
);

const dateOnlyString = z.preprocess((value) => {
  if (typeof value !== "string") return value;

  return Number.isNaN(Date.parse(value)) ? value : value.slice(0, 10);
}, z.string().date());

const optionalDateOnlyString = z.preprocess((value) => {
  if (value === null || value === "") return undefined;
  if (typeof value !== "string") return value;

  return Number.isNaN(Date.parse(value)) ? value : value.slice(0, 10);
}, z.string().date().optional());

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
export const billingTypeSchema = z.enum(["private", "medical_aid"]);
export const claimStatusSchema = z.enum([
  "not_submitted",
  "submitted",
  "paid",
  "partially_paid",
  "rejected",
  "appealed",
]);

const icd10CodeSchema = z.object({
  code: z.string(),
  description: z.string(),
  category: z.string().optional(),
});

const tariffCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
  rate: z.number().min(0),
  quantity: z.number().min(0),
  amount: z.number().min(0),
});

const medicalAidInvoiceFields = {
  billingType: billingTypeSchema.default("private"),
  medicalAidSchemeId: optionalString,
  medicalAidSchemeName: optionalString,
  medicalAidPlan: optionalString,
  medicalAidNumber: optionalString,
  mainMemberName: optionalString,
  dependantCode: optionalString,
  claimStatus: claimStatusSchema.optional().default("not_submitted"),
  schemeBilledAmount: z.number().min(0).optional().default(0),
  schemePaidAmount: z.number().min(0).optional().default(0),
  patientCopayment: z.number().min(0).optional().default(0),
  icd10Codes: z.array(icd10CodeSchema).optional().default([]),
  tariffCodes: z.array(tariffCodeSchema).optional().default([]),
  claimReference: optionalString,
  serviceDate: optionalDateOnlyString,
};

//
// -------------------------------------------------
// Base Invoice
// -------------------------------------------------
export const invoiceSchema = z
  .object({
    id: z.string(),

    tenantId: optionalString,

    number: z.string().min(1),

    patientId: z.string(),
    patientName: z.string().min(1),

    date: dateOnlyString,
    dueDate: dateOnlyString,

    amount: z.number().min(0),

    type: invoiceTypeSchema,
    status: invoiceStatusSchema.default("Draft"),
    ...medicalAidInvoiceFields,
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
    tenantId: optionalString,

    number: z.string().min(1),

    patientId: z.string(),
    patientName: z.string().min(1),

    date: dateOnlyString,
    dueDate: dateOnlyString,

    amount: z.number().min(0),

    type: invoiceTypeSchema.default("Private"),
    status: invoiceStatusSchema.default("Draft"),
    ...medicalAidInvoiceFields,
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
    tenantId: optionalString,

    number: z.string().min(1).optional(),

    patientId: z.string().optional(),
    patientName: z.string().min(1).optional(),

    date: optionalDateOnlyString,
    dueDate: optionalDateOnlyString,

    amount: z.number().min(0).optional(),

    type: invoiceTypeSchema.optional(),
    status: invoiceStatusSchema.optional(),
    billingType: billingTypeSchema.optional(),
    medicalAidSchemeId: optionalString,
    medicalAidSchemeName: optionalString,
    medicalAidPlan: optionalString,
    medicalAidNumber: optionalString,
    mainMemberName: optionalString,
    dependantCode: optionalString,
    claimStatus: claimStatusSchema.optional(),
    schemeBilledAmount: z.number().min(0).optional(),
    schemePaidAmount: z.number().min(0).optional(),
    patientCopayment: z.number().min(0).optional(),
    icd10Codes: z.array(icd10CodeSchema).optional(),
    tariffCodes: z.array(tariffCodeSchema).optional(),
    claimReference: optionalString,
    serviceDate: optionalDateOnlyString,
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
      !!data.status, 
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
