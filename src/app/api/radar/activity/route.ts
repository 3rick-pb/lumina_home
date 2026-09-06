import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cleanClientName, resolveCoordinates } from '@/lib/radarStore';

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

const CLIENT_TIMEOUT_MS = 45 * 1000; // 45s timeout protects against browser background-tab throttling while maintaining quick cleanup

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

  // 1. Fetch live active sessions from Supabase table
  try {
    const cutoff = new Date(Date.now() - CLIENT_TIMEOUT_MS).toISOString();
    const { data: dbSessions, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('is_online', true)
      .gte('last_seen', cutoff)
      .order('last_seen', { ascending: false });

    if (!error && Array.isArray(dbSessions)) {
      const activeDbUserIds = new Set<string>();

      for (const row of dbSessions) {
        if (
          row.user_id && 
          !row.user_id.startsWith('vis_') && 
          !row.user_id.startsWith('guest_') &&
          !String(row.name).toLowerCase().includes('visitante')
        ) {
          activeDbUserIds.add(row.user_id);
          const existing = globalClients.get(row.user_id);
          const purchases = Number(row.purchases_count) || 0;
          const frequency = purchases >= 12 ? 'Semanal' : purchases >= 6 ? 'Quincenal' : purchases >= 3 ? 'Mensual' : purchases >= 1 ? 'Ocasional' : '1ª Vez';
          const finalCity = row.city || (existing ? existing.city : '');
          const coords = resolveCoordinates(finalCity);
          const parsedX = row.x !== null && row.x !== undefined ? Number(row.x) : NaN;
          const parsedY = row.y !== null && row.y !== undefined ? Number(row.y) : NaN;
          const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : (existing && existing.x >= 0 ? existing.x : -100));
          const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : (existing && existing.y >= 0 ? existing.y : -100));
          const dbLastSeen = new Date(row.last_seen).getTime() || Date.now();
          const existingLastSeen = existing?.lastSeen || 0;
          const isDbNewer = dbLastSeen >= existingLastSeen;

          globalClients.set(row.user_id, {
            id: row.user_id,
            name: cleanClientName(row.name),
            email: row.email || (existing ? existing.email : ''),
            city: finalCity,
            country: row.country || 'Ecuador',
            x: finalX,
            y: finalY,
            frequency,
            purchasesCount: purchases,
            totalSpent: Number(row.total_spent) || 0,
            currentSection: (existing && !isDbNewer) ? existing.currentSection : (row.current_section || existing?.currentSection || 'Explorando Tienda'),
            intentScore: 85,
            device: (row.device as CachedClient['device']) || (existing ? existing.device : 'Computador'),
            hasCart: (existing && !isDbNewer) ? existing.hasCart : Boolean(row.has_cart),
            cartItemsCount: (existing && !isDbNewer) ? existing.cartItemsCount : (Number(row.cart_items_count) || 0),
            isOnline: true,
            lastSeen: Math.max(dbLastSeen, existingLastSeen),
          });
        }
      }

      // Clean up memory clients whose session truly expired or went offline
      const now = Date.now();
      globalClients.forEach((client, id) => {
        if (!client.isOnline || (now - client.lastSeen > CLIENT_TIMEOUT_MS)) {
          globalClients.delete(id);
        }
      });
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
          .delete()
          .eq('user_id', id);
      } catch (e) {
        void e;
      }
      return NextResponse.json({ success: true, status: 'offline' });
    }

    const cleanCity = city || '';
    const coords = resolveCoordinates(cleanCity);
    const parsedX = x !== null && x !== undefined ? Number(x) : NaN;
    const parsedY = y !== null && y !== undefined ? Number(y) : NaN;
    const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : -100);
    const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : -100);

    const clientRecord: CachedClient = {
      id,
      name: cleanName,
      email: email || '',
      city: cleanCity,
      country: 'Ecuador',
      x: finalX,
      y: finalY,
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
