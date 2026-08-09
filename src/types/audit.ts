import { z } from "zod";
import {
  auditCreateSchema,
  auditSchema,
  auditTypeEnum,
  auditUpdateSchema,
} from "@/schema/audit";

export type AuditType = z.infer<typeof auditTypeEnum>;
export type Audit = z.infer<typeof auditSchema>;
export type AuditCreate = z.infer<typeof auditCreateSchema>;
export type AuditUpdate = z.infer<typeof auditUpdateSchema>;
export type AuditOut = Audit;
