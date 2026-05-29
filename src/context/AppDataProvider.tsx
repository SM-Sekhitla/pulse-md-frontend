import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AuditProvider,
  useAudits,
} from "./AuditContext";

import {
  InventoryProvider,
  useInventory,
} from "./InventoryContext";

import {
  UserProvider,
  useUsers,
} from "./UserContext";

import {
  InvoiceProvider,
  useInvoices,
} from "./InvoiceContext";

import {
  PatientProvider,
  usePatients,
} from "./PatientContext";

import {
  PlatformSettingsProvider,
  usePlatformSettings,
} from "./PlatformSettingsContext";

import {
  PrescriptionProvider,
  usePrescriptions,
} from "./PrescriptionContext";

import {
  SickNoteProvider,
  useSickNotes,
} from "./SicknoteContext";

import {
  TenantProvider,
  useTenants,
} from "./TenantContext";

import type { DataContextType } from "@/types/dataContextType";

//
// -------------------------------------------------
// Context
// -------------------------------------------------
const DataContext = createContext<
  DataContextType | undefined
>(undefined);

//
// -------------------------------------------------
// Bridge
// -------------------------------------------------
type BridgeProps = {
  children: ReactNode;
};

const DataContextBridge = ({
  children,
}: BridgeProps) => {
  const [isBootstrapping, setIsBootstrapping] =
    useState(true);

  const auditCtx = useAudits();
  const inventoryCtx = useInventory();
  const userCtx = useUsers();
  const invoiceCtx = useInvoices();
  const patientCtx = usePatients();
  const platformSettingsCtx =
    usePlatformSettings();
  const prescriptionCtx =
    usePrescriptions();
  const sickNoteCtx = useSickNotes();
  const tenantCtx = useTenants();

  //
  // -------------------------------------------------
  // Bootstrap
  // -------------------------------------------------
  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([]);
      } catch (err) {
        console.error(
          "App bootstrap failed:",
          err
        );
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  //
  // -------------------------------------------------
  // Context Value
  // -------------------------------------------------
  const contextValue = useMemo<DataContextType>(
    () => ({
      isBootstrapping,

      //
      // ---------------- INVOICE ----------------
      //
      invoice: {
        invoices: invoiceCtx.invoices,
        isInvoiceLoading:
          invoiceCtx.isLoading,

        getInvoice:
          invoiceCtx.getInvoice,

        createInvoice:
          invoiceCtx.createInvoice,

        updateInvoice:
          invoiceCtx.updateInvoice,

        updateInvoiceStatus:
          invoiceCtx.updateInvoiceStatus,

        deleteInvoice:
          invoiceCtx.deleteInvoice,
      },

      //
      // ---------------- INVENTORY ----------------
      //
      inventory: {
        inventoryList:
          inventoryCtx.inventory,

        isInventoryLoading:
          inventoryCtx.isLoading,

        getInventoryItem:
          inventoryCtx.getInventoryItem,

        createInventory:
          inventoryCtx.createInventory,

        updateInventory:
          inventoryCtx.updateInventory,

        updateStock:
          inventoryCtx.updateStock,

        deleteInventory:
          inventoryCtx.deleteInventory,
      },

      //
      // ---------------- PATIENT ----------------
      //
      patient: {
        patients: patientCtx.patients,

        isPatientLoading:
          patientCtx.isLoading,

        getPatient:
          patientCtx.getPatient,

        createPatient:
          patientCtx.createPatient,

        updatePatient:
          patientCtx.updatePatient,

        updatePatientStatus:
          patientCtx.updatePatientStatus,

        deletePatient:
          patientCtx.deletePatient,
      },

      //
      // ---------------- PLATFORM SETTINGS ----------------
      //
      platformSetting: {
        platformSettings:
          platformSettingsCtx.platformSettings,

        isPlatformSettingsLoading:
          platformSettingsCtx.isLoading,

        getPlatformSettings:
          platformSettingsCtx.getPlatformSettings,

        createOrUpdatePlatformSettings:
          platformSettingsCtx.createOrUpdatePlatformSettings,
      },

      //
      // ---------------- PRESCRIPTION ----------------
      //
      prescription: {
        prescriptions:
          prescriptionCtx.prescriptions,

        isPrescriptionLoading:
          prescriptionCtx.isLoading,

        getPrescription:
          prescriptionCtx.getPrescription,

        createPrescription:
          prescriptionCtx.createPrescription,

        updatePrescription:
          prescriptionCtx.updatePrescription,

        revokePrescription:
          prescriptionCtx.revokePrescription,

        deletePrescription:
          prescriptionCtx.deletePrescription,
      },

      //
      // ---------------- SICK NOTE ----------------
      //
      sicknote: {
        sickNotes:
          sickNoteCtx.sickNotes,

        isLoading:
          sickNoteCtx.isLoading,

        getSickNote:
          sickNoteCtx.getSickNote,

        createSickNote:
          sickNoteCtx.createSickNote,

        updateSickNote:
          sickNoteCtx.updateSickNote,

        revokeSickNote:
          sickNoteCtx.revokeSickNote,

        deleteSickNote:
          sickNoteCtx.deleteSickNote,
      },

      //
      // ---------------- TENANT ----------------
      //
      tenant: {
        tenants: tenantCtx.tenants,

        isLoading:
          tenantCtx.isLoading,

        getTenant:
          tenantCtx.getTenant,

        createTenant:
          tenantCtx.createTenant,

        updateTenantStatus:
          tenantCtx.updateTenantStatus,

        updateTenantPlan:
          tenantCtx.updateTenantPlan,

        deleteTenant:
          tenantCtx.deleteTenant,
      },

      //
      // ---------------- USER ----------------
      //
      user: {
        users: userCtx.users,

        stats: userCtx.stats,

        isLoading:
          userCtx.isLoading,

        isCreating:
          userCtx.isCreating,

        isUpdating:
          userCtx.isUpdating,

        isDeleting:
          userCtx.isDeleting,

        createError:
          userCtx.createError,

        updateError:
          userCtx.updateError,

        deleteError:
          userCtx.deleteError,

        get: userCtx.getUser,

        create:
          userCtx.createUser,

        update:
          userCtx.updateUser,

        delete:
          userCtx.deleteUser,

        updateRole:
          userCtx.updateUserRole,

        changePassword:
          userCtx.changePassword,

        search:
          userCtx.searchUsers,
      },
    }),
    [
      isBootstrapping,
      invoiceCtx,
      inventoryCtx,
      patientCtx,
      platformSettingsCtx,
      prescriptionCtx,
      sickNoteCtx,
      tenantCtx,
      userCtx,
    ]
  );

  return (
    <DataContext.Provider
      value={contextValue}
    >
      {children}
    </DataContext.Provider>
  );
};

//
// -------------------------------------------------
// Provider
// -------------------------------------------------
type ProviderProps = {
  children: ReactNode;
};

export const AppDataProvider = ({
  children,
}: ProviderProps) => {
  return (
    <InvoiceProvider>
      <InventoryProvider>
        <PrescriptionProvider>
          <SickNoteProvider>
            <PatientProvider>
              <TenantProvider>
                <AuditProvider>
                  <UserProvider>
                    <PlatformSettingsProvider>
                      <DataContextBridge>
                        {children}
                      </DataContextBridge>
                    </PlatformSettingsProvider>
                  </UserProvider>
                </AuditProvider>
              </TenantProvider>
            </PatientProvider>
          </SickNoteProvider>
        </PrescriptionProvider>
      </InventoryProvider>
    </InvoiceProvider>
  );
};

//
// -------------------------------------------------
// Hook
// -------------------------------------------------
export const useData = () => {
  const ctx = useContext(DataContext);

  if (!ctx) {
    throw new Error(
      "useData must be used within AppDataProvider"
    );
  }

  return ctx;
};