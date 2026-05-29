import { z } from "zod";
import {
  inventorySchema,
  inventoryCreateSchema,
  inventoryUpdateSchema,
  inventoryStockUpdateSchema,
  inventoryOutSchema,
} from "@/schema/inventory";

//
// -------------------------------------------------
// Core Types
// -------------------------------------------------
export type Inventory = z.infer<typeof inventorySchema>;
export type InventoryCreate = z.infer<typeof inventoryCreateSchema>;
export type InventoryUpdate = z.infer<typeof inventoryUpdateSchema>;
export type InventoryStockUpdate = z.infer<typeof inventoryStockUpdateSchema>;

//
// -------------------------------------------------
// Output
// -------------------------------------------------
export type InventoryOut = z.infer<typeof inventoryOutSchema>;