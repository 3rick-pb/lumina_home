import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cleanClientName } from '@/lib/radarStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface CachedClient {
  id: string;
  name: string;
  email: string;
  city: string;
  country: string;
  x: number;
  y: number;
  frequency: "Semanal" | "Quincenal" | "Mensual" | "Ocasional" | "1ª Vez";
  purchasesCount: number;
  totalSpent: number;
  currentSection: string;
  intentScore: number;
  device: "Computador" | "Celular" | "Tablet";
  hasCart: boolean;
  cartItemsCount: number;
  isOnline: boolean;
  lastSeen: number;
}

// In-memory global store to guarantee instant synchronization across clients
const globalClients = new Map<string, CachedClient>();

const CLIENT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes inactivity timeout

function pruneStaleClients() {
  const now = Date.now();
  globalClients.forEach((client, id) => {
    if (
      id.startsWith('vis_') || 
      id.startsWith('guest_') || 
      client.name.toLowerCase().includes('visitante') ||
      !client.isOnline || 
      now - client.lastSeen > CLIENT_TIMEOUT_MS
    ) {
      globalClients.delete(id);
    }
  });
}

export async function GET() {
  pruneStaleClients();

  // 1. Try to fetch from Supabase active_sessions table
  try {
    const twoMinutesAgo = new Date(Date.now() - CLIENT_TIMEOUT_MS).toISOString();
    const { data: dbSessions, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('is_online', true)
      .gte('last_seen', twoMinutesAgo);

    if (!error && Array.isArray(dbSessions) && dbSessions.length > 0) {
      for (const row of dbSessions) {
        if (
          row.user_id && 
          !row.user_id.startsWith('vis_') && 
          !row.user_id.startsWith('guest_') &&
          !String(row.name).toLowerCase().includes('visitante')
        ) {
          const existing = globalClients.get(row.user_id);
          const dbTime = new Date(row.last_seen).getTime() || 0;
          if (existing && existing.lastSeen > dbTime) {
            // Memory has a fresher activity update, keep it
            continue;
          }

          const purchases = Number(row.purchases_count) || 0;
          const frequency = purchases >= 12 ? 'Semanal' : purchases >= 6 ? 'Quincenal' : purchases >= 3 ? 'Mensual' : purchases >= 1 ? 'Ocasional' : '1ª Vez';
          const finalCity = row.city || (existing ? existing.city : '');
          const finalX = typeof row.x === 'number' && Number(row.x) >= 0 ? Number(row.x) : (existing ? existing.x : -100);
          const finalY = typeof row.y === 'number' && Number(row.y) >= 0 ? Number(row.y) : (existing ? existing.y : -100);

          globalClients.set(row.user_id, {
            id: row.user_id,
            name: cleanClientName(row.name),
            email: row.email || '',
            city: finalCity,
            country: row.country || 'Ecuador',
            x: finalX,
            y: finalY,
            frequency,
            purchasesCount: purchases,
            totalSpent: Number(row.total_spent) || 0,
            currentSection: row.current_section || 'Explorando Tienda',
            intentScore: 85,
            device: (row.device as CachedClient['device']) || 'Computador',
            hasCart: Boolean(row.has_cart),
            cartItemsCount: Number(row.cart_items_count) || 0,
            isOnline: true,
            lastSeen: new Date(row.last_seen).getTime() || Date.now(),
          });
        }
      }
    }
  } catch (err) {
    void err;
  }

  const clientsList: Array<CachedClient & { isRealUser: boolean }> = [];
  globalClients.forEach((c) => {
    if (
      c.isOnline &&
      !c.id.startsWith('vis_') &&
      !c.id.startsWith('guest_') &&
      !c.name.toLowerCase().includes('visitante')
    ) {
      clientsList.push({
        ...c,
        isRealUser: true,
      });
    }
  });

  return NextResponse.json(
    {
      success: true,
      count: clientsList.length,
      clients: clientsList,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      email,
      city,
      x,
      y,
      frequency,
      purchasesCount,
      totalSpent,
      currentSection,
      intentScore,
      device,
      hasCart,
      cartItemsCount,
      isOnline,
    } = body;

    if (!id || id.startsWith('vis_') || id.startsWith('guest_') || String(name).toLowerCase().includes('visitante')) {
      return NextResponse.json({ success: false, error: 'Only real authenticated users are tracked' }, { status: 400 });
    }

    const cleanName = cleanClientName(name);

    if (isOnline === false) {
      globalClients.delete(id);
      try {
        await supabase
          .from('active_sessions')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('user_id', id);
      } catch (e) {
        void e;
      }
      return NextResponse.json({ success: true, status: 'offline' });
    }

    const clientRecord: CachedClient = {
      id,
      name: cleanName,
      email: email || '',
      city: city || '',
      country: 'Ecuador',
      x: typeof x === 'number' ? x : -100,
      y: typeof y === 'number' ? y : -100,
      frequency: frequency || '1ª Vez',
      purchasesCount: purchasesCount || 0,
      totalSpent: totalSpent || 0,
      currentSection: currentSection || 'Explorando Tienda',
      intentScore: intentScore || 85,
      device: device || 'Computador',
      hasCart: Boolean(hasCart),
      cartItemsCount: cartItemsCount || 0,
      isOnline: true,
      lastSeen: Date.now(),
    };

    globalClients.set(id, clientRecord);

    // Also persist to Supabase active_sessions table if available
    try {
      await supabase.from('active_sessions').upsert({
        user_id: id,
        name: cleanName,
        email: email || '',
        city: clientRecord.city,
        country: 'Ecuador',
        x: clientRecord.x,
        y: clientRecord.y,
        current_section: clientRecord.currentSection,
        is_online: true,
        has_cart: clientRecord.hasCart,
        cart_items_count: clientRecord.cartItemsCount,
        total_spent: clientRecord.totalSpent,
        purchases_count: clientRecord.purchasesCount,
        device: clientRecord.device,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (dbErr) {
      void dbErr;
    }

    return NextResponse.json({ success: true, count: globalClients.size });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
