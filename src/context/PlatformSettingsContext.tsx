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
  platformSettingsSchema,
} from "@/schema/platformSettings";

import type {
  PlatformSettings,
} from "@/types/platformSettings";

//
// -------------------------------------------------
// Query Keys
// -------------------------------------------------
export const platformSettingsKeys = {
  all: ["platform-settings"] as const,

  detail: () =>
    [...platformSettingsKeys.all, "detail"] as const,
};

//
// -------------------------------------------------
// Context Type
// -------------------------------------------------
interface PlatformSettingsContextType {
  platformSettings: PlatformSettings | null;
  isLoading: boolean;

  getPlatformSettings: () => Promise<PlatformSettings | null>;

  createOrUpdatePlatformSettings: (
    data: PlatformSettings
  ) => Promise<PlatformSettings | null>;
}

//
// -------------------------------------------------
// Context
// -------------------------------------------------
const PlatformSettingsContext =
  createContext<
    PlatformSettingsContextType | undefined
  >(undefined);

//
// -------------------------------------------------
// Hook
// -------------------------------------------------
export const usePlatformSettings = () => {
  const ctx = useContext(
    PlatformSettingsContext
  );

  if (!ctx) {
    throw new Error(
      "usePlatformSettings must be used within PlatformSettingsProvider"
    );
  }

  return ctx;
};

//
// -------------------------------------------------
// Provider
// -------------------------------------------------
export function PlatformSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  //
  // ---------------- GET SETTINGS ----------------
  //
  const {
    data: platformSettings = null,
    isLoading,
  } = useQuery({
    queryKey:
      platformSettingsKeys.detail(),

    queryFn: async (): Promise<
      PlatformSettings | null
    > => {
      try {
        const res = await API.get(
          "/platform-settings"
        );

        return platformSettingsSchema.parse(
          res.data
        );
      } catch {
        return null;
      }
    },
  });

  //
  // ---------------- GET SETTINGS ----------------
  //
  const getPlatformSettings =
    async (): Promise<PlatformSettings | null> => {
      try {
        const res = await API.get(
          "/platform-settings"
        );

        return platformSettingsSchema.parse(
          res.data
        );
      } catch {
        return null;
      }
    };

  //
  // ---------------- UPSERT SETTINGS ----------------
  //
  const createOrUpdatePlatformSettings =
    async (
      data:
        | PlatformSettings
    ): Promise<PlatformSettings | null> => {
      try {
        //
        // Try create schema first
        //


        const res = await API.put(
          "/platform-settings",
          data
        );

        const parsed =
          platformSettingsSchema.parse(
            res.data
          );

        queryClient.invalidateQueries({
          queryKey:
            platformSettingsKeys.detail(),
        });

        return parsed;
      } catch {
        return null;
      }
    };

  return (
    <PlatformSettingsContext.Provider
      value={{
        platformSettings,
        isLoading,

        getPlatformSettings,

        createOrUpdatePlatformSettings,
      }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
}