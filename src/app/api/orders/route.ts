import { NextResponse } from 'next/server';
import { verifyIsAdmin, getAuthenticatedUser, getScopedSupabaseClient } from '@/lib/serverAuth';
import { sendOrderEmails, getAllDispatchRecipients } from '@/lib/emailService';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimit';
import { appCache } from '@/lib/cache';
import {
  generateOrderTrackingToken,
  verifyOrderTrackingToken,
  anonymizeCustomerName,
} from '@/lib/wallet/orderPassTokens';
import { syncOrderToWallets } from '@/lib/wallet/walletSyncService';

export interface ApiOrder {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  recipient: string;
  customerIdNumber?: string;
  customerPhone?: string;
  shippingAddress?: {
    recipient?: string;
    idNumber?: string;
    phone?: string;
    email?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: string;
  date: string;
  time?: string;
  createdAt: string;
  status: 'Procesando' | 'Enviado' | 'Entregado';
  trackingNumber?: string;
  trackingUrl?: string;
  carrierName?: string;
  total: number;
  items: Array<{
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

function encodeOrderTracking(trackingNumber?: string, trackingUrl?: string, carrierName?: string): string | null {
  const cleanCode = String(trackingNumber || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 80);
  if (!cleanCode) return null;
  const cleanUrl = String(trackingUrl || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 300);
  const cleanCarrier = String(carrierName || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 60);
  if (cleanUrl || cleanCarrier) {
    return `${cleanCode}||${cleanUrl}||${cleanCarrier}`;
  }
  return cleanCode;
}

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'orders_get',
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.isAllowed) {
    return createRateLimitResponse('Demasiadas consultas de pedidos.', rateLimit.resetTimeMs);
  }

  try {
    // Allow public lookup of a single order by ID for the Wallet Pass QR page (`?orderId=...`)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token')?.trim();
    const singleOrderId = searchParams.get('orderId')?.trim();
    const client = getScopedSupabaseClient(request);

    // 1. Cryptographically verified token lookup (Anti-enumeration QR code & Pass integration)
    if (token) {
      const verified = verifyOrderTrackingToken(token);
      if (!verified.valid || !verified.orderId) {
        return NextResponse.json(
          { success: false, error: 'Token de seguimiento inválido o caducado.' },
          { status: 403 }
        );
      }

      const { data: matchedOrder, error: tokenError } = await client
        .from('orders')
        .select('*')
        .eq('id', verified.orderId)
        .maybeSingle();

      if (tokenError || !matchedOrder) {
        return NextResponse.json({ success: false, error: 'Orden no encontrada.' }, { status: 404 });
      }

      const st = (matchedOrder.status || 'Procesando') as 'Procesando' | 'Enviado' | 'Entregado';
      const tr = decodeOrderTracking(matchedOrder.tracking_number, st);
      const safePublicOrder = {
        id: matchedOrder.id,
        status: st,
        date: matchedOrder.date || new Date(matchedOrder.created_at).toLocaleDateString('es-EC'),
        total: Number(matchedOrder.total || 0),
        customerName: anonymizeCustomerName(matchedOrder.customer_name),
        trackingNumber: tr.trackingNumber,
        trackingUrl: tr.trackingUrl,
        carrierName: tr.carrierName,
        shippingCity: matchedOrder.shipping_address?.city || undefined,
        shippingCountry: matchedOrder.shipping_address?.country || undefined,
        items: Array.isArray(matchedOrder.items)
          ? (matchedOrder.items as Array<Record<string, unknown>>).map((item) => {
              const product = (item.product && typeof item.product === 'object' ? item.product : {}) as Record<string, unknown>;
              return {
                product: {
                  id: String(product.id || ''),
                  title: String(product.title || 'Pieza Colección Lumina'),
                  price: Number(product.price || 0),
                  imageUrl: String(product.imageUrl || ''),
                },
                quantity: Number(item.quantity || 1),
                color: typeof item.color === 'string' ? item.color : undefined,
              };
            })
          : [],
        walletToken: token,
      };

      return NextResponse.json({ success: true, order: safePublicOrder, orders: [safePublicOrder] });
    }

    // Verify authenticated user via JWT Bearer
    const authUser = await getAuthenticatedUser(request);
    const isAdmin = authUser?.email ? await verifyIsAdmin(authUser.email) : false;

    let query = client
      .from('orders')
      .select('*')
      .not('id', 'like', 'SYS_%')
      .order('created_at', { ascending: false });

    if (singleOrderId) {
      if (!isAdmin && (!authUser || !authUser.id)) {
        return NextResponse.json(
          { success: false, error: 'Se requiere token criptográfico de seguimiento o sesión autorizada.' },
          { status: 401 }
        );
      }
      query = query.eq('id', singleOrderId);
      if (!isAdmin && authUser) {
        query = query.or(`user_id.eq.${authUser.id},customer_email.eq.${(authUser.email || '').toLowerCase().trim()}`);
      }
    } else if (!isAdmin) {
      if (!authUser || !authUser.id) {
        return NextResponse.json({ success: true, orders: [], count: 0 });
      }

      const verifiedUserId = authUser.id;
      const verifiedEmail = (authUser.email || '').toLowerCase().trim();

      if (verifiedUserId && verifiedEmail) {
        query = query.or(`user_id.eq.${verifiedUserId},customer_email.eq.${verifiedEmail}`);
      } else if (verifiedUserId) {
        query = query.eq('user_id', verifiedUserId);
      } else {
        query = query.eq('customer_email', verifiedEmail);
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message, orders: [] }, { status: 500 });
    }

    // Resolve authentic customer avatar settings & user_id from user_avatar_settings and user_profiles
    const avatarByUserId = new Map<string, { seed: string; shape: 'squircle' | 'circle' }>();
    const avatarByEmail = new Map<string, { userId: string; seed: string; shape: 'squircle' | 'circle' }>();
    const userIdByEmail = new Map<string, string>();
    const adminEmailsSet = new Set<string>(['admin@lumina.com', 'arteagae796@gmail.com']);

    try {
      const [avatarRes, profileRes, invRes] = await Promise.all([
        client.from('user_avatar_settings').select('user_id, user_email, custom_seed, background_shape'),
        client.from('user_profiles').select('user_id, email'),
        client.from('admin_invitations').select('email').eq('is_active', true),
      ]);

      if (Array.isArray(profileRes.data)) {
        for (const p of profileRes.data) {
          if (p.user_id && p.email) {
            userIdByEmail.set(String(p.email).toLowerCase().trim(), String(p.user_id));
          }
        }
      }

      if (Array.isArray(avatarRes.data)) {
        for (const row of avatarRes.data) {
          const uid = row.user_id ? String(row.user_id) : '';
          const em = row.user_email ? String(row.user_email).toLowerCase().trim() : '';
          const seed = row.custom_seed ? String(row.custom_seed).trim() : uid;
          const shape: 'squircle' | 'circle' = row.background_shape === 'circle' ? 'circle' : 'squircle';
          if (uid) {
            avatarByUserId.set(uid, { seed: seed || uid, shape });
          }
          if (em) {
            if (uid && !userIdByEmail.has(em)) userIdByEmail.set(em, uid);
            avatarByEmail.set(em, { userId: uid, seed: seed || uid || em, shape });
          }
        }
      }

      if (Array.isArray(invRes.data)) {
        for (const inv of invRes.data) {
          if (inv.email) adminEmailsSet.add(String(inv.email).toLowerCase().trim());
        }
      }
    } catch {}

    const formattedOrders = (data || [])
      .filter((o: Record<string, unknown>) => !String(o.id || '').startsWith('SYS_'))
      .map((o: Record<string, unknown>) => {
        const rawEmail = String(o.customer_email || (o.shipping_address as Record<string, unknown>)?.email || 'cliente@lumina.com');
        const normEmail = rawEmail.toLowerCase().trim();
        const rawUserId = o.user_id ? String(o.user_id).trim() : '';
        const resolvedUserId = rawUserId || userIdByEmail.get(normEmail) || avatarByEmail.get(normEmail)?.userId || undefined;

        const byId = resolvedUserId ? avatarByUserId.get(resolvedUserId) : undefined;
        const byEmail = avatarByEmail.get(normEmail);
        const resolvedAvatarSeed =
          byId?.seed ||
          byEmail?.seed ||
          resolvedUserId ||
          normEmail ||
          String(o.customer_name || 'Cliente Lumina');
        const resolvedAvatarShape: 'squircle' | 'circle' =
          byId?.shape || byEmail?.shape || 'squircle';
        const resolvedCustomerRole: 'USER' | 'ADMIN' =
          adminEmailsSet.has(normEmail) ? 'ADMIN' : 'USER';

        const resolvedStatus = (o.status as ApiOrder['status']) || 'Procesando';
        const decodedTracking = decodeOrderTracking(o.tracking_number, resolvedStatus);

        return {
          id: String(o.id || ''),
          userId: resolvedUserId,
          customerName: String(o.customer_name || 'Cliente Lumina'),
          customerEmail: rawEmail,
          customerAvatarSeed: resolvedAvatarSeed,
          customerAvatarShape: resolvedAvatarShape,
          customerRole: resolvedCustomerRole,
          recipient: String(o.recipient || o.customer_name || 'Cliente'),
          customerIdNumber: o.customer_id_number ? String(o.customer_id_number) : undefined,
          customerPhone: o.customer_phone ? String(o.customer_phone) : undefined,
          shippingAddress: (o.shipping_address as ApiOrder['shippingAddress']) || undefined,
          paymentMethod: String(o.payment_method || 'Tarjeta de Crédito'),
          date: o.created_at ? new Date(String(o.created_at)).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Reciente',
          time: o.created_at ? new Date(String(o.created_at)).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '12:00',
          createdAt: String(o.created_at || new Date().toISOString()),
          status: resolvedStatus,
          trackingNumber: decodedTracking.trackingNumber,
          trackingUrl: decodedTracking.trackingUrl,
          carrierName: decodedTracking.carrierName,
          total: Number(o.total) || 0,
          items: Array.isArray(o.items) ? (o.items as ApiOrder['items']) : []
        };
      });

    return NextResponse.json({ success: true, orders: formattedOrders, count: formattedOrders.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), orders: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'orders_post',
    maxRequests: 20,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.isAllowed) {
    return createRateLimitResponse('Límite de creación de pedidos excedido. Por favor espera un momento.', rateLimit.resetTimeMs);
  }

  try {
    const body = await request.json();
    const { order } = body;

    if (!order || !order.id) {
      return NextResponse.json({ success: false, error: 'Order data is missing' }, { status: 400 });
    }

    // Bind authenticated user identity if logged in
    const authUser = await getAuthenticatedUser(request);
    const userId = authUser?.id || order.userId || undefined;

    // Sanitize string inputs against XSS and injection
    const cleanCustomerName = String(order.customerName || 'Cliente Lumina').replace(/<[^>]*>?/gm, '').trim().slice(0, 80);
    const cleanRecipient = String(order.recipient || cleanCustomerName).replace(/<[^>]*>?/gm, '').trim().slice(0, 80);
    const cleanEmail = String(order.customerEmail || authUser?.email || 'cliente@lumina.com').toLowerCase().trim().slice(0, 100);
    const cleanPayment = String(order.paymentMethod || 'Tarjeta de Crédito').replace(/<[^>]*>?/gm, '').trim().slice(0, 50);
    const cleanIdNumber = String(order.customerIdNumber || order.shippingAddress?.idNumber || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 40);
    const cleanPhone = String(order.customerPhone || order.shippingAddress?.phone || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 40);

    // Do NOT assign a trackingNumber on initial order creation ("Procesando") — assigned later when shipped ("Enviado")
    const newApiOrder: ApiOrder = {
      id: String(order.id).trim().slice(0, 60),
      userId,
      customerName: cleanCustomerName,
      customerEmail: cleanEmail,
      recipient: cleanRecipient,
      customerIdNumber: cleanIdNumber || undefined,
      customerPhone: cleanPhone || undefined,
      shippingAddress: order.shippingAddress || undefined,
      paymentMethod: cleanPayment,
      date: order.date || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: order.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      createdAt: order.createdAt || new Date().toISOString(),
      status: 'Procesando',
      trackingNumber: undefined,
      trackingUrl: undefined,
      carrierName: undefined,
      total: Math.max(0, Number(order.total) || 0),
      items: Array.isArray(order.items) ? order.items : []
    };

    const client = getScopedSupabaseClient(request);
    const { error } = await client.from('orders').upsert({
      id: newApiOrder.id,
      user_id: newApiOrder.userId || null,
      status: newApiOrder.status,
      total: newApiOrder.total,
      items: newApiOrder.items,
      tracking_number: null,
      customer_name: newApiOrder.customerName,
      customer_email: newApiOrder.customerEmail,
      customer_id_number: newApiOrder.customerIdNumber || null,
      customer_phone: newApiOrder.customerPhone || null,
      recipient: newApiOrder.recipient,
      shipping_address: newApiOrder.shippingAddress,
      payment_method: newApiOrder.paymentMethod,
      created_at: newApiOrder.createdAt
    });

    if (error) {
      console.error('Supabase orders save error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 2. Real inventory deduction in Supabase products table
    try {
      if (Array.isArray(newApiOrder.items) && newApiOrder.items.length > 0) {
        for (const item of newApiOrder.items) {
          const prodId = item.product?.id;
          const qty = Math.max(1, Number(item.quantity) || 1);
          if (prodId) {
            const { data: currentProd } = await client
              .from('products')
              .select('stock, badge')
              .eq('id', prodId)
              .maybeSingle();

            if (currentProd) {
              const currentStock = typeof currentProd.stock === 'number' ? currentProd.stock : 20;
              const nextStock = Math.max(0, currentStock - qty);
              const updates: Record<string, unknown> = {
                stock: nextStock,
                updated_at: new Date().toISOString(),
              };
              if (nextStock === 0) {
                updates.badge = 'AGOTADO';
              }
              await client.from('products').update(updates).eq('id', prodId);
            }
          }
        }
        appCache.invalidate('products');
      }
    } catch (stockErr) {
      console.warn('[orders/route] Could not deduct inventory stock:', stockErr);
    }

    // 3. Trigger customer invoice and store admin dispatch notice safely
    try {
      const allDispatchRecipients = await getAllDispatchRecipients();
      await sendOrderEmails({
        order: newApiOrder,
        adminEmails: allDispatchRecipients
      });
    } catch (emailInitErr) {
      console.warn('[emailService] Could not trigger email dispatch:', emailInitErr);
    }

    const walletToken = generateOrderTrackingToken(newApiOrder.id);
    return NextResponse.json({
      success: true,
      order: {
        ...newApiOrder,
        walletToken,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // 1. Mandatory JWT Authentication
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere inicio de sesión administrativo.' },
        { status: 401 }
      );
    }

    // 2. Strict Zero-Trust Admin Role Verification
    const isAdmin = await verifyIsAdmin(authUser.email);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes. Solo administradores autorizados pueden modificar estados de órdenes.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, status, trackingNumber, trackingUrl, carrierName, action } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId es un campo requerido.' }, { status: 400 });
    }

    const cleanOrderId = String(orderId).trim();
    const client = getScopedSupabaseClient(request);
    const origin = new URL(request.url).origin;

    // Optional admin action: Manual wallet re-synchronization without status change
    if (action === 'resync_wallets') {
      const { data: existingOrder } = await client
        .from('orders')
        .select('*')
        .eq('id', cleanOrderId)
        .maybeSingle();

      if (!existingOrder) {
        return NextResponse.json({ success: false, error: 'Orden no encontrada.' }, { status: 404 });
      }

      const currentStatus = (existingOrder.status || 'Procesando') as 'Procesando' | 'Enviado' | 'Entregado';
      const tracking = decodeOrderTracking(existingOrder.tracking_number, currentStatus);

      const syncResult = await syncOrderToWallets({
        orderId: cleanOrderId,
        status: currentStatus,
        total: Number(existingOrder.total || 0),
        customerName: existingOrder.customer_name,
        date: existingOrder.date,
        trackingNumber: tracking.trackingNumber,
        trackingUrl: tracking.trackingUrl,
        carrierName: tracking.carrierName,
        origin,
      });

      return NextResponse.json({
        success: true,
        orderId: cleanOrderId,
        walletSync: syncResult,
      });
    }

    if (!status) {
      return NextResponse.json({ success: false, error: 'status es un campo requerido.' }, { status: 400 });
    }

    // Whitelist valid order status transitions
    const validStatuses = ['Procesando', 'Enviado', 'Entregado'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Estado de orden no válido.' }, { status: 400 });
    }

    // Strict validation for "Enviado": Carrier, Tracking Code, and Valid External URL required!
    if (status === 'Enviado') {
      const cleanCode = String(trackingNumber || '').trim();
      const cleanUrl = String(trackingUrl || '').trim();
      const cleanCarrier = String(carrierName || '').trim();

      if (!cleanCode || cleanCode.length < 3) {
        return NextResponse.json(
          {
            success: false,
            error: 'Para despachar como "Enviado", debes ingresar una guía de rastreo válida (mínimo 3 caracteres).',
          },
          { status: 400 }
        );
      }
      if (!cleanUrl || !/^https?:\/\//i.test(cleanUrl)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Para despachar como "Enviado", debes ingresar una URL de seguimiento web válida (debe comenzar con http:// o https://).',
          },
          { status: 400 }
        );
      }
      if (!cleanCarrier) {
        return NextResponse.json(
          {
            success: false,
            error: 'Para despachar como "Enviado", debes seleccionar o ingresar el nombre de la transportadora/operador.',
          },
          { status: 400 }
        );
      }
    }

    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'Procesando') {
      updatePayload.tracking_number = null;
    } else if (trackingNumber !== undefined) {
      updatePayload.tracking_number = encodeOrderTracking(trackingNumber, trackingUrl, carrierName);
    }

    // 1. Database is the single source of truth: Commit DB update first
    const { error } = await client.from('orders').update(updatePayload).eq('id', cleanOrderId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 2. Trigger resilient wallet push updates to Apple Wallet & Google Wallet
    let walletSyncResult = null;
    try {
      const { data: updatedRecord } = await client
        .from('orders')
        .select('*')
        .eq('id', cleanOrderId)
        .maybeSingle();

      if (updatedRecord) {
        walletSyncResult = await syncOrderToWallets({
          orderId: cleanOrderId,
          status,
          total: Number(updatedRecord.total || 0),
          customerName: updatedRecord.customer_name,
          date: updatedRecord.date,
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          carrierName: carrierName || undefined,
          origin,
        });
      }
    } catch (syncErr) {
      console.warn('[orders/route PATCH] Non-fatal wallet synchronization error:', syncErr);
    }

    return NextResponse.json({
      success: true,
      orderId: cleanOrderId,
      status,
      trackingNumber: trackingNumber || undefined,
      trackingUrl: trackingUrl || undefined,
      carrierName: carrierName || undefined,
      walletSync: walletSyncResult,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
