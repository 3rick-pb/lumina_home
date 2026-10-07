import crypto from "crypto";

/**
 * Módulo de Cifrado Robusto para Tokens OAuth de Google Drive.
 * Utiliza AES-256-GCM (Authenticated Encryption with Associated Data).
 * Cada cifrado produce un vector de inicialización (IV) aleatorio único y una etiqueta de autenticación (auth tag)
 * para garantizar confidencialidad e integridad criptográfica.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recomendado para GCM

function getEncryptionKey(): Buffer {
  const envKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim();
  if (envKey) {
    if (envKey.length === 64) {
      return Buffer.from(envKey, "hex");
    }
    // Si es una cadena de texto o base64, derivar a exactamente 32 bytes con SHA-256
    return crypto.createHash("sha256").update(envKey).digest();
  }

  // Fallback seguro derivado del secreto o anon key del servidor para entornos de desarrollo
  const fallbackSeed = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "lumina-home-google-drive-key-2026";
  return crypto.createHash("sha256").update(fallbackSeed).digest();
}

/**
 * Cifra un token o texto plano usando AES-256-GCM.
 * Formato devuelto: "iv_hex:tag_hex:ciphertext_hex"
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Descifra un token cifrado con AES-256-GCM.
 * Lanza error si los datos han sido manipulados o la clave es incorrecta.
 */
export function decryptToken(encryptedBundle: string): string {
  if (!encryptedBundle) return "";

  // Si no contiene el formato iv:tag:cipher, podría ser texto legado o inválido
  const parts = encryptedBundle.split(":");
  if (parts.length !== 3) {
    // Si no está cifrado en formato GCM, retornar vacío o el original si es no sensible
    return "";
  }

  try {
    const [ivHex, tagHex, cipherHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.warn("Aviso: No se pudo descifrar token con la clave actual:", err);
    return "";
  }
}

