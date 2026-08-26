// src/api/axios.ts
import axios, { AxiosRequestConfig } from 'axios';

declare module "axios" {
  interface AxiosRequestConfig {
    suppressErrorToast?: boolean;
  }
}

const BASE_URL = import.meta.env.VITE_API_URL;
const REFRESH_PATH = "/auth/refresh";

let refreshPromise: Promise<boolean> | null = null;
let redirectingToLogin = false;

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ⚠ send cookies with every request
});

export const getApiErrorMessage = (error: any) => {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  const message =
    detail?.message ||
    (typeof detail === "string" ? detail : null) ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong";

  if (status >= 500) {
    return "Something went wrong on the server. Please try again.";
  }

  if (status === 422 || Array.isArray(detail)) {
    return "Please check the form details and try again.";
  }

  if (typeof message === "string") {
    const internalFragments = [
      "validation error",
      "invalid_type",
      "\"expected\"",
      "\"code\"",
      "\"path\"",
      "traceback",
      "typeerror",
      "valueerror",
      "pydantic",
      "zod",
      "objectid",
      "vars()",
      "not iterable",
    ];
    const lowerMessage = message.toLowerCase();
    if (internalFragments.some((fragment) => lowerMessage.includes(fragment))) {
      return "Something went wrong. Please try again.";
    }
  }

  return message;
};

const isAuthRefreshRequest = (url?: string) => {
  if (!url) return false;
  return url.includes(REFRESH_PATH);
};

export const redirectToLogin = () => {
  if (redirectingToLogin || window.location.pathname === "/login") return;
  redirectingToLogin = true;
  window.location.href = "/login";
};

export const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}${REFRESH_PATH}`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Optional: automatically refresh access token on 401
API.interceptors.response.use(
  (response) => response, // pass through successful responses
  async (error) => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRefreshRequest(originalRequest.url)
    ) {
      originalRequest._retry = true;

      const refreshed = await refreshSession();
      if (refreshed) {
        // Retry the original request after refresh
        return API(originalRequest);
      }

      redirectToLogin();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest?._retry) {
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default API;
