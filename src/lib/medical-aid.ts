export type BillingType = "private" | "medical_aid";
export type MedicalAidSchemeType = "open" | "restricted";

export interface MedicalAidScheme {
  id: string;
  tenantId: string | null;
  name: string;
  type: MedicalAidSchemeType;
  administrator: string;
  isActive: boolean;
  acceptedByPractice: boolean;
  plans: string[];
  createdAt: string;
}

export interface Icd10Code {
  code: string;
  description: string;
  category: string;
}

export interface TariffCode {
  code: string;
  description: string;
  rate: number;
}

const now = "2026-06-10T00:00:00.000Z";

const schemeId = (name: string) =>
  `mas_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;

export const DEFAULT_PLAN_OPTIONS: Record<string, string[]> = {
  [schemeId("Discovery Health Medical Scheme")]: [
    "KeyCare Start",
    "KeyCare Plus",
    "KeyCare Core",
    "Essential Smart",
    "Classic Smart",
    "Classic Saver",
    "Executive Plan",
  ],
  [schemeId("Momentum Health")]: ["Ingwe", "Custom", "Evolve", "Incentive", "Summit"],
  [schemeId("Bonitas Medical Fund")]: [
    "BonStart",
    "BonEssential",
    "BonClassic",
    "BonComplete",
    "BonCap",
  ],
  [schemeId("GEMS (Government Employees Medical Scheme)")]: [
    "Emerald",
    "Ruby",
    "Sapphire",
    "Beryl",
    "Onyx",
  ],
};

const rows: Array<[string, MedicalAidSchemeType, string]> = [
  ["Discovery Health Medical Scheme", "open", "Discovery Health (Pty) Ltd"],
  ["Momentum Health", "open", "Momentum Medical Scheme Administrators"],
  ["Bonitas Medical Fund", "open", "Bonitas Medical Fund"],
  ["Medihelp", "open", "Medihelp"],
  ["Bestmed Medical Scheme", "open", "Bestmed Medical Scheme"],
  ["Fedhealth Medical Scheme", "open", "Fedhealth"],
  ["Keyhealth Medical Scheme", "open", "Medscheme"],
  ["Profmed Medical Scheme", "open", "Profmed"],
  ["LA Health Medical Scheme", "open", "Medscheme"],
  ["Spectramed Medical Scheme", "open", "Medscheme"],
  ["Resolution Health Medical Scheme", "open", "Resolution Health"],
  ["CompCare Medical Scheme", "open", "CompCare Wellness"],
  ["Sizwe Medical Fund", "open", "Sizwe Medical Fund"],
  ["Simples Medical Scheme", "open", "Agility"],
  ["Momentum Advantage", "open", "Momentum Medical Scheme Administrators"],
  ["Selfmed Medical Scheme", "open", "Selfmed"],
  ["Medshield Medical Scheme", "open", "Medshield"],
  ["Prosperity Medical Scheme", "open", "Agility"],
  ["Umvuzo Health Medical Scheme", "open", "Umvuzo"],
  ["Makoti Medical Scheme", "open", "Makoti"],
  ["Oxygen Medical Scheme", "open", "Agility"],
  ["National Independent Medical Aid Scheme (NIMAS)", "open", "NIMAS"],
  ["Alliance Midmed Medical Scheme", "open", "Alliance Midmed"],
  ["Medxxi Medical Scheme", "open", "Agility"],
  ["Sanlam Health", "open", "Sanlam"],
  ["Remed Medical Aid Scheme", "open", "Agility"],
  ["Topmed Medical Scheme", "open", "Topmed"],
  ["Universal Healthcare Medical Fund", "open", "Universal"],
  ["GEMS (Government Employees Medical Scheme)", "restricted", "GEMS"],
  ["Polmed", "restricted", "Medscheme"],
  ["Transmed Medical Fund", "restricted", "Medscheme"],
  ["Nedgroup Medical Aid Scheme", "restricted", "Netcare"],
  ["Anglo American Medical Scheme (AAMAS)", "restricted", "Anglo American"],
  ["Barloworld Medical Scheme", "restricted", "Medscheme"],
  ["Camaf Medical Scheme", "restricted", "Camaf"],
  ["Coastmed", "restricted", "Medscheme"],
  ["De Beers Medical Scheme", "restricted", "De Beers"],
  ["Engen Medical Benefit Fund", "restricted", "Momentum"],
  ["Glencore Medical Scheme", "restricted", "Momentum"],
  ["Old Mutual Staff Medical Aid Fund", "restricted", "Medscheme"],
  ["Sasolmed", "restricted", "Sasolmed"],
  ["Thebemed Medical Scheme", "restricted", "Agility"],
  ["TFG Medical Aid Scheme", "restricted", "Medscheme"],
  ["Vodacom Medical Scheme", "restricted", "Momentum"],
  ["Chromed Medical Scheme", "restricted", "Momentum"],
  ["Hosmed Medical Aid Scheme", "restricted", "Hosmed"],
  ["Netcare Medical Scheme", "restricted", "Netcare"],
  ["Pick n Pay Medical Scheme", "restricted", "Medscheme"],
  ["Shoprite/Checkers Medical Scheme", "restricted", "Medscheme"],
  ["Wooltru Healthcare Fund", "restricted", "Medscheme"],
  ["Petrosure Medical Scheme", "restricted", "Momentum"],
  ["First Rand Group Medical Scheme", "restricted", "Medscheme"],
  ["Standard Bank Medical Scheme", "restricted", "Medscheme"],
  ["ABSA Group Medical Scheme", "restricted", "Medscheme"],
  ["ACFC Medical Fund", "restricted", "Momentum"],
  ["Armscor Medical Scheme", "restricted", "Medscheme"],
  ["BMW Employees Medical Aid Society", "restricted", "Medscheme"],
  ["Eskom Medical Scheme", "restricted", "Medscheme"],
  ["Gesondheidsplan (GEMAS)", "restricted", "Agility"],
  ["Impala Medical Plan", "restricted", "Momentum"],
  ["Massmart Health Plan", "restricted", "Medscheme"],
  ["Mercedes-Benz Medical Aid Fund", "restricted", "Medscheme"],
  ["Minemed Medical Scheme", "restricted", "Momentum"],
  ["Municipal Medical Aid Fund (MUNIMED)", "restricted", "Munimed"],
  ["Nampak Medical Aid Scheme", "restricted", "Medscheme"],
  ["Parmed Medical Aid Scheme", "restricted", "Parmed"],
  ["Popcru Group of Companies Medical Scheme", "restricted", "Agility"],
  ["Rand Mutual Assurance", "restricted", "RMA"],
  ["Samwumed", "restricted", "Samwumed"],
  ["Suremed Health", "restricted", "Momentum"],
  ["Tritoria Medical Fund", "restricted", "Agility"],
  ["Tsogo Sun Group Medical Scheme", "restricted", "Medscheme"],
  ["Volkswagen Medical Aid Fund", "restricted", "Medscheme"],
  ["Xstrata Medical Scheme", "restricted", "Momentum"],
];

export const DEFAULT_MEDICAL_AID_SCHEMES: MedicalAidScheme[] = rows.map(
  ([name, type, administrator]) => {
    const id = schemeId(name);
    return {
      id,
      tenantId: null,
      name,
      type,
      administrator,
      isActive: true,
      acceptedByPractice: true,
      plans: DEFAULT_PLAN_OPTIONS[id] ?? [],
      createdAt: now,
    };
  },
);

export const ICD10_CODES: Icd10Code[] = [
  { code: "A09", description: "Infectious gastroenteritis and colitis, unspecified", category: "A00-B99" },
  { code: "B34.9", description: "Viral infection, unspecified", category: "A00-B99" },
  { code: "C80.9", description: "Malignant neoplasm, unspecified", category: "C00-D49" },
  { code: "D50.9", description: "Iron deficiency anaemia, unspecified", category: "C00-D49" },
  { code: "E11", description: "Type 2 diabetes mellitus", category: "E00-E89" },
  { code: "E66", description: "Obesity", category: "E00-E89" },
  { code: "E78", description: "Disorders of lipoprotein metabolism and other lipidaemias", category: "E00-E89" },
  { code: "F32", description: "Depressive episode", category: "F01-F99" },
  { code: "F41", description: "Other anxiety disorders", category: "F01-F99" },
  { code: "G35", description: "Multiple sclerosis", category: "G00-G99" },
  { code: "G43", description: "Migraine", category: "G00-G99" },
  { code: "H10", description: "Conjunctivitis", category: "H00-H59" },
  { code: "H66", description: "Suppurative and unspecified otitis media", category: "H60-H95" },
  { code: "I10", description: "Essential hypertension", category: "I00-I99" },
  { code: "I25", description: "Chronic ischaemic heart disease", category: "I00-I99" },
  { code: "J06", description: "Acute upper respiratory infections of multiple and unspecified sites", category: "J00-J99" },
  { code: "J18", description: "Pneumonia, unspecified organism", category: "J00-J99" },
  { code: "J44", description: "Other chronic obstructive pulmonary disease", category: "J00-J99" },
  { code: "J45", description: "Asthma", category: "J00-J99" },
  { code: "K21", description: "Gastro-oesophageal reflux disease", category: "K00-K95" },
  { code: "K57", description: "Diverticular disease of intestine", category: "K00-K95" },
  { code: "L20", description: "Atopic dermatitis", category: "L00-L99" },
  { code: "L70", description: "Acne", category: "L00-L99" },
  { code: "M54", description: "Dorsalgia", category: "M00-M99" },
  { code: "M79", description: "Other soft tissue disorders, not elsewhere classified", category: "M00-M99" },
  { code: "N18", description: "Chronic kidney disease", category: "N00-N99" },
  { code: "N39", description: "Other disorders of urinary system", category: "N00-N99" },
  { code: "R05", description: "Cough", category: "R00-R99" },
  { code: "R10", description: "Abdominal and pelvic pain", category: "R00-R99" },
  { code: "R50", description: "Fever of other and unknown origin", category: "R00-R99" },
  { code: "R51", description: "Headache", category: "R00-R99" },
  { code: "Z00", description: "General examination and investigation of persons without complaint", category: "Z00-Z99" },
  { code: "Z13", description: "Special screening examination for other diseases and disorders", category: "Z00-Z99" },
  { code: "Z76.0", description: "Issue of repeat prescription", category: "Z00-Z99" },
];

export const TARIFF_CODES: TariffCode[] = [
  { code: "0190", description: "Initial consultation (new patient)", rate: 650 },
  { code: "0191", description: "Follow-up consultation (established patient)", rate: 520 },
  { code: "0192", description: "Emergency consultation", rate: 850 },
  { code: "0193", description: "Consultation after hours", rate: 920 },
  { code: "0194", description: "Telephonic consultation", rate: 350 },
  { code: "0195", description: "Home visit", rate: 1100 },
  { code: "0196", description: "Consultation for a procedure only", rate: 430 },
  { code: "0198", description: "Prolonged consultation (add-on)", rate: 260 },
  { code: "2630", description: "Minor surgical procedure", rate: 780 },
  { code: "2680", description: "Wound treatment / dressing", rate: 280 },
  { code: "2688", description: "Suturing of wound (per cm)", rate: 220 },
  { code: "3504", description: "Injection (intramuscular/subcutaneous)", rate: 160 },
  { code: "3512", description: "Intravenous infusion setup", rate: 420 },
  { code: "5000", description: "ECG with interpretation", rate: 520 },
  { code: "5009", description: "Spirometry / peak flow", rate: 410 },
  { code: "6161", description: "Pregnancy confirmation", rate: 260 },
  { code: "8505", description: "Pap smear", rate: 390 },
  { code: "2110", description: "Removal of foreign body", rate: 580 },
];

export function acceptedSchemes(schemes: MedicalAidScheme[]) {
  return schemes.filter((scheme) => scheme.isActive && scheme.acceptedByPractice);
}
