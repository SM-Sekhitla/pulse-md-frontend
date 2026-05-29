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
  patientSchema,
  patientCreateSchema,
  patientUpdateSchema,
  patientStatusUpdateSchema,
} from "@/schema/patient";

import type {
  Patient,
  PatientCreate,
  PatientUpdate,
  PatientStatusUpdate,
} from "@/types/patient";

//
// -------------------------------------------------
// Query Keys
// -------------------------------------------------
export const patientKeys = {
  all: ["patients"] as const,

  lists: () =>
    [...patientKeys.all, "list"] as const,

  detail: (id: string) =>
    [...patientKeys.all, "detail", id] as const,
};

//
// -------------------------------------------------
// Context Type
// -------------------------------------------------
interface PatientContextType {
  patients: Patient[];
  isLoading: boolean;

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
}

//
// -------------------------------------------------
// Context
// -------------------------------------------------
const PatientContext = createContext<
  PatientContextType | undefined
>(undefined);

//
// -------------------------------------------------
// Hook
// -------------------------------------------------
export const usePatients = () => {
  const ctx = useContext(PatientContext);

  if (!ctx) {
    throw new Error(
      "usePatients must be used within PatientProvider"
    );
  }

  return ctx;
};

//
// -------------------------------------------------
// Provider
// -------------------------------------------------
export function PatientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  //
  // ---------------- GET ALL ----------------
  //
  const {
    data: patients = [],
    isLoading,
  } = useQuery({
    queryKey: patientKeys.lists(),

    queryFn: async (): Promise<
      Patient[]
    > => {
      const res = await API.get(
        "/patients"
      );

      const result = patientSchema
        .array()
        .safeParse(res.data);

      if (!result.success) {
        console.error(
          "PATIENT ZOD ERROR:",
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
  const getPatient = async (
    id: string
  ): Promise<Patient | null> => {
    try {
      const res = await API.get(
        `/patients/${id}`
      );

      return patientSchema.parse(
        res.data
      );
    } catch {
      return null;
    }
  };

  //
  // ---------------- CREATE ----------------
  //
  const createPatient = async (
    data: PatientCreate
  ): Promise<Patient> => {
    const parsedInput =
      patientCreateSchema.parse(data);

    const res = await API.post(
      "/patients",
      parsedInput
    );

    const parsed = patientSchema.parse(
      res.data
    );

    queryClient.invalidateQueries({
      queryKey: patientKeys.lists(),
    });

    return parsed;
  };

  //
  // ---------------- UPDATE ----------------
  //
  const updatePatient = async (
    id: string,
    data: PatientUpdate
  ): Promise<Patient | null> => {
    try {
      const parsedInput =
        patientUpdateSchema.parse(
          data
        );

      const res = await API.patch(
        `/patients/${id}`,
        parsedInput
      );

      const parsed = patientSchema.parse(
        res.data
      );

      queryClient.invalidateQueries({
        queryKey: patientKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          patientKeys.detail(id),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- UPDATE STATUS ----------------
  //
  const updatePatientStatus = async (
    id: string,
    data: PatientStatusUpdate
  ): Promise<Patient | null> => {
    try {
      const parsedInput =
        patientStatusUpdateSchema.parse(
          data
        );

      const res = await API.patch(
        `/patients/${id}/status`,
        parsedInput
      );

      const parsed = patientSchema.parse(
        res.data
      );

      queryClient.invalidateQueries({
        queryKey: patientKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          patientKeys.detail(id),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- DELETE ----------------
  //
  const deletePatient = async (
    id: string
  ): Promise<boolean> => {
    try {
      await API.delete(
        `/patients/${id}`
      );

      queryClient.invalidateQueries({
        queryKey: patientKeys.lists(),
      });

      return true;
    } catch {
      return false;
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        isLoading,

        getPatient,

        createPatient,
        updatePatient,
        updatePatientStatus,

        deletePatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}