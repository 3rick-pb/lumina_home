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
 * Merge two client lists without duplicates, preferring the most up-to-date entry
 */
function mergeClientLists(listA: ConnectedClient[], listB: ConnectedClient[]): ConnectedClient[] {
  const map = new Map<string, ConnectedClient>();

  for (const c of listA) {
    if (
      c && 
      c.id && 
      !c.id.startsWith('vis_') && 
      !c.id.startsWith('guest_') && 
      !c.name?.toLowerCase().includes('visitante')
    ) {
      map.set(c.id, c);
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
        map.set(c.id, c);
      } else {
        // Merge with newer info while protecting valid location coordinates
        const hasIncomingCoords = typeof c.x === 'number' && c.x >= 0;
        const finalCity = (c.city && c.city.trim()) ? c.city : (existing.city || '');
        const finalX = (c.city && hasIncomingCoords) ? c.x : (existing.city && typeof existing.x === 'number' && existing.x >= 0 ? existing.x : c.x);
        const finalY = (c.city && hasIncomingCoords) ? c.y : (existing.city && typeof existing.y === 'number' && existing.y >= 0 ? existing.y : c.y);

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
          set((state) => {
            // Guard against momentary network glitches or empty responses wiping all pins
            if (json.clients.length === 0 && state.clients.length > 0) {
              return state;
            }
            return { clients: json.clients };
          });
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

    const payload = {
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
    };

    // Immediately reflect the current logged-in user in local clients so "Tú" is visible right away
    set((state) => ({
      clients: mergeClientLists(state.clients, [payload]),
    }));

    // Concurrently broadcast to Presence Channel, Server In-Memory/DB API, and Supabase Table
    const activeChannel = get().channel;
    const promises: Promise<unknown>[] = [];

    // 1. Send to Supabase Presence Channel
    if (activeChannel) {
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
      }, 4000);
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
                const idx = state.clients.findIndex((c) => c.id === row.user_id);
                const coords = resolveCoordinates(row.city || '');
                const purchases = Number(row.purchases_count) || 0;
                const spent = Number(row.total_spent) || 0;
                const hasCart = Boolean(row.has_cart);
                const updatedClient: ConnectedClient = {
                  id: row.user_id,
                  name: cleanClientName(row.name),
                  email: row.email || '',
                  city: row.city || '',
                  country: row.country || 'Ecuador',
                  x: typeof row.x === 'number' && Number(row.x) >= 0 ? Number(row.x) : coords.x,
                  y: typeof row.y === 'number' && Number(row.y) >= 0 ? Number(row.y) : coords.y,
                  frequency: resolveFrequency(purchases),
                  purchasesCount: purchases,
                  totalSpent: spent,
                  currentSection: row.current_section || 'Explorando Tienda',
                  intentScore: calculateIntentScore(purchases, spent, hasCart),
                  device: (row.device as ConnectedClient['device']) || 'Computador',
                  hasCart,
                  cartItemsCount: Number(row.cart_items_count) || 0,
                  isRealUser: true,
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

    // ── Setup Realtime Presence channel ──
    if (!activeChannel) {
      activeChannel = supabase.channel('radar:clients');

      const handlePresenceUpdate = () => {
        get().fetchActiveClients();
      };

      activeChannel
        .on('presence', { event: 'sync' }, handlePresenceUpdate)
        .on('presence', { event: 'join' }, handlePresenceUpdate)
        .on('presence', { event: 'leave' }, handlePresenceUpdate)
        .subscribe();

      set({ channel: activeChannel });
    }
  },
}));
