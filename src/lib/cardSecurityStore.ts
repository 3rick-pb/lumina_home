"use client";

const PIN_STORAGE_KEY = "lumina_card_security_pin_hash";

/**
 * SHA-256 hash calculation using Web Crypto API
 */
export async function hashCardPin(pin: string): Promise<string> {
  const cleanPin = pin.trim();
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    // Fallback simple hash for non-crypto environments
    let hash = 0;
    for (let i = 0; i < cleanPin.length; i++) {
      hash = (hash << 5) - hash + cleanPin.charCodeAt(i);
      hash |= 0;
    }
    return `pin_hash_${Math.abs(hash)}`;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(`lumina_wallet_card_salt_${cleanPin}`);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if the user has already registered a 5-digit card security PIN
 */
export function hasCardSecurityPin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    return Boolean(stored && stored.length > 0);
  } catch {
    return false;
  }
}

/**
 * Register or update the 5-digit card security PIN
 */
export async function setCardSecurityPin(pin: string): Promise<boolean> {
  const digitsOnly = pin.replace(/\D/g, "").slice(0, 5);
  if (digitsOnly.length !== 5) {
    throw new Error("El PIN debe tener exactamente 5 dígitos numéricos.");
  }

  if (typeof window === "undefined") return false;

  try {
    const hashed = await hashCardPin(digitsOnly);
    localStorage.setItem(PIN_STORAGE_KEY, hashed);
    // Dispatch custom event for reactive sync across open components
    window.dispatchEvent(new Event("lumina-card-pin-updated"));
    return true;
  } catch (err) {
    console.error("Error setting card security pin:", err);
    return false;
  }
}

/**
 * Verify if the provided PIN matches the stored hash
 */
export async function verifyCardSecurityPin(pin: string): Promise<boolean> {
  const digitsOnly = pin.replace(/\D/g, "").slice(0, 5);
  if (digitsOnly.length !== 5) return false;

  if (typeof window === "undefined") return false;

  try {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (!stored) return false;

    const inputHashed = await hashCardPin(digitsOnly);
    return inputHashed === stored;
  } catch (err) {
    console.error("Error verifying card security pin:", err);
    return false;
  }
}

/**
 * Remove the card security PIN
 */
export function removeCardSecurityPin(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PIN_STORAGE_KEY);
    window.dispatchEvent(new Event("lumina-card-pin-updated"));
  } catch {}
}
