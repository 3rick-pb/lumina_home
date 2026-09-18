import { NextResponse } from 'next/server';
import { supabaseServer, getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';
import { verifyAndSendTestEmail, sendOrderEmails, getDispatchRecipientEmails, OrderEmailData } from '@/lib/emailService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_DISPATCH_RECIPIENTS = 7;

/**
 * Loads the current list of dispatch notification recipients from admin_notification_settings
 */
async function loadDispatchRecipients(): Promise<string[]> {
  try {
    const { data: row } = await supabaseServer
      .from('admin_notification_settings')
      .select('title')
      .eq('id', 'dispatch_recipients')
      .maybeSingle();

    if (row?.title) {
      try {
        const parsed = JSON.parse(row.title);
        if (Array.isArray(parsed)) {
          const valid = parsed
            .map((e: unknown) => String(e || '').toLowerCase().trim())
            .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
          return Array.from(new Set(valid)).slice(0, MAX_DISPATCH_RECIPIENTS);
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[smtp/route] Could not load dispatch recipients:', err);
  }
  return [];
}

/**
 * GET /api/admin/smtp
 * Reads the current Vercel environment variables securely without exposing raw secrets.
 * Also retrieves the list of configured dispatch notification recipients.
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

    const dispatchRecipients = await loadDispatchRecipients();

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
      dispatchRecipients,
      maxDispatchRecipients: MAX_DISPATCH_RECIPIENTS,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/admin/smtp
 * Supports:
 * - action: 'test' -> Handshake test with test email
 * - action: 'save_dispatch_recipients' -> Persist up to 7 emails for warehouse dispatch notices
 * - action: 'test_dispatch' -> Dispatches a sample order notice to test delivery
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
    const { action = 'test', host, port, secure, user, pass, from, recipientEmail, recipients } = body;

    // 1. Connection Handshake Test
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

    // 2. Save Dispatch Recipients (up to 7 emails)
    if (action === 'save_dispatch_recipients') {
      let rawList: string[] = [];
      if (Array.isArray(recipients)) {
        rawList = recipients;
      } else if (typeof recipients === 'string') {
        rawList = recipients.split(',').map((e) => e.trim());
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanList: string[] = [];

      for (const item of rawList) {
        const normalized = String(item || '').toLowerCase().trim();
        if (!normalized) continue;
        if (!emailRegex.test(normalized)) {
          return NextResponse.json(
            { success: false, error: `El correo '${item}' no tiene un formato válido.` },
            { status: 400 }
          );
        }
        if (!cleanList.includes(normalized)) {
          cleanList.push(normalized);
        }
      }

      if (cleanList.length > MAX_DISPATCH_RECIPIENTS) {
        return NextResponse.json(
          {
            success: false,
            error: `Límite excedido: Solo puedes registrar hasta ${MAX_DISPATCH_RECIPIENTS} correos como receptores de despacho. Has intentado agregar ${cleanList.length}.`,
          },
          { status: 400 }
        );
      }

      const { error: dbErr } = await supabaseServer
        .from('admin_notification_settings')
        .upsert({
          id: 'dispatch_recipients',
          admin_email: authUser.email || 'admin@lumina.com',
          title: JSON.stringify(cleanList),
          position: 'dispatch',
          layout: 'recipients',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (dbErr) {
        return NextResponse.json({ success: false, error: 'Error al persistir receptores: ' + dbErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: cleanList.length > 0 
          ? `Se guardaron exitosamente ${cleanList.length} correo(s) de despacho.` 
          : 'Lista de correos de despacho vaciada. Las órdenes se enviarán a los administradores principales.',
        dispatchRecipients: cleanList,
      });
    }

    // 3. Test Dispatch Order Notification
    if (action === 'test_dispatch') {
      const explicitTarget = recipientEmail ? String(recipientEmail).trim().toLowerCase() : null;
      let targetList: string[] = [];

      if (explicitTarget && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(explicitTarget)) {
        targetList = [explicitTarget];
      } else {
        targetList = await getDispatchRecipientEmails();
      }

      if (targetList.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No hay correos de destino configurados para enviar la orden de prueba.' },
          { status: 400 }
        );
      }

      const sampleOrder: OrderEmailData = {
        id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
        trackingNumber: 'LM-PRUEBA-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }),
        time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        customerName: 'Cliente Demostrativo (Prueba de Despacho)',
        customerEmail: 'prueba@luminahome.com',
        customerIdNumber: '1799999999001',
        customerPhone: '0999999999',
        recipient: 'Encargado de Bodega y Logística',
        paymentMethod: 'PayPhone Ecuador (Tarjeta Verificada)',
        total: 185.00,
        items: [
          {
            product: {
              id: 'demo-1',
              title: 'Lámpara de Pie Orbital Minimalista Titanium Edition',
              price: 185.00,
              category: 'Iluminación',
              imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80',
            },
            quantity: 1,
            color: 'Titanium Grafito',
          },
        ],
        shippingAddress: {
          recipient: 'Receptor de Despacho Lumina',
          idNumber: '1799999999001',
          phone: '0999999999',
          email: 'prueba@luminahome.com',
          street: 'Av. República de El Salvador N36-84 y Naciones Unidas',
          city: 'Quito',
          state: 'Pichincha',
          postalCode: '170505',
          country: 'Ecuador',
        },
      };

      const sendResult = await sendOrderEmails({
        order: sampleOrder,
        adminEmails: targetList,
      });

      return NextResponse.json({
        success: true,
        message: sendResult.mocked 
          ? `Alerta de despacho simulada registrada en base de datos para: ${targetList.join(', ')} (Servidor local sin SMTP configurado).`
          : `Alerta de despacho real enviada exitosamente a: ${targetList.join(', ')}.`,
        recipients: targetList,
        mocked: Boolean(sendResult.mocked),
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
