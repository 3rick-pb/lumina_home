import { NextResponse } from 'next/server';
import {
  verifyOrderTrackingToken,
} from '@/lib/wallet/orderPassTokens';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  createOrGetCustomerGoogleWalletPass,
  getGoogleWalletCredentials,
} from '@/lib/wallet/googleCustomerPassService';
import { buildGoogleGenericObject } from '@/lib/wallet/googleWalletService';
import crypto from 'crypto';

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeOrderTracking(rawTracking: unknown, status: string) {
  if (!rawTracking || status === 'Procesando') {
    return { trackingNumber: undefined, trackingUrl: undefined, carrierName: undefined };
  }
  const str = String(rawTracking).trim();
  if (!str) {
    return { trackingNumber: undefined, trackingUrl: undefined, carrierName: undefined };
  }
  if (str.includes('||')) {
    const [code, url, carrier] = str.split('||');
    return {
      trackingNumber: code?.trim() || undefined,
      trackingUrl: url?.trim() || undefined,
      carrierName: carrier?.trim() || undefined,
    };
  }
  return {
    trackingNumber: str,
    trackingUrl: undefined,
    carrierName: undefined,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const passType = searchParams.get('type') || 'loyalty';
  const origin = new URL(request.url).origin;

  // ============================================================================
  // A. ORDER TRACKING PASS (type=order) — Google Wallet direct
  // ============================================================================
  if (passType === 'order') {
    const rawToken = searchParams.get('token')?.trim();
    const rawOrderId = searchParams.get('orderId')?.trim();

    let resolvedOrderId = rawOrderId || '';

    // Verify token if provided
    if (rawToken) {
      const verification = verifyOrderTrackingToken(rawToken);
      if (verification.valid && verification.orderId) {
        resolvedOrderId = verification.orderId;
      } else if (!rawOrderId) {
        return NextResponse.json(
          { error: 'Token de seguimiento inválido o caducado.' },
          { status: 403 }
        );
      }
    }

    if (!resolvedOrderId) {
      return NextResponse.json(
        { error: 'Parámetro de orden o token requerido.' },
        { status: 400 }
      );
    }

    // Single Source of Truth: Fetch from Database
    let orderData: {
      orderId: string;
      status: 'Procesando' | 'Enviado' | 'Entregado';
      total: number;
      customerName: string;
      date: string;
      trackingNumber?: string;
      trackingUrl?: string;
      carrierName?: string;
    } = {
      orderId: resolvedOrderId,
      status: (searchParams.get('status') as 'Procesando' | 'Enviado' | 'Entregado') || 'Procesando',
      total: Number(searchParams.get('total') || 0),
      customerName: searchParams.get('customer') || 'Cliente Lumina',
      date: searchParams.get('date') || 'Reciente',
      trackingNumber: searchParams.get('tracking') || undefined,
      carrierName: searchParams.get('carrier') || undefined,
      trackingUrl: searchParams.get('url') || undefined,
    };

    try {
      const { data: dbOrder } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', resolvedOrderId)
        .maybeSingle();

      if (dbOrder) {
        const status = (dbOrder.status || 'Procesando') as 'Procesando' | 'Enviado' | 'Entregado';
        const tracking = decodeOrderTracking(dbOrder.tracking_number, status);
        orderData = {
          orderId: dbOrder.id,
          status,
          total: Number(dbOrder.total || 0),
          customerName: dbOrder.customer_name || 'Cliente Lumina',
          date: dbOrder.date || new Date(dbOrder.created_at).toLocaleDateString('es-EC'),
          trackingNumber: tracking.trackingNumber,
          trackingUrl: tracking.trackingUrl,
          carrierName: tracking.carrierName,
        };
      }
    } catch (dbErr) {
      console.warn('[wallet/pass] Supabase lookup error (using params fallback):', dbErr);
    }

    // Use robust credential resolution (supports JSON, file, and individual env vars)
    const credentials = getGoogleWalletCredentials();
    if (!credentials) {
      console.error('[wallet/pass] Google Wallet credentials not configured on server.');
      return NextResponse.json(
        { error: 'Google Wallet no está configurado en el servidor. Contacta al administrador.' },
        { status: 503 }
      );
    }

    try {
      const { genericClass, genericObject } = buildGoogleGenericObject(
        { ...orderData, origin },
        credentials.issuerId
      );

      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        iss: credentials.clientEmail,
        aud: 'google',
        typ: 'savetowallet',
        iat: Math.floor(Date.now() / 1000),
        origins: [],
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
      const signature = signer.sign(credentials.privateKey);
      const saveUrl = `https://pay.google.com/gp/v/save/${signingInput}.${base64UrlEncode(signature)}`;

      return NextResponse.redirect(saveUrl);
    } catch (err) {
      console.error('[wallet/pass] JWT signing error for order pass:', err);
      return NextResponse.json(
        { error: 'Error al generar el pase de Google Wallet.' },
        { status: 500 }
      );
    }
  }

  // ============================================================================
  // B. LOYALTY PASS (type=loyalty) — Exclusively Google Wallet, direct redirect
  // ============================================================================
  const code = searchParams.get('code') || 'LUM-1042-PRV';
  const name = searchParams.get('name') || 'Cliente Lumina';
  const pts = parseInt(searchParams.get('pts') || '200', 10);
  const email = searchParams.get('email') || '';

  const passResult = await createOrGetCustomerGoogleWalletPass({
    customerId: code || email,
    customerName: name,
    customerEmail: email || 'cliente@luminahome.ec',
    memberCode: code,
    pointsBalance: isNaN(pts) ? 200 : pts,
    tierName: (isNaN(pts) ? 200 : pts) >= 1200 ? 'Nivel Oro' : 'Nivel Plata',
    status: 'active',
  });

  if (passResult.success && passResult.saveUrl) {
    return NextResponse.redirect(passResult.saveUrl);
  }

  console.error('[wallet/pass] Loyalty pass creation failed:', passResult.error);
  return NextResponse.json(
    { error: passResult.error || 'No se pudo generar el pase de fidelización.' },
    { status: 503 }
  );
}
