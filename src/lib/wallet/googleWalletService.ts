import crypto from 'crypto';
import { anonymizeCustomerName } from './orderPassTokens';
import { getGoogleWalletCredentials } from './googleCustomerPassService';

export interface GoogleWalletOrderInput {
  orderId: string;
  status: 'Procesando' | 'Enviado' | 'Entregado';
  total: number;
  customerName?: string;
  date?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrierName?: string;
  origin?: string;
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * Normalizes private key from environment variables.
 */
export function cleanPrivateKey(rawKey?: string): string {
  if (!rawKey) return '';
  let cleaned = rawKey.trim();
  if (cleaned.includes('\\n')) {
    cleaned = cleaned.replace(/\\n/g, '\n');
  }
  return cleaned;
}

export function isGoogleWalletConfigured(): boolean {
  return getGoogleWalletCredentials() !== null;
}

/**
 * Builds the official GenericClass and GenericObject payload for Google Wallet
 */
export function buildGoogleGenericObject(data: GoogleWalletOrderInput, issuerId: string) {
  const origin = data.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://luminahome.ec';
  const cleanId = data.orderId.trim();
  const livePassUrl = `${origin}/profile`;

  const safeOrderId = cleanId.replace(/[^a-zA-Z0-9._-]/g, '_');
  const classId = `${issuerId}.lumina_order_tracking_v1`;
  const objectId = `${issuerId}.order_${safeOrderId}`;

  const status = data.status || 'Procesando';
  const isShipped = status === 'Enviado';
  const isDelivered = status === 'Entregado';

  let statusLabel = 'EN PREPARACIÓN';
  let statusMessage =
    'Tu pedido está siendo preparado. El enlace de seguimiento aparecerá aquí en cuanto el paquete sea entregado al operador logístico.';

  if (isShipped) {
    statusLabel = 'EN CAMINO';
    statusMessage =
      'Tu pedido está en camino. Puedes rastrear los movimientos de tu paquete con la guía indicada.';
  } else if (isDelivered) {
    statusLabel = 'ENTREGADO';
    statusMessage =
      'Tu pedido ha sido entregado correctamente. Gracias por confiar en Lúmina Home.';
  }

  const customerName = anonymizeCustomerName(data.customerName);
  const totalFormatted = `$${Number(data.total || 0).toFixed(2)} USD`;
  const dateStr = data.date || 'Reciente';

  const textModulesData: Array<{ id: string; header: string; body: string }> = [
    {
      id: 'order_status',
      header: 'ESTADO DEL PEDIDO',
      body: statusLabel,
    },
    {
      id: 'status_message',
      header: 'DETALLE DE ENTREGA',
      body: statusMessage,
    },
    {
      id: 'customer',
      header: 'TITULAR',
      body: customerName,
    },
    {
      id: 'total',
      header: 'IMPORTE FACTURADO',
      body: totalFormatted,
    },
    {
      id: 'date',
      header: 'FECHA DE COMPRA',
      body: dateStr,
    },
  ];

  if ((isShipped || isDelivered) && data.trackingNumber) {
    textModulesData.splice(2, 0, {
      id: 'carrier_tracking',
      header: `GUÍA DE ENVÍO (${(data.carrierName || 'OPERADOR').toUpperCase()})`,
      body: data.trackingNumber.trim().toUpperCase(),
    });
  }

  const linksUris: Array<{ uri: string; description: string; id: string }> = [
    {
      id: 'web_tracking',
      uri: livePassUrl,
      description: 'Ver seguimiento interactivo en Lúmina Home',
    },
  ];

  // Only attach external carrier link when shipped or delivered and URL is valid
  if ((isShipped || isDelivered) && data.trackingUrl && /^https?:\/\//i.test(data.trackingUrl)) {
    linksUris.unshift({
      id: 'carrier_portal',
      uri: data.trackingUrl.trim(),
      description: `Rastrear en directo con ${data.carrierName || 'la transportadora'}`,
    });
  }

  const genericClass = {
    id: classId,
    issuerName: 'Lúmina Home',
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: '#111113',
    logo: {
      sourceUri: {
        uri: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=256&auto=format&fit=crop&q=80',
      },
    },
  };

  const genericObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    hexBackgroundColor: '#111113',
    cardTitle: {
      defaultValue: {
        language: 'es',
        value: 'Lúmina Home · Pedido',
      },
    },
    subheader: {
      defaultValue: {
        language: 'es',
        value: `Estado: ${statusLabel}`,
      },
    },
    header: {
      defaultValue: {
        language: 'es',
        value: cleanId,
      },
    },
    barcode: {
      type: 'QR_CODE',
      value: livePassUrl,
      alternateText: `${cleanId} · ${statusLabel}`,
    },
    textModulesData,
    linksModuleData: {
      uris: linksUris,
    },
  };

  return { genericClass, genericObject, classId, objectId };
}

/**
 * Builds the signed Google Wallet "Add to Wallet" Save JWT URL
 */
