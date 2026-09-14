import { getLoginRoute } from "@/lib/auth-routing";
import { User } from '@/types/user';
import { fetchTenants, tenantKeys } from '@/context/TenantContext';
import { auditSchema } from '@/schema/audit';
import { patientSchema } from '@/schema/patient';
import { userSchema } from '@/schema/user';
import API, { refreshSession } from '@/utils/api';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
const BASE_URL = import.meta.env.VITE_API_URL;
const TENANT_SLUG_STORAGE_KEY = "pulse_tenant_slug";

export const isSuperAdminRole = (role?: string | null) =>
  role === "super-admin";

const timeout = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const prefetchSuperAdminData = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.race([
    Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: tenantKeys.lists(),
        queryFn: fetchTenants,
      }),
      queryClient.prefetchQuery({
        queryKey: ["patients", "list"],
        queryFn: async () => {
          const res = await API.get("/patients");
          return patientSchema.array().parse(res.data);
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ["users"],
        queryFn: async () => {
          const res = await API.get("/users");
          return userSchema.array().parse(res.data);
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ["users", "stats"],
        queryFn: async () => {
          const res = await API.get("/users/stats");
          return res.data;
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ["audits", "list"],
        queryFn: async () => {
          const res = await API.get("/audits");
          return auditSchema.array().parse(res.data);
        },
      }),
    ]),
    timeout(2000),
  ]);
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, practiceSlug?: string) => Promise<{ success: boolean; message?: string, user?: User }>;
  acceptInvite: (token: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{success: boolean; message?: string }>;
  changePassword: (newPassword: string) => Promise<{success: boolean; message?: string }>;
  requestResetWeb: (email: string) => Promise<{success: boolean; message?: string}>;
  requestResetMobile: (email: string) => Promise<{success: boolean; message?: string; reset_token?: string}>;
  verifyOtp: (email: string, otp: string) => Promise<{success: boolean; message?: string; reset_token?: string}>;
  resetPasswordWeb: (resetToken: string, newPassword: string) => Promise<{success: boolean; message?: string}>;
  resetPasswordMobile: (resetToken: string, newPassword: string) => Promise<{success: boolean; message?: string}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = isSuperAdminRole(user?.role);

  useEffect(() => {
    checkAuth();
  }, []);

  const rememberTenantSlug = (loggedInUser: User | null) => {
    if (loggedInUser?.practiceSlug) {
      window.sessionStorage.setItem(TENANT_SLUG_STORAGE_KEY, loggedInUser.practiceSlug);
      return;
    }
    window.sessionStorage.removeItem(TENANT_SLUG_STORAGE_KEY);
  };

  const login = async (email: string, password: string, practiceSlug?: string) => {
    try {
      const endpoint = practiceSlug
        ? `${BASE_URL}/auth/practice/${encodeURIComponent(practiceSlug)}/login`
        : `${BASE_URL}/auth/login`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: [401, 403, 404, 422].includes(res.status)
            ? "Invalid credentials, email or password."
            : result.detail?.message || "Login failed",
        };
      }

      let loggedInUser = result.user ?? result.data?.user;

      if (!loggedInUser) {
        const me = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
        if (!me.ok) {
          return { success: false, message: "Login succeeded, but user profile could not be loaded" };
        }
        loggedInUser = await me.json();
      }

      queryClient.clear();
      setUser(loggedInUser);
      setIsAuthenticated(true);
      rememberTenantSlug(loggedInUser);

      if (isSuperAdminRole(loggedInUser.role)) {
        await prefetchSuperAdminData(queryClient);
      }

      return { success: true, user: loggedInUser };
    } catch (err: any) {
      return { success: false, message: "Login failed" };
    }
  };

  const acceptInvite = async (token: string, password: string) => {
    try {
      const { data } = await API.post("/auth/invite/accept", {
        token,
        password,
      });
      const loggedInUser = userSchema.parse(data.user);

      queryClient.clear();
      setUser(loggedInUser);
      setIsAuthenticated(true);
      rememberTenantSlug(loggedInUser);

      return { success: true, user: loggedInUser };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.detail || "Invalid or expired invite.",
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data } = await API.post(`/user`, { name, email, password });
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Registration failed" };
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user?.id) return { success: false, message: "User not authenticated" };

    try {
      const { data } = await API.post(`/auth/change-password`, { new_password: newPassword });
      if (data.user) {
        setUser(data.user);
      }
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err?.response?.data?.detail || "Password change failed" };
    }
  };

  const checkAuth = async () => {
    try {
      let res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });

      if (res.status === 401) {
        const refreshed = await refreshSession();
        if (!refreshed) throw new Error("Refresh failed");
        res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
      }

      if (!res.ok) throw new Error("Auth failed");

      const user = await res.json();
      setUser(user);
      setIsAuthenticated(true);
      rememberTenantSlug(user);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      rememberTenantSlug(null);
  
    } finally {
      setLoading(false);
    }
  };

  // --- WEB PASSWORD RESET ---
  const requestResetWeb = async (email: string) => {
    const { data } = await API.post("/auth/web/request-reset", { email });
    return { success: data.success, message: data.message };
  };

  const resetPasswordWeb = async (resetToken: string, newPassword: string) => {
    const { data } = await API.post("/auth/web/reset-password", { reset_token: resetToken, new_password: newPassword });
    return { success: data.success, message: data.message };
  };

  // --- MOBILE PASSWORD RESET ---
  const requestResetMobile = async (email: string) => {
    const { data } = await API.post("/auth/mobile/request-reset", { email });
    return { success: data.success, message: data.message, reset_token: data.reset_token };
  };

  const verifyOtp = async (email: string, otp: string) => {
    const { data } = await API.post("/auth/mobile/verify-otp", { email, otp });
    return { success: data.success, message: data.message, reset_token: data.reset_token };
  };

  const resetPasswordMobile = async (resetToken: string, newPassword: string) => {
    const { data } = await API.post("/auth/mobile/reset-password", { reset_token: resetToken, new_password: newPassword });
    return { success: data.success, message: data.message };
  };

  const logout = async () => {
    const tenants = queryClient.getQueryData<Array<{ id: string; slug: string; gpUserId?: string }>>(tenantKeys.lists()) ?? [];
    const practice = tenants.find((tenant) => tenant.id === user?.tenantId)
      ?? tenants.find((tenant) => user?.role === "owner" && tenant.gpUserId === user.id);
    const slug = practice?.slug || user?.practiceSlug || window.sessionStorage.getItem(TENANT_SLUG_STORAGE_KEY);
    const loginRoute = isSuperAdminRole(user?.role) ? "/login" : getLoginRoute(slug);
    try {
      await fetch(`${BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // Local auth state still needs to be cleared if the network request fails.
    }
    queryClient.clear();
    if (loginRoute !== "/login" && slug) {
      window.sessionStorage.setItem(TENANT_SLUG_STORAGE_KEY, slug);
    } else {
      window.sessionStorage.removeItem(TENANT_SLUG_STORAGE_KEY);
    }
    setUser(null);
    setIsAuthenticated(false);
    window.location.assign(loginRoute);
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, loading, isAdmin,
      login, acceptInvite, logout, register, changePassword,
      requestResetWeb, requestResetMobile, verifyOtp,
      resetPasswordWeb, resetPasswordMobile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
