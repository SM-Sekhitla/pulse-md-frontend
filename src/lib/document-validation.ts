export function medicationValidationError(
  items: Array<{
    drug: string;
    dose: string;
    frequency: string;
    duration: string;
  }>,
) {
  for (const [index, item] of items.entries()) {
    // Ignore a completely unused extra row, but never silently discard partial entries.
    if (
      ![item.drug, item.dose, item.frequency, item.duration].some((value) =>
        value.trim(),
      )
    )
      continue;
    const missing = (["drug", "dose", "frequency", "duration"] as const)
      .filter((field) => !item[field].trim())
      .map((field) => (field === "drug" ? "medication" : field));
    if (missing.length)
      return `Medication ${index + 1}: enter ${missing.join(", ")} before signing.`;
  }
  return null;
}

export function documentValidationMessage(detail: unknown) {
  const labels: Record<string, string> = {
    drug: "Medication",
    dose: "Dose",
    frequency: "Frequency",
    duration: "Duration",
    patientId: "Patient",
    patientName: "Patient name",
    gpName: "Doctor name",
    hpcsa: "HPCSA number",
    fromDate: "Start date",
    toDate: "End date",
    reason: "Reason",
    icd10: "ICD-10 code",
    items: "Medications",
    validDays: "Validity period",
    appointmentId: "Appointment",
  };
  if (!Array.isArray(detail))
    return "Please check the document details and try again.";
  const fields = detail.flatMap((issue) => {
    const loc = issue?.loc;
    if (!Array.isArray(loc)) return [];
    const label = labels[String(loc.at(-1))];
    if (!label) return [];
    const index = loc.indexOf("items");
    return [
      index >= 0 && typeof loc[index + 1] === "number"
        ? `Medication ${loc[index + 1] + 1}: ${label.toLowerCase()}`
        : label,
    ];
  });
  return fields.length
    ? `Please check: ${[...new Set(fields)].join("; ")}.`
    : "Please check the document details and try again.";
}
