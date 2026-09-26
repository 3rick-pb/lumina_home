import { NextResponse } from 'next/server';
import { verifyPassKitAuthToken } from '@/lib/wallet/orderPassTokens';
import { registerPassDevice, unregisterPassDevice } from '@/lib/wallet/passDeviceStore';

function extractAuthToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^ApplePass\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function parseOrderIdFromSerial(serialNumber: string): string {
  // Serial numbers are formatted as LH-<orderId>
  if (serialNumber.startsWith('LH-')) {
    return serialNumber.slice(3);
  }
  return serialNumber;
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
      serialNumber: string;
    }>;
  }
) {
  try {
    const params = await context.params;
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = params;
    const authHeader = request.headers.get('authorization');
    const providedToken = extractAuthToken(authHeader);

    const orderId = parseOrderIdFromSerial(serialNumber);

    if (!providedToken || !verifyPassKitAuthToken(orderId, providedToken)) {
      return new NextResponse(null, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const pushToken = typeof body?.pushToken === 'string' ? body.pushToken.trim() : '';

    if (!pushToken) {
      return NextResponse.json({ error: 'pushToken is required in body' }, { status: 400 });
    }

    const { isNew } = await registerPassDevice({
      deviceLibraryIdentifier,
      pushToken,
      passTypeIdentifier,
      serialNumber,
      orderId,
    });

    return new NextResponse(null, { status: isNew ? 201 : 200 });
  } catch (err) {
    console.error('[PassKit Device Registration] Error:', err);
    return new NextResponse(null, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
      serialNumber: string;
    }>;
  }
) {
  try {
    const params = await context.params;
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = params;
    const authHeader = request.headers.get('authorization');
    const providedToken = extractAuthToken(authHeader);

    const orderId = parseOrderIdFromSerial(serialNumber);

    if (!providedToken || !verifyPassKitAuthToken(orderId, providedToken)) {
      return new NextResponse(null, { status: 401 });
    }

    await unregisterPassDevice(deviceLibraryIdentifier, passTypeIdentifier, serialNumber);
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error('[PassKit Device Unregistration] Error:', err);
    return new NextResponse(null, { status: 500 });
  }
}
