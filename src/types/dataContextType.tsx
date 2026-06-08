import { PrescriptionCreate, PrescriptionUpdate } from "@/context/PrescriptionContext";

import {
  Inventory,
  InventoryCreate,
  InventoryStockUpdate,
  InventoryUpdate,
} from "./inventory";

import {
  Invoice,
  InvoiceCreate,
  InvoiceStatusUpdate,
  InvoiceUpdate,
} from "./invoice";

import {
  Patient,
  PatientCreate,
  PatientStatusUpdate,
  PatientUpdate,
} from "./patient";

import { PlatformSettings } from "./platformSettings";

import { Prescription, } from "./prescription";

import { 
  SickNote,
  SickNoteCreate,
  SickNoteUpdate, } from "./sicknote";


import { Tenant,
  TenantCreate,
  TenantUpdate,
  TenantStatus,
  Plan,
  ModuleKey,
  TenantOut, } from "./tenant";

import { User, UserCreate, UserUpdate } from "./user";
import { Audit, AuditCreate, AuditUpdate } from "./audit";
import { Appointment, AppointmentCreate, AppointmentOut } from "./appointment";

export interface DataContextType {
  isBootstrapping: boolean;

  /* ---------------- BOOKINGS ---------------- */
  invoice: {
      invoices: Invoice[];
      isInvoiceLoading: boolean;
    
      getInvoice: (
        id: string
      ) => Promise<Invoice | null>;
    
      createInvoice: (
        data: InvoiceCreate
      ) => Promise<Invoice>;
    
      updateInvoice: (
        id: string,
        data: InvoiceUpdate
      ) => Promise<Invoice | null>;
    
      updateInvoiceStatus: (
        id: string,
        data: InvoiceStatusUpdate
      ) => Promise<Invoice | null>;
    
      deleteInvoice: (
        id: string
      ) => Promise<boolean>;
  };

  /* ---------------- INSTALLER AVAILABILITY ---------------- */
  inventory: {
      inventoryList: Inventory[];
      isInventoryLoading: boolean;
    
      getInventoryItem: (
        id: string
      ) => Promise<Inventory | null>;
    
      createInventory: (
        data: InventoryCreate
      ) => Promise<Inventory>;
    
      updateInventory: (
        id: string,
        data: InventoryUpdate
      ) => Promise<Inventory | null>;
    
      updateStock: (
        id: string,
        data: InventoryStockUpdate
      ) => Promise<Inventory | null>;
    
      deleteInventory: (
        id: string
      ) => Promise<boolean>;
  };

  /* ---------------- INSTALLER SPECIALTIES ---------------- */
  patient: {
      patients: Patient[];
      isPatientLoading: boolean;
    
      getPatient: (
        id: string
      ) => Promise<Patient | null>;
    
      createPatient: (
        data: PatientCreate
      ) => Promise<Patient>;
    
      updatePatient: (
        id: string,
        data: PatientUpdate
      ) => Promise<Patient | null>;
    
      updatePatientStatus: (
        id: string,
        data: PatientStatusUpdate
      ) => Promise<Patient | null>;
    
      deletePatient: (
        id: string
      ) => Promise<boolean>;
  };

  /* ---------------- PROFILES ---------------- */
  platformSetting: {
    platformSettings: PlatformSettings | null;
    isPlatformSettingsLoading: boolean;

    getPlatformSettings: () => Promise<PlatformSettings | null>;

    createOrUpdatePlatformSettings: (
      data: PlatformSettings
    ) => Promise<PlatformSettings | null>;
  };

  /* ---------------- PORTFOLIO ITEMS ---------------- */
  prescription: {
      prescriptions: Prescription[];
      isPrescriptionLoading: boolean;
    
      getPrescription: (
        id: string
      ) => Promise<Prescription | null>;
    
      createPrescription: (
        data: PrescriptionCreate
      ) => Promise<Prescription>;
    
      updatePrescription: (
        id: string,
        data: PrescriptionUpdate
      ) => Promise<Prescription | null>;
    
      revokePrescription: (
        id: string
      ) => Promise<boolean>;
    
      deletePrescription: (
        id: string
      ) => Promise<boolean>;
  };

