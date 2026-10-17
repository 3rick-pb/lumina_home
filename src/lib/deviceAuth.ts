"use client";

export interface DeviceAuthResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
}

const DEVICE_CREDENTIAL_STORAGE_KEY = "lumina_device_cred_id";

/**
 * Verifica si el navegador y el hardware soportan autenticación biométrica de plataforma
 * (Windows Hello, Touch ID, Face ID, bloqueo por huella o PIN de Android).
 */
export async function isDeviceAuthAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Solicita el desbloqueo nativo del dispositivo en el que se navega:
 * Huella digital (Touch ID / Windows Hello / Sensor Android),
 * Reconocimiento facial (Face ID / Windows Hello Cámara),
 * o PIN / contraseña del sistema operativo.
 */
export async function authenticateWithDeviceUnlock(
  reason: string = "Verifica tu identidad para revelar los datos de tu tarjeta"
): Promise<DeviceAuthResult> {
  if (typeof window === "undefined") {
    return { success: false, error: "Entorno no compatible." };
  }

  if (!window.PublicKeyCredential) {
    return {
      success: false,
      error: "Tu navegador no cuenta con soporte para Web Authentication API.",
    };
  }

  try {
    const isAvailable = await isDeviceAuthAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: "No se detectó un método de desbloqueo configurado en este dispositivo (Windows Hello, Touch ID, Face ID o PIN).",
      };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const storedCredId = localStorage.getItem(DEVICE_CREDENTIAL_STORAGE_KEY);

    // Si ya existe una credencial local registrada en este dispositivo, intentar verificarla primero
    if (storedCredId) {
      try {
        const credIdBinary = Uint8Array.from(atob(storedCredId), (c) => c.charCodeAt(0));
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [
              {
                id: credIdBinary,
                type: "public-key",
                transports: ["internal"],
              },
            ],
            userVerification: "required",
            timeout: 60000,
          },
        });

        if (assertion) {
          return { success: true };
        }
      } catch (getErr: unknown) {
        const err = getErr as { name?: string };
        if (err?.name === "NotAllowedError" || err?.name === "AbortError") {
          return { success: false, cancelled: true, error: "Desbloqueo cancelado en el dispositivo." };
        }
        // Si falló por credencial caducada o reinstalada, creamos una nueva a continuación
        console.warn("Re-registrando credencial de plataforma:", getErr);
      }
    }

    // Registrar y verificar en el mismo paso con el autenticador de plataforma nativo
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "Lumina Home",
          id: window.location.hostname || "localhost",
        },
        user: {
          id: userId,
          name: "cliente@lumina.com",
          displayName: "Cliente Lumina",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;

    if (credential && credential.rawId) {
      const b64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem(DEVICE_CREDENTIAL_STORAGE_KEY, b64);
      return { success: true };
    }

    return { success: false, error: "No se pudo completar el desbloqueo del dispositivo." };
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string };
    if (errorObj?.name === "NotAllowedError" || errorObj?.name === "AbortError") {
      return { success: false, cancelled: true, error: "Desbloqueo cancelado por el usuario." };
    }
    return { success: false, error: errorObj?.message || "Error al autenticar con el dispositivo." };
  }
}
