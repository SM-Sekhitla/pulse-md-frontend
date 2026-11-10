import API from "@/utils/api";

export type MedilinkConfig = {
  revision: number;
  environment: "sandbox";
  wireVersion: string;
  membershipLookupEnabled: boolean;
  supplierName: string;
  supplierBhf: string;
  supplierHpcsa: string;
  placeOfService: 11 | 12;
  treatingProviders: Array<{ userId: string; bhf: string; hpcsa: string }>;
  schemeMappings: Array<{
    schemeId: string;
    planName: string;
    optionCode: string;
  }>;
};

export type MedilinkSettings = MedilinkConfig & {
  credentialsPresent: boolean;
  authenticationEnabled: boolean;
  membershipChecksEnabled: boolean;
  serverIssue: string | null;
  missingSetup: string[];
  connection: {
    status: "authenticated" | "failed";
    message: string;
    checkedAt: string;
  } | null;
  submissionEnabled: boolean;
  benefitChecksEnabled: boolean;
};

export type MedilinkProvider = { id: string; name: string; hpcsa: string };

const base = (tenantId: string) =>
  `/admin/integrations/medilink/practices/${encodeURIComponent(tenantId)}`;

export const medilinkService = {
  settings: async (tenantId: string) =>
    (await API.get<MedilinkSettings>(`${base(tenantId)}/settings`)).data,
  save: async (tenantId: string, values: MedilinkConfig) =>
    (await API.put<MedilinkSettings>(`${base(tenantId)}/settings`, values))
      .data,
  providers: async (tenantId: string) =>
    (await API.get<MedilinkProvider[]>(`${base(tenantId)}/providers`)).data,
  schemes: async (tenantId: string) =>
    (
      await API.get<
        Array<{ id: string; name: string; isActive: boolean; plans: string[] }>
      >(`${base(tenantId)}/schemes`)
    ).data,
  test: async (tenantId: string, revision: number) =>
    (
      await API.post<{ status: string; message: string }>(
        `${base(tenantId)}/test-connection`,
        { revision },
      )
    ).data,
};
