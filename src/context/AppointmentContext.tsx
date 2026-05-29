import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import API from "@/utils/api";

import {
  appointmentSchema,
  appointmentCreateSchema,
} from "@/schema/appointment";

import type {
  Appointment,
  AppointmentCreate,
} from "@/types/appointment";

//
// -------------------------------------------------
// Query Keys
// -------------------------------------------------
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  detail: (id: string) => ["appointments", id] as const,
  slots: (date: string) => ["appointments", "slots", date] as const,
};

//
// -------------------------------------------------
// Context Type
// -------------------------------------------------
interface AppointmentContextType {
  appointments: Appointment[];
  isLoading: boolean;

  getAppointment: (id: string) => Promise<Appointment | null>;

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
}

//
// -------------------------------------------------
// Context
// -------------------------------------------------
const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined
);

export const useAppointments = () => {
  const ctx = useContext(AppointmentContext);
  if (!ctx) {
    throw new Error("useAppointments must be used within AppointmentProvider");
  }
  return ctx;
};

//
// -------------------------------------------------
// Provider
// -------------------------------------------------

export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  //
  // ---------------- GET ALL APPOINTMENTS ----------------
  //
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: appointmentKeys.lists(),
    queryFn: async (): Promise<Appointment[]> => {
      const res = await API.get("/appointments");

      const result = appointmentSchema.array().safeParse(res.data);

      if (!result.success) {
        console.error("APPOINTMENT ZOD ERROR:", result.error);
        return [];
      }

      return result.data;
    },
  });

  //
  // ---------------- GET ONE ----------------
  //
  const getAppointment = async (id: string) => {
    try {
      const res = await API.get(`/appointments/${id}`);
      return appointmentSchema.parse(res.data);
    } catch {
      return null;
    }
  };

  //
  // ---------------- CREATE ----------------
  //
  const createAppointment = async (data: AppointmentCreate) => {
    const parsedInput = appointmentCreateSchema.parse(data);

    const res = await API.post("/appointments", parsedInput);
    const parsed = appointmentSchema.parse(res.data);

    queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    return parsed;
  };

  //
  // ---------------- CREATE BY USER ----------------
  //
  const createAppointmentByUser = async (data: AppointmentCreate) => {
    const parsedInput = appointmentCreateSchema.parse(data);

    const res = await API.post("/appointments/user", parsedInput);
    const parsed = appointmentSchema.parse(res.data);

    queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    return parsed;
  };

  //
  // ---------------- UPDATE ----------------
  //
  const updateAppointment = async (
    id: string,
    data: Partial<Appointment>
  ) => {
    try {
      const res = await API.patch(`/appointments/${id}`, data);

      const parsed = appointmentSchema.parse(res.data);

      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- DELETE ----------------
  //
  const deleteAppointment = async (id: string) => {
    try {
      const res = await API.delete(`/appointments/${id}`);

      const parsed = appointmentSchema.parse(res.data);

      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- STATUS UPDATE ----------------
  //
  const updateAppointmentStatus = async (
    id: string,
    status: Appointment["status"]
  ) => {
    try {
      const res = await API.patch(`/appointments/${id}/status`, {
        status,
      });

      const parsed = appointmentSchema.parse(res.data);

      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- SLOTS ----------------
  //
  const getBookedSlots = async (date: string) => {
    try {
      const res = await API.get(`/appointments/slots/${date}`);
      return res.data as string[];
    } catch {
      return [];
    }
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        isLoading,
        getAppointment,
        createAppointment,
        createAppointmentByUser,
        updateAppointment,
        deleteAppointment,
        updateAppointmentStatus,
        getBookedSlots,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};