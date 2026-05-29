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
  invoiceSchema,
  invoiceCreateSchema,
  invoiceUpdateSchema,
  invoiceStatusUpdateSchema,
} from "@/schema/invoice";

import type {
  Invoice,
  InvoiceCreate,
  InvoiceUpdate,
  InvoiceStatusUpdate,
} from "@/types/invoice";

//
// -------------------------------------------------
// Query Keys
// -------------------------------------------------
export const invoiceKeys = {
  all: ["invoices"] as const,

  lists: () =>
    [...invoiceKeys.all, "list"] as const,

  detail: (id: string) =>
    [...invoiceKeys.all, "detail", id] as const,
};

//
// -------------------------------------------------
// Context Type
// -------------------------------------------------
interface InvoiceContextType {
  invoices: Invoice[];
  isLoading: boolean;

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
}

//
// -------------------------------------------------
// Context
// -------------------------------------------------
const InvoiceContext = createContext<
  InvoiceContextType | undefined
>(undefined);

//
// -------------------------------------------------
// Hook
// -------------------------------------------------
export const useInvoices = () => {
  const ctx = useContext(InvoiceContext);

  if (!ctx) {
    throw new Error(
      "useInvoices must be used within InvoiceProvider"
    );
  }

  return ctx;
};

//
// -------------------------------------------------
// Provider
// -------------------------------------------------
export function InvoiceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  //
  // ---------------- GET ALL ----------------
  //
  const {
    data: invoices = [],
    isLoading,
  } = useQuery({
    queryKey: invoiceKeys.lists(),

    queryFn: async (): Promise<
      Invoice[]
    > => {
      const res = await API.get(
        "/invoices"
      );

      const result = invoiceSchema
        .array()
        .safeParse(res.data);

      if (!result.success) {
        console.error(
          "INVOICE ZOD ERROR:",
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
  const getInvoice = async (
    id: string
  ): Promise<Invoice | null> => {
    try {
      const res = await API.get(
        `/invoices/${id}`
      );

      return invoiceSchema.parse(
        res.data
      );
    } catch {
      return null;
    }
  };

  //
  // ---------------- CREATE ----------------
  //
  const createInvoice = async (
    data: InvoiceCreate
  ): Promise<Invoice> => {
    const parsedInput =
      invoiceCreateSchema.parse(data);

    const res = await API.post(
      "/invoices",
      parsedInput
    );

    const parsed = invoiceSchema.parse(
      res.data
    );

    queryClient.invalidateQueries({
      queryKey: invoiceKeys.lists(),
    });

    return parsed;
  };

  //
  // ---------------- UPDATE ----------------
  //
  const updateInvoice = async (
    id: string,
    data: InvoiceUpdate
  ): Promise<Invoice | null> => {
    try {
      const parsedInput =
        invoiceUpdateSchema.parse(
          data
        );

      const res = await API.patch(
        `/invoices/${id}`,
        parsedInput
      );

      const parsed = invoiceSchema.parse(
        res.data
      );

      queryClient.invalidateQueries({
        queryKey: invoiceKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          invoiceKeys.detail(id),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- UPDATE STATUS ----------------
  //
  const updateInvoiceStatus = async (
    id: string,
    data: InvoiceStatusUpdate
  ): Promise<Invoice | null> => {
    try {
      const parsedInput =
        invoiceStatusUpdateSchema.parse(
          data
        );

      const res = await API.patch(
        `/invoices/${id}/status`,
        parsedInput
      );

      const parsed = invoiceSchema.parse(
        res.data
      );

      queryClient.invalidateQueries({
        queryKey: invoiceKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          invoiceKeys.detail(id),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- DELETE ----------------
  //
  const deleteInvoice = async (
    id: string
  ): Promise<boolean> => {
    try {
      await API.delete(
        `/invoices/${id}`
      );

      queryClient.invalidateQueries({
        queryKey: invoiceKeys.lists(),
      });

      return true;
    } catch {
      return false;
    }
  };

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        isLoading,

        getInvoice,

        createInvoice,
        updateInvoice,
        updateInvoiceStatus,

        deleteInvoice,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}