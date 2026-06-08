import { z } from "zod";

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
  ts: z.string().transform((val) => new Date(val)),
  action: z.string(),
  detail: z.string(),
  type: auditTypeEnum,
  createdAt: z.string().transform((val) => new Date(val)),
  updatedAt: z.string().transform((val) => new Date(val)),

});