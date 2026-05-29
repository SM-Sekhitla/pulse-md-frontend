import React, { createContext, useContext, useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import API from "@/utils/api";

import {
  userSchema,
  userCreateSchema,
  userUpdateSchema,
} from "@/schema/user";

import {
  User,
  UserCreate,
  UserUpdate,
} from "@/types/user";

// 🔑 Query Keys
export const userKeys = {
  all: ["users"] as const,
  detail: (id: string) => ["users", id] as const,
  stats: ["users", "stats"] as const,
};

// 📦 Payload type for mutation
type UpdateUserPayload = {
  id: string;
  data: UserUpdate;
};

// 📦 Context Type
interface UserContextType {
  users: User[];
  isLoading: boolean;

  stats: any[];

  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  createError: unknown;
  updateError: unknown;
  deleteError: unknown;

  getUser: (id: string) => Promise<User | null>;

  createUser: (data: UserCreate) => Promise<User>;
  updateUser: (id: string, data: UserUpdate) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;

  updateUserRole: (id: string, role: string) => Promise<User>;

  changePassword: (id: string, newPassword: string) => Promise<User>;

  searchUsers: (query: string) => User[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// 🔌 Hook
export const useUsers = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUsers must be used within UserProvider");
  }
  return ctx;
};

// 🏗 Provider
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  // 🔹 FETCH ALL USERS
  const { data: users = [], isLoading } = useQuery({
    queryKey: userKeys.all,
    queryFn: async () => {
      const res = await API.get("/users");
      return userSchema.array().parse(res.data);
    },
    staleTime: 1000 * 60 * 5,
  });

  // 🔹 FETCH STATS
  const { data: stats = [] } = useQuery({
    queryKey: userKeys.stats,
    queryFn: async () => {
      const res = await API.get("/users/stats");
      return res.data;
    },
  });

  // 🔹 CREATE USER
  const { mutateAsync: createMutation, isPending: isCreating, error: createError } =
    useMutation({
      mutationFn: async (data: UserCreate) => {
        userCreateSchema.parse(data);

        const res = await API.post("/users", data);
        return userSchema.parse(res.data);
      },

      onSuccess: (newUser) => {
        queryClient.setQueryData(userKeys.all, (old: User[] = []) => [
          ...old,
          newUser,
        ]);
      },
    });

  // 🔹 UPDATE USER (FIXED)
  const {
    mutateAsync: updateMutation,
    isPending: isUpdating,
    error: updateError,
  } = useMutation<User, Error, UpdateUserPayload>({
    mutationFn: async ({ id, data }: UpdateUserPayload) => {
      userUpdateSchema.parse(data);

      const res = await API.patch(`/users/${id}`, data);
      return userSchema.parse(res.data);
    },

    onSuccess: (updated) => {
      queryClient.setQueryData(userKeys.all, (old: User[] = []) =>
        old.map((u) => (u.id === updated.id ? updated : u))
      );

      queryClient.setQueryData(userKeys.detail(updated.id), updated);
    },
  });

  // 🔴 FIX: WRAPPER FUNCTION (THIS FIXES YOUR ERROR)
  const updateUser = async (id: string, data: UserUpdate): Promise<User> => {
    return await updateMutation({ id, data });
  };

  // 🔹 DELETE USER
  const { mutateAsync: deleteMutation, isPending: isDeleting, error: deleteError } =
    useMutation({
      mutationFn: async (id: string) => {
        await API.delete(`/users/${id}`);
      },

      onSuccess: (_, id) => {
        queryClient.setQueryData(userKeys.all, (old: User[] = []) =>
          old.filter((u) => u.id !== id)
        );

        queryClient.removeQueries({
          queryKey: userKeys.detail(id),
        });
      },
    });

  const deleteUser = async (id: string): Promise<void> => {
    await deleteMutation(id);
  };

  // 🔹 GET USER
  const getUser = async (id: string): Promise<User | null> => {
    try {
      const res = await API.get(`/users/${id}`);
      return userSchema.parse(res.data);
    } catch {
      return null;
    }
  };

  // 🔹 UPDATE ROLE
  const updateUserRole = async (id: string, role: string): Promise<User> => {
    const res = await API.patch(`/users/${id}/role`, { role });
    const updated = userSchema.parse(res.data);

    queryClient.setQueryData(userKeys.all, (old: User[] = []) =>
      old.map((u) => (u.id === updated.id ? updated : u))
    );

    return updated;
  };

  // 🔹 CHANGE PASSWORD
  const changePassword = async (
    id: string,
    newPassword: string
  ): Promise<User> => {
    const res = await API.patch(`/users/${id}/password`, {
      new_password: newPassword,
    });

    return userSchema.parse(res.data);
  };

  // 🔹 SEARCH
  const searchUsers = useCallback(
    (query: string): User[] => {
      if (!query) return users;

      const q = query.toLowerCase();

      return users.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.practiceName?.toLowerCase().includes(q)
      );
    },
    [users]
  );

  return (
    <UserContext.Provider
      value={{
        users,
        isLoading,

        stats,

        isCreating,
        isUpdating,
        isDeleting,

        createError,
        updateError,
        deleteError,

        getUser,
        createUser: createMutation,
        updateUser, // ✅ FIXED
        deleteUser,

        updateUserRole,
        changePassword,

        searchUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};