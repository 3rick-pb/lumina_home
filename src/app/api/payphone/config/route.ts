import { NextResponse } from 'next/server';
import { getPayPhoneConfig, getStorePaymentMode } from '@/lib/payphone';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/payphone/config
 * Exposes safe client configuration without leaking secrets.
 * The client uses this to render the active mode selected by the administrator ('box' | 'redirect').
 */
export async function GET() {
  try {
    const config = getPayPhoneConfig();
    const mode = await getStorePaymentMode();

    return NextResponse.json({
      success: true,
      mode,
      storeId: config.storeId,
      isConfigured: config.isConfigured,
      isSimulated: config.isSimulated,
      environment: config.environment,
      currency: 'USD',
      statusNotice: config.isSimulated 
        ? 'Modo de prueba activo (RUC / SRI en trámite). Puedes simular pagos de punta a punta.' 
        : 'Pasarela PayPhone conectada y lista para cobros en vivo.'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
