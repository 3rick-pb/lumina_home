import crypto from 'node:crypto';

// Clave por defecto de desarrollo si no estuviera configurada en .env.local
const DEFAULT_FALLBACK_KEY = '1a2b3b91a52397e49ee4d111fb7fad923a599447c9e5fc6aa36b95d6d9e62c8f';
const DEFAULT_FALLBACK_WEBAUTHN = '080e328c92f079a9f080b15a2cb2f7b6916585d40e05ddda8f55fa4de795cd74';

function getEncryptionKey(): Buffer {
  const hex = process.env.CARD_ENCRYPTION_KEY || DEFAULT_FALLBACK_KEY;
  return Buffer.from(hex, 'hex');
}

function getWebAuthnSecret(): string {
  return process.env.WEBAUTHN_SECRET_KEY || DEFAULT_FALLBACK_WEBAUTHN;
}

/**
 * Cifra un texto sensible (ej. número de tarjeta) usando AES-256-GCM
 * Formato resultante: iv:tag:ciphertext (en hexadecimal)
 */
export function encryptSensitive(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recomendado para GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Descifra un texto sensible cifrado con AES-256-GCM
 */
export function decryptSensitive(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return cipherText;
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText;

    const [ivHex, tagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[card-crypto] Error al descifrar texto sensible:', err);
    return cipherText;
  }
}

/**
 * Genera un challenge criptográfico aleatorio de 32 bytes y lo firma con HMAC-SHA256
 * con tiempo de expiración de 60 segundos (stateless, ideal para Serverless en Vercel)
 */
export function generateSignedChallenge(ttlSeconds = 60): {
  challenge: string;
  expiresAt: number;
  token: string;
} {
  const challengeBuf = crypto.randomBytes(32);
  // Base64URL string sin relleno para compatibilidad directa con WebAuthn API
  const challenge = challengeBuf.toString('base64url');
  const expiresAt = Date.now() + ttlSeconds * 1000;

  const secret = getWebAuthnSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${challenge}:${expiresAt}`)
    .digest('base64url');

  // Token compacto: challenge.expiresAt.signature
  const token = `${challenge}.${expiresAt}.${signature}`;

  return { challenge, expiresAt, token };
}

/**
 * Verifica la firma y vigencia de un challenge WebAuthn firmado
 */
export function verifySignedChallenge(
  token: string
): { valid: boolean; challenge?: string; reason?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Token ausente o inválido' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Estructura de token inválida' };
  }

  const [challenge, expiresAtStr, signature] = parts;
  const expiresAt = Number.parseInt(expiresAtStr, 10);

  if (Number.isNaN(expiresAt)) {
    return { valid: false, reason: 'Timestamp de expiración inválido' };
  }

  if (Date.now() > expiresAt) {
    return { valid: false, reason: 'El reto criptográfico ha expirado (máximo 60s)' };
  }

  const secret = getWebAuthnSecret();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${challenge}:${expiresAt}`)
    .digest('base64url');

  // Comparación en tiempo constante para mitigar timing attacks
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: 'Firma de autenticidad del reto inválida' };
  }

  return { valid: true, challenge };
}
