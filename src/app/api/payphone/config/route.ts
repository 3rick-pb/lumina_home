import { NextResponse } from 'next/server';
import { getPayPhoneConfig } from '@/lib/payphone';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/payphone/config
 * Exposes safe client configuration without leaking secrets.
 */
export async function GET() {
  try {
    const config = getPayPhoneConfig();
    return NextResponse.json({
      success: true,
      isConfigured: config.isConfigured,
      isSimulated: config.isSimulated,
      environment: config.environment,
      appId: config.appId,
      currency: 'USD',
      statusNotice: config.isSimulated 
        ? 'Modo de prueba activo (RUC / SRI en trámite). Puedes simular pagos de punta a punta.' 
        : 'Pasarela PayPhone conectada y lista para cobros en vivo.'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
