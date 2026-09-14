import type { User } from "@/types/user";

export const getPostAuthRoute = (user: Pick<User, "role" | "mustChangePassword">) => {
  if (user.mustChangePassword) return "/change-password";
  if (user.role === "super-admin") return "/admin";
  return "/dashboard";
};

export const getLoginRoute = (practiceSlug?: string | null) => {
  const slug = practiceSlug ?? (typeof window !== "undefined"
    ? window.sessionStorage.getItem("pulse_tenant_slug")
    : null);
  return slug ? `/practice/${encodeURIComponent(slug)}/login` : "/login";
};
