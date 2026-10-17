"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Convertidores entre Base64URL y ArrayBuffer sin dependencias externas
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

const STORAGE_CRED_ID_KEY = "lumina_webauthn_platform_cred_id_v2";

export interface DeviceUnlockResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
  method?: "biometric" | "pin";
}

export function useDeviceUnlock() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresPinFallback, setRequiresPinFallback] = useState(false);
  const pendingUnlockCallbackRef = useRef<(() => void) | null>(null);
  const autoLockTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 1. Verificar si el dispositivo soporta autenticación de plataforma (Touch ID, Face ID, Windows Hello, Android)
  const isPlatformAuthSupported = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return false;
    }
    if (!window.PublicKeyCredential) return false;
    try {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  // 2. Desbloqueo Nativo mediante WebAuthn
  const triggerNativeAuth = useCallback(
    async (): Promise<DeviceUnlockResult> => {
      try {
        setIsAuthenticating(true);
        setError(null);

        // a. Solicitar challenge firmado al backend serverless
        const challengeRes = await fetch("/api/cards/unlock", { method: "GET" });
        if (!challengeRes.ok) {
          throw new Error("No se pudo iniciar el protocolo de seguridad con el servidor.");
        }
        const challengeData = await challengeRes.json();
        if (!challengeData.success || !challengeData.challenge || !challengeData.token) {
          throw new Error(challengeData.error || "Respuesta de reto no válida.");
        }

        const challengeBuffer = base64urlToBuffer(challengeData.challenge);
        const savedCredId = localStorage.getItem(STORAGE_CRED_ID_KEY);

        let credential: PublicKeyCredential | null = null;

        // b. Si ya existe una credencial local en este dispositivo, intentar navigator.credentials.get
        if (savedCredId) {
          try {
            const getOptions: CredentialRequestOptions = {
              publicKey: {
                challenge: challengeBuffer,
                allowCredentials: [
                  {
                    id: base64urlToBuffer(savedCredId),
                    type: "public-key",
                    transports: ["internal"],
                  },
                ],
                userVerification: "required", // OBLIGA al PIN/Biometría del dispositivo
                timeout: 60000,
              },
            };
            credential = (await navigator.credentials.get(getOptions)) as PublicKeyCredential | null;
          } catch (getErr: unknown) {
            // Si el usuario canceló explícitamente en el diálogo del sistema
            if (getErr instanceof Error && getErr.name === "NotAllowedError") {
              return { success: false, cancelled: true, error: "Desbloqueo cancelado en el dispositivo." };
            }
            // Si la credencial expiró o fue eliminada del almacén del SO, intentar auto-enrollment transparente
            credential = null;
          }
        }

        // c. Si es la primera vez (o falló get), auto-enrollment transparente con navigator.credentials.create
        if (!credential) {
          try {
            const createOptions: CredentialCreationOptions = {
              publicKey: {
                challenge: challengeBuffer,
                rp: {
                  name: "Lumina Home",
                },
                user: {
                  id: new Uint8Array([118, 101, 114, 105, 102, 121, 45, 99, 97, 114, 100]),
                  name: "usuario@luminahome.com",
                  displayName: "Usuario Lumina",
                },
                pubKeyCredParams: [
                  { type: "public-key", alg: -7 },   // ES256
                  { type: "public-key", alg: -257 }, // RS256
                ],
                authenticatorSelection: {
                  authenticatorAttachment: "platform", // Exclusivamente lector o PIN del propio teléfono/PC
                  userVerification: "required",        // Forzar Huella, Face ID o PIN de bloqueo
                  residentKey: "preferred",
                },
                timeout: 60000,
              },
            };

            credential = (await navigator.credentials.create(createOptions)) as PublicKeyCredential | null;
          } catch (createErr: unknown) {
            if (createErr instanceof Error && createErr.name === "NotAllowedError") {
              return { success: false, cancelled: true, error: "Desbloqueo cancelado en el dispositivo." };
            }
            throw createErr;
          }
        }

        if (!credential) {
          throw new Error("El sensor del dispositivo no devolvió credenciales válidas.");
        }

        // d. Extraer respuesta y guardar credId para futuros desbloqueos en 1 solo paso
        const credResponse = credential.response as AuthenticatorResponse & {
          clientDataJSON: ArrayBuffer;
        };

        const clientDataJSON = bufferToBase64url(credResponse.clientDataJSON);
        const newCredId = bufferToBase64url(credential.rawId);
        localStorage.setItem(STORAGE_CRED_ID_KEY, newCredId);

        // e. Validar con el backend serverless
        const verifyRes = await fetch("/api/cards/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: challengeData.token,
            clientDataJSON,
            credentialId: newCredId,
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || "Validación de seguridad fallida.");
        }

        return { success: true, method: "biometric" };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error durante la autenticación del dispositivo.";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  // 3. Método unificado para desbloquear una tarjeta al tocar el "ojito"
  const requestCardUnlock = useCallback(
    async (
      cardId: string,
      isCurrentlyVisible: boolean,
      onReveal: () => void,
      onHide: () => void
    ) => {
      // Regla 5.1: Ocultar sin pedir huella si ya está visible
      if (isCurrentlyVisible) {
        // Limpiar temporizador pendiente si existía
        const existingTimer = autoLockTimersRef.current.get(cardId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          autoLockTimersRef.current.delete(cardId);
        }
        onHide();
        return;
      }

      // Verificar si el dispositivo soporta biometría/PIN de plataforma
      const supported = await isPlatformAuthSupported();
      if (!supported) {
        // Fallback para PCs antiguas o navegadores sin biometría nativa
        pendingUnlockCallbackRef.current = () => {
          onReveal();
          scheduleAutoLock(cardId, onHide);
        };
        setRequiresPinFallback(true);
        return;
      }

      // Invocar autenticación biométrica nativa de plataforma
      const result = await triggerNativeAuth();
      if (result.success) {
        onReveal();
        scheduleAutoLock(cardId, onHide);
      } else if (!result.cancelled) {
        // Si falló por incompatibilidad inesperada, ofrecer fallback sin bloquear
        pendingUnlockCallbackRef.current = () => {
          onReveal();
          scheduleAutoLock(cardId, onHide);
        };
        setRequiresPinFallback(true);
      }
    },
    [isPlatformAuthSupported, triggerNativeAuth]
  );

  // 4. Temporizador de Auto-Lock a los 30 segundos (Regla 5.2)
  const scheduleAutoLock = (cardId: string, onHide: () => void) => {
    const existingTimer = autoLockTimersRef.current.get(cardId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      onHide();
      autoLockTimersRef.current.delete(cardId);
    }, 30000); // 30 segundos

    autoLockTimersRef.current.set(cardId, timer);
  };

  // 5. Fallback con PIN de seguridad
  const verifyFallbackPin = useCallback(
    async (pin: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/cards/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fallbackPin: pin }),
        });
        const data = await res.json();
        if (data.success) {
          if (pendingUnlockCallbackRef.current) {
            pendingUnlockCallbackRef.current();
            pendingUnlockCallbackRef.current = null;
          }
          setRequiresPinFallback(false);
          setError(null);
          return true;
        } else {
          setError(data.error || "PIN incorrecto");
          return false;
        }
      } catch {
        setError("Error al verificar PIN de seguridad");
        return false;
      }
    },
    []
  );

  const closePinFallback = useCallback(() => {
    setRequiresPinFallback(false);
    pendingUnlockCallbackRef.current = null;
    setError(null);
  }, []);

  return {
    isAuthenticating,
    error,
    requiresPinFallback,
    requestCardUnlock,
    verifyFallbackPin,
    closePinFallback,
    autoLockTimersRef,
  };
}
