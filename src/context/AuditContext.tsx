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
  auditSchema,
} from "@/schema/audit";

import type {
  Audit,
  AuditCreate,
  AuditUpdate,
} from "@/types/audit";

//
// -------------------------------------------------
// Query Keys
// -------------------------------------------------
export const auditKeys = {
  all: ["audits"] as const,

  lists: () => [...auditKeys.all, "list"] as const,

  detail: (id: string) =>
    [...auditKeys.all, "detail", id] as const,

  user: (user: string) =>
    [...auditKeys.all, "user", user] as const,

  type: (actionType: string) =>
    [...auditKeys.all, "type", actionType] as const,
};

//
// -------------------------------------------------
// Context Type
// -------------------------------------------------
interface AuditContextType {
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
}

//
// -------------------------------------------------
// Context
// -------------------------------------------------
const AuditContext = createContext<
  AuditContextType | undefined
>(undefined);

//
// -------------------------------------------------
// Hook
// -------------------------------------------------
export const useAudits = () => {
  const ctx = useContext(AuditContext);

  if (!ctx) {
    throw new Error(
      "useAudits must be used within AuditProvider"
    );
  }

  return ctx;
};

//
// -------------------------------------------------
// Provider
// -------------------------------------------------
export function AuditProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  //
  // ---------------- GET ALL ----------------
  //
  const {
    data: audits = [],
    isLoading,
  } = useQuery({
    queryKey: auditKeys.lists(),

    queryFn: async (): Promise<Audit[]> => {
      const res = await API.get("/audits");

      const result = auditSchema
        .array()
        .safeParse(res.data);

      if (!result.success) {
        console.error(
          "AUDIT ZOD ERROR:",
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
  const getAudit = async (
    id: string
  ): Promise<Audit | null> => {
    try {
      const res = await API.get(`/audits/${id}`);

      return auditSchema.parse(res.data);
    } catch {
      return null;
    }
  };

  //
  // ---------------- GET BY USER ----------------
  //
  const getAuditsByUser = async (
    user: string,
    skip = 0,
    limit = 20
  ): Promise<Audit[]> => {
    try {
      const res = await API.get(
        `/audits/user/${user}`,
        {
          params: {
            skip,
            limit,
          },
        }
      );

      const result = auditSchema
        .array()
        .safeParse(res.data);

      if (!result.success) {
        console.error(
          "AUDIT USER ZOD ERROR:",
          result.error
        );

        return [];
      }

      return result.data;
    } catch {
      return [];
    }
  };

  //
  // ---------------- GET BY TYPE ----------------
  //
  const getAuditsByType = async (
    actionType: string,
    skip = 0,
    limit = 20
  ): Promise<Audit[]> => {
    try {
      const res = await API.get(
        `/audits/type/${actionType}`,
        {
          params: {
            skip,
            limit,
          },
        }
      );

      const result = auditSchema
        .array()
        .safeParse(res.data);

      if (!result.success) {
        console.error(
          "AUDIT TYPE ZOD ERROR:",
          result.error
        );

        return [];
      }

      return result.data;
    } catch {
      return [];
    }
  };

  //
  // ---------------- CREATE ----------------
  //
  const createAudit = async (
    data: AuditCreate
  ): Promise<Audit> => {
    const parsedInput =
      auditSchema.parse(data);

    const res = await API.post(
      "/audits",
      parsedInput
    );

    const parsed = auditSchema.parse(
      res.data
    );

    queryClient.invalidateQueries({
      queryKey: auditKeys.lists(),
    });

    return parsed;
  };

  //
  // ---------------- UPDATE ----------------
  //
  const updateAudit = async (
    id: string,
    data: AuditUpdate
  ): Promise<Audit | null> => {
    try {
      const parsedInput =
        auditSchema.parse(data);

      const res = await API.put(
        `/audits/${id}`,
        parsedInput
      );

      const parsed = auditSchema.parse(
        res.data
      );

      queryClient.invalidateQueries({
        queryKey: auditKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: auditKeys.detail(id),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- DELETE ----------------
  //
  const deleteAudit = async (
    id: string
  ): Promise<Audit | null> => {
    try {
      const res = await API.delete(
        `/audits/${id}`
      );

      const parsed = auditSchema.parse(
        res.data
      );

      queryClient.invalidateQueries({
        queryKey: auditKeys.lists(),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  return (
    <AuditContext.Provider
      value={{
        audits,
        isLoading,

        getAudit,

        getAuditsByUser,
        getAuditsByType,

        createAudit,
        updateAudit,
        deleteAudit,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
}