export function buildGoogleWalletOrderJwtUrl(data: GoogleWalletOrderInput): {
  saveUrl: string | null;
  error?: string;
} {
  const credentials = getGoogleWalletCredentials();
  if (!credentials) {
    return {
      saveUrl: null,
      error: 'Credenciales de Google Wallet no configuradas.',
    };
  }
  const { issuerId, clientEmail, privateKey } = credentials;

  try {
    const { genericClass, genericObject } = buildGoogleGenericObject(data, issuerId);

    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: clientEmail,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      origins: [data.origin || 'https://luminahome.ec'],
      payload: {
        genericClasses: [genericClass],
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
    return { saveUrl };
  } catch (err) {
    console.error('[googleWalletService] JWT signing error:', err);
    return { saveUrl: null, error: String(err) };
  }
}

/**
 * Obtains a Google Cloud OAuth2 Access Token for REST API calls
 */
async function getGoogleWalletAccessToken(): Promise<string | null> {
  const credentials = getGoogleWalletCredentials();
  if (!credentials) return null;

  const { clientEmail, privateKey } = credentials;

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
    const input = `${encodedHeader}.${encodedClaimSet}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(input);
    signer.end();
    const signature = signer.sign(privateKey);
    const assertion = `${input}.${base64UrlEncode(signature)}`;

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
      console.warn('[googleWalletService] OAuth2 Token Error:', errText);
      return null;
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token || null;
  } catch (err) {
    console.error('[googleWalletService] OAuth2 Token Request Exception:', err);
    return null;
  }
}

/**
 * Builds a human-readable notification message for a status change.
 */
function buildStatusNotification(data: GoogleWalletOrderInput): { header: string; body: string } {
  const shortId = data.orderId.slice(-8).toUpperCase();
  switch (data.status) {
    case 'Enviado':
      return {
        header: '📦 Tu pedido está en camino',
        body: `El pedido #${shortId} ha sido despachado${data.carrierName ? ` con ${data.carrierName}` : ''}. Guía: ${data.trackingNumber || 'Ver en tu pase'}.`,
      };
    case 'Entregado':
      return {
        header: '✅ Pedido entregado',
        body: `El pedido #${shortId} fue entregado correctamente. ¡Gracias por confiar en Lúmina Home!`,
      };
    default:
      return {
        header: '🔄 Pedido en preparación',
        body: `El pedido #${shortId} está siendo procesado. Te notificaremos cuando sea despachado.`,
      };
  }
}

/**
 * Pushes live updates directly to Google Wallet via REST API:
 *   1. PATCH the genericObject (updates data on the pass)
 *   2. addMessage with TEXT_AND_NOTIFY (triggers push notification to user's device)
 */
export async function pushGoogleWalletOrderUpdate(data: GoogleWalletOrderInput): Promise<{
  success: boolean;
  status: 'UPDATED' | 'CREATED' | 'SKIPPED' | 'FAILED';
  message?: string;
}> {
  const credentials = getGoogleWalletCredentials();
  if (!credentials) {
    return {
      success: false,
      status: 'SKIPPED',
      message: 'Credenciales de Google Wallet no configuradas en el entorno.',
    };
  }
  const issuerId = credentials.issuerId;

  try {
    const accessToken = await getGoogleWalletAccessToken();
    if (!accessToken) {
      return {
        success: false,
        status: 'FAILED',
        message: 'No se pudo obtener el token de acceso OAuth2 de Google Service Account.',
      };
    }

    const { genericObject, objectId } = buildGoogleGenericObject(data, issuerId);
    const objectUrl = `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${encodeURIComponent(objectId)}`;

    // ── 1. PATCH: update pass data ───────────────────────────────────────────
    const patchRes = await fetch(objectUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(genericObject),
    });

    let resultStatus: 'UPDATED' | 'CREATED' | 'SKIPPED' | 'FAILED' = 'FAILED';
    let resultMessage = '';

    if (patchRes.ok) {
      resultStatus = 'UPDATED';
      resultMessage = 'Google Wallet pass actualizado.';
    } else if (patchRes.status === 404) {
      // Object doesn't exist yet — create class + object
      const { genericClass } = buildGoogleGenericObject(data, issuerId);

      await fetch('https://walletobjects.googleapis.com/walletobjects/v1/genericClass', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(genericClass),
      });

      const insertRes = await fetch(
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

      if (insertRes.ok) {
        resultStatus = 'CREATED';
        resultMessage = 'Google Wallet pass creado (el usuario deberá abrirlo para recibir notificaciones futuras).';
      } else {
        const errBody = await insertRes.text();
        return {
          success: false,
          status: 'FAILED',
          message: `Google Wallet insert error ${insertRes.status}: ${errBody}`,
        };
      }
    } else {
      const errBody = await patchRes.text();
      return {
        success: false,
        status: 'FAILED',
        message: `Google Wallet PATCH error ${patchRes.status}: ${errBody}`,
      };
    }

    // ── 2. addMessage: push notification to user's device (TEXT_AND_NOTIFY) ──
    // Only send for UPDATED (object already existed and is saved in a device's wallet)
    if (resultStatus === 'UPDATED') {
      try {
        const { header, body } = buildStatusNotification(data);
        const notifRes = await fetch(`${objectUrl}/addMessage`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              id: `status_${data.status.toLowerCase()}_${Date.now()}`,
              header,
              body,
              messageType: 'TEXT_AND_NOTIFY',
            },
          }),
        });

        if (notifRes.ok) {
          resultMessage += ' Notificación push enviada al dispositivo del usuario.';
        } else {
          const notifErr = await notifRes.text();
          // Non-fatal: the pass was updated, notification is best-effort
          console.warn(`[googleWalletService] addMessage falló (${notifRes.status}): ${notifErr}`);
          resultMessage += ' (Notificación push no pudo enviarse, pero el pase fue actualizado.)';
        }
      } catch (notifErr) {
        console.warn('[googleWalletService] addMessage exception (non-fatal):', notifErr);
        resultMessage += ' (Excepción en notificación push, pase actualizado correctamente.)';
      }
    }

    return { success: true, status: resultStatus, message: resultMessage };
  } catch (err) {
    console.error('[googleWalletService] Live Push Update Exception:', err);
    return {
      success: false,
      status: 'FAILED',
      message: String(err),
    };
  }
}
