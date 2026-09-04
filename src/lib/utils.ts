/**
 * Normalizes text for accent-insensitive, case-insensitive, and diacritic-insensitive search.
 * Example: "Lámpara" -> "lampara", "Sofá" -> "sofa", "Café" -> "cafe", "Diseño" -> "diseno".
 */
export function normalizeSearchText(text?: string | null): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
