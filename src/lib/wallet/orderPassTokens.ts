import crypto from 'crypto';

/**
 * Returns the secret key used for signing order tracking tokens.
 */
function getWalletSecret(): string {
  return (
    process.env.WALLET_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'lumina-production-wallet-secret-key-384910284759'
  );
}

function base64UrlEncode(strOrBuffer: string | Buffer): string {
  const buf = typeof strOrBuffer === 'string' ? Buffer.from(strOrBuffer, 'utf-8') : strOrBuffer;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(str: string): Buffer {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

/**
 * Generates an opaque, anti-enumeration cryptographic token for an order.
 * Format: base64url(orderId).base64url(hmacSha256(orderId, secret))
 */
export function generateOrderTrackingToken(orderId: string): string {
  const cleanId = String(orderId).trim();
  const secret = getWalletSecret();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`lumina_order_tracking_v1:${cleanId}`);
  const signature = hmac.digest();

  const idB64 = base64UrlEncode(cleanId);
  const sigB64 = base64UrlEncode(signature);
  return `${idB64}.${sigB64}`;
}

/**
 * Verifies that a given token is authentic and extracts the underlying orderId.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyOrderTrackingToken(token: string): { valid: boolean; orderId?: string } {
  try {
    if (!token || typeof token !== 'string') return { valid: false };

    const parts = token.trim().split('.');
    if (parts.length !== 2) {
      return { valid: false };
    }

    const [idB64, sigB64] = parts;
    const orderId = base64UrlDecode(idB64).toString('utf-8');
    if (!orderId) return { valid: false };

    const secret = getWalletSecret();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`lumina_order_tracking_v1:${orderId}`);
    const expectedSig = hmac.digest();
    const receivedSig = base64UrlDecode(sigB64);

    if (expectedSig.length !== receivedSig.length) {
      return { valid: false };
    }

    const matches = crypto.timingSafeEqual(expectedSig, receivedSig);
    if (!matches) {
      return { valid: false };
    }

    return { valid: true, orderId };
  } catch (err) {
    console.warn('[orderPassTokens] Error verifying token:', err);
    return { valid: false };
  }
}

/**
 * Generates the Apple Wallet PassKit authentication token for device registration
 * and push notification security.
 */
export function generatePassKitAuthToken(orderId: string): string {
  const cleanId = String(orderId).trim();
  const secret = getWalletSecret();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`lumina_passkit_auth_v1:${cleanId}`);
  return hmac.digest('hex');
}

/**
 * Validates the Apple PassKit authentication token.
 */
export function verifyPassKitAuthToken(orderId: string, providedToken: string): boolean {
  try {
    if (!orderId || !providedToken) return false;
    const expected = generatePassKitAuthToken(orderId);
    const expectedBuf = Buffer.from(expected, 'utf-8');
    const providedBuf = Buffer.from(providedToken, 'utf-8');
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

/**
 * Anonymizes customer full name for public tracking display to preserve privacy.
 * Example: "Erick Arteaga" -> "Erick A."
 */
export function anonymizeCustomerName(fullName?: string): string {
  if (!fullName || typeof fullName !== 'string') return 'Cliente Lumina';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || 'Cliente Lumina';
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}
