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
// Base Inventory
// -------------------------------------------------
export const inventorySchema = z.object({
  id: z.string(),

  tenantId: optionalString,

  name: z.string().min(1),
  category: z.string().min(1),

  sku: z.string().min(1),

  stock: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),

  unitCost: z.number().min(0),
  sellingPrice: z.number().min(0),

  expiry: dateOnlyString,

  supplier: z.string().min(1),
});

//
// -------------------------------------------------
// Create Inventory
// -------------------------------------------------
export const inventoryCreateSchema = z.object({
  tenantId: optionalString,

  name: z.string().min(1),
  category: z.string().min(1),

  sku: z.string().min(1),

  stock: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(0),

  unitCost: z.number().min(0),
  sellingPrice: z.number().min(0),

  expiry: dateOnlyString,

  supplier: z.string().min(1),
});

//
// -------------------------------------------------
// Update Inventory
// -------------------------------------------------
export const inventoryUpdateSchema = z.object({
  tenantId: optionalString,

  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),

  sku: z.string().min(1).optional(),

  stock: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),

  unitCost: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),

  expiry: optionalDateOnlyString,

  supplier: z.string().min(1).optional(),
});


export const inventoryStockUpdateSchema = z.object({
  stock: z.number().int().min(0),
});

//
// -------------------------------------------------
// Safe Output
// -------------------------------------------------
export const inventoryOutSchema = inventorySchema;
