// Mock data + localStorage store for PulseMD
import { addDays, format, startOfDay, subDays } from "date-fns";

export type Role = "owner" | "manager" | "receptionist" | "nurse" | "patient" | "super_admin";
export type TenantStatus = "pending_approval" | "active" | "suspended" | "rejected";
export type UserStatus = "invited" | "active" | "inactive";
export type Plan = "Starter" | "Growth" | "Enterprise";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  role: Role;
  tenantId: string | null; // super_admin has null
  status: UserStatus;
  phone?: string;
  practiceName?: string;
  practiceSlug?: string;
  hpcsa?: string;
  invitedBy?: string;
  inviteSentAt?: string;
  inviteToken?: string;
  deletedAt?: string;
  lastLogin?: string;
  passwordSet?: boolean;
  tempPassword?: string;
  password?: string;
  mustChangePassword?: boolean;
}

export const MODULE_KEYS = [
  "calendar", "patients", "appointments", "prescriptions", "sick_notes",
  "inventory", "equipment", "billing", "reports", "staff",
] as const;
export type ModuleKey = typeof MODULE_KEYS[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  calendar: "Calendar",
  patients: "Patients",
  appointments: "Appointments",
  prescriptions: "Prescriptions",
  sick_notes: "Sick notes",
  inventory: "Medical inventory",
  equipment: "Equipment",
  billing: "Billing & invoices",
  reports: "Financial reports",
  staff: "Staff & roles",
};

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  address?: string;
  province?: string;
  hpcsa?: string;
  vat?: string;
  plan: Plan;
  gpUserId: string;
  status: TenantStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  enabledModules?: ModuleKey[];
}

export interface Patient {
  id: string;
  tenantId?: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: "M" | "F";
  idNumber: string;
  phone: string;
  email: string;
  medicalAid: string;
  medicalAidNumber: string;
  allergies: string[];
  chronic: string[];
  lastVisit: string;
  active: boolean;
}

export type AppointmentStatus =
  | "Booked" | "Confirmed" | "Checked-in" | "In progress"
  | "Completed" | "No-show" | "Cancelled";

export type AppointmentType =
  | "Consultation" | "Follow-up" | "Procedure" | "Telehealth" | "Emergency" | "Walk-in";

export interface Appointment {
  id: string;
  tenantId?: string;
  patientId: string;
  patientName: string;
  type: AppointmentType;
  start: string;
  end: string;
  status: AppointmentStatus;
  reason: string;
  room: string;
  gp: string;
}

export interface InventoryItem {
  id: string;
  tenantId?: string;
  name: string;
  category: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  unitCost: number;
  sellingPrice: number;
  expiry: string;
  supplier: string;
}

export interface Invoice {
  id: string;
  tenantId?: string;
  number: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  amount: number;
  type: "Medical aid" | "Private";
  status: "Draft" | "Sent" | "Partially paid" | "Paid" | "Overdue" | "Void";
}

export interface AuditEvent {
  id: string;
  ts: string;
  type: string;
  message: string;
  tenantId?: string;
  actorEmail?: string;
}

export interface OutboxEmail {
  id: string;
  ts: string;
  to: string;
  subject: string;
  body: string;
  kind: string;
}

export interface PrescriptionItem {
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  gpName: string;
  hpcsa: string;
  issuedAt: string;
  validDays: number;
  diagnosis?: string;
  icd10?: string;
  items: PrescriptionItem[];
  securityCode: string;
  qrToken: string;
  qrHash: string;
}

export interface SickNote {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  gpName: string;
  hpcsa: string;
  issuedAt: string;
  fromDate: string;
  toDate: string;
  reason: string;
  icd10?: string;
  recommendation?: string;
  securityCode: string;
}

export interface PlatformSettings {
  superAdminEmail: string;
  supportEmail: string;
  maintenanceMode: boolean;
}

const KEY = "pulsemd:v5";

