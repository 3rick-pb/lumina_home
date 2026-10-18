"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Helper para convertir Base64URL <-> ArrayBuffer
 */
const toBuffer = (b64: string) =>
  Uint8Array.from(atob(b64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

const toBase64Url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/**
 * Desbloqueo directo contra el hardware local del dispositivo (WebAuthn Platform Authenticator).
 * - En celulares: Android Biometric (Huella, Rostro, Patrón o PIN de pantalla) / iOS (Face ID, Touch ID o Código).
 * - En PC: Windows Hello (Huella, Rostro o PIN del sistema) / Mac (Touch ID o Contraseña).
 * - residentKey: "discouraged" evita que Chrome o Windows pregunten "¿Dónde guardar la Passkey?" en la nube.
 * - transports: ["internal"] y authenticatorAttachment: "platform" fuerzan el uso exclusivo del sensor local.
 */
export async function unlockWithDevice(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    throw new Error("Tu navegador no soporta desbloqueo nativo del dispositivo.");
  }

  const rpId = window.location.hostname; // Usar siempre el hostname actual (localhost o dominio de Vercel)
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const savedCredId = localStorage.getItem("lumina_device_lock_id");

  // 1. Si el dispositivo ya fue vinculado antes, pedimos solo verificación directa (Huella/FaceID/PIN del teléfono)
  if (savedCredId) {
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId,
          allowCredentials: [
            {
              id: toBuffer(savedCredId),
              type: "public-key",
              transports: ["internal"], // Fuerza usar SOLO el sensor interno del celular/PC sin buscar otros dispositivos
            },
          ],
          userVerification: "required", // Fuerza pedir Huella, Face ID o PIN de bloqueo de pantalla del teléfono
          timeout: 60000,
        },
      });
      if (assertion) return true;
    } catch (err: unknown) {
      // Si el usuario canceló voluntariamente el prompt de huella/PIN en su celular, detenemos todo y NO revelamos la tarjeta
      if (err instanceof Error && err.name === "NotAllowedError") {
        return false;
      }
      // Si la credencial local ya no existe en el teléfono, limpiamos para recrearla abajo
      localStorage.removeItem("lumina_device_lock_id");
    }
  }

  // 2. Vinculación silenciosa en el dispositivo físico (sin gestores en la nube)
  try {
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "Lumina Home",
          id: rpId,
        },
        user: {
          id: userId,
          name: "Verificacion de Seguridad",
          displayName: "Titular de Tarjeta",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },   // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // OBLIGATORIO: Solo sensor integrado en el propio celular/PC
          residentKey: "discouraged",          // CRÍTICO: Evita que Chrome pregunte "dónde guardar la passkey" en la nube
          requireResidentKey: false,
          userVerification: "required",        // Obliga a pedir Huella, Face ID o PIN del sistema operativo
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (credential) {
      localStorage.setItem("lumina_device_lock_id", toBase64Url(credential.rawId));
      return true;
    }
    return false;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "NotAllowedError") {
      return false;
    }
    return false;
  }
}

export function useDeviceUnlock() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoLockTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Temporizador de Auto-Lock a los 30 segundos
  const scheduleAutoLock = (cardId: string, onHide: () => void) => {
    const existingTimer = autoLockTimersRef.current.get(cardId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      onHide();
      autoLockTimersRef.current.delete(cardId);
    }, 30000); // 30 segundos

    autoLockTimersRef.current.set(cardId, timer);
  };

  // Método unificado para desbloquear una tarjeta al tocar el "ojito"
  const requestCardUnlock = useCallback(
    async (
      cardId: string,
      isCurrentlyVisible: boolean,
      onReveal: () => void,
      onHide: () => void
    ) => {
      // 1. Ocultar sin pedir huella si ya está visible
      if (isCurrentlyVisible) {
        const existingTimer = autoLockTimersRef.current.get(cardId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          autoLockTimersRef.current.delete(cardId);
        }
        onHide();
        return;
      }

      // 2. Invocar desbloqueo nativo del sistema operativo
      try {
        setIsAuthenticating(true);
        setError(null);

        const unlocked = await unlockWithDevice();
        if (unlocked) {
          onReveal();
          scheduleAutoLock(cardId, onHide);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al desbloquear el dispositivo.";
        setError(msg);
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  return {
    isAuthenticating,
    error,
    requestCardUnlock,
    autoLockTimersRef,
  };
}
