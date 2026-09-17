import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

