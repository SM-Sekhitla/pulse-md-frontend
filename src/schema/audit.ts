import { z } from "zod";
import { apiDateTimeSchema } from "./user";

export const auditTypeEnum = z.enum([
  "create",
  "change",
  "cancel",
  "price",
  "login",
  "export",
  "role",
  "delete",
]);

export const auditSchema = z.object({
  id: z.string(),
  ts: apiDateTimeSchema,
  message: z.string(),
  type: auditTypeEnum,
  tenantId: z.string().nullish(),
  actorEmail: z.string().email().nullish(),
  createdAt: apiDateTimeSchema.nullish(),
  updatedAt: apiDateTimeSchema.nullish(),
});

export const auditCreateSchema = z.object({
  message: z.string().min(1),
  type: auditTypeEnum,
  tenantId: z.string().optional(),
  actorEmail: z.string().email().optional(),
});

export const auditUpdateSchema = auditCreateSchema
  .partial()
  .extend({
    ts: apiDateTimeSchema.optional(),
  });
