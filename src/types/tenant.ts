import { z } from "zod";
import {
  tenantSchema,
  tenantCreateSchema,
  tenantUpdateSchema,
  tenantOutSchema,
} from "@/schema/tenant";

//
// -------------------------------------------------
// Core Types
// -------------------------------------------------
export type Tenant = z.infer<typeof tenantSchema>;
export type TenantCreate = z.infer<typeof tenantCreateSchema>;
export type TenantUpdate = z.infer<typeof tenantUpdateSchema>;

//
// -------------------------------------------------
// Output
// -------------------------------------------------
export type TenantOut = z.infer<typeof tenantOutSchema>;

//
// -------------------------------------------------
// Derived Enums
// -------------------------------------------------
export type TenantStatus = Tenant["status"];
export type Plan = Tenant["plan"];
export type ModuleKey = NonNullable<Tenant["enabledModules"]>[number];