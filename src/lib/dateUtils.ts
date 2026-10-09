/**
 * Canonical Date & Time formatting utilities for Lumina Home.
 * Ensures timestamps are always displayed in the user's local device timezone
 * with friendly 12-hour AM/PM format (e.g., "12:20 p. m."), eliminating
 * server-side UTC offsets (like 21:12 instead of 12:20).
 */

export function formatOrderDate(input?: string | { createdAt?: string; date?: string }): string {
  if (!input) return "Reciente";
  const dateOrIso = typeof input === "object" ? (input.createdAt || input.date) : input;
  if (!dateOrIso) return "Reciente";
  try {
    const d = new Date(dateOrIso);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("es-EC", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  } catch {}
  return dateOrIso;
}

export function formatOrderTime(
  createdAtOrIsoOrOrder?: string | { createdAt?: string; time?: string },
  fallbackTime?: string
): string {
  const createdAtOrIso = typeof createdAtOrIsoOrOrder === "object" ? createdAtOrIsoOrOrder.createdAt : createdAtOrIsoOrOrder;
  const fallback = typeof createdAtOrIsoOrOrder === "object" ? (createdAtOrIsoOrOrder.time || fallbackTime) : fallbackTime;

  // 1. If an ISO timestamp exists (from Supabase created_at / createdAt), format in user's browser local time
  if (createdAtOrIso) {
    try {
      const d = new Date(createdAtOrIso);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    } catch {}
  }

  // 2. If fallback exists and is a "HH:mm" string, format into 12-hour AM/PM
  if (fallback && typeof fallback === "string") {
    const clean = fallback.trim();
    if (clean.includes(":")) {
      const parts = clean.split(":");
      const h = parseInt(parts[0], 10);
      const m = parts[1]?.slice(0, 2);
      if (!isNaN(h) && m) {
        const period = h >= 12 ? "p. m." : "a. m.";
        const hour12 = h % 12 || 12;
        return `${hour12.toString().padStart(2, "0")}:${m} ${period}`;
      }
    }
    return clean;
  }

  return "";
}

