import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cleanClientName, resolveCoordinates, resolveFrequency, calculateIntentScore } from '@/lib/radarStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export interface CachedSession {
  sessionId: string;
  userId: string;
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
  updatedAt: number;
}

export interface AggregatedClient {
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
  activeSessionsCount: number;
  isRealUser: boolean;
}

// In-memory multi-session store (keyed by sessionId)
const globalSessions = new Map<string, CachedSession>();

// Enterprise TTL: 60 seconds of inactivity to declare session dead
const CLIENT_TTL_MS = 60 * 1000;

function pruneStaleSessions() {
  const now = Date.now();
  globalSessions.forEach((session, sId) => {
    if (
      session.userId.startsWith('vis_') ||
      session.userId.startsWith('guest_') ||
      session.name.toLowerCase().includes('visitante') ||
      !session.isOnline ||
      now - session.lastSeen > CLIENT_TTL_MS
    ) {
      globalSessions.delete(sId);
    }
  });
}

function getAggregatedClients(): AggregatedClient[] {
  pruneStaleSessions();

  // Group active sessions by userId
  const byUser = new Map<string, CachedSession[]>();
  globalSessions.forEach((session) => {
    if (
      !session.isOnline ||
      session.userId.startsWith('vis_') ||
      session.userId.startsWith('guest_') ||
      session.name.toLowerCase().includes('visitante')
    ) {
      return;
    }
    const list = byUser.get(session.userId) || [];
    list.push(session);
    byUser.set(session.userId, list);
  });

  const aggregated: AggregatedClient[] = [];

  byUser.forEach((sessions, userId) => {
    if (sessions.length === 0) return;

    // Pick the most recently active session for section/cart display
    sessions.sort((a, b) => b.lastSeen - a.lastSeen);
    const primary = sessions[0];

    // Check if any active session of this user has an open cart or items
    const anyCart = sessions.some((s) => s.hasCart);
    const maxCartCount = Math.max(...sessions.map((s) => s.cartItemsCount || 0));

    aggregated.push({
      id: userId,
      name: primary.name,
      email: primary.email,
      city: primary.city,
      country: primary.country || 'Ecuador',
      x: primary.x,
      y: primary.y,
      frequency: primary.frequency,
      purchasesCount: primary.purchasesCount,
      totalSpent: primary.totalSpent,
      currentSection: primary.currentSection,
      intentScore: primary.intentScore,
      device: primary.device,
      hasCart: anyCart,
      cartItemsCount: maxCartCount,
      isOnline: true,
      lastSeen: primary.lastSeen,
      activeSessionsCount: sessions.length,
      isRealUser: true,
    });
  });

  return aggregated;
}

