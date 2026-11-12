import API from "@/utils/api";
import { isAxiosError } from "axios";

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
  test: (tenantId: string, revision: number) =>
    testConnection(`${base(tenantId)}/test-connection`, { revision }),
  platformStatus: async () =>
    (
      await API.get<{
        credentialsPresent: boolean;
        authenticationEnabled: boolean;
        serverIssue: string | null;
        environment: "sandbox";
      }>("/admin/integrations/medilink/platform/status")
    ).data,
  testPlatform: () =>
    testConnection("/admin/integrations/medilink/platform/test-connection"),
};

async function testConnection(path: string, payload?: { revision: number }) {
  try {
    return (
      await API.post<{ status: string; message: string }>(path, payload, {
        timeout: 30000,
      })
    ).data;
  } catch (error) {
    // Only display known, sanitised connection failures; never an upstream body.
    const messages = [
      "Sandbox authentication is disabled on the server.",
      "Medilink server credentials are incorrectly configured.",
      "Configure both platform development username and password on the backend.",
      "Configure a platform development username and password on the backend to select the account to test.",
      "Configure platform development credentials on the backend.",
      "Ask your platform administrator to configure sandbox credentials for this practice.",
      "Medilink authentication is busy. Try again shortly.",
      "Medilink rejected the authentication request. Check the request format and development account details.",
      "Medilink rejected the authentication Content-Type. Confirm the required header with Medilink.",
      "Medilink rejected sandbox authentication. Check the server credentials and assigned access.",
      "Medilink sandbox authentication is unavailable. Check the endpoint and try again.",
      "Medilink returned an unexpected authentication response.",
      "Could not reach the Medilink sandbox securely. Check connectivity and try again.",
    ];
    if (isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      if (typeof detail === "string" && messages.includes(detail)) {
        throw new Error(detail);
      }
      if (
        detail?.code === "medilink_authentication_failed" &&
        messages.includes(detail.message) &&
        Number.isInteger(detail.upstreamStatus) &&
        detail.upstreamStatus >= 100 &&
        detail.upstreamStatus <= 599
      ) {
        const knownCodes = [
          "invalid_request",
          "invalid_client",
          "invalid_grant",
          "unauthorized_client",
          "unsupported_grant_type",
          "invalid_scope",
          "access_denied",
          "server_error",
          "temporarily_unavailable",
        ];
        const oauth = knownCodes.includes(detail.oauthError)
          ? `; OAuth ${detail.oauthError}`
          : "";
        throw new Error(
          `${detail.message} (HTTP ${detail.upstreamStatus}${oauth})`,
        );
      }
    }
    throw error;
  }
}
