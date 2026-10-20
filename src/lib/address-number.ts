// Preserve an explicitly typed building number when a provider only knows the
// street. Do not mistake ordinal street names (e.g. "7th Avenue") for numbers.
export function preserveStreetNumber(
  query: string,
  result: { address: string; title: string; houseNumber?: string | number },
) {
  const number = query.trim().match(/^(\d+[a-z]?(?:[-/]\d+[a-z]?)?)\s+(?=\S)/i)?.[1];
  if (!number || String(result.houseNumber ?? "").trim()) {
    return { address: result.address, title: result.title, numberRetained: false };
  }
  const prefix = (text: string) =>
    text.toLowerCase().startsWith(`${number.toLowerCase()} `)
      ? text
      : `${number} ${text}`;
  return {
    address: prefix(result.address),
    title: prefix(result.title),
    numberRetained: true,
  };
}
