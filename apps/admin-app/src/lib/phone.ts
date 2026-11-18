/** Accepts "+992 92 555 01 01", "92-555-0101" or "992925550101" and returns E.164 ("+992925550101"). */
export function normalizePhone(input: string) {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 9) return `+992${digits}`;
  return `+${digits}`;
}
