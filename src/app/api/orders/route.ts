import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// Initial mock orders to ensure immediate continuity with the user's dashboard
const initialStoreOrders: ApiOrder[] = [
  {
    id: "INV_852138",
    userId: "client-erick-demo",
    customerName: "Erick Pérez",
    customerEmail: "erick.perez@ejemplo.com",
    recipient: "Erick Pérez",
    shippingAddress: {
      street: "Av. San Isidro y San Cristóbal",
      city: "Quito - Uyumbicho",
      state: "Pichincha",
      postalCode: "170505",
      country: "Ecuador",
    },
    paymentMethod: "VISA •••• 4120",
    date: "4 de septiembre de 2026",
    time: "11:42",
    createdAt: "2026-09-04T11:42:00.000Z",
    status: "Procesando",
    trackingNumber: "LM-8521382",
    total: 154.50,
    items: [
      {
        product: {
          id: "prod-1",
          title: "Lámpara Nórdica Terra",
          price: 89.50,
          imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
          category: "Iluminación"
        },
        quantity: 1,
        color: "Terracota"
      },
      {
        product: {
          id: "prod-2",
          title: "Jarrón Cerámica Aura",
          price: 65.00,
          imageUrl: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=800&auto=format&fit=crop",
          category: "Decoración"
        },
        quantity: 1,
        color: "Blanco Marfil"
      }
    ]
  },
  {
    id: "INV_741920",
    userId: "client-valeria-demo",
    customerName: "Valeria Gómez",
    customerEmail: "valeria.gomez@gmail.com",
    recipient: "Valeria Gómez",
    shippingAddress: {
      street: "Calle de Alcalá 45, 3ºB",
      city: "Madrid",
      state: "Madrid",
      postalCode: "28014",
      country: "España",
    },
    paymentMethod: "MASTERCARD •••• 0019",
    date: "3 de septiembre de 2026",
    time: "16:15",
    createdAt: "2026-09-03T16:15:00.000Z",
    status: "Enviado",
    trackingNumber: "LM-7419205",
    total: 210.00,
    items: [
      {
        product: {
          id: "prod-3",
          title: "Sillón Lounge Minimal",
          price: 210.00,
          imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop",
          category: "Mobiliario"
        },
        quantity: 1,
        color: "Gris Carbón"
      }
    ]
  }
];

// In-memory persistent order repository for the Node process
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalOrdersRef: { orders: ApiOrder[] } = (globalThis as any).__lumina_orders_cache || {
  orders: [...initialStoreOrders]
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__lumina_orders_cache = globalOrdersRef;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const email = searchParams.get('email') || '';
    const isAdmin = role === 'ADMIN' || email.toLowerCase() === 'admin@lumina.com';

    // 1. Try to fetch from Supabase if connected
    let supabaseOrders: ApiOrder[] = [];
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabaseOrders = data.map((o: any) => ({
          id: o.id,
          userId: o.user_id,
          customerName: o.customer_name || 'Cliente Lumina',
          customerEmail: o.customer_email || 'cliente@lumina.com',
          recipient: o.recipient || o.customer_name || 'Cliente',
          shippingAddress: o.shipping_address || undefined,
          paymentMethod: o.payment_method || 'Tarjeta de Crédito',
          date: o.created_at ? new Date(o.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Reciente',
          time: o.created_at ? new Date(o.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '12:00',
          createdAt: o.created_at || new Date().toISOString(),
          status: (o.status as ApiOrder['status']) || 'Procesando',
          trackingNumber: o.tracking_number,
          total: Number(o.total) || 0,
          items: Array.isArray(o.items) ? o.items : []
        }));
      }
    } catch {
      // Supabase RLS fallback
    }

    // Merge Supabase with server cache ensuring no duplicate IDs
    const mergedMap = new Map<string, ApiOrder>();
    
    // Add server memory orders first
    globalOrdersRef.orders.forEach(o => mergedMap.set(o.id, o));
    
    // Override/supplement with Supabase orders
    supabaseOrders.forEach(o => mergedMap.set(o.id, o));

    let finalOrders = Array.from(mergedMap.values());

    // Filter if not admin
    if (!isAdmin && userId) {
      finalOrders = finalOrders.filter(o => o.userId === userId || o.customerEmail?.toLowerCase() === email.toLowerCase());
    }

    // Sort newest first
    finalOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, orders: finalOrders, count: finalOrders.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), orders: globalOrdersRef.orders }, { status: 500 });
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

    // 1. Save in server memory cache
    const existingIndex = globalOrdersRef.orders.findIndex(o => o.id === newApiOrder.id);
    if (existingIndex >= 0) {
      globalOrdersRef.orders[existingIndex] = newApiOrder;
    } else {
      globalOrdersRef.orders.unshift(newApiOrder);
    }

    // 2. Attempt to save to Supabase
    try {
      await supabase.from('orders').upsert({
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
    } catch (sbErr) {
      console.warn('Notice: Supabase save fallback to local sync cache', sbErr);
    }

    return NextResponse.json({ success: true, order: newApiOrder });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'orderId and status are required' }, { status: 400 });
    }

    // 1. Update in server cache
    let foundOrder: ApiOrder | null = null;
    globalOrdersRef.orders = globalOrdersRef.orders.map(o => {
      if (o.id === orderId) {
        foundOrder = { ...o, status };
        return foundOrder;
      }
      return o;
    });

    // 2. Attempt to update in Supabase
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
    } catch (sbErr) {
      console.warn('Notice: Supabase update fallback to local sync cache', sbErr);
    }

    return NextResponse.json({ success: true, order: foundOrder });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
