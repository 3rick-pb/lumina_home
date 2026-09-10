import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyIsAdmin, getAuthenticatedUser } from '@/lib/serverAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ApiOrder {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  recipient: string;
  shippingAddress?: {
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email') || '';

    // Verify authenticated user via JWT Bearer
    const authUser = await getAuthenticatedUser(request);
    const isAdmin = authUser?.email ? await verifyIsAdmin(authUser.email) : false;

    let query = supabase
      .from('orders')
      .select('*')
      .not('id', 'like', 'SYS_%')
      .order('created_at', { ascending: false });

    // Non-admins only see their own orders (prioritizing verified JWT identity)
    if (!isAdmin) {
      const targetUserId = authUser?.id || userId;
      const targetEmail = authUser?.email ? authUser.email.toLowerCase().trim() : (email ? email.toLowerCase().trim() : '');

      if (targetUserId && targetEmail) {
        query = query.or(`user_id.eq.${targetUserId},customer_email.eq.${targetEmail}`);
      } else if (targetUserId) {
        query = query.eq('user_id', targetUserId);
      } else if (targetEmail) {
        query = query.eq('customer_email', targetEmail);
      } else {
        return NextResponse.json({ success: true, orders: [], count: 0 });
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

    const newApiOrder: ApiOrder = {
      id: order.id,
      userId: order.userId || undefined,
      customerName: order.customerName || 'Cliente Lumina',
      customerEmail: order.customerEmail || 'cliente@lumina.com',
      recipient: order.recipient || order.customerName || 'Cliente',
      shippingAddress: order.shippingAddress || undefined,
      paymentMethod: order.paymentMethod || 'Tarjeta de Crédito',
      date: order.date || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: order.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      createdAt: order.createdAt || new Date().toISOString(),
      status: order.status || 'Procesando',
      trackingNumber: order.trackingNumber || `LM-${Math.floor(1000000 + Math.random() * 9000000)}`,
      total: Number(order.total) || 0,
      items: Array.isArray(order.items) ? order.items : []
    };

    const { error } = await supabase.from('orders').upsert({
      id: newApiOrder.id,
      user_id: newApiOrder.userId || null,
      status: newApiOrder.status,
      total: newApiOrder.total,
      items: newApiOrder.items,
      tracking_number: newApiOrder.trackingNumber,
      customer_name: newApiOrder.customerName,
      customer_email: newApiOrder.customerEmail,
      recipient: newApiOrder.recipient,
      shipping_address: newApiOrder.shippingAddress,
      payment_method: newApiOrder.paymentMethod,
      created_at: newApiOrder.createdAt
    });

    if (error) {
      console.error('Supabase orders save error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: newApiOrder });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, requesterEmail } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'orderId and status are required' }, { status: 400 });
    }

    // Optional admin check if email/auth provided
    const authUser = await getAuthenticatedUser(request);
    const emailToCheck = authUser?.email || requesterEmail;
    if (emailToCheck) {
      const isAdmin = await verifyIsAdmin(emailToCheck);
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'No autorizado para cambiar estado de orden' }, { status: 403 });
      }
    }

    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId, status });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
