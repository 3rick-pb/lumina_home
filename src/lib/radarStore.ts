import { create } from 'zustand';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ConnectedClient {
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
  cartItemsCount?: number;
  isRealUser?: boolean;
  isOnline?: boolean;
  lastSeen?: number;
  lastUpdated?: number;
}

const COMMON_FIRST_NAMES = [
  'alejandro', 'sebastian', 'valeria', 'fernando', 'gabriel', 'carlos', 
  'daniel', 'manuel', 'miguel', 'javier', 'erick', 'david', 'jorge', 
  'pedro', 'mateo', 'camila', 'paula', 'sofia', 'pablo', 'mario', 
  'maria', 'diego', 'luis', 'jose', 'juan', 'eric', 'ana'
];

/**
 * Normalizes names cleanly:
 * - Separates email/username dots/underscores/hyphens (e.g. "erick.arteaga" -> "Erick Arteaga")
 * - Separates lowercase letter followed by uppercase (e.g. "ErickArteaga" -> "Erick Arteaga", "ErickADMIN" -> "Erick ADMIN")
 * - Detects common first names followed by surname (e.g. "erickarteaga" -> "Erick Arteaga")
 * - Normalizes any glued "ADMIN" (e.g. "ErickADMIN" or "erickadmin" -> "Erick ADMIN")
 * - Properly capitalizes each word
 */
