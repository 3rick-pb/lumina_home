import { NextResponse } from 'next/server';
import { verifyIsAdmin, getAuthenticatedUser, getScopedSupabaseClient } from '@/lib/serverAuth';
import { sendOrderEmails, getAllAdminEmails } from '@/lib/emailService';

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

export async function GET(request: Request) {
  try {
    // Verify authenticated user via JWT Bearer
    const authUser = await getAuthenticatedUser(request);
    const isAdmin = authUser?.email ? await verifyIsAdmin(authUser.email) : false;
    const client = getScopedSupabaseClient(request);

    let query = client
      .from('orders')
      .select('*')
      .not('id', 'like', 'SYS_%')
      .order('created_at', { ascending: false });

    // Non-admins only see their own orders (strict zero-trust: must be authenticated)
    if (!isAdmin) {
      if (!authUser || !authUser.id) {
        // Unauthenticated callers have no access to private customer orders
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

    const formattedOrders: ApiOrder[] = (data || [])
      .filter((o: Record<string, unknown>) => !String(o.id || '').startsWith('SYS_'))
      .map((o: Record<string, unknown>) => ({
        id: String(o.id || ''),
        userId: o.user_id ? String(o.user_id) : undefined,
        customerName: String(o.customer_name || 'Cliente Lumina'),
        customerEmail: String(o.customer_email || 'cliente@lumina.com'),
        recipient: String(o.recipient || o.customer_name || 'Cliente'),
        customerIdNumber: o.customer_id_number ? String(o.customer_id_number) : undefined,
        customerPhone: o.customer_phone ? String(o.customer_phone) : undefined,
        shippingAddress: (o.shipping_address as ApiOrder['shippingAddress']) || undefined,
        paymentMethod: String(o.payment_method || 'Tarjeta de Crédito'),
        date: o.created_at ? new Date(String(o.created_at)).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Reciente',
        time: o.created_at ? new Date(String(o.created_at)).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '12:00',
        createdAt: String(o.created_at || new Date().toISOString()),
        status: (o.status as ApiOrder['status']) || 'Procesando',
        trackingNumber: o.tracking_number ? String(o.tracking_number) : undefined,
        total: Number(o.total) || 0,
        items: Array.isArray(o.items) ? (o.items as ApiOrder['items']) : []
      }));

    return NextResponse.json({ success: true, orders: formattedOrders, count: formattedOrders.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), orders: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
      status: 'Procesando', // Enforce default state on initial creation
      trackingNumber: order.trackingNumber || `LM-${Math.floor(1000000 + Math.random() * 9000000)}`,
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
      tracking_number: newApiOrder.trackingNumber,
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

    // Trigger customer invoice and store admin dispatch notice safely
    try {
      const adminEmails = await getAllAdminEmails();
      // Await email dispatch so serverless lambda does not freeze before completion
      await sendOrderEmails({
        order: newApiOrder,
        adminEmails
      });
    } catch (emailInitErr) {
      console.warn('[emailService] Could not trigger email dispatch:', emailInitErr);
    }

    return NextResponse.json({ success: true, order: newApiOrder });
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
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'orderId y status son campos requeridos.' }, { status: 400 });
    }

    // Whitelist valid order status transitions
    const validStatuses = ['Procesando', 'Enviado', 'Entregado'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Estado de orden no válido.' }, { status: 400 });
    }

    const cleanOrderId = String(orderId).trim();
    const client = getScopedSupabaseClient(request);
    const { error } = await client.from('orders').update({ status }).eq('id', cleanOrderId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId: cleanOrderId, status });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
