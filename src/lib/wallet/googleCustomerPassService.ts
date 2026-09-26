import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface CustomerPassData {
  customerId: string;
  customerName: string;
  customerEmail: string;
  memberCode: string;
  pointsBalance: number;
  tierName?: string;
  status?: string;
}

export interface GoogleCredentials {
  clientEmail: string;
  privateKey: string;
  issuerId: string;
  classId: string;
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function cleanPrivateKey(rawKey?: string): string {
  if (!rawKey) return '';
  let cleaned = rawKey.trim();
  if (cleaned.includes('\\n')) {
    cleaned = cleaned.replace(/\\n/g, '\n');
  }
  return cleaned;
}

/**
 * Safely resolves Google Wallet credentials from multiple environment mechanisms:
 * 1. GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON file)
 * 2. GOOGLE_WALLET_CREDENTIALS_JSON (raw JSON string)
 * 3. GOOGLE_WALLET_CLIENT_EMAIL and GOOGLE_WALLET_PRIVATE_KEY
 */
export function getGoogleWalletCredentials(): GoogleCredentials | null {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000023209784';
  const rawClassSuffix = process.env.GOOGLE_WALLET_CLASS_ID || 'LUMINA_HOME';
  const classId = rawClassSuffix.includes('.') ? rawClassSuffix : `${issuerId}.${rawClassSuffix}`;

  // 1. Check GOOGLE_APPLICATION_CREDENTIALS file path
  const credFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const candidateFilePaths = [
    credFilePath,
    path.resolve(process.cwd(), 'google-wallet-key.json'),
    'C:/Users/WinterOS/Desktop/lumina-home-wallet-ab1112d8500b.json',
  ].filter(Boolean) as string[];

  for (const filePath of candidateFilePaths) {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const json = JSON.parse(fileContent);
        if (json.client_email && json.private_key) {
          return {
            clientEmail: json.client_email,
            privateKey: cleanPrivateKey(json.private_key),
            issuerId,
            classId,
          };
        }
      }
    } catch (err) {
      // Continue searching next candidate
    }
  }

  // 2. Check GOOGLE_WALLET_CREDENTIALS_JSON raw string
  const rawJson = process.env.GOOGLE_WALLET_CREDENTIALS_JSON;
  if (rawJson) {
    try {
      const json = JSON.parse(rawJson);
      if (json.client_email && json.private_key) {
        return {
          clientEmail: json.client_email,
          privateKey: cleanPrivateKey(json.private_key),
          issuerId,
          classId,
        };
      }
    } catch {}
  }

  // 3. Check individual environment variables
  const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
  const privateKey = cleanPrivateKey(process.env.GOOGLE_WALLET_PRIVATE_KEY);
  if (clientEmail && privateKey && privateKey.includes('PRIVATE KEY')) {
    return {
      clientEmail,
      privateKey,
      issuerId,
      classId,
    };
  }

  return null;
}

/**
 * Obtains an OAuth2 access token for Google Wallet REST API
 */
async function getOAuth2AccessToken(clientEmail: string, privateKey: string): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
    const signingInput = `${encodedHeader}.${encodedClaimSet}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const signature = signer.sign(privateKey);
    const assertion = `${signingInput}.${base64UrlEncode(signature)}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.warn('[googleCustomerPassService] OAuth2 Token Error:', errText);
      return null;
    }

    const data = await tokenRes.json();
    return data.access_token || null;
  } catch (err) {
    console.error('[googleCustomerPassService] OAuth2 Exception:', err);
    return null;
  }
}

/**
 * Builds the canonical GenericObject for the client pass
 */
