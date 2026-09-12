import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';
import { verifyAndSendTestEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/smtp
 * Reads the current Vercel environment variables securely without exposing raw secrets.
 * Strictly protected for authorized administrators.
 */
export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
    }

    const isAdmin = await verifyIsAdmin(authUser.email);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes de administrador' }, { status: 403 });
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || '';
    const from = process.env.SMTP_FROM || (user ? `Lumina Home <${user}>` : '');
    const hasPassword = Boolean(process.env.SMTP_PASS);
    const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    return NextResponse.json({
      success: true,
      isConfigured,
      host,
      port,
      user,
      from,
      hasPassword,
      source: 'Vercel / Variables de Entorno',
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/admin/smtp
 * Tests the SMTP connection (handshake + test email dispatch).
 * Can test active Vercel environment variables or test credentials passed in payload.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
    }

    const isAdmin = await verifyIsAdmin(authUser.email);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes de administrador' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { action = 'test', host, port, secure, user, pass, from, recipientEmail } = body;

    if (action === 'test') {
      const targetEmail = String(recipientEmail || authUser.email || '').trim();
      if (!targetEmail || !targetEmail.includes('@')) {
        return NextResponse.json({ success: false, error: 'Se requiere un correo de destino válido para la prueba.' }, { status: 400 });
      }

      const result = await verifyAndSendTestEmail({
        host,
        port,
        secure,
        user,
        pass,
        from,
        recipientEmail: targetEmail,
      });

      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: result.message });
    }

    return NextResponse.json({ success: false, error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
