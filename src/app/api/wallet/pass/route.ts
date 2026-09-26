import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { buildGoogleWalletOrderJwtUrl } from '@/lib/wallet/googleWalletService';
import {
  generateOrderTrackingToken,
  verifyOrderTrackingToken,
} from '@/lib/wallet/orderPassTokens';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createOrGetCustomerGoogleWalletPass } from '@/lib/wallet/googleCustomerPassService';

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
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
  const rawPlatform = searchParams.get('platform') || 'auto';
  const origin = new URL(request.url).origin;
  const userAgent = request.headers.get('user-agent') || '';
  const isIOS = /iPhone|iPad|iPod|Macintosh/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);

  // ============================================================================
  // A. ORDER TRACKING PASS (type=order) — Apple Wallet (.pkpass) & Google Wallet
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

    // Generate canonical anti-enumeration token
    const secureToken = generateOrderTrackingToken(orderData.orderId);
    const liveOrderPassUrl = `${origin}/wallet/order/${secureToken}`;

    // Exclusively generate Google Wallet Order Pass
    const googleRes = buildGoogleWalletOrderJwtUrl({
      ...orderData,
      origin,
    });

    if (googleRes.saveUrl) {
      return NextResponse.redirect(googleRes.saveUrl);
    }

    // If Google Wallet credentials are not configured yet, redirect to web viewer
    return NextResponse.redirect(`${liveOrderPassUrl}?wallet=google&status=pending_credentials`);
  }

  // ============================================================================
  // B. LOYALTY PASS (type=loyalty) — Exclusively Google Wallet
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

  const loyaltyLiveUrl = `${origin}/loyalty/pass?code=${encodeURIComponent(
    code
  )}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&pts=${encodeURIComponent(
    String(pts)
  )}`;

  return NextResponse.redirect(loyaltyLiveUrl);
}
