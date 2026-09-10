/** Canonical form used to compare team names for duplicates. */
export function normalizeTeamName(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
