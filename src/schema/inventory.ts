import { z } from "zod";

//
// -------------------------------------------------
// Base Inventory
// -------------------------------------------------
export const inventorySchema = z.object({
  id: z.string(),

  tenantId: z.string().optional(),

  name: z.string().min(1),
  category: z.string().min(1),

  sku: z.string().min(1),

  stock: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),

  unitCost: z.number().min(0),
  sellingPrice: z.number().min(0),

  expiry: z.string().date(),

  supplier: z.string().min(1),
});

//
// -------------------------------------------------
// Create Inventory
// -------------------------------------------------
export const inventoryCreateSchema = z.object({
  tenantId: z.string().optional(),

  name: z.string().min(1),
  category: z.string().min(1),

  sku: z.string().min(1),

  stock: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(0),

  unitCost: z.number().min(0),
  sellingPrice: z.number().min(0),

  expiry: z.string().date(),

  supplier: z.string().min(1),
});

//
// -------------------------------------------------
// Update Inventory
// -------------------------------------------------
export const inventoryUpdateSchema = z.object({
  tenantId: z.string().optional(),

  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),

  sku: z.string().min(1).optional(),

  stock: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),

  unitCost: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),

  expiry: z.string().date().optional(),

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