export const cleanClientName = (rawName?: string) => {
  if (!rawName) return "Cliente Lumina";
  let formatted = String(rawName).trim();
  // 1. Replace periods, underscores, dashes with space
  formatted = formatted.replace(/[\._\-]+/g, ' ');
  // 2. Separate lowercase letter followed by uppercase letter (camelCase: ErickArteaga -> Erick Arteaga, ErickADMIN -> Erick ADMIN)
  formatted = formatted.replace(/([a-zñáéíóú])([A-ZÑÁÉÍÓÚ])/g, '$1 $2');
  // 3. Separate number followed by letter or letter followed by number
  formatted = formatted.replace(/([a-zA-ZáéíóúÁÉÍÓÚñÑ])([0-9])/g, '$1 $2');
  formatted = formatted.replace(/([0-9])([a-zA-ZáéíóúÁÉÍÓÚñÑ])/g, '$1 $2');
  // 4. Separate and normalize any variation of ADMIN glued to letters/numbers
  formatted = formatted.replace(/([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])\s*(?:admin)\b/gi, '$1 ADMIN');
  // 5. If still a single continuous lowercase word without spaces, split if it starts with a common first name
  if (!formatted.includes(' ')) {
    const lower = formatted.toLowerCase();
    for (const fn of COMMON_FIRST_NAMES) {
      if (lower.startsWith(fn) && lower.length > fn.length + 1) {
        formatted = formatted.slice(0, fn.length) + ' ' + formatted.slice(fn.length);
        break;
      }
    }
  }
  // 6. Clean multiple spaces and capitalize words properly
  const words = formatted.replace(/\s+/g, ' ').trim().split(' ');
  return words.map(w => w.toUpperCase() === 'ADMIN' ? 'ADMIN' : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// ── Province coordinate lookup table (Calibrated to 100% solid land on 3D Relief map) ──
const CITY_COORDINATES: Record<string, { x: number; y: number }> = {
  // Sierra
  "quito": { x: 48.8, y: 26.5 },
  "pichincha": { x: 48.8, y: 26.5 },
  "cuenca": { x: 40.5, y: 67.5 },
  "azuay": { x: 40.5, y: 67.5 },
  "ambato": { x: 50.5, y: 41.5 },
  "tungurahua": { x: 50.5, y: 41.5 },
  "latacunga": { x: 49.5, y: 35.0 },
  "cotopaxi": { x: 49.5, y: 35.0 },
  "riobamba": { x: 50.0, y: 49.0 },
  "chimborazo": { x: 50.0, y: 49.0 },
  "loja": { x: 37.5, y: 82.5 },
  "ibarra": { x: 55.0, y: 17.5 },
  "imbabura": { x: 55.0, y: 17.5 },
  "tulcan": { x: 60.5, y: 12.0 },
  "carchi": { x: 60.5, y: 12.0 },
  "azogues": { x: 42.0, y: 63.5 },
  "cañar": { x: 42.0, y: 63.5 },
  "guaranda": { x: 45.0, y: 47.0 },
  "bolivar": { x: 45.0, y: 47.0 },
  // Costa (Calibrated to precise inland landmass coordinates, never in the ocean/water)
  "guayaquil": { x: 35.5, y: 52.0 },
  "guayas": { x: 35.5, y: 52.0 },
  "manta": { x: 21.0, y: 39.5 },
  "portoviejo": { x: 24.5, y: 41.0 },
  "manabi": { x: 24.5, y: 41.0 },
  "santo domingo": { x: 41.0, y: 29.5 },
  "machala": { x: 27.5, y: 69.5 },
  "el oro": { x: 27.5, y: 69.5 },
  "esmeraldas": { x: 38.0, y: 12.0 },
  "santa elena": { x: 25.0, y: 50.0 },
  "salinas": { x: 24.4, y: 50.5 },
  "babahoyo": { x: 34.0, y: 49.0 },
  "los rios": { x: 34.0, y: 49.0 },
  // Galápagos
  "galapagos": { x: 10.0, y: 22.0 },
  "baquerizo moreno": { x: 10.0, y: 22.0 },
  "santa cruz": { x: 10.0, y: 22.0 },
  // Amazonía
  "nueva loja": { x: 75.0, y: 22.0 },
  "lago agrio": { x: 75.0, y: 22.0 },
  "sucumbios": { x: 75.0, y: 22.0 },
  "coca": { x: 73.0, y: 34.0 },
  "orellana": { x: 73.0, y: 34.0 },
  "tena": { x: 62.0, y: 39.0 },
  "napo": { x: 62.0, y: 39.0 },
  "puyo": { x: 63.0, y: 49.0 },
  "pastaza": { x: 63.0, y: 49.0 },
  "macas": { x: 58.0, y: 56.0 },
  "morona santiago": { x: 58.0, y: 56.0 },
  "zamora": { x: 48.0, y: 83.0 },
  "zamora chinchipe": { x: 48.0, y: 83.0 },
};

export function resolveCoordinates(city?: string): { x: number; y: number } {
  if (!city || !city.trim()) return { x: -100, y: -100 };

  const normalized = city.toLowerCase().trim();
  if (normalized === 'ecuador' || normalized === 'desconocido' || normalized === 'null' || normalized === 'undefined') {
    return { x: -100, y: -100 };
  }

  // 1. Exact match
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }

  // 2. Partial match
  for (const key of Object.keys(CITY_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return CITY_COORDINATES[key];
    }
  }

  return { x: -100, y: -100 };
}

export function resolveFrequency(purchasesCount: number): ConnectedClient['frequency'] {
  if (purchasesCount >= 12) return 'Semanal';
  if (purchasesCount >= 6) return 'Quincenal';
  if (purchasesCount >= 3) return 'Mensual';
  if (purchasesCount >= 1) return 'Ocasional';
  return '1ª Vez';
}

export function calculateIntentScore(purchasesCount: number, totalSpent: number, hasCart: boolean): number {
  let score = 25; // base
  if (purchasesCount > 0) score += Math.min(purchasesCount * 10, 35);
  if (totalSpent > 0) score += Math.min(Math.floor(totalSpent / 50) * 5, 25);
  if (hasCart) score += 15;
  return Math.min(score, 98);
}

interface RadarStore {
  clients: ConnectedClient[];
  channel: RealtimeChannel | null;
  dbChannel: RealtimeChannel | null;
  pollIntervalId: ReturnType<typeof setInterval> | null;
  initRadar: (
    user: { id: string; name?: string; email?: string } | null,
    city?: string,
    totalSpent?: number,
    purchasesCount?: number,
    currentSection?: string,
    hasCart?: boolean,
    cartItemsCount?: number
  ) => void;
  trackActivity: (
    user: { id: string; name?: string; email?: string } | null,
    city?: string,
    totalSpent?: number,
    purchasesCount?: number,
    currentSection?: string,
    hasCart?: boolean,
    cartItemsCount?: number
  ) => Promise<void>;
  fetchActiveClients: () => Promise<void>;
  cleanup: () => void;
}

/**
 * Reconciles current in-memory live clients with newly fetched background data.
 * Protects fresh WebSocket updates from being overwritten while immediately purging disconnected clients.
 */
function reconcileClients(currentList: ConnectedClient[], fetchedList: ConnectedClient[], presenceChannel?: RealtimeChannel | null): ConnectedClient[] {
  const now = Date.now();
  const map = new Map<string, ConnectedClient>();

  // Fetch active connected presence keys from WebSocket channel
  const activePresenceUserIds = new Set<string>();
  if (presenceChannel) {
    try {
      const presenceState = presenceChannel.presenceState();
      if (presenceState) {
        Object.values(presenceState).forEach((presences) => {
          if (Array.isArray(presences)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            presences.forEach((p: any) => {
              if (p?.id) activePresenceUserIds.add(p.id);
              if (p?.user_id) activePresenceUserIds.add(p.user_id);
            });
          }
        });
      }
    } catch {}
  }

  // 1. Safely merge newly fetched data from active_sessions
  for (const incoming of fetchedList) {
    if (
      incoming && 
      incoming.id && 
      !incoming.id.startsWith('vis_') && 
      !incoming.id.startsWith('guest_') && 
      !incoming.name?.toLowerCase().includes('visitante')
    ) {
      const existing = currentList.find(c => c.id === incoming.id);
      const cleanCity = (incoming.city && incoming.city.trim()) ? incoming.city : (existing?.city || '');
      const coords = resolveCoordinates(cleanCity);
      const parsedX = incoming.x !== null && incoming.x !== undefined ? Number(incoming.x) : NaN;
      const parsedY = incoming.y !== null && incoming.y !== undefined ? Number(incoming.y) : NaN;
      const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : (existing?.x ?? -100));
      const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : (existing?.y ?? -100));

      const isRecentLiveBroadcast = existing?.lastUpdated && (now - existing.lastUpdated < 6000);
      const sectionToUse = isRecentLiveBroadcast 
        ? existing.currentSection 
        : (incoming.currentSection || existing?.currentSection || 'Explorando Tienda');

      map.set(incoming.id, {
        ...(existing || {}),
        ...incoming,
        city: cleanCity,
        x: finalX,
        y: finalY,
        name: cleanClientName(incoming.name || existing?.name),
        currentSection: sectionToUse,
        hasCart: Boolean(isRecentLiveBroadcast ? existing?.hasCart : (incoming.hasCart !== undefined ? incoming.hasCart : existing?.hasCart)),
        cartItemsCount: Number(isRecentLiveBroadcast ? existing?.cartItemsCount : (incoming.cartItemsCount !== undefined ? incoming.cartItemsCount : existing?.cartItemsCount)) || 0,
        lastSeen: Math.max(existing?.lastSeen || 0, incoming.lastSeen || 0, now),
        lastUpdated: existing?.lastUpdated || now,
      });
    }
  }

  // 2. Retain un-fetched clients ONLY if they are active in presence OR have very recent WebSocket activity (<8s)
  for (const existing of currentList) {
    if (
      existing && 
      existing.id && 
      !map.has(existing.id) &&
      !existing.id.startsWith('vis_') && 
      !existing.id.startsWith('guest_') && 
      !existing.name?.toLowerCase().includes('visitante')
    ) {
      const isConnectedInPresence = activePresenceUserIds.has(existing.id);
      const isVeryFresh = existing.lastUpdated && (now - existing.lastUpdated < 8000);

      if (isConnectedInPresence || isVeryFresh) {
        map.set(existing.id, existing);
      }
    }
  }

  const result: ConnectedClient[] = [];
  map.forEach((client) => result.push(client));
  return result;
}

