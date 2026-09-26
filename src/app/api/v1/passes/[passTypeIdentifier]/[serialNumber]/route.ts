import { NextResponse } from 'next/server';
import { verifyPassKitAuthToken } from '@/lib/wallet/orderPassTokens';
import { generateAppleOrderPassZip } from '@/lib/wallet/appleWalletService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function extractAuthToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^ApplePass\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function parseOrderIdFromSerial(serialNumber: string): string {
  if (serialNumber.startsWith('LH-')) {
    return serialNumber.slice(3);
  }
  return serialNumber;
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

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      passTypeIdentifier: string;
      serialNumber: string;
    }>;
  }
) {
  try {
    const params = await context.params;
    const { serialNumber } = params;
    const authHeader = request.headers.get('authorization');
    const providedToken = extractAuthToken(authHeader);

    const orderId = parseOrderIdFromSerial(serialNumber);

    if (!providedToken || !verifyPassKitAuthToken(orderId, providedToken)) {
      return new NextResponse(null, { status: 401 });
    }

    // Fetch order from database
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      return new NextResponse(null, { status: 404 });
    }

    const orderUpdatedAt = new Date(order.updated_at || order.created_at || Date.now());
    const ifModifiedSince = request.headers.get('if-modified-since');

    if (ifModifiedSince) {
      const ifModifiedSinceDate = new Date(ifModifiedSince);
      if (!isNaN(ifModifiedSinceDate.getTime()) && orderUpdatedAt <= ifModifiedSinceDate) {
        return new NextResponse(null, { status: 304 });
      }
    }

    const status = (order.status || 'Procesando') as 'Procesando' | 'Enviado' | 'Entregado';
    const tracking = decodeOrderTracking(order.tracking_number, status);
    const origin = new URL(request.url).origin;

    const passResult = await generateAppleOrderPassZip({
      orderId: order.id,
      status,
      total: Number(order.total || 0),
      customerName: order.customer_name || 'Cliente Lumina',
      date: order.date || new Date(order.created_at).toLocaleDateString('es-EC'),
      trackingNumber: tracking.trackingNumber,
      trackingUrl: tracking.trackingUrl,
      carrierName: tracking.carrierName,
      origin,
    });

    return new NextResponse(new Uint8Array(passResult.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Last-Modified': orderUpdatedAt.toUTCString(),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('[PassKit Deliver Pass] Error:', err);
    return new NextResponse(null, { status: 500 });
  }
}
