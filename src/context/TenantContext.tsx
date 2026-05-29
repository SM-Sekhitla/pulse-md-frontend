import React, {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import API from "@/utils/api";

import {
  tenantSchema,
  tenantCreateSchema,
  tenantUpdateSchema,
} from "@/schema/tenant";

import type {
  Tenant,
  TenantCreate,
  TenantUpdate,
  TenantStatus,
  Plan,
  ModuleKey,
} from "@/types/tenant";

//
// -------------------------------------------------
// Query Keys
// -------------------------------------------------
export const tenantKeys = {
  all: ["tenants"] as const,

  lists: () =>
    [...tenantKeys.all, "list"] as const,

  detail: (id: string) =>
    [...tenantKeys.all, "detail", id] as const,
};

//
// -------------------------------------------------
// Context Type
// -------------------------------------------------
interface TenantContextType {
  tenants: Tenant[];
  isLoading: boolean;

  getTenant: (
    id: string
  ) => Promise<Tenant | null>;

  createTenant: (
    data: TenantCreate
  ) => Promise<Tenant>;

  updateTenantStatus: (
    id: string,
    status: TenantStatus
  ) => Promise<Tenant | null>;

  updateTenantPlan: (
    id: string,
    plan: Plan
  ) => Promise<Tenant | null>;

  deleteTenant: (
    id: string
  ) => Promise<Tenant | null>;
}

//
// -------------------------------------------------
// Context
// -------------------------------------------------
const TenantContext = createContext<
  TenantContextType | undefined
>(undefined);

//
// -------------------------------------------------
// Hook
// -------------------------------------------------
export const useTenants = () => {
  const ctx = useContext(TenantContext);

  if (!ctx) {
    throw new Error(
      "useTenants must be used within TenantProvider"
    );
  }

  return ctx;
};

//
// -------------------------------------------------
// Provider
// -------------------------------------------------
export function TenantProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  //
  // ---------------- GET ALL ----------------
  //
  const {
    data: tenants = [],
    isLoading,
  } = useQuery({
    queryKey: tenantKeys.lists(),

    queryFn: async (): Promise<
      Tenant[]
    > => {
      const res = await API.get(
        "/tenants"
      );

      const result =
        tenantSchema
          .array()
          .safeParse(res.data);

      if (!result.success) {
        console.error(
          "TENANT ZOD ERROR:",
          result.error
        );

        return [];
      }

      return result.data;
    },
  });

  //
  // ---------------- GET ONE ----------------
  //
  const getTenant = async (
    id: string
  ): Promise<Tenant | null> => {
    try {
      const res = await API.get(
        `/tenants/${id}`
      );

      return tenantSchema.parse(
        res.data
      );
    } catch {
      return null;
    }
  };

  //
  // ---------------- CREATE ----------------
  //
  const createTenant = async (
    data: TenantCreate
  ): Promise<Tenant> => {
    const parsedInput =
      tenantCreateSchema.parse(
        data
      );

    const res = await API.post(
      "/tenants",
      parsedInput
    );

    const parsed =
      tenantSchema.parse(
        res.data
      );

    queryClient.invalidateQueries({
      queryKey:
        tenantKeys.lists(),
    });

    return parsed;
  };

  //
  // ---------------- UPDATE STATUS ----------------
  //
  const updateTenantStatus =
    async (
      id: string,
      status: TenantStatus
    ): Promise<Tenant | null> => {
      try {
        const res = await API.patch(
          `/tenants/${id}/status`,
          { status }
        );

        const parsed =
          tenantSchema.parse(
            res.data
          );

        queryClient.invalidateQueries({
          queryKey:
            tenantKeys.lists(),
        });

        queryClient.invalidateQueries({
          queryKey:
            tenantKeys.detail(id),
        });

        return parsed;
      } catch {
        return null;
      }
    };

  //
  // ---------------- UPDATE PLAN ----------------
  //
  const updateTenantPlan =
    async (
      id: string,
      plan: Plan
    ): Promise<Tenant | null> => {
      try {
        const res = await API.patch(
          `/tenants/${id}/plan`,
          { plan }
        );

        const parsed =
          tenantSchema.parse(
            res.data
          );

        queryClient.invalidateQueries({
          queryKey:
            tenantKeys.lists(),
        });

        queryClient.invalidateQueries({
          queryKey:
            tenantKeys.detail(id),
        });

        return parsed;
      } catch {
        return null;
      }
    };

  //
  // ---------------- DELETE ----------------
  //
  const deleteTenant = async (
    id: string
  ): Promise<Tenant | null> => {
    try {
      const res = await API.delete(
        `/tenants/${id}`
      );

      const parsed =
        tenantSchema.parse(
          res.data
        );

      queryClient.invalidateQueries({
        queryKey:
          tenantKeys.lists(),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenants,
        isLoading,

        getTenant,
        createTenant,
        updateTenantStatus,
        updateTenantPlan,
        deleteTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}