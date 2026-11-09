import API from "@/utils/api";

export type MedilinkConfig = {
  revision: number;
  environment: "sandbox";
  wireVersion: string;
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

export const medilinkService = {
  settings: async () =>
    (await API.get<MedilinkSettings>("/integrations/medilink/settings")).data,
  save: async (values: MedilinkConfig) =>
    (await API.put<MedilinkSettings>("/integrations/medilink/settings", values))
      .data,
  providers: async () =>
    (await API.get<MedilinkProvider[]>("/integrations/medilink/providers"))
      .data,
  test: async (revision: number) =>
    (
      await API.post<{ status: string; message: string }>(
        "/integrations/medilink/test-connection",
        { revision },
      )
    ).data,
};
