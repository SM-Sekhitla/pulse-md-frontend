import API from "@/utils/api";

export type ImpersonationStart = {
  success: boolean;
  expiresAt: string;
  practiceSlug: string | null;
  practiceName: string | null;
  owner: { name: string; email: string };
};

export const impersonationService = {
  start: async (tenantId: string, reason: string) => {
    const res = await API.post<ImpersonationStart>(
      `/admin/impersonation/practices/${encodeURIComponent(tenantId)}/start`,
      { reason },
    );
    return res.data;
  },
  end: async () => {
    await API.post("/auth/impersonation/end", undefined, {
      suppressErrorToast: true,
    });
  },
};
