import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { confirmPayPhonePayment, sanitizeString } from '@/lib/payphone';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { sendOrderEmails, getAllAdminEmails } from '@/lib/emailService';
import { ApiOrder } from '@/app/api/orders/route';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ConfirmRequestBody {
  id: number | string;
  clientTxId: string;
  simulatedDeferred?: boolean;
  orderData?: {
    orderId?: string;
    items?: Array<{
      product: {
        id: string;
        title: string;
        price: number;
        imageUrl: string;
        category?: string;
      };
      quantity: number;
      color?: string;
    }>;
    customerName?: string;
    customerEmail?: string;
    recipient?: string;
    customerIdNumber?: string;
    customerPhone?: string;
    shippingAddress?: {
      recipient?: string;
      idNumber?: string;
      phone?: string;
      email?: string;
      street: string;
      city: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    total?: number;
  };
}

/**
 * POST /api/payphone/confirm
 * Verifies transaction with PayPhone server-to-server.
 * Implements Anti-Replay protection, Amount Matching, and order synchronization.
 */
export async function POST(request: Request) {
  // 0. Rate limiting (15 requests / 60 seconds per IP)
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'payphone_confirm',
    maxRequests: 15,
    windowMs: 60 * 1000
  });
  if (!rateLimit.isAllowed) {
    return createRateLimitResponse(
      'Demasiados intentos de verificación de pago. Por favor espera unos momentos antes de reintentar.',
      rateLimit.resetTimeMs
    );
  }

  try {
    const authUser = await getAuthenticatedUser(request).catch(() => null);
    const body = (await request.json().catch(() => ({}))) as ConfirmRequestBody;

    const { id, clientTxId, simulatedDeferred, orderData } = body;

    if (!id || !clientTxId) {
      return NextResponse.json({
        success: false,
        error: 'Identificador de transacción o clientTxId faltante.'
      }, { status: 400 });
    }

    const cleanClientTxId = sanitizeString(clientTxId, 80);
    const cleanId = String(id).trim();

    // 1. CYBERSECURITY ANTI-REPLAY: Check if this transaction has already been confirmed/processed in Supabase
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${orderData?.orderId || cleanClientTxId},tracking_number.like.%${cleanClientTxId}%`)
      .maybeSingle();

    if (existingOrder && existingOrder.status !== 'Cancelado') {
      // Idempotency: Return existing confirmed order without duplicating or re-dispatching
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        transactionStatus: 'Approved',
        order: {
          id: existingOrder.id,
          status: existingOrder.status,
          total: existingOrder.total,
          items: existingOrder.items,
          customerName: existingOrder.customer_name,
          customerEmail: existingOrder.customer_email,
          shippingAddress: existingOrder.shipping_address,
          paymentMethod: existingOrder.payment_method,
          date: existingOrder.created_at,
          trackingNumber: existingOrder.tracking_number,
          deferred: Boolean(existingOrder.deferred),
          deferredMessage: existingOrder.deferred_message || null
        }
      });
    }

    // 2. Expected total in cents (for anti-tampering amount match)
    const expectedTotal = Math.max(0, Number(orderData?.total) || 0);
    const expectedAmountCents = Math.round(expectedTotal * 100);

    // 3. Confirm with PayPhone Server-to-Server
    const confirmation = await confirmPayPhonePayment({
      id: cleanId,
      clientTxId: cleanClientTxId,
      expectedAmountCents: expectedAmountCents > 0 ? expectedAmountCents : undefined,
      simulatedDeferred: Boolean(simulatedDeferred)
    });

    if (!confirmation.success || confirmation.transactionStatus !== 'Approved') {
      return NextResponse.json({
        success: false,
        transactionStatus: confirmation.transactionStatus,
        error: confirmation.error || confirmation.message || 'La transacción no fue aprobada por la pasarela de pagos.'
      }, { status: 400 });
    }

    // 4. Build Authoritative Order Record for Database with Deferred Detail
    const now = new Date();
    const finalOrderId = sanitizeString(orderData?.orderId || `INV_${Math.floor(100000 + Math.random() * 900000)}`, 50);
    const trackingCode = `LM-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const deferredText = confirmation.isDeferred && confirmation.deferredMessage
      ? ` (${confirmation.deferredMessage})`
      : (confirmation.isDeferred ? ' (Diferido)' : ' (Corriente)');

    const cardDetail = confirmation.cardType 
      ? `PayPhone (Ecuador) - ${confirmation.cardType} •••• ${confirmation.lastDigits || '4242'}${deferredText}`
      : `PayPhone (Ecuador)${deferredText}`;

    const cleanCustomerName = sanitizeString(orderData?.customerName || orderData?.recipient || authUser?.email?.split('@')[0] || 'Cliente Lumina', 80);
    const cleanCustomerEmail = sanitizeString(orderData?.customerEmail || authUser?.email || 'cliente@lumina.com', 100).toLowerCase();
    const cleanRecipient = sanitizeString(orderData?.recipient || cleanCustomerName, 80);
    const cleanIdNumber = sanitizeString(orderData?.customerIdNumber || orderData?.shippingAddress?.idNumber || '', 30);
    const cleanPhone = sanitizeString(orderData?.customerPhone || orderData?.shippingAddress?.phone || '', 30);

    const apiOrder: ApiOrder & { deferred?: boolean; deferredMessage?: string | null } = {
      id: finalOrderId,
      userId: authUser?.id || undefined,
      customerName: cleanCustomerName,
      customerEmail: cleanCustomerEmail,
      recipient: cleanRecipient,
      customerIdNumber: cleanIdNumber || undefined,
      customerPhone: cleanPhone || undefined,
      shippingAddress: orderData?.shippingAddress ? {
        recipient: cleanRecipient,
        idNumber: cleanIdNumber || undefined,
        phone: cleanPhone || undefined,
        email: cleanCustomerEmail,
        street: sanitizeString(orderData.shippingAddress.street, 120),
        city: sanitizeString(orderData.shippingAddress.city, 60),
        state: sanitizeString(orderData.shippingAddress.state || 'Pichincha', 60),
        postalCode: sanitizeString(orderData.shippingAddress.postalCode || '170150', 20),
        country: 'Ecuador'
      } : undefined,
      paymentMethod: cardDetail,
      date: now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      createdAt: now.toISOString(),
      status: 'Procesando',
      trackingNumber: trackingCode,
      total: expectedTotal > 0 ? expectedTotal : (Number(confirmation.amountCents || 0) / 100),
      items: Array.isArray(orderData?.items) ? orderData.items : [],
      deferred: confirmation.isDeferred || false,
      deferredMessage: confirmation.deferredMessage || null
    };

    // 5. Persist in Supabase Orders Table with Deferred Fields
    const { error: dbError } = await supabase.from('orders').upsert({
      id: apiOrder.id,
      user_id: apiOrder.userId || null,
      status: apiOrder.status,
      total: apiOrder.total,
      items: apiOrder.items,
      tracking_number: apiOrder.trackingNumber,
      customer_name: apiOrder.customerName,
      customer_email: apiOrder.customerEmail,
      customer_id_number: apiOrder.customerIdNumber || null,
      customer_phone: apiOrder.customerPhone || null,
      recipient: apiOrder.recipient,
      shipping_address: apiOrder.shippingAddress,
      payment_method: apiOrder.paymentMethod,
      deferred: confirmation.isDeferred || false,
      deferred_code: confirmation.deferredCode || null,
      deferred_message: confirmation.deferredMessage || null,
      created_at: apiOrder.createdAt
    });

    if (dbError) {
      console.error('[PayPhone] Supabase order upsert error:', dbError);
      // Still proceed with response since payment was collected
    }

    // 6. Trigger Automatic Invoice & Warehouse Dispatch Notification Emails
    try {
      const adminEmails = await getAllAdminEmails();
      await sendOrderEmails({
        order: apiOrder,
        adminEmails
      });
    } catch (emailErr) {
      console.warn('[PayPhone] Warning: email dispatch encountered an issue:', emailErr);
    }

    return NextResponse.json({
      success: true,
      transactionStatus: 'Approved',
      transactionId: confirmation.transactionId,
      order: apiOrder,
      isSimulated: confirmation.isSimulated
    });
  } catch (error) {
    console.error('[API /api/payphone/confirm] Unhandled error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
