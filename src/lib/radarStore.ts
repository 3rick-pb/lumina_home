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
  'erick', 'eric', 'juan', 'carlos', 'luis', 'jose', 'maria', 'ana', 
  'diego', 'david', 'jorge', 'pedro', 'valeria', 'fernando', 'andres', 
  'gabriel', 'mateo', 'sebastian', 'camila', 'paula', 'sofia', 'daniel', 
  'alejandro', 'manuel', 'miguel', 'angel', 'javier', 'pablo', 'mario'
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
  let formatted = rawName.trim();
  // 1. Replace periods, underscores, dashes with space
  formatted = formatted.replace(/[\._\-]+/g, ' ');
  // 2. Separate lowercase letter followed by uppercase letter (camelCase: ErickArteaga -> Erick Arteaga, ErickADMIN -> Erick ADMIN)
  formatted = formatted.replace(/([a-zñáéíóú])([A-ZÑÁÉÍÓÚ])/g, '$1 $2');
  // 3. Separate number followed by letter or letter followed by number
  formatted = formatted.replace(/([a-zA-ZáéíóúÁÉÍÓÚñÑ])([0-9])/g, '$1 $2');
  // 4. Separate and normalize any variation of ADMIN glued to letters/numbers
  formatted = formatted.replace(/([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])\s*(?:admin)\b/gi, '$1 ADMIN');
  // 5. If still a single continuous lowercase word without spaces, split if it starts with a common first name
  if (!formatted.includes(' ')) {
    const lower = formatted.toLowerCase();
    for (const fn of COMMON_FIRST_NAMES) {
      if (lower.startsWith(fn) && lower.length > fn.length + 2) {
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
  const fallback = { x: 48.8, y: 26.5 }; // Quito default
  if (!city) return fallback;

  const normalized = city.toLowerCase().trim();

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

  return fallback;
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

function parsePresenceState(channel: RealtimeChannel | null): ConnectedClient[] {
  if (!channel) return [];
  try {
    const newState = channel.presenceState() || {};
    const clientList: ConnectedClient[] = [];

    for (const key in newState) {
      const presenceArr = newState[key] as unknown[];
      if (presenceArr && presenceArr.length > 0) {
        const clientData = presenceArr[0] as ConnectedClient;
        if (clientData && clientData.id) {
          clientList.push(clientData);
        }
      }
    }
    return clientList;
  } catch {
    return [];
  }
}

/**
 * Merge two client lists without duplicates, preferring the most up-to-date entry
 */
function mergeClientLists(listA: ConnectedClient[], listB: ConnectedClient[]): ConnectedClient[] {
  const map = new Map<string, ConnectedClient>();

  for (const c of listA) {
    if (c && c.id) map.set(c.id, c);
  }

  for (const c of listB) {
    if (c && c.id) {
      const existing = map.get(c.id);
      if (!existing) {
        map.set(c.id, c);
      } else {
        // Merge with newer info
        map.set(c.id, {
          ...existing,
          ...c,
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
          const currentPresenceClients = parsePresenceState(get().channel);
          const merged = mergeClientLists(currentPresenceClients, json.clients);
          set({ clients: merged });
        }
      }
    } catch {
      // Network or offline fallback
    }
  },

  trackActivity: async (user, city = 'Quito', totalSpent = 0, purchasesCount = 0, currentSection = 'Explorando Tienda', hasCart = false, cartItemsCount = 0) => {
    if (!user?.id) return;

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
      city: city || 'Quito',
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

    // 1. Send to Supabase Presence Channel
    const activeChannel = get().channel;
    if (activeChannel) {
      try {
        await activeChannel.track(payload);
      } catch {
        // Retry or fallback
      }
    }

    // 2. Send to /api/radar/activity (which updates server memory + Supabase active_sessions DB)
    try {
      await fetch('/api/radar/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Offline fallback
    }

    // 3. Directly update Supabase active_sessions table for immediate postgres_changes broadcast
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
    } catch {
      // Table may not exist yet
    }
  },

  initRadar: (user, city = 'Quito', totalSpent = 0, purchasesCount = 0, currentSection = 'Explorando Tienda', hasCart = false, cartItemsCount = 0) => {
    let activeChannel = get().channel;
    let dbChan = get().dbChannel;

    // Initial fetch from activity endpoint
    get().fetchActiveClients();

    // Start 1.8-second auto-poll fallback to ensure real-time responsiveness under any network condition
    if (!get().pollIntervalId) {
      const intervalId = setInterval(() => {
        get().fetchActiveClients();
      }, 1800);
      set({ pollIntervalId: intervalId });
    }

    // ── Setup Postgres Changes listener on active_sessions table ──
    if (!dbChan) {
      dbChan = supabase.channel('radar:db_changes');
      dbChan
        .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions' }, () => {
          // Re-fetch immediately when any database row is inserted/updated/deleted
          get().fetchActiveClients();
        })
        .subscribe();
      set({ dbChannel: dbChan });
    }

    // ── Setup Realtime Presence channel ──
    if (!activeChannel) {
      activeChannel = supabase.channel('radar:clients');

      const handlePresenceUpdate = () => {
        const presenceList = parsePresenceState(activeChannel);
        // Merge with existing clients
        set((state) => ({
          clients: mergeClientLists(state.clients, presenceList),
        }));
      };

      activeChannel
        .on('presence', { event: 'sync' }, handlePresenceUpdate)
        .on('presence', { event: 'join' }, handlePresenceUpdate)
        .on('presence', { event: 'leave' }, handlePresenceUpdate)
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && user?.id) {
            get().trackActivity(user, city, totalSpent, purchasesCount, currentSection, hasCart, cartItemsCount);
          }
        });

      set({ channel: activeChannel });
    } else if (user?.id) {
      get().trackActivity(user, city, totalSpent, purchasesCount, currentSection, hasCart, cartItemsCount);
    }
  },
}));
