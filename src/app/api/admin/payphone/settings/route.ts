import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';
import { 
  getStorePaymentMode, 
  setStorePaymentMode, 
  getPayPhoneConfig, 
  PayPhonePaymentMode 
} from '@/lib/payphone';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/payphone/settings
 * Retrieves the current PayPhone payment configuration and active mode.
 * Strictly protected: Only accessible by authenticated administrators.
 */
export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere iniciar sesión.' },
        { status: 401 }
      );
    }

    const isAdmin = await verifyIsAdmin(authUser.email);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const mode = await getStorePaymentMode();
    const config = getPayPhoneConfig();

    const maskedStoreId = config.storeId 
      ? (config.storeId.length > 8 ? `${config.storeId.slice(0, 4)}••••${config.storeId.slice(-4)}` : config.storeId) 
      : null;

    return NextResponse.json({
      success: true,
      mode,
      storeId: maskedStoreId,
      isConfigured: config.isConfigured,
      isSimulated: config.isSimulated,
      environment: config.environment
    });
  } catch (error) {
    console.error('[API /api/admin/payphone/settings GET] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/admin/payphone/settings
 * Updates the store-wide PayPhone payment mode ('box' | 'redirect').
 * Strictly protected: Only accessible by authenticated administrators.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere iniciar sesión.' },
        { status: 401 }
      );
    }

    const isAdmin = await verifyIsAdmin(authUser.email);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado. Se requieren permisos de administrador para modificar la modalidad.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.mode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Cuerpo de solicitud inválido. Se requiere el parámetro "mode".' },
        { status: 400 }
      );
    }

    const cleanMode = body.mode.trim().toLowerCase();
    if (cleanMode !== 'box' && cleanMode !== 'redirect') {
      return NextResponse.json(
        { success: false, error: 'Modalidad inválida. Los únicos valores permitidos son "box" o "redirect".' },
        { status: 400 }
      );
    }

    const success = await setStorePaymentMode(cleanMode as PayPhonePaymentMode, authUser.email);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'No se pudo guardar la configuración en la base de datos.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: cleanMode,
      message: `Modalidad de PayPhone configurada exitosamente a "${cleanMode === 'box' ? 'Cajita de Pagos' : 'Botón de Pago por Redirección'}".`
    });
  } catch (error) {
    console.error('[API /api/admin/payphone/settings POST] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