export function buildCustomerGenericObject(
  data: CustomerPassData,
  classId: string,
  objectId: string
) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://luminahome.ec';
  const cleanName = data.customerName.trim() || 'Cliente Lumina';
  const memberCode = data.memberCode.trim();
  const tier = data.tierName || (data.pointsBalance >= 1200 ? 'Nivel Oro' : 'Nivel Plata');
  const pointsStr = `${data.pointsBalance.toLocaleString('es-EC')} Puntos`;
  const statusStr = (data.status || 'Activo').toUpperCase();

  return {
    id: objectId,
    classId,
    state: 'ACTIVE',
    cardTitle: {
      defaultValue: {
        language: 'es',
        value: 'LÚMINA HOME',
      },
    },
    subheader: {
      defaultValue: {
        language: 'es',
        value: 'TARJETA DE CLIENTE',
      },
    },
    header: {
      defaultValue: {
        language: 'es',
        value: cleanName,
      },
    },
    logo: {
      sourceUri: {
        uri: origin.startsWith('https://') ? `${origin}/favicon.ico` : 'https://lumina-home.vercel.app/favicon.ico',
      },
      contentDescription: {
        defaultValue: {
          language: 'es',
          value: 'Lúmina Home',
        },
      },
    },
    hexBackgroundColor: '#171717',
    barcode: {
      type: 'QR_CODE',
      value: memberCode,
      alternateText: memberCode,
    },
    textModulesData: [
      {
        id: 'member_code',
        header: 'CÓDIGO DE CLIENTE',
        body: memberCode,
      },
      {
        id: 'member_tier',
        header: 'NIVEL',
        body: tier,
      },
      {
        id: 'points_balance',
        header: 'PUNTOS LÚMINA',
        body: pointsStr,
      },
      {
        id: 'status',
        header: 'ESTADO',
        body: statusStr,
      },
    ],
    linksModuleData: {
      uris: [
        {
          uri: `${origin}/shop`,
          description: 'Catálogo de Diseños Lúmina Home',
          id: 'store_link',
        },
        {
          uri: `${origin}/profile`,
          description: 'Mi Perfil & Beneficios',
          id: 'profile_link',
        },
      ],
    },
  };
}

export interface CustomerPassResult {
  success: boolean;
  saveUrl: string | null;
  objectId: string;
  isExisting: boolean;
  error?: string;
}

/**
 * Creates or retrieves the Google Wallet GenericObject for a customer with idempotency.
 * Generates the signed JWT url for the "Add to Google Wallet" flow.
 */
export async function createOrGetCustomerGoogleWalletPass(
  customer: CustomerPassData
): Promise<CustomerPassResult> {
  const credentials = getGoogleWalletCredentials();
  if (!credentials) {
    return {
      success: false,
      saveUrl: null,
      objectId: '',
      isExisting: false,
      error: 'Credenciales de Google Wallet no configuradas en el entorno.',
    };
  }

  const { clientEmail, privateKey, issuerId, classId } = credentials;

  // Format objectId compliant with Google Wallet constraints: [a-zA-Z0-9_.-]+
  const safeIdentifier = (customer.customerId || customer.memberCode || customer.customerEmail)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toUpperCase();
  const objectId = `${issuerId}.LUMINA_HOME.CLIENTE_${safeIdentifier}`;

  console.info(`[googleCustomerPassService] Procesando pase para cliente: ${customer.customerEmail || safeIdentifier}`);

  const genericObject = buildCustomerGenericObject(customer, classId, objectId);
  let isExisting = false;

  // 1. Idempotency check via Google Wallet REST API
  try {
    const accessToken = await getOAuth2AccessToken(clientEmail, privateKey);
    if (accessToken) {
      const checkRes = await fetch(
        `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${encodeURIComponent(objectId)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (checkRes.ok) {
        isExisting = true;
        console.info(`[googleCustomerPassService] Generic Object existente detectado (${objectId}), reutilizando.`);
        // Optional: Update object with latest points / tier
        await fetch(
          `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${encodeURIComponent(objectId)}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              textModulesData: genericObject.textModulesData,
              header: genericObject.header,
            }),
          }
        );
      } else if (checkRes.status === 404) {
        // Create new Generic Object via REST API
        const createRes = await fetch(
          'https://walletobjects.googleapis.com/walletobjects/v1/genericObject',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(genericObject),
          }
        );

        if (!createRes.ok) {
          const errDetail = await createRes.text();
          console.warn(`[googleCustomerPassService] REST API creación retornó HTTP ${createRes.status}:`, errDetail);
        } else {
          console.info(`[googleCustomerPassService] Generic Object creado con éxito (${objectId}).`);
        }
      }
    }
  } catch (apiErr) {
    console.warn('[googleCustomerPassService] REST API verificación error (continuando con JWT):', apiErr);
  }

  // 2. Generate signed JWT according to Google Wallet API standards
  try {
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: clientEmail,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      origins: [],
      payload: {
        genericObjects: [genericObject],
      },
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const signature = signer.sign(privateKey);
    const encodedSignature = base64UrlEncode(signature);

    const saveUrl = `https://pay.google.com/gp/v/save/${signingInput}.${encodedSignature}`;

    return {
      success: true,
      saveUrl,
      objectId,
      isExisting,
    };
  } catch (jwtErr) {
    console.error('[googleCustomerPassService] Error firmando JWT:', jwtErr);
    return {
      success: false,
      saveUrl: null,
      objectId,
      isExisting: false,
      error: `Error al firmar pase de Google Wallet: ${String(jwtErr)}`,
    };
  }
}
