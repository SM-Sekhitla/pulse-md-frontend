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
  inventorySchema,
  inventoryCreateSchema,
  inventoryUpdateSchema,
  inventoryStockUpdateSchema,
} from "@/schema/inventory";

import type {
  Inventory,
  InventoryCreate,
  InventoryUpdate,
  InventoryStockUpdate,
} from "@/types/inventory";

//
// -------------------------------------------------
// Query Keys
// -------------------------------------------------
export const inventoryKeys = {
  all: ["inventory"] as const,

  lists: () =>
    [...inventoryKeys.all, "list"] as const,

  detail: (id: string) =>
    [...inventoryKeys.all, "detail", id] as const,
};

//
// -------------------------------------------------
// Context Type
// -------------------------------------------------
interface InventoryContextType {
  inventory: Inventory[];
  isLoading: boolean;

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
}

//
// -------------------------------------------------
// Context
// -------------------------------------------------
const InventoryContext = createContext<
  InventoryContextType | undefined
>(undefined);

//
// -------------------------------------------------
// Hook
// -------------------------------------------------
export const useInventory = () => {
  const ctx = useContext(InventoryContext);

  if (!ctx) {
    throw new Error(
      "useInventory must be used within InventoryProvider"
    );
  }

  return ctx;
};

//
// -------------------------------------------------
// Provider
// -------------------------------------------------
export function InventoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  //
  // ---------------- GET ALL ----------------
  //
  const {
    data: inventory = [],
    isLoading,
  } = useQuery({
    queryKey: inventoryKeys.lists(),

    queryFn: async (): Promise<
      Inventory[]
    > => {
      const res = await API.get(
        "/inventory"
      );

      const result = inventorySchema
        .array()
        .safeParse(res.data);

      if (!result.success) {
        console.error(
          "INVENTORY ZOD ERROR:",
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
  const getInventoryItem = async (
    id: string
  ): Promise<Inventory | null> => {
    try {
      const res = await API.get(
        `/inventory/${id}`
      );

      return inventorySchema.parse(
        res.data
      );
    } catch {
      return null;
    }
  };

  //
  // ---------------- CREATE ----------------
  //
  const createInventory = async (
    data: InventoryCreate
  ): Promise<Inventory> => {
    const parsedInput =
      inventoryCreateSchema.parse(
        data
      );

    const res = await API.post(
      "/inventory",
      parsedInput
    );

    const parsed = inventorySchema.parse(
      res.data
    );

    queryClient.invalidateQueries({
      queryKey: inventoryKeys.lists(),
    });

    return parsed;
  };

  //
  // ---------------- UPDATE ----------------
  //
  const updateInventory = async (
    id: string,
    data: InventoryUpdate
  ): Promise<Inventory | null> => {
    try {
      const parsedInput =
        inventoryUpdateSchema.parse(
          data
        );

      const res = await API.patch(
        `/inventory/${id}`,
        parsedInput
      );

      const parsed = inventorySchema.parse(
        res.data
      );

      queryClient.invalidateQueries({
        queryKey: inventoryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          inventoryKeys.detail(id),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- UPDATE STOCK ----------------
  //
  const updateStock = async (
    id: string,
    data: InventoryStockUpdate
  ): Promise<Inventory | null> => {
    try {
      const parsedInput =
        inventoryStockUpdateSchema.parse(
          data
        );

      const res = await API.patch(
        `/inventory/${id}/stock`,
        parsedInput
      );

      const parsed = inventorySchema.parse(
        res.data
      );

      queryClient.invalidateQueries({
        queryKey: inventoryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          inventoryKeys.detail(id),
      });

      return parsed;
    } catch {
      return null;
    }
  };

  //
  // ---------------- DELETE ----------------
  //
  const deleteInventory = async (
    id: string
  ): Promise<boolean> => {
    try {
      await API.delete(
        `/inventory/${id}`
      );

      queryClient.invalidateQueries({
        queryKey: inventoryKeys.lists(),
      });

      return true;
    } catch {
      return false;
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        isLoading,

        getInventoryItem,

        createInventory,
        updateInventory,
        updateStock,
        deleteInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}