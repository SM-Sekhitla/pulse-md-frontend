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
  prescriptionSchema,
} from "@/schema/prescription";

import type {
  Prescription,
} from "@/types/prescription";

//
// -------------------------------------------------
// Create / Update Types
// -------------------------------------------------
export type PrescriptionCreate = Omit<
  Prescription,
  "id"
>;

export type PrescriptionUpdate = Partial<
  PrescriptionCreate
>;

//
// -------------------------------------------------
// Query Keys
// -------------------------------------------------
export const prescriptionKeys = {
  all: ["prescriptions"] as const,

  lists: () =>
    [...prescriptionKeys.all, "list"] as const,

  detail: (id: string) =>
    [...prescriptionKeys.all, "detail", id] as const,
};

//
// -------------------------------------------------
// Context Type
// -------------------------------------------------
interface PrescriptionContextType {
  prescriptions: Prescription[];
  isLoading: boolean;

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
}

//
// -------------------------------------------------
// Context
// -------------------------------------------------
const PrescriptionContext = createContext<
  PrescriptionContextType | undefined
>(undefined);

//
// -------------------------------------------------
// Hook
// -------------------------------------------------
export const usePrescriptions = () => {
  const ctx = useContext(
    PrescriptionContext
  );

  if (!ctx) {
    throw new Error(
      "usePrescriptions must be used within PrescriptionProvider"
    );
  }

  return ctx;
};

//
// -------------------------------------------------
// Provider
// -------------------------------------------------
export function PrescriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  //
  // ---------------- GET ALL ----------------
  //
  const {
    data: prescriptions = [],
    isLoading,
  } = useQuery({
    queryKey:
      prescriptionKeys.lists(),

    queryFn: async (): Promise<
      Prescription[]
    > => {
      const res = await API.get(
        "/prescriptions"
      );

      const result =
        prescriptionSchema
          .array()
          .safeParse(res.data);

      if (!result.success) {
        console.error(
          "PRESCRIPTION ZOD ERROR:",
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
  const getPrescription = async (
    id: string
  ): Promise<Prescription | null> => {
    try {
      const res = await API.get(
        `/prescriptions/${id}`
      );

      return prescriptionSchema.parse(
        res.data
      );
    } catch {
      return null;
    }
  };

  //
  // ---------------- CREATE ----------------
  //
  const createPrescription = async (
    data: PrescriptionCreate
  ): Promise<Prescription> => {
    const res = await API.post(
      "/prescriptions",
      data
    );

    const parsed =
      prescriptionSchema.parse(
        res.data
      );

    queryClient.invalidateQueries({
      queryKey:
        prescriptionKeys.lists(),
    });

    return parsed;
  };

  //
  // ---------------- UPDATE ----------------
  //
  const updatePrescription = async (
    id: string,
    data: PrescriptionUpdate
  ): Promise<Prescription | null> => {
    try {
      const res = await API.patch(
        `/prescriptions/${id}`,
        data
      );

      const parsed =
        prescriptionSchema.parse(
          res.data
        );

      queryClient.invalidateQueries({
        queryKey:
          prescriptionKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          prescriptionKeys.detail(id),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- REVOKE ----------------
  //
  const revokePrescription =
    async (
      id: string
    ): Promise<boolean> => {
      try {
        await API.patch(
          `/prescriptions/${id}/revoke`
        );

        queryClient.invalidateQueries({
          queryKey:
            prescriptionKeys.lists(),
        });

        queryClient.invalidateQueries({
          queryKey:
            prescriptionKeys.detail(id),
        });

        return true;
      } catch {
        return false;
      }
    };

  //
  // ---------------- DELETE ----------------
  //
  const deletePrescription =
    async (
      id: string
    ): Promise<boolean> => {
      try {
        await API.delete(
          `/prescriptions/${id}`
        );

        queryClient.invalidateQueries({
          queryKey:
            prescriptionKeys.lists(),
        });

        return true;
      } catch {
        return false;
      }
    };

  return (
    <PrescriptionContext.Provider
      value={{
        prescriptions,
        isLoading,

        getPrescription,

        createPrescription,
        updatePrescription,

        revokePrescription,
        deletePrescription,
      }}
    >
      {children}
    </PrescriptionContext.Provider>
  );
}