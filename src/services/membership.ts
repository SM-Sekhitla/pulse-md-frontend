import API from "@/utils/api";

export type MembershipValues = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "dob"
    | "gender"
    | "idNumber"
    | "phone"
    | "address"
    | "medicalAid"
    | "medicalAidSchemeId"
    | "medicalAidSchemeName"
    | "medicalAidPlan"
    | "medicalAidNumber"
    | "dependantCode"
    | "mainMemberName"
    | "mainMemberNumber"
    | "relationshipToMain",
    string
  >
> & { isMainMember?: boolean };
export type MembershipResult = {
  lookupId: string;
  outcome: "match_found" | "no_match";
  checkedAt: string;
  expiresAt: string;
  message: string;
  dependants: Array<{
    index: number;
    name: string;
    dependantCode: string;
    values: MembershipValues;
    canApply: boolean;
    membershipStatus: string;
  }>;
};
export type MembershipHistory = {
  id: string;
  checkedAt: string;
  schemeName: string;
  outcome: string;
  reviewed: boolean;
};

export const membershipService = {
  status: async () =>
    (
      await API.get<{ available: boolean }>("/membership/status", {
        suppressErrorToast: true,
        timeout: 5000,
      })
    ).data,
  query: async (values: {
    schemeId: string;
    planName: string;
    memberNumber: string;
    patientId?: string;
    authorized: true;
  }) =>
    (
      await API.post<MembershipResult>("/membership/query", values, {
        suppressErrorToast: true,
        timeout: 45000,
      })
    ).data,
  review: async (lookupId: string, dependantIndex: number, fields: string[]) =>
    (
      await API.post<{ lookupId: string; values: MembershipValues }>(
        `/membership/${lookupId}/review`,
        { dependantIndex, fields },
        { suppressErrorToast: true, timeout: 10000 },
      )
    ).data,
  link: async (lookupId: string, patientId: string) =>
    (
      await API.post(
        `/membership/${lookupId}/link`,
        { patientId },
        { suppressErrorToast: true, timeout: 5000 },
      )
    ).data,
  history: async (patientId: string) =>
    (
      await API.get<MembershipHistory[]>(
        `/membership/patients/${encodeURIComponent(patientId)}/history`,
        { suppressErrorToast: true, timeout: 5000 },
      )
    ).data,
};
