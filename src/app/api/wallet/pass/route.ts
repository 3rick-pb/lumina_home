import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { generateAppleOrderPassZip } from '@/lib/wallet/appleWalletService';
import { buildGoogleWalletOrderJwtUrl } from '@/lib/wallet/googleWalletService';
import {
  generateOrderTrackingToken,
  verifyOrderTrackingToken,
} from '@/lib/wallet/orderPassTokens';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateAppleLoyaltyPassBuffer } from '@/lib/applePassGenerator';

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

    const effectivePlatform =
      rawPlatform === 'apple' || rawPlatform === 'google'
        ? rawPlatform
        : isIOS
        ? 'apple'
        : isAndroid
        ? 'google'
        : 'universal';

    // 1. Apple Wallet (.pkpass)
    if (effectivePlatform === 'apple') {
      try {
        const passResult = await generateAppleOrderPassZip({
          ...orderData,
          origin,
        });

        const safeFileId = orderData.orderId.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'orden';
        return new NextResponse(new Uint8Array(passResult.buffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="lumina-pedido-${safeFileId}.pkpass"`,
            'Cache-Control': 'no-store, max-age=0',
          },
        });
      } catch (err) {
        console.error('Failed to generate Order .pkpass buffer:', err);
        return NextResponse.redirect(`${liveOrderPassUrl}?wallet=apple&error=pass_generation_failed`);
      }
    }

    // 2. Google Wallet (Save JWT)
    if (effectivePlatform === 'google') {
      const googleRes = buildGoogleWalletOrderJwtUrl({
        ...orderData,
        origin,
      });

      if (googleRes.saveUrl) {
        return NextResponse.redirect(googleRes.saveUrl);
      }

      // If credentials not configured, redirect to web viewer with clear helper param
      return NextResponse.redirect(`${liveOrderPassUrl}?wallet=google&status=pending_credentials`);
    }

    // 3. Universal Desktop / Fallback route
    return NextResponse.redirect(liveOrderPassUrl);
  }

  // ============================================================================
  // B. LOYALTY PASS (type=loyalty) — Preserved Apple & Google Wallet Support
  // ============================================================================
  const platform = rawPlatform === 'auto' ? (isIOS ? 'apple' : 'google') : rawPlatform;

  if (platform === 'apple') {
    const program = searchParams.get('program') || 'Lumina Member Pass';
    const issuer = searchParams.get('issuer') || 'Lumina Home';
    const code = searchParams.get('code') || 'LUM-8842-PRV';
    const name = searchParams.get('name') || 'Cliente Lumina';
    const pts = searchParams.get('pts') || '200';
    const ptsPerDollar = searchParams.get('ptsPerDollar') || '10';

    try {
      const passBuffer = await generateAppleLoyaltyPassBuffer({
        programName: program,
        issuerName: issuer,
        memberCode: code,
        memberName: name,
        points: pts,
        ptsPerDollar,
      });

      return new NextResponse(new Uint8Array(passBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename="lumina-${code.toLowerCase()}.pkpass"`,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    } catch (err) {
      console.error('Failed to generate loyalty .pkpass buffer:', err);
      return NextResponse.json({ error: 'No se pudo generar el archivo .pkpass' }, { status: 500 });
    }
  }

  if (platform === 'google') {
    const program = searchParams.get('program') || 'Lumina Member Pass';
    const issuer = searchParams.get('issuer') || 'Lumina Home';
    const code = searchParams.get('code') || 'LUM-8842-PRV';
    const name = searchParams.get('name') || 'Cliente Lumina';
    const pts = searchParams.get('pts') || '200';
    const bg = searchParams.get('bg') || '#111113';

    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (issuerId && clientEmail && privateKey) {
      try {
        const classId = `${issuerId}.lumina_loyalty_class_v1`;
        const objectId = `${issuerId}.member_${code.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        const header = { alg: 'RS256', typ: 'JWT' };
        const payload = {
          iss: clientEmail,
          aud: 'google',
          typ: 'savetowallet',
          iat: Math.floor(Date.now() / 1000),
          origins: [],
          payload: {
            loyaltyClasses: [
              {
                id: classId,
                issuerName: issuer,
                programName: program,
                reviewStatus: 'UNDER_REVIEW',
                hexBackgroundColor: bg.startsWith('#') ? bg : '#111113',
              },
            ],
            loyaltyObjects: [
              {
                id: objectId,
                classId,
                state: 'ACTIVE',
                accountId: code,
                accountName: name,
                loyaltyPoints: {
                  label: 'Puntos Lumina',
                  balance: {
                    int: parseInt(pts, 10) || 200,
                  },
                },
              },
            ],
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

        return NextResponse.redirect(`https://pay.google.com/gp/v/save/${signingInput}.${encodedSignature}`);
      } catch (err) {
        console.warn('Google Wallet Loyalty JWT error:', err);
      }
    }

    const loyaltyLiveUrl = `${origin}/loyalty/pass?program=${encodeURIComponent(
      program
    )}&issuer=${encodeURIComponent(issuer)}&code=${encodeURIComponent(
      code
    )}&name=${encodeURIComponent(name)}&pts=${encodeURIComponent(pts)}&installed=google&needsSetup=true`;

    return NextResponse.redirect(loyaltyLiveUrl);
  }

  return NextResponse.redirect(`${origin}/loyalty/pass`);
}
