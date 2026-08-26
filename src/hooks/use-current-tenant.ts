import { useData } from "@/context/AppDataProvider";
import { useAuth } from "@/context/AuthContext";

export function useCurrentTenant() {
  const { tenant } = useData();
  const { user } = useAuth();

  if (!user?.tenantId) return null;
  return tenant.tenants.find((item) => item.id === user.tenantId) ?? null;
}
