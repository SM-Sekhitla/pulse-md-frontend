export type AuditType =
  | "create"
  | "change"
  | "cancel"
  | "price"
  | "login"
  | "export"
  | "role"
  | "delete";

export interface Audit {
  id: string;            // maps from _id
  timestamp: Date;     // ISO string (datetime)
  user: string;
  action: string;
  detail: string;
  type: AuditType;

  createdAt: Date;
  updatedAt: Date;
}

export interface AuditCreate {
  user: string;
  action: string;
  detail: string;
  type: AuditType;
}

export interface AuditUpdate {
  user?: string;
  action?: string;
  detail?: string;
  type?: AuditType;
}

export type AuditOut = Audit;