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
  sickNoteSchema,
  sickNoteCreateSchema,
  sickNoteUpdateSchema,
} from "@/schema/sicknote";

import type {
  SickNote,
  SickNoteCreate,
  SickNoteUpdate,
} from "@/types/sicknote";

//
// -------------------------------------------------
// Query Keys
// -------------------------------------------------
export const sickNoteKeys = {
  all: ["sick-notes"] as const,

  lists: () =>
    [...sickNoteKeys.all, "list"] as const,

  detail: (id: string) =>
    [...sickNoteKeys.all, "detail", id] as const,
};

//
// -------------------------------------------------
// Context Type
// -------------------------------------------------
interface SickNoteContextType {
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
}

//
// -------------------------------------------------
// Context
// -------------------------------------------------
const SickNoteContext = createContext<
  SickNoteContextType | undefined
>(undefined);

//
// -------------------------------------------------
// Hook
// -------------------------------------------------
export const useSickNotes = () => {
  const ctx = useContext(
    SickNoteContext
  );

  if (!ctx) {
    throw new Error(
      "useSickNotes must be used within SickNoteProvider"
    );
  }

  return ctx;
};

//
// -------------------------------------------------
// Provider
// -------------------------------------------------
export function SickNoteProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  //
  // ---------------- GET ALL ----------------
  //
  const {
    data: sickNotes = [],
    isLoading,
  } = useQuery({
    queryKey: sickNoteKeys.lists(),

    queryFn: async (): Promise<
      SickNote[]
    > => {
      const res = await API.get(
        "/sick-notes"
      );

      const result =
        sickNoteSchema
          .array()
          .safeParse(res.data);

      if (!result.success) {
        console.error(
          "SICK NOTE ZOD ERROR:",
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
  const getSickNote = async (
    id: string
  ): Promise<SickNote | null> => {
    try {
      const res = await API.get(
        `/sick-notes/${id}`
      );

      return sickNoteSchema.parse(
        res.data
      );
    } catch {
      return null;
    }
  };

  //
  // ---------------- CREATE ----------------
  //
  const createSickNote = async (
    data: SickNoteCreate
  ): Promise<SickNote> => {
    const parsedInput =
      sickNoteCreateSchema.parse(
        data
      );

    const res = await API.post(
      "/sick-notes",
      parsedInput
    );

    const parsed =
      sickNoteSchema.parse(
        res.data
      );

    queryClient.invalidateQueries({
      queryKey:
        sickNoteKeys.lists(),
    });

    return parsed;
  };

  //
  // ---------------- UPDATE ----------------
  //
  const updateSickNote = async (
    id: string,
    data: SickNoteUpdate
  ): Promise<SickNote | null> => {
    try {
      const parsedInput =
        sickNoteUpdateSchema.parse(
          data
        );

      const res = await API.patch(
        `/sick-notes/${id}`,
        parsedInput
      );

      const parsed =
        sickNoteSchema.parse(
          res.data
        );

      queryClient.invalidateQueries({
        queryKey:
          sickNoteKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          sickNoteKeys.detail(id),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- REVOKE ----------------
  //
  const revokeSickNote = async (
    id: string
  ): Promise<boolean> => {
    try {
      await API.patch(
        `/sick-notes/${id}/revoke`
      );

      queryClient.invalidateQueries({
        queryKey:
          sickNoteKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          sickNoteKeys.detail(id),
      });

      return true;
    } catch {
      return false;
    }
  };

  //
  // ---------------- DELETE ----------------
  //
  const deleteSickNote = async (
    id: string
  ): Promise<boolean> => {
    try {
      await API.delete(
        `/sick-notes/${id}`
      );

      queryClient.invalidateQueries({
        queryKey:
          sickNoteKeys.lists(),
      });

      return true;
    } catch {
      return false;
    }
  };

  return (
    <SickNoteContext.Provider
      value={{
        sickNotes,
        isLoading,

        getSickNote,

        createSickNote,
        updateSickNote,
        revokeSickNote,
        deleteSickNote,
      }}
    >
      {children}
    </SickNoteContext.Provider>
  );
}