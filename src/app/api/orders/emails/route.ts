import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';
import { getOrderEmailLogs, resendOrderEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/orders/emails?orderId=...
 * Obtiene el historial auditable de correos (factura y alertas) asociados a una orden.
 */
export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId es requerido' }, { status: 400 });
    }

    const currentEmail = String(authUser.email || '').toLowerCase().trim();

    // Permitir consulta a administradores o al dueño de la orden
    const isAdmin = await verifyIsAdmin(currentEmail);
    const logs = await getOrderEmailLogs(orderId);

    // Si no es admin, solo permitir ver los logs enviados a su propio correo
    const filteredLogs = isAdmin 
      ? logs 
      : logs.filter(l => l.recipient_email.toLowerCase() === currentEmail);

    return NextResponse.json({
      success: true,
      orderId,
      logs: filteredLogs,
      count: filteredLogs.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), logs: [] }, { status: 500 });
  }
}

/**
 * POST /api/orders/emails
 * Permite a los administradores reenviar manualmente la Factura al Cliente o la Alerta de Despacho.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
    }

    const isAdmin = await verifyIsAdmin(authUser.email);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes. Solo administradores pueden reenviar notificaciones.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { orderId, emailType, targetEmail } = body;

    if (!orderId || !emailType) {
      return NextResponse.json(
        { success: false, error: 'orderId y emailType son requeridos.' },
        { status: 400 }
      );
    }

    if (emailType !== 'customer_invoice' && emailType !== 'admin_dispatch_notice') {
      return NextResponse.json(
        { success: false, error: 'emailType inválido. Valores válidos: customer_invoice, admin_dispatch_notice' },
        { status: 400 }
      );
    }

    const result = await resendOrderEmail({
      orderId,
      emailType,
      targetEmail,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
