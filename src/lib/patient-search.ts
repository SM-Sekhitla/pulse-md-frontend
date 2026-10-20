/** Match names and phone fragments, including South African local/international prefixes. */
export function matchesPatient(
  query: string,
  patient: { firstName: string; lastName: string; phone: string },
) {
  const text = query.trim().toLocaleLowerCase();
  if (!text) return true;
  if (
    `${patient.firstName} ${patient.lastName}`
      .toLocaleLowerCase()
      .includes(text) ||
    `${patient.lastName} ${patient.firstName}`
      .toLocaleLowerCase()
      .includes(text)
  )
    return true;
  if (!/^[+\d\s()-]+$/.test(text)) return false;
  const digits = (value: string) =>
    value.replace(/\D/g, "").replace(/^0027/, "27").replace(/^27/, "0");
  const phone = digits(patient.phone);
  const search = digits(text);
  return search.length > 0 && phone.includes(search);
}