/**
 * Merge two client lists without duplicates, preferring the most up-to-date entry
 */
function mergeClientLists(listA: ConnectedClient[], listB: ConnectedClient[]): ConnectedClient[] {
  const now = Date.now();
  const map = new Map<string, ConnectedClient>();

  for (const c of listA) {
    if (
      c && 
      c.id && 
      !c.id.startsWith('vis_') && 
      !c.id.startsWith('guest_') && 
      !c.name?.toLowerCase().includes('visitante')
    ) {
      if (now - (c.lastSeen || now) < 35000) {
        map.set(c.id, c);
      }
    }
  }

  for (const c of listB) {
    if (
      c && 
      c.id && 
      !c.id.startsWith('vis_') && 
      !c.id.startsWith('guest_') && 
      !c.name?.toLowerCase().includes('visitante')
    ) {
      const existing = map.get(c.id);
      if (!existing) {
        const coords = resolveCoordinates(c.city);
        const parsedX = c.x !== null && c.x !== undefined ? Number(c.x) : NaN;
        const parsedY = c.y !== null && c.y !== undefined ? Number(c.y) : NaN;
        const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : -100);
        const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : -100);

        map.set(c.id, {
          ...c,
          name: cleanClientName(c.name),
          x: finalX,
          y: finalY,
          lastSeen: c.lastSeen || now,
          lastUpdated: c.lastUpdated || now,
        });
      } else {
        // Merge with newer info while protecting valid location coordinates
        const finalCity = (c.city && c.city.trim()) ? c.city : (existing.city || '');
        const coords = resolveCoordinates(finalCity);
        const parsedX = c.x !== null && c.x !== undefined ? Number(c.x) : NaN;
        const parsedY = c.y !== null && c.y !== undefined ? Number(c.y) : NaN;
        const hasIncomingCoords = !isNaN(parsedX) && parsedX >= 0;

        let finalX = existing.x;
        let finalY = existing.y;

        if (hasIncomingCoords) {
          finalX = parsedX;
          finalY = parsedY;
        } else if (coords.x >= 0) {
          finalX = coords.x;
          finalY = coords.y;
        } else if (typeof existing.x === 'number' && existing.x >= 0) {
          finalX = existing.x;
          finalY = existing.y;
        }

        map.set(c.id, {
          ...existing,
          ...c,
          city: finalCity,
          x: finalX,
          y: finalY,
          name: cleanClientName(c.name || existing.name),
          currentSection: c.currentSection || existing.currentSection,
          hasCart: c.hasCart !== undefined ? c.hasCart : existing.hasCart,
          cartItemsCount: c.cartItemsCount !== undefined ? c.cartItemsCount : existing.cartItemsCount,
          lastSeen: Math.max(existing.lastSeen || 0, c.lastSeen || 0, now),
          lastUpdated: Math.max(existing.lastUpdated || 0, c.lastUpdated || 0, now),
        });
      }
    }
  }
  const merged: ConnectedClient[] = [];
  map.forEach((client) => merged.push(client));
  return merged;
}