interface Store {
  user: User | null;
  users: User[];
  tenants: Tenant[];
  patients: Patient[];
  appointments: Appointment[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  audit: AuditEvent[];
  outbox: OutboxEmail[];
  prescriptions: Prescription[];
  sickNotes: SickNote[];
  settings: PlatformSettings;
  accentColor: string;
  practiceName: string;
}

const SA_NAMES = [
  ["Thandiwe", "Mokoena"], ["Sipho", "Dlamini"], ["Ayesha", "Patel"],
  ["Johan", "van der Merwe"], ["Naledi", "Khumalo"], ["Pieter", "Botha"],
  ["Zanele", "Nkosi"], ["Riaan", "Pretorius"], ["Lerato", "Mahlangu"],
  ["Fatima", "Cassim"], ["Brendon", "Naidoo"], ["Refilwe", "Sithole"],
  ["Karabo", "Mthembu"], ["Hannelie", "du Toit"], ["Tshepo", "Modise"],
  ["Imraan", "Ebrahim"], ["Mpho", "Maseko"], ["Anele", "Zulu"],
];

const MEDICAL_AIDS = ["Discovery Health", "Bonitas", "Momentum Health", "Medihelp", "Fedhealth", "GEMS", "Polmed"];

export function rid(p = ""): string {
  return p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}

function seed(): Store {
  const today = startOfDay(new Date());

  // Demo tenant (active, owned by Dr Naidoo)
  const demoTenantId = "tn_demo";
  const demoOwnerId = "u_demo_owner";
  const superAdminId = "u_super";

  const demoTenant: Tenant = {
    id: demoTenantId,
    name: "Northcliff Family Practice",
    slug: "northcliff",
    address: "12 Beyers Naude Drive, Northcliff, Johannesburg",
    province: "Gauteng",
    hpcsa: "MP0712345",
    vat: "4123456789",
    plan: "Growth",
    gpUserId: demoOwnerId,
    status: "active",
    createdAt: subDays(today, 60).toISOString(),
    approvedAt: subDays(today, 59).toISOString(),
    approvedBy: superAdminId,
    enabledModules: [...MODULE_KEYS],
  };

  // A pending tenant for demo
  const pendingTenantId = "tn_pending_demo";
  const pendingOwnerId = "u_pending_owner";
  const pendingTenant: Tenant = {
    id: pendingTenantId,
    name: "Sandton Medical Centre",
    slug: "sandton-medical",
    address: "1 Rivonia Road, Sandton",
    province: "Gauteng",
    hpcsa: "MP0998877",
    vat: "",
    plan: "Starter",
    gpUserId: pendingOwnerId,
    status: "pending_approval",
    createdAt: subDays(today, 1).toISOString(),
  };

  const users: User[] = [
    {
      id: superAdminId,
      email: "admin@pulsemd.co.za",
      firstName: "Platform",
      lastName: "Admin",
      title: "",
      role: "super_admin",
      tenantId: null,
      status: "active",
      passwordSet: true,
    },
    {
      id: demoOwnerId,
      email: "dr.naidoo@northcliff.health",
      firstName: "Mira",
      lastName: "Naidoo",
      title: "Dr",
      role: "owner",
      tenantId: demoTenantId,
      status: "active",
      phone: "+27 82 555 0123",
      practiceName: "Northcliff Family Practice",
      practiceSlug: "northcliff",
      hpcsa: "MP0712345",
      passwordSet: true,
      lastLogin: subDays(today, 0).toISOString(),
    },
    {
      id: pendingOwnerId,
      email: "dr.adams@sandtonmed.co.za",
      firstName: "Sarah",
      lastName: "Adams",
      title: "Dr",
      role: "owner",
      tenantId: pendingTenantId,
      status: "active",
      phone: "+27 83 111 2222",
      practiceName: "Sandton Medical Centre",
      practiceSlug: "sandton-medical",
      hpcsa: "MP0998877",
      passwordSet: true,
    },
    // sample receptionist (active) for demo tenant
    {
      id: "u_recep_lebo",
      email: "lebo@northcliff.health",
      firstName: "Lebo",
      lastName: "Khoza",
      title: "",
      role: "receptionist",
      tenantId: demoTenantId,
      status: "active",
      phone: "+27 82 555 0125",
      invitedBy: demoOwnerId,
      inviteSentAt: subDays(today, 30).toISOString(),
      passwordSet: true,
    },
  ];

  const patients: Patient[] = SA_NAMES.map((n, i) => ({
    id: rid("pt_"),
    tenantId: demoTenantId,
    firstName: n[0],
    lastName: n[1],
    dob: format(subDays(today, 365 * (20 + (i * 3) % 50) + i * 31), "yyyy-MM-dd"),
    gender: i % 2 === 0 ? "F" : "M",
    idNumber: `${(80 + i).toString().padStart(2, "0")}${(i * 7 % 12 + 1).toString().padStart(2, "0")}${((i * 13) % 28 + 1).toString().padStart(2, "0")}${(5000 + i * 91).toString().slice(0, 4)}087`,
    phone: `+2782${(1000000 + i * 73219).toString().slice(0, 7)}`,
    email: `${n[0].toLowerCase()}.${n[1].toLowerCase().replace(/\s/g, "")}@example.co.za`,
    medicalAid: MEDICAL_AIDS[i % MEDICAL_AIDS.length],
    medicalAidNumber: `${100000 + i * 4231}`,
    allergies: i % 4 === 0 ? ["Penicillin"] : i % 5 === 0 ? ["Peanuts", "Latex"] : [],
    chronic: i % 3 === 0 ? ["Hypertension"] : i % 7 === 0 ? ["Type 2 Diabetes"] : [],
    lastVisit: format(subDays(today, (i * 11) % 90), "yyyy-MM-dd"),
    active: true,
  }));

  const types: AppointmentType[] = ["Consultation", "Follow-up", "Procedure", "Telehealth", "Emergency", "Walk-in"];
  const statuses: AppointmentStatus[] = ["Booked", "Confirmed", "Checked-in", "In progress", "Completed"];
  const appointments: Appointment[] = [];
  for (let d = -3; d <= 14; d++) {
    const day = addDays(today, d);
    const count = d === 0 ? 12 : 4 + (Math.abs(d) % 5);
    for (let i = 0; i < count; i++) {
      const hour = 8 + Math.floor(i * (10 / count));
      const minute = (i % 2) * 30;
      const p = patients[(i + Math.abs(d) * 3) % patients.length];
      const start = new Date(day);
      start.setHours(hour, minute, 0, 0);
      const end = new Date(start.getTime() + 20 * 60000);
      appointments.push({
        id: rid("ap_"),
        tenantId: demoTenantId,
        patientId: p.id,
        patientName: `${p.firstName} ${p.lastName}`,
        type: types[i % types.length],
        start: start.toISOString(),
        end: end.toISOString(),
        status: d < 0 ? "Completed" : (d === 0 && i < 4 ? statuses[i] : "Booked"),
        reason: ["Routine check-up", "BP review", "Flu symptoms", "Repeat script", "Blood test follow-up"][i % 5],
        room: `Room ${(i % 3) + 1}`,
        gp: "Dr. M. Naidoo",
      });
    }
  }

  const inventory: InventoryItem[] = [
    { id: rid("in_"), tenantId: demoTenantId, name: "Amoxicillin 500mg", category: "Prescription medication", sku: "AMX-500", stock: 124, reorderLevel: 50, unitCost: 1.2, sellingPrice: 4.5, expiry: format(addDays(today, 180), "yyyy-MM-dd"), supplier: "MediSupply SA" },
    { id: rid("in_"), tenantId: demoTenantId, name: "Paracetamol 500mg", category: "OTC medication", sku: "PCM-500", stock: 8, reorderLevel: 100, unitCost: 0.4, sellingPrice: 1.5, expiry: format(addDays(today, 45), "yyyy-MM-dd"), supplier: "Pharma Direct" },
    { id: rid("in_"), tenantId: demoTenantId, name: "Surgical gloves (M)", category: "PPE", sku: "GLV-M", stock: 320, reorderLevel: 100, unitCost: 0.8, sellingPrice: 0, expiry: format(addDays(today, 730), "yyyy-MM-dd"), supplier: "MediSupply SA" },
    { id: rid("in_"), tenantId: demoTenantId, name: "Influenza vaccine", category: "Vaccine", sku: "FLU-22", stock: 14, reorderLevel: 30, unitCost: 65, sellingPrice: 180, expiry: format(addDays(today, 22), "yyyy-MM-dd"), supplier: "VaxCo" },
    { id: rid("in_"), tenantId: demoTenantId, name: "Disposable syringe 5ml", category: "Consumable", sku: "SYR-5", stock: 540, reorderLevel: 200, unitCost: 0.6, sellingPrice: 0, expiry: format(addDays(today, 900), "yyyy-MM-dd"), supplier: "MediSupply SA" },
    { id: rid("in_"), tenantId: demoTenantId, name: "Multivitamin tablets", category: "Supplement", sku: "MVT-90", stock: 60, reorderLevel: 25, unitCost: 35, sellingPrice: 85, expiry: format(addDays(today, 365), "yyyy-MM-dd"), supplier: "Pharma Direct" },
    { id: rid("in_"), tenantId: demoTenantId, name: "Surgical mask (50pk)", category: "PPE", sku: "MSK-50", stock: 18, reorderLevel: 40, unitCost: 25, sellingPrice: 0, expiry: format(addDays(today, 540), "yyyy-MM-dd"), supplier: "MediSupply SA" },
    { id: rid("in_"), tenantId: demoTenantId, name: "Adrenaline 1mg/ml", category: "Prescription medication", sku: "ADR-1", stock: 32, reorderLevel: 10, unitCost: 18, sellingPrice: 65, expiry: format(addDays(today, 14), "yyyy-MM-dd"), supplier: "VaxCo" },
  ];

  const invoices: Invoice[] = patients.slice(0, 14).map((p, i) => ({
    id: rid("iv_"),
    tenantId: demoTenantId,
    number: `PM-${(2400 + i).toString()}`,
    patientId: p.id,
    patientName: `${p.firstName} ${p.lastName}`,
    date: format(subDays(today, (i * 5) % 60), "yyyy-MM-dd"),
    dueDate: format(addDays(subDays(today, (i * 5) % 60), 30), "yyyy-MM-dd"),
    amount: 350 + (i * 173) % 2400,
    type: i % 3 === 0 ? "Private" : "Medical aid",
    status: (["Paid", "Paid", "Sent", "Partially paid", "Overdue", "Paid", "Sent"] as const)[i % 7],
  }));

  const audit: AuditEvent[] = [
    { id: rid("ev_"), ts: subDays(today, 60).toISOString(), type: "registration", message: "Northcliff Family Practice registered", tenantId: demoTenantId },
    { id: rid("ev_"), ts: subDays(today, 59).toISOString(), type: "approval", message: "Northcliff Family Practice approved", tenantId: demoTenantId, actorEmail: "admin@pulsemd.co.za" },
    { id: rid("ev_"), ts: subDays(today, 1).toISOString(), type: "registration", message: "Sandton Medical Centre registered", tenantId: pendingTenantId },
  ];

  return {
    user: null,
    users,
    tenants: [demoTenant, pendingTenant],
    patients,
    appointments,
    inventory,
    invoices,
    audit,
    outbox: [],
    prescriptions: [],
    sickNotes: [],
    settings: {
      superAdminEmail: "admin@pulsemd.co.za",
      supportEmail: "support@pulsemd.co.za",
      maintenanceMode: false,
    },
    accentColor: "#3B7BF8",
    practiceName: "Northcliff Family Practice",
  };
}

function load(): Store {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Store;
  } catch {
    return seed();
  }
}