export async function GET() {
  const now = Date.now();
  const cutoff = new Date(now - CLIENT_TTL_MS).toISOString();

  // 1. Synchronize Supabase table if it exists
  try {
    await supabase
      .from('active_sessions')
      .update({ is_online: false })
      .eq('is_online', true)
      .lt('last_seen', cutoff);
  } catch {
    // Non-critical: table may not exist
  }

  // 2. Fetch from Supabase active_sessions if available to merge external server sessions
  try {
    const { data: dbSessions, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('is_online', true)
      .gte('last_seen', cutoff)
      .order('last_seen', { ascending: false });

    if (!error && Array.isArray(dbSessions) && dbSessions.length > 0) {
      for (const row of dbSessions) {
        if (
          !row.user_id ||
          row.user_id.startsWith('vis_') ||
          row.user_id.startsWith('guest_') ||
          String(row.name).toLowerCase().includes('visitante')
        ) {
          continue;
        }

        const dbLastSeen = new Date(row.last_seen).getTime() || 0;
        if (now - dbLastSeen > CLIENT_TTL_MS) continue;

        const sessionKey = row.session_id || `db_session_${row.user_id}`;
        const existing = globalSessions.get(sessionKey);

        const purchases = Number(row.purchases_count) || 0;
        const finalCity = row.city || (existing ? existing.city : '');
        const coords = resolveCoordinates(finalCity);
        const parsedX = row.x !== null && row.x !== undefined ? Number(row.x) : NaN;
        const parsedY = row.y !== null && row.y !== undefined ? Number(row.y) : NaN;
        const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : (existing && existing.x >= 0 ? existing.x : -100));
        const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : (existing && existing.y >= 0 ? existing.y : -100));

        globalSessions.set(sessionKey, {
          sessionId: sessionKey,
          userId: row.user_id,
          name: cleanClientName(row.name),
          email: row.email || existing?.email || '',
          city: finalCity,
          country: row.country || 'Ecuador',
          x: finalX,
          y: finalY,
          frequency: resolveFrequency(purchases),
          purchasesCount: purchases,
          totalSpent: Number(row.total_spent) || 0,
          currentSection: row.current_section || existing?.currentSection || 'Explorando Tienda',
          intentScore: calculateIntentScore(purchases, Number(row.total_spent) || 0, Boolean(row.has_cart)),
          device: (row.device as CachedSession['device']) || existing?.device || 'Computador',
          hasCart: Boolean(row.has_cart),
          cartItemsCount: Number(row.cart_items_count) || 0,
          isOnline: true,
          lastSeen: Math.max(dbLastSeen, existing?.lastSeen || 0),
          updatedAt: now,
        });
      }
    }
  } catch {
    // Non-critical if Supabase table is not present
  }

  const clientsList = getAggregatedClients();

  return NextResponse.json(
    {
      success: true,
      count: clientsList.length,
      clients: clientsList,
      timestamp: Date.now(),
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
      id, // user_id
      sessionId,
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
      allSessions, // true on explicit logout
    } = body;

    if (!id || id.startsWith('vis_') || id.startsWith('guest_') || String(name).toLowerCase().includes('visitante')) {
      return NextResponse.json({ success: false, error: 'Only real authenticated users are tracked' }, { status: 400 });
    }

    const cleanName = cleanClientName(name);
    const sessionKey = sessionId || `session_${id}_default`;

    // ── Handle Offline Transition ──
    if (isOnline === false) {
      if (allSessions === true || !sessionId) {
        // Explicit logout: Purge ALL sessions for this user
        globalSessions.forEach((s, k) => {
          if (s.userId === id) {
            globalSessions.delete(k);
          }
        });

        try {
          await supabase
            .from('active_sessions')
            .update({ is_online: false })
            .eq('user_id', id);
          await supabase
            .from('active_sessions')
            .delete()
            .eq('user_id', id);
        } catch {
          // Ignore DB table errors
        }

        return NextResponse.json({ success: true, status: 'offline_all_sessions' });
      } else {
        // Tab closed (unload): Remove ONLY this specific session
        globalSessions.delete(sessionKey);

        try {
          await supabase
            .from('active_sessions')
            .delete()
            .eq('session_id', sessionKey);
        } catch {
          // Ignore DB table errors
        }

        return NextResponse.json({ success: true, status: 'offline_session_closed', remainingSessions: getAggregatedClients().filter(c => c.id === id).length });
      }
    }

    // ── Handle Online / Heartbeat / Navigation ──
    const cleanCity = city || '';
    const coords = resolveCoordinates(cleanCity);
    const parsedX = x !== null && x !== undefined ? Number(x) : NaN;
    const parsedY = y !== null && y !== undefined ? Number(y) : NaN;
    const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : -100);
    const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : -100);

    const purchases = purchasesCount || 0;
    const spent = totalSpent || 0;
    const now = Date.now();

    const sessionRecord: CachedSession = {
      sessionId: sessionKey,
      userId: id,
      name: cleanName,
      email: email || '',
      city: cleanCity,
      country: 'Ecuador',
      x: finalX,
      y: finalY,
      frequency: frequency || resolveFrequency(purchases),
      purchasesCount: purchases,
      totalSpent: spent,
      currentSection: currentSection || 'Explorando Tienda',
      intentScore: intentScore || calculateIntentScore(purchases, spent, Boolean(hasCart)),
      device: device || 'Computador',
      hasCart: Boolean(hasCart),
      cartItemsCount: cartItemsCount || 0,
      isOnline: true,
      lastSeen: now,
      updatedAt: now,
    };

    globalSessions.set(sessionKey, sessionRecord);

    // Persist to Supabase if table exists (fire and forget)
    try {
      await supabase.from('active_sessions').upsert({
        session_id: sessionKey,
        user_id: id,
        name: cleanName,
        email: email || '',
        city: sessionRecord.city,
        country: 'Ecuador',
        x: sessionRecord.x,
        y: sessionRecord.y,
        current_section: sessionRecord.currentSection,
        is_online: true,
        has_cart: sessionRecord.hasCart,
        cart_items_count: sessionRecord.cartItemsCount,
        total_spent: sessionRecord.totalSpent,
        purchases_count: sessionRecord.purchasesCount,
        device: sessionRecord.device,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'session_id' });
    } catch {
      // Ignore if table active_sessions doesn't exist
    }

    return NextResponse.json({ 
      success: true, 
      activeUsersCount: getAggregatedClients().length,
      sessionId: sessionKey 
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
