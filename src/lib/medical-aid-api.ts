import API from "@/utils/api";
import type { MedicalAidScheme } from "@/lib/medical-aid";

export async function getMedicalAidSchemes(): Promise<MedicalAidScheme[]> {
  const res = await API.get("/medical-aid-schemes");
  return res.data;
}

export async function updateMedicalAidScheme(
  id: string,
  data: Partial<Pick<MedicalAidScheme, "acceptedByPractice" | "isActive" | "plans">>,
): Promise<MedicalAidScheme> {
  const res = await API.patch(`/medical-aid-schemes/${id}`, data);
  return res.data;
}