  /* ---------------- SPECIALTIES (MASTER TABLE) ---------------- */
  sicknote: {
    sickNotes: SickNote[];
    isLoading: boolean;

    getSickNote: (
      id: string
    ) => Promise<SickNote | null>;

    createSickNote: (
      data: SickNoteCreate
    ) => Promise<SickNote>;

    updateSickNote: (
      id: string,
      data: SickNoteUpdate
    ) => Promise<SickNote | null>;

    revokeSickNote: (
      id: string
    ) => Promise<boolean>;

    deleteSickNote: (
      id: string
    ) => Promise<boolean>;
  };


  tenant: {
    tenants: TenantOut[];
    isLoading: boolean;

    getTenant: (
      id: string
    ) => Promise<TenantOut | null>;

    getTenantBySlug: (
      slug: string
    ) => Promise<TenantOut | null>;

    createTenant: (
      data: TenantCreate
    ) => Promise<Tenant>;

    updateTenant: (
      id: string,
      data: TenantUpdate
    ) => Promise<Tenant | null>;

    updateTenantStatus: (
      id: string,
      status: TenantStatus
    ) => Promise<Tenant | null>;

    updateTenantPlan: (
      id: string,
      plan: Plan
    ) => Promise<Tenant | null>;

    approveTenant: (
      id: string
    ) => Promise<Tenant | null>;

    rejectTenant: (
      id: string,
      reason: string
    ) => Promise<Tenant | null>;

    suspendTenant: (
      id: string,
      reason: string
    ) => Promise<Tenant | null>;

    deleteTenant: (
      id: string
    ) => Promise<Tenant | null>;
  };

  /* ---------------- USERS ---------------- */
  user: {
    users: User[];

    stats: any[];

    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;

    createError: unknown;
    updateError: unknown;
    deleteError: unknown;

    get: (id: string) => Promise<User | null>;

    create: (data: UserCreate) => Promise<User>;
    update: (id: string, data: UserUpdate) => Promise<User>;
    delete: (id: string) => Promise<void>;

    updateRole: (id: string, role: string) => Promise<User>;
    changePassword: (id: string, newPassword: string) => Promise<User>;

    search: (query: string) => User[];
  };


  audit: {
    audits: Audit[];
    isLoading: boolean;
    getAudit: (id: string) => Promise<Audit | null>;
    
      getAuditsByUser: (
        user: string,
        skip?: number,
        limit?: number
      ) => Promise<Audit[]>;
    
      getAuditsByType: (
        actionType: string,
        skip?: number,
        limit?: number
      ) => Promise<Audit[]>;
    
      createAudit: (
        data: AuditCreate
      ) => Promise<Audit>;
    
      updateAudit: (
        id: string,
        data: AuditUpdate
      ) => Promise<Audit | null>;
    
      deleteAudit: (
        id: string
      ) => Promise<Audit | null>;
  };

  appointment: {
    appointments: AppointmentOut[];
    isLoading: boolean;
    getAppointment: (id: string) => Promise<AppointmentOut | null>;
    createAppointment: (data: AppointmentCreate) => Promise<Appointment>;
    createAppointmentByUser: (data: AppointmentCreate) => Promise<Appointment>;
    updateAppointment: (
      id: string,
      data: Partial<Appointment>
    ) => Promise<Appointment | null>;
    deleteAppointment: (id: string) => Promise<Appointment | null>;
    updateAppointmentStatus: (
      id: string,
      status: Appointment["status"]
    ) => Promise<Appointment | null>;
    getBookedSlots: (date: string) => Promise<string[]>;
  };
}