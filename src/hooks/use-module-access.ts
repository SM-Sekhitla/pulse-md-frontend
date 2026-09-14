import { useMemo } from "react";

import { isSuperAdminRole, useAuth } from "@/context/AuthContext";
import { useTenants } from "@/context/TenantContext";
import { tenantEnabledModules } from "@/lib/modules";
import type { ModuleKey } from "@/types/tenant";

export function useModuleAccess(modules?: ModuleKey | ModuleKey[]): boolean {
  const { user, loading } = useAuth();
  const { tenants, isLoading } = useTenants();

  return useMemo(() => {
    if (loading || !user) return false;
    if (isSuperAdminRole(user.role)) return true;
    if (!modules) return true;
    if (isLoading || !user.tenantId) return false;

    const tenant = tenants.find((item) => item.id === user.tenantId);
    if (!tenant) return false;

    const allowed = tenantEnabledModules(tenant);
    const requested = Array.isArray(modules) ? modules : [modules];
    return requested.some((module) => allowed.includes(module));
  }, [isLoading, loading, modules, tenants, user]);
}