export const useRadarStore = create<RadarStore>((set, get) => ({
  clients: [],
  channel: null,
  dbChannel: null,
  pollIntervalId: null,

  cleanup: () => {
    const { channel, dbChannel, pollIntervalId } = get();
    if (channel) {
      supabase.removeChannel(channel);
    }
    if (dbChannel) {
      supabase.removeChannel(dbChannel);
    }
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
    }
    set({ channel: null, dbChannel: null, pollIntervalId: null });
  },

  fetchActiveClients: async () => {
    try {
      const res = await fetch('/api/radar/activity', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.clients)) {
          const activeChannel = get().channel;
          set((state) => ({
            clients: reconcileClients(state.clients, json.clients, activeChannel),
          }));
        }
      }
    } catch {
      // Network or offline fallback
    }
  },

  trackActivity: async (user, city = '', totalSpent = 0, purchasesCount = 0, currentSection = 'Explorando Tienda', hasCart = false, cartItemsCount = 0) => {
    if (!user?.id || user.id.startsWith('vis_') || user.id.startsWith('guest_') || user.name?.toLowerCase().includes('visitante')) return;

    const coords = resolveCoordinates(city);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
    const device: ConnectedClient['device'] = isMobile ? 'Celular' : isTablet ? 'Tablet' : 'Computador';
    const frequency = resolveFrequency(purchasesCount);
    const intentScore = calculateIntentScore(purchasesCount, totalSpent, hasCart);
    const cleanName = cleanClientName(user.name || user.email?.split('@')[0] || 'Cliente Lumina');
    const now = Date.now();

    const payload: ConnectedClient = {
      id: user.id,
      name: cleanName,
      email: user.email || '',
      city: city || '',
      country: 'Ecuador',
      x: coords.x,
      y: coords.y,
      frequency,
      purchasesCount: purchasesCount || 0,
      totalSpent: totalSpent || 0,
      currentSection,
      intentScore,
      device,
      hasCart,
      cartItemsCount: cartItemsCount || 0,
      isRealUser: true,
      isOnline: true,
      lastSeen: now,
      lastUpdated: now,
    };

    // Immediately reflect the current logged-in user in local clients so "Tú" is visible right away
    set((state) => ({
      clients: mergeClientLists(state.clients, [payload]),
    }));

    // Concurrently broadcast to Presence Channel, Server In-Memory/DB API, and Supabase Table
    const activeChannel = get().channel;
    const promises: Promise<unknown>[] = [];

    // 1. Send Instant Peer-to-Peer WebSocket Broadcast (<40ms latency) & Presence
    if (activeChannel) {
      promises.push(
        activeChannel.send({
          type: 'broadcast',
          event: 'activity',
          payload,
        }).catch(() => {})
      );
      promises.push(activeChannel.track(payload).catch(() => {}));
    }

    // 2. Send to /api/radar/activity (updates server memory + active_sessions DB)
    promises.push(
      fetch('/api/radar/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    );

    // 3. Directly update Supabase active_sessions table for immediate postgres_changes broadcast
    promises.push(
      (async () => {
        try {
          await supabase.from('active_sessions').upsert({
            user_id: payload.id,
            name: payload.name,
            email: payload.email,
            city: payload.city,
            country: 'Ecuador',
            x: payload.x,
            y: payload.y,
            current_section: payload.currentSection,
            is_online: true,
            has_cart: payload.hasCart,
            cart_items_count: payload.cartItemsCount,
            total_spent: payload.totalSpent,
            purchases_count: payload.purchasesCount,
            device: payload.device,
            last_seen: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        } catch {}
      })()
    );

    await Promise.allSettled(promises);
  },

  initRadar: (user, _city = '', _totalSpent = 0, _purchasesCount = 0, _currentSection = '', _hasCart = false, _cartItemsCount = 0) => {
    void _city; void _totalSpent; void _purchasesCount; void _currentSection; void _hasCart; void _cartItemsCount;
    if (!user?.id || user.id.startsWith('vis_') || user.id.startsWith('guest_')) return;

    let activeChannel = get().channel;
    let dbChan = get().dbChannel;

    // Initial fetch from activity endpoint
    get().fetchActiveClients();

    // Start calm 4-second auto-poll fallback to ensure real-time responsiveness without flooding
    if (!get().pollIntervalId) {
      const intervalId = setInterval(() => {
        get().fetchActiveClients();
      }, 2000);
      set({ pollIntervalId: intervalId });
    }

    // ── Setup Postgres Changes listener on active_sessions table ──
    if (!dbChan) {
      dbChan = supabase.channel('radar:db_changes');
      dbChan
        .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions' }, (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldUserId = (payload.old as { user_id?: string })?.user_id;
            if (oldUserId) {
              set((state) => ({
                clients: state.clients.filter((c) => c.id !== oldUserId),
              }));
            }
          } else if ((payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') && payload.new) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const row = payload.new as any;
            if (row.user_id && !row.user_id.startsWith('vis_') && !row.user_id.startsWith('guest_')) {
              if (row.is_online === false) {
                set((state) => ({
                  clients: state.clients.filter((c) => c.id !== row.user_id),
                }));
                return;
              }

              set((state) => {
                const now = Date.now();
                const idx = state.clients.findIndex((c) => c.id === row.user_id);
                const coords = resolveCoordinates(row.city || '');
                const purchases = Number(row.purchases_count) || 0;
                const spent = Number(row.total_spent) || 0;
                const hasCart = Boolean(row.has_cart);
                const parsedX = row.x !== null && row.x !== undefined ? Number(row.x) : NaN;
                const parsedY = row.y !== null && row.y !== undefined ? Number(row.y) : NaN;
                const existingClient = state.clients.find((c) => c.id === row.user_id);
                const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : (existingClient?.x ?? -100));
                const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : (existingClient?.y ?? -100));

                // Protect recent live WebSocket broadcast from being overwritten by delayed DB events
                const isRecentLive = existingClient?.lastUpdated && (now - existingClient.lastUpdated < 6000);
                const sectionToUse = isRecentLive 
                  ? existingClient.currentSection 
                  : (row.current_section || existingClient?.currentSection || 'Explorando Tienda');

                const updatedClient: ConnectedClient = {
                  id: row.user_id,
                  name: cleanClientName(row.name),
                  email: row.email || '',
                  city: row.city || '',
                  country: row.country || 'Ecuador',
                  x: finalX,
                  y: finalY,
                  frequency: resolveFrequency(purchases),
                  purchasesCount: purchases,
                  totalSpent: spent,
                  currentSection: sectionToUse,
                  intentScore: calculateIntentScore(purchases, spent, hasCart),
                  device: (row.device as ConnectedClient['device']) || 'Computador',
                  hasCart: isRecentLive ? existingClient.hasCart : hasCart,
                  cartItemsCount: isRecentLive ? existingClient.cartItemsCount : (Number(row.cart_items_count) || 0),
                  isRealUser: true,
                  lastSeen: now,
                  lastUpdated: existingClient?.lastUpdated || now,
                };
                if (idx >= 0) {
                  const next = [...state.clients];
                  next[idx] = { ...next[idx], ...updatedClient };
                  return { clients: next };
                } else {
                  return { clients: [...state.clients, updatedClient] };
                }
              });
            }
          }
        })
        .subscribe();
      set({ dbChannel: dbChan });
    }

    // ── Setup Realtime Broadcast & Presence channel ──
    if (!activeChannel) {
      activeChannel = supabase.channel('radar:clients', {
        config: {
          broadcast: { self: false },
        },
      });

      // Peer-to-peer instant broadcast for zero-latency tracking (<40ms)
      activeChannel
        .on('broadcast', { event: 'activity' }, ({ payload }) => {
          if (!payload || !payload.id || payload.id.startsWith('vis_') || payload.id.startsWith('guest_') || String(payload.name).toLowerCase().includes('visitante')) return;

          set((state) => {
            const now = Date.now();
            const cleanCity = payload.city || '';
            const coords = resolveCoordinates(cleanCity);
            const parsedX = payload.x !== null && payload.x !== undefined ? Number(payload.x) : NaN;
            const parsedY = payload.y !== null && payload.y !== undefined ? Number(payload.y) : NaN;
            const existingClient = state.clients.find((c) => c.id === payload.id);
            const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : (existingClient?.x ?? -100));
            const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : (existingClient?.y ?? -100));
            const purchases = Number(payload.purchasesCount) || 0;
            const spent = Number(payload.totalSpent) || 0;
            const hasCart = Boolean(payload.hasCart);

            const updatedClient: ConnectedClient = {
              id: payload.id,
              name: cleanClientName(payload.name),
              email: payload.email || '',
              city: cleanCity,
              country: payload.country || 'Ecuador',
              x: finalX,
              y: finalY,
              frequency: payload.frequency || resolveFrequency(purchases),
              purchasesCount: purchases,
              totalSpent: spent,
              currentSection: payload.currentSection || 'Explorando Tienda',
              intentScore: payload.intentScore || calculateIntentScore(purchases, spent, hasCart),
              device: (payload.device as ConnectedClient['device']) || 'Computador',
              hasCart,
              cartItemsCount: Number(payload.cartItemsCount) || 0,
              isRealUser: true,
              lastSeen: now,
              lastUpdated: now,
            };

            const idx = state.clients.findIndex((c) => c.id === payload.id);
            if (idx >= 0) {
              const next = [...state.clients];
              next[idx] = { ...next[idx], ...updatedClient };
              return { clients: next };
            } else {
              return { clients: [...state.clients, updatedClient] };
            }
          });
        })
        .on('broadcast', { event: 'offline' }, ({ payload }) => {
          if (payload?.id) {
            set((state) => ({
              clients: state.clients.filter((c) => c.id !== payload.id),
            }));
          }
        });

      activeChannel
        .on('presence', { event: 'sync' }, () => {
          get().fetchActiveClients();
        })
        .on('presence', { event: 'join' }, () => {
          get().fetchActiveClients();
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          if (Array.isArray(leftPresences)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const leftIds = new Set(leftPresences.map((p: any) => p.id || p.user_id).filter(Boolean));
            if (leftIds.size > 0) {
              set((state) => ({
                clients: state.clients.filter((c) => !leftIds.has(c.id)),
              }));
            }
          }
          get().fetchActiveClients();
        })
        .subscribe();

      set({ channel: activeChannel });
    }
  },
}));
