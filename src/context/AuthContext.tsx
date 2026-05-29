import { User } from '@/types/user';
import API from '@/utils/api';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
const BASE_URL = import.meta.env.VITE_API_URL;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string, user?: User }>;
  logout: () => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "super-admin";

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (!res.ok) {
        return { success: false, message: result.detail?.message || "Invalid credentials" };
      }

      

      setUser(result.user);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(result.user));

      return { success: true, user: result.user };
    } catch (err: any) {
      return { success: false, message: "Login failed" };
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
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).id : null;
    if (!userId) return { success: false, message: "User not authenticated" };

    try {
      const { data } = await API.put(`/user/${userId}/change-password`, { new_password: newPassword });
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Password change failed" };
    }
  };

  const checkAuth = async () => {
    try {
      let res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });

      if (res.status === 401) {
        const refresh = await fetch(`${BASE_URL}/auth/refresh`, { method: "POST", credentials: "include" });
        if (!refresh.ok) throw new Error("Refresh failed");
        res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
      }

      if (!res.ok) throw new Error("Auth failed");

      const user = await res.json();
      setUser(user);
      setIsAuthenticated(true);
    } catch {
      await logout()

      setUser(null);
      setIsAuthenticated(false);
  
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
    await fetch(`${BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, loading, isAdmin,
      login, logout, register, changePassword,
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
