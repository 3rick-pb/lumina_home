import { NextResponse } from 'next/server';
import { getPassesForDevice } from '@/lib/wallet/passDeviceStore';

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
    }>;
  }
) {
  try {
    const params = await context.params;
    const { deviceLibraryIdentifier, passTypeIdentifier } = params;
    const { searchParams } = new URL(request.url);
    const passesUpdatedSince = searchParams.get('passesUpdatedSince') || undefined;

    const { serialNumbers, lastUpdated } = await getPassesForDevice(
      deviceLibraryIdentifier,
      passTypeIdentifier,
      passesUpdatedSince
    );

    if (serialNumbers.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({
      lastUpdated,
      serialNumbers,
    });
  } catch (err) {
    console.error('[PassKit Device Passes Query] Error:', err);
    return new NextResponse(null, { status: 500 });
  }
}