function save(s: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export const store = {
  get: load,
  set: (updater: (s: Store) => Store) => {
    const next = updater(load());
    save(next);
    return next;
  },
  reset: () => {
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
    const s = seed();
    save(s);
    return s;
  },
};

// ─── Auth ──────────────────────────────────────────

export function loginByEmail(email: string, password?: string): { ok: boolean; user?: User; error?: string } {
  const s = load();
  const u = s.users.find((x) => x.email.toLowerCase() === email.toLowerCase() && !x.deletedAt);
  if (!u) return { ok: false, error: "No account found for that email." };
  if (u.status === "inactive") return { ok: false, error: "This account is deactivated." };
  if (u.status === "invited") return { ok: false, error: "You haven't set up your account yet. Check your invite email." };
  if (password !== undefined && password !== "") {
    const expected = u.mustChangePassword ? u.tempPassword : u.password;
    // Demo fallback: if no stored password, accept "demo"
    if (expected) {
      if (password !== expected) return { ok: false, error: "Incorrect password." };
    } else if (password !== "demo") {
      return { ok: false, error: "Incorrect password." };
    }
  }
  const updated = { ...u, lastLogin: new Date().toISOString() };
  store.set((st) => ({ ...st, user: updated, users: st.users.map((x) => x.id === u.id ? updated : x) }));
  return { ok: true, user: updated };
}

// Legacy helper kept for compatibility
export function login(_role: Role = "owner"): User {
  const r = loginByEmail("dr.naidoo@northcliff.health");
  return r.user!;
}

export function logout() {
  store.set((s) => ({ ...s, user: null }));
}

export function currentUser(): User | null {
  if (typeof window === "undefined") return null;
  return load().user;
}

export function currentTenant(): Tenant | null {
  const u = currentUser();
  if (!u || !u.tenantId) return null;
  return load().tenants.find((t) => t.id === u.tenantId) || null;
}

export function formatZAR(n: number): string {
  return "R " + n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Tenant lifecycle ──────────────────────────────

export function registerTenant(input: {
  practiceName: string; address?: string; province?: string; hpcsa?: string; vat?: string;
  plan: Plan; title: string; firstName: string; lastName: string; email: string; phone?: string;
}): { tenant: Tenant; user: User } {
  const tenantId = rid("tn_");
  const userId = rid("u_");
  const slug = input.practiceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const tenant: Tenant = {
    id: tenantId, name: input.practiceName, slug, address: input.address, province: input.province,
    hpcsa: input.hpcsa, vat: input.vat, plan: input.plan, gpUserId: userId,
    status: "pending_approval", createdAt: new Date().toISOString(),
  };
  const user: User = {
    id: userId, email: input.email, firstName: input.firstName, lastName: input.lastName,
    title: input.title, role: "owner", tenantId, status: "active", phone: input.phone,
    practiceName: input.practiceName, practiceSlug: slug, hpcsa: input.hpcsa, passwordSet: true,
    lastLogin: new Date().toISOString(),
  };
  store.set((s) => ({
    ...s,
    tenants: [...s.tenants, tenant],
    users: [...s.users, user],
    user,
    audit: [{ id: rid("ev_"), ts: new Date().toISOString(), type: "registration", message: `${input.practiceName} registered`, tenantId }, ...s.audit],
    outbox: [{
      id: rid("em_"), ts: new Date().toISOString(),
      to: s.settings.superAdminEmail,
      subject: `New PulseMD registration: ${input.practiceName}`,
      kind: "admin_alert",
      body: `A new practice has registered and is awaiting approval.\n\nPractice: ${input.practiceName}\nGP: ${input.title} ${input.firstName} ${input.lastName}\nEmail: ${input.email}\nHPCSA: ${input.hpcsa}\nPlan: ${input.plan}\n\nReview at: /admin/practices/${tenantId}`,
    }, ...s.outbox],
  }));
  return { tenant, user };
}

function generateTempPassword(): string {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  for (let i = 0; i < 4; i++) s += digits[Math.floor(Math.random() * digits.length)];
  return "Pulse-" + s;
}

export function approveTenant(tenantId: string, actor: User) {
  store.set((s) => {
    const tenant = s.tenants.find((t) => t.id === tenantId);
    if (!tenant) return s;
    const updated: Tenant = {
      ...tenant, status: "active", approvedAt: new Date().toISOString(), approvedBy: actor.id,
      enabledModules: tenant.enabledModules ?? [...MODULE_KEYS],
    };
    const owner = s.users.find((u) => u.id === tenant.gpUserId);
    const tempPw = generateTempPassword();
    const updatedOwner = owner ? { ...owner, tempPassword: tempPw, mustChangePassword: true, passwordSet: false, password: undefined } : null;
    return {
      ...s,
      tenants: s.tenants.map((t) => t.id === tenantId ? updated : t),
      users: updatedOwner ? s.users.map((u) => u.id === updatedOwner.id ? updatedOwner : u) : s.users,
      audit: [{ id: rid("ev_"), ts: new Date().toISOString(), type: "approval", message: `${tenant.name} approved`, tenantId, actorEmail: actor.email }, ...s.audit],
      outbox: owner ? [{
        id: rid("em_"), ts: new Date().toISOString(), to: owner.email, kind: "approval",
        subject: "Your PulseMD account is approved",
        body: `Welcome to PulseMD, ${owner.title} ${owner.lastName}!\n\nYour practice "${tenant.name}" has been approved.\n\nYour temporary password is:\n\n    ${tempPw}\n\nSign in at /login using your email and this temporary password. You will be asked to set a new password on first login.\n\nNeed help? Contact ${s.settings.supportEmail}.`,
      }, ...s.outbox] : s.outbox,
    };
  });
}

export function rejectTenant(tenantId: string, reason: string, actor: User) {
  store.set((s) => {
    const tenant = s.tenants.find((t) => t.id === tenantId);
    if (!tenant) return s;
    const updated: Tenant = { ...tenant, status: "rejected", rejectionReason: reason };
    const owner = s.users.find((u) => u.id === tenant.gpUserId);
    return {
      ...s,
      tenants: s.tenants.map((t) => t.id === tenantId ? updated : t),
      audit: [{ id: rid("ev_"), ts: new Date().toISOString(), type: "rejection", message: `${tenant.name} rejected`, tenantId, actorEmail: actor.email }, ...s.audit],
      outbox: owner ? [{
        id: rid("em_"), ts: new Date().toISOString(), to: owner.email, kind: "rejection",
        subject: "Your PulseMD application",
        body: `Your application for "${tenant.name}" was not approved.\n\nReason: ${reason}\n\nIf you have questions, contact ${s.settings.supportEmail}.`,
      }, ...s.outbox] : s.outbox,
    };
  });
}

export function suspendTenant(tenantId: string, reason: string, actor: User) {
  store.set((s) => {
    const tenant = s.tenants.find((t) => t.id === tenantId);
    if (!tenant) return s;
    const updated: Tenant = { ...tenant, status: "suspended", suspendedAt: new Date().toISOString(), suspensionReason: reason };
    const owner = s.users.find((u) => u.id === tenant.gpUserId);
    return {
      ...s,
      tenants: s.tenants.map((t) => t.id === tenantId ? updated : t),
      audit: [{ id: rid("ev_"), ts: new Date().toISOString(), type: "suspension", message: `${tenant.name} suspended`, tenantId, actorEmail: actor.email }, ...s.audit],
      outbox: owner ? [{
        id: rid("em_"), ts: new Date().toISOString(), to: owner.email, kind: "suspension",
        subject: "Your PulseMD account has been suspended",
        body: `Your access to PulseMD has been suspended.\n\nReason: ${reason}\n\nContact ${s.settings.supportEmail}.`,
      }, ...s.outbox] : s.outbox,
    };
  });
}

export function reinstateTenant(tenantId: string, actor: User) {
  store.set((s) => {
    const tenant = s.tenants.find((t) => t.id === tenantId);
    if (!tenant) return s;
    const updated: Tenant = { ...tenant, status: "active", suspendedAt: undefined, suspensionReason: undefined };
    const owner = s.users.find((u) => u.id === tenant.gpUserId);
    return {
      ...s,
      tenants: s.tenants.map((t) => t.id === tenantId ? updated : t),
      audit: [{ id: rid("ev_"), ts: new Date().toISOString(), type: "reinstate", message: `${tenant.name} reinstated`, tenantId, actorEmail: actor.email }, ...s.audit],
      outbox: owner ? [{
        id: rid("em_"), ts: new Date().toISOString(), to: owner.email, kind: "reinstate",
        subject: "Your PulseMD account is active again",
        body: `Welcome back. Your access to PulseMD has been restored.`,
      }, ...s.outbox] : s.outbox,
    };
  });
}

// ─── Staff (receptionist) ──────────────────────────

export function inviteReceptionist(input: { firstName: string; lastName: string; email: string; phone?: string }, actor: User): User {
  const token = rid("inv_");
  const newUser: User = {
    id: rid("u_"),
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    title: "",
    role: "receptionist",
    tenantId: actor.tenantId,
    status: "invited",
    phone: input.phone,
    invitedBy: actor.id,
    inviteSentAt: new Date().toISOString(),
    inviteToken: token,
    passwordSet: false,
  };
  store.set((s) => ({
    ...s,
    users: [...s.users, newUser],
    outbox: [{
      id: rid("em_"), ts: new Date().toISOString(), to: input.email, kind: "invite",
      subject: `You've been invited to join ${actor.practiceName} on PulseMD`,
      body: `${actor.title} ${actor.firstName} ${actor.lastName} has invited you as a Receptionist.\n\nAccept invite: /invite/${token}`,
    }, ...s.outbox],
  }));
  return newUser;
}

export function resendInvite(userId: string) {
  const s = load();
  const u = s.users.find(x => x.id === userId);
  if (!u || !u.inviteToken) return;
  store.set((st) => ({
    ...st,
    users: st.users.map(x => x.id === userId ? { ...x, inviteSentAt: new Date().toISOString() } : x),
    outbox: [{
      id: rid("em_"), ts: new Date().toISOString(), to: u.email, kind: "invite_resend",
      subject: `Reminder: your PulseMD invite`,
      body: `Accept invite: /invite/${u.inviteToken}`,
    }, ...st.outbox],
  }));
}

export function acceptInvite(token: string, _password: string): { ok: boolean; user?: User; error?: string } {
  const s = load();
  const u = s.users.find(x => x.inviteToken === token && x.status === "invited");
  if (!u) return { ok: false, error: "This invite link has expired or is invalid." };
  const updated: User = { ...u, status: "active", passwordSet: true, inviteToken: undefined, lastLogin: new Date().toISOString() };
  store.set((st) => ({
    ...st,
    user: updated,
    users: st.users.map(x => x.id === u.id ? updated : x),
  }));
  return { ok: true, user: updated };
}

export function setUserStatus(userId: string, status: UserStatus) {
  store.set((s) => ({ ...s, users: s.users.map(u => u.id === userId ? { ...u, status } : u) }));
}

export function updateStaff(userId: string, patch: Partial<User>) {
  store.set((s) => ({ ...s, users: s.users.map(u => u.id === userId ? { ...u, ...patch } : u) }));
}

export function softDeleteUser(userId: string) {
  store.set((s) => ({
    ...s,
    users: s.users.map(u => u.id === userId ? { ...u, deletedAt: new Date().toISOString(), status: "inactive" } : u),
  }));
}

export function tenantStaff(tenantId: string): User[] {
  return load().users.filter(u => u.tenantId === tenantId && u.role === "receptionist" && !u.deletedAt);
}

export function tenantPatientCount(tenantId: string): number {
  return load().patients.filter(p => !p.tenantId || p.tenantId === tenantId).length;
}

export function updateSettings(patch: Partial<PlatformSettings>) {
  store.set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function planPrice(p: Plan): number {
  return p === "Starter" ? 799 : p === "Growth" ? 1799 : 4500;
}

// ─── Password change ───────────────────────────────

export function changePassword(userId: string, newPassword: string): { ok: boolean; error?: string } {
  const s = load();
  const u = s.users.find(x => x.id === userId);
  if (!u) return { ok: false, error: "User not found" };
  if (newPassword.length < 8 || !/\d/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
    return { ok: false, error: "Password must be at least 8 characters with 1 number and 1 uppercase letter." };
  }
  const updated: User = { ...u, password: newPassword, tempPassword: undefined, mustChangePassword: false, passwordSet: true };
  store.set((st) => ({ ...st, user: st.user?.id === userId ? updated : st.user, users: st.users.map(x => x.id === userId ? updated : x) }));
  return { ok: true };
}

// ─── Module access control ─────────────────────────

export function setTenantModules(tenantId: string, modules: ModuleKey[]) {
  store.set((s) => ({
    ...s,
    tenants: s.tenants.map(t => t.id === tenantId ? { ...t, enabledModules: modules } : t),
    audit: [{ id: rid("ev_"), ts: new Date().toISOString(), type: "modules_updated", message: `Modules updated for ${s.tenants.find(t => t.id === tenantId)?.name}`, tenantId, actorEmail: s.user?.email }, ...s.audit],
  }));
}

export function tenantEnabledModules(tenantId: string | null | undefined): ModuleKey[] {
  if (!tenantId) return [...MODULE_KEYS];
  const t = load().tenants.find(x => x.id === tenantId);
  return t?.enabledModules ?? [...MODULE_KEYS];
}

// ─── Appointments ──────────────────────────────────

export function createAppointment(input: Omit<Appointment, "id">): Appointment {
  const tid = input.tenantId ?? currentUser()?.tenantId ?? undefined;
  const a: Appointment = { ...input, tenantId: tid || undefined, id: rid("ap_") };
  store.set((s) => ({ ...s, appointments: [a, ...s.appointments] }));
  return a;
}

export function createPatient(input: Omit<Patient, "id" | "tenantId" | "lastVisit" | "active"> & { lastVisit?: string; active?: boolean }): Patient {
  const tid = currentUser()?.tenantId || undefined;
  const p: Patient = {
    ...input,
    id: rid("pt_"),
    tenantId: tid,
    lastVisit: input.lastVisit ?? new Date().toISOString().slice(0, 10),
    active: input.active ?? true,
    allergies: input.allergies ?? [],
    chronic: input.chronic ?? [],
  };
  store.set((s) => ({ ...s, patients: [p, ...s.patients] }));
  return p;
}

// ─── Prescriptions & sick notes ────────────────────

function generateSecurityCode(): string {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 12; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}

export function createPrescription(input: Omit<Prescription, "id" | "securityCode" | "issuedAt"> & { issuedAt?: string }): Prescription {
  const p: Prescription = {
    ...input,
    id: rid("rx_"),
    securityCode: generateSecurityCode(),
    issuedAt: input.issuedAt ?? new Date().toISOString(),
  };
  store.set((s) => ({ ...s, prescriptions: [p, ...(s.prescriptions ?? [])] }));
  return p;
}

export function createSickNote(input: Omit<SickNote, "id" | "securityCode" | "issuedAt"> & { issuedAt?: string }): SickNote {
  const n: SickNote = {
    ...input,
    id: rid("sn_"),
    securityCode: generateSecurityCode(),
    issuedAt: input.issuedAt ?? new Date().toISOString(),
  };
  store.set((s) => ({ ...s, sickNotes: [n, ...(s.sickNotes ?? [])] }));
  return n;
}

export function tenantPrescriptions(tenantId: string | null | undefined): Prescription[] {
  if (!tenantId) return [];
  return (load().prescriptions ?? []).filter((p) => p.tenantId === tenantId);
}

export function tenantSickNotes(tenantId: string | null | undefined): SickNote[] {
  if (!tenantId) return [];
  return (load().sickNotes ?? []).filter((n) => n.tenantId === tenantId);
}

export function patientAppointments(patientId: string): Appointment[] {
  return load().appointments.filter((a) => a.patientId === patientId).sort((a, b) => b.start.localeCompare(a.start));
}

// ─── Tenant-scoped data helpers ────────────────────

export function tenantPatients(tenantId: string | null | undefined): Patient[] {
  if (!tenantId) return [];
  return load().patients.filter((p) => p.tenantId === tenantId);
}

export function tenantAppointments(tenantId: string | null | undefined): Appointment[] {
  if (!tenantId) return [];
  return load().appointments.filter((a) => a.tenantId === tenantId);
}

export function tenantInventory(tenantId: string | null | undefined): InventoryItem[] {
  if (!tenantId) return [];
  return load().inventory.filter((i) => i.tenantId === tenantId);
}

export function tenantInvoices(tenantId: string | null | undefined): Invoice[] {
  if (!tenantId) return [];
  return load().invoices.filter((i) => i.tenantId === tenantId);
}

/** Returns a fresh snapshot of the store with patients/appointments/inventory/invoices
 *  filtered to the current user's tenant. Other fields are passed through unchanged. */
export function myScopedStore() {
  const s = load();
  const tid = s.user?.tenantId || null;
  if (!tid) return s;
  return {
    ...s,
    patients: s.patients.filter((p) => p.tenantId === tid),
    appointments: s.appointments.filter((a) => a.tenantId === tid),
    inventory: s.inventory.filter((i) => i.tenantId === tid),
    invoices: s.invoices.filter((i) => i.tenantId === tid),
  };
}

// ─── Inventory mutations ───────────────────────────

export const INVENTORY_CATEGORIES = [
  "Prescription medication",
  "OTC medication",
  "PPE",
  "Vaccine",
  "Consumable",
  "Supplement",
  "Equipment",
  "Other",
] as const;

export function receiveStock(input: {
  itemId?: string; // when adding to existing item
  name?: string;
  category?: string;
  sku?: string;
  quantity: number;
  unitCost?: number;
  sellingPrice?: number;
  reorderLevel?: number;
  expiry?: string;
  supplier?: string;
}): InventoryItem {
  const tid = currentUser()?.tenantId || undefined;
  const s = load();
  if (input.itemId) {
    const existing = s.inventory.find((i) => i.id === input.itemId);
    if (existing) {
      const updated: InventoryItem = {
        ...existing,
        stock: existing.stock + input.quantity,
        unitCost: input.unitCost ?? existing.unitCost,
        sellingPrice: input.sellingPrice ?? existing.sellingPrice,
        reorderLevel: input.reorderLevel ?? existing.reorderLevel,
        expiry: input.expiry ?? existing.expiry,
        supplier: input.supplier ?? existing.supplier,
      };
      store.set((st) => ({ ...st, inventory: st.inventory.map((i) => i.id === existing.id ? updated : i) }));
      return updated;
    }
  }
  const item: InventoryItem = {
    id: rid("in_"),
    tenantId: tid,
    name: input.name || "Unnamed item",
    category: input.category || "Other",
    sku: input.sku || `SKU-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    stock: input.quantity,
    reorderLevel: input.reorderLevel ?? 10,
    unitCost: input.unitCost ?? 0,
    sellingPrice: input.sellingPrice ?? 0,
    expiry: input.expiry || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    supplier: input.supplier || "",
  };
  store.set((st) => ({ ...st, inventory: [item, ...st.inventory] }));
  return item;
}

export function adjustStock(itemId: string, delta: number, _reason?: string): InventoryItem | null {
  const s = load();
  const it = s.inventory.find((i) => i.id === itemId);
  if (!it) return null;
  const next = Math.max(0, it.stock + delta);
  const updated = { ...it, stock: next };
  store.set((st) => ({ ...st, inventory: st.inventory.map((i) => i.id === itemId ? updated : i) }));
  return updated;
}

