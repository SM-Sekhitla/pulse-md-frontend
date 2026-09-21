import API from "@/utils/api";
export type Claim = {
  id: string;
  reference: string;
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  schemeName: string;
  memberNumber: string;
  dependantCode: string;
  dateOfService: string;
  billedCents: number;
  revision: number;
  status: "draft" | "needs_attention" | "prepared";
  deliveryStatus: string;
  assessmentStatus: string;
  validationErrors: string[];
  diagnoses: Array<{ code: string; description: string }>;
  lines: Array<{
    code: string;
    description: string;
    quantity: number;
    rateCents: number;
    amountCents: number;
    diagnosisCodes?: string[];
  }>;
  events: Array<{
    type: string;
    description: string;
    createdAt: string;
    actorId: string;
  }>;
  updatedAt: string;
};
export type ClaimsPage = {
  items: Claim[];
  total: number;
  page: number;
  pageSize: number;
};
export const claimsService = {
  correct: async (claim: Claim, values: DraftCorrection) =>
    (
      await API.patch<Claim>(`/claims/${claim.id}/draft`, {
        ...values,
        revision: claim.revision,
      })
    ).data,
  refreshInvoice: async (claim: Claim) =>
    (
      await API.post<Claim>(`/claims/${claim.id}/refresh-invoice`, {
        revision: claim.revision,
      })
    ).data,
  list: async (q: string, status: string, page: number, signal?: AbortSignal) =>
    (
      await API.get<ClaimsPage>("/claims", {
        params: { q, status, page },
        signal,
      })
    ).data,
  detail: async (id: string) => (await API.get<Claim>(`/claims/${id}`)).data,
  create: async (invoiceId: string) =>
    (await API.post<Claim>("/claims", { invoiceId })).data,
  validate: async (claim: Claim) =>
    (
      await API.post<Claim>(`/claims/${claim.id}/validate`, {
        revision: claim.revision,
      })
    ).data,
  note: async (claim: Claim, text: string) =>
    (
      await API.post<Claim>(`/claims/${claim.id}/notes`, {
        revision: claim.revision,
        text,
      })
    ).data,
};

export type DraftCorrection = Pick<
  Claim,
  "memberNumber" | "dependantCode" | "dateOfService" | "diagnoses"
> & {
  lineDiagnoses: string[][];
};
