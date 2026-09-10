import { create } from 'zustand';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ConnectedClient {
  id: string; // user_id
  sessionId?: string;
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
  isAnonymous?: boolean;
  isOnline?: boolean;
  lastSeen?: number;
  lastUpdated?: number;
  activeSessionsCount?: number;
}

export const RADAR_CLIENT_TTL_MS = 60 * 1000; // 60s Enterprise TTL

const COMMON_FIRST_NAMES = [
  'alejandro', 'sebastian', 'valeria', 'fernando', 'gabriel', 'carlos', 
  'daniel', 'manuel', 'miguel', 'javier', 'erick', 'david', 'jorge', 
  'pedro', 'mateo', 'camila', 'paula', 'sofia', 'pablo', 'mario', 
  'maria', 'diego', 'luis', 'jose', 'juan', 'eric', 'ana'
];

/**
 * Normalizes names cleanly
 */
export const cleanClientName = (rawName?: string) => {
  if (!rawName) return "Cliente Lumina";
  let formatted = String(rawName).trim();
  formatted = formatted.replace(/[\._\-]+/g, ' ');
  formatted = formatted.replace(/([a-zñáéíóú])([A-ZÑÁÉÍÓÚ])/g, '$1 $2');
  formatted = formatted.replace(/([a-zA-ZáéíóúÁÉÍÓÚñÑ])([0-9])/g, '$1 $2');
  formatted = formatted.replace(/([0-9])([a-zA-ZáéíóúÁÉÍÓÚñÑ])/g, '$1 $2');
  formatted = formatted.replace(/([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])\s*(?:admin)\b/gi, '$1 ADMIN');
  if (!formatted.includes(' ')) {
    const lower = formatted.toLowerCase();
    for (const fn of COMMON_FIRST_NAMES) {
      if (lower.startsWith(fn) && lower.length > fn.length + 1) {
        formatted = formatted.slice(0, fn.length) + ' ' + formatted.slice(fn.length);
        break;
      }
    }
  }
  const words = formatted.replace(/\s+/g, ' ').trim().split(' ');
  return words.map(w => w.toUpperCase() === 'ADMIN' ? 'ADMIN' : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// ── Province coordinate lookup table ──
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
  // Costa
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

  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }

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
  let score = 25;
  if (purchasesCount > 0) score += Math.min(purchasesCount * 10, 35);
  if (totalSpent > 0) score += Math.min(Math.floor(totalSpent / 50) * 5, 25);
  if (hasCart) score += 15;
  return Math.min(score, 98);
}

const DEFAULT_ECUADOR_CITIES = ['Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Manta', 'Ambato', 'Loja', 'Puyo'];

/**
 * Extracts connected clients from Supabase Realtime presenceState.
 * Groups multi-session tabs for registered users and tracks anonymous visitors cleanly.
 */
export function parsePresenceState(state: Record<string, unknown>): ConnectedClient[] {
  const map = new Map<string, ConnectedClient>();
  const now = Date.now();

  for (const key of Object.keys(state)) {
    const presences = state[key] as unknown[];
    if (Array.isArray(presences)) {
      for (const raw of presences) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = raw as any;
        if (!p || !p.id) continue;

        const isAnon = Boolean(p.isAnonymous || p.id.startsWith('anon_') || p.id.startsWith('vis_') || p.id.startsWith('guest_') || !p.email);

        let cleanCity = (p.city && typeof p.city === 'string') ? p.city.trim() : '';
        if (!cleanCity && isAnon) {
          const charCodeSum = String(p.sessionId || p.id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
          cleanCity = DEFAULT_ECUADOR_CITIES[charCodeSum % DEFAULT_ECUADOR_CITIES.length];
        }

        const coords = resolveCoordinates(cleanCity);
        const parsedX = p.x !== null && p.x !== undefined ? Number(p.x) : NaN;
        const parsedY = p.y !== null && p.y !== undefined ? Number(p.y) : NaN;
        const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : 48.8);
        const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : 26.5);

        const purchases = Number(p.purchasesCount) || 0;
        const spent = Number(p.totalSpent) || 0;
        const hasCart = Boolean(p.hasCart);

        const clientKey = isAnon ? (p.sessionId || p.id) : p.id;
        const existing = map.get(clientKey);

        const clientObj: ConnectedClient = {
          id: p.id,
          sessionId: p.sessionId,
          name: isAnon ? 'Visitante Anónimo' : cleanClientName(p.name),
          email: isAnon ? '' : (p.email || ''),
          city: cleanCity || 'Ecuador',
          country: p.country || 'Ecuador',
          x: finalX,
          y: finalY,
          frequency: isAnon ? '1ª Vez' : (p.frequency || resolveFrequency(purchases)),
          purchasesCount: isAnon ? 0 : purchases,
          totalSpent: isAnon ? 0 : spent,
          currentSection: p.currentSection || 'Explorando Tienda',
          intentScore: isAnon ? 15 : (Number(p.intentScore) || calculateIntentScore(purchases, spent, hasCart)),
          device: (p.device as ConnectedClient['device']) || 'Computador',
          hasCart,
          cartItemsCount: Number(p.cartItemsCount) || 0,
          isRealUser: !isAnon,
          isAnonymous: isAnon,
          isOnline: true,
          lastSeen: Math.max(existing?.lastSeen || 0, p.lastSeen || now),
          lastUpdated: Math.max(existing?.lastUpdated || 0, p.lastUpdated || now),
          activeSessionsCount: (existing?.activeSessionsCount || 0) + 1,
        };

        map.set(clientKey, clientObj);
      }
    }
  }

  const result: ConnectedClient[] = [];
  map.forEach(c => result.push(c));
  return result;
}

// Track WebSocket connection readiness and pending broadcast queue
let channelSubscribed = false;
let pendingBroadcastQueue: Array<() => void> = [];

interface RadarStore {
  clients: ConnectedClient[];
  channel: RealtimeChannel | null;
  pollIntervalId: ReturnType<typeof setInterval> | null;
  initRadar: (
    user?: { id: string; name?: string; email?: string } | null,
    sessionId?: string
  ) => RealtimeChannel | null;
  trackActivity: (
    user: { id: string; name?: string; email?: string } | null,
    city?: string,
    totalSpent?: number,
    purchasesCount?: number,
    currentSection?: string,
    hasCart?: boolean,
    cartItemsCount?: number,
    isOnline?: boolean,
    sessionId?: string,
    allSessions?: boolean
  ) => Promise<void>;
  fetchActiveClients: () => Promise<void>;
  cleanup: () => void;
}

export const useRadarStore = create<RadarStore>((set, get) => ({
  clients: [],
  channel: null,
  pollIntervalId: null,

  cleanup: () => {
    const { channel } = get();
    channelSubscribed = false;
    pendingBroadcastQueue = [];
    if (channel) {
      supabase.removeChannel(channel);
    }
    set({ channel: null, pollIntervalId: null });
  },

  fetchActiveClients: async () => {
    const chan = get().channel;
    if (chan) {
      const presenceState = chan.presenceState();
      const presenceClients = parsePresenceState(presenceState);
      if (presenceClients.length > 0) {
        set({ clients: presenceClients });
      }
    }
  },

  trackActivity: async (
    user,
    city = '',
    totalSpent = 0,
    purchasesCount = 0,
    currentSection = 'Explorando Tienda',
    hasCart = false,
    cartItemsCount = 0,
    isOnline = true,
    sessionId,
    allSessions = false
  ) => {
    void allSessions;
    let activeChannel = get().channel;
    if (!activeChannel) {
      activeChannel = get().initRadar(user, sessionId);
    }

    const clientId = user?.id || `anon_${sessionId || 'tab'}`;
    const isAnon = !user?.id;

    // ── Handle Offline Transition ──
    if (isOnline === false) {
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== clientId && c.sessionId !== sessionId),
      }));

      if (activeChannel) {
        try {
          await activeChannel.send({
            type: 'broadcast',
            event: 'offline',
            payload: { id: clientId, sessionId },
          });
          await activeChannel.untrack();
        } catch {}
      }
      return;
    }

    // ── Handle Online Presence ──
    let cleanCity = (city && typeof city === 'string') ? city.trim() : '';
    if (!cleanCity && isAnon) {
      const charCodeSum = String(sessionId || clientId).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      cleanCity = DEFAULT_ECUADOR_CITIES[charCodeSum % DEFAULT_ECUADOR_CITIES.length];
    }
    const coords = resolveCoordinates(cleanCity);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
    const device: ConnectedClient['device'] = isMobile ? 'Celular' : isTablet ? 'Tablet' : 'Computador';
    const now = Date.now();

    const payload: ConnectedClient = {
      id: clientId,
      sessionId,
      name: isAnon ? 'Visitante Anónimo' : cleanClientName(user?.name || user?.email?.split('@')[0] || 'Cliente Lumina'),
      email: isAnon ? '' : (user?.email || ''),
      city: cleanCity || 'Ecuador',
      country: 'Ecuador',
      x: coords.x >= 0 ? coords.x : 48.8,
      y: coords.y >= 0 ? coords.y : 26.5,
      frequency: isAnon ? '1ª Vez' : resolveFrequency(purchasesCount),
      purchasesCount: isAnon ? 0 : purchasesCount,
      totalSpent: isAnon ? 0 : totalSpent,
      currentSection,
      intentScore: isAnon ? 15 : calculateIntentScore(purchasesCount, totalSpent, hasCart),
      device,
      hasCart,
      cartItemsCount,
      isRealUser: !isAnon,
      isAnonymous: isAnon,
      isOnline: true,
      lastSeen: now,
      lastUpdated: now,
    };

    const dispatchRealtime = () => {
      const chan = get().channel;
      if (chan) {
        chan.send({
          type: 'broadcast',
          event: 'activity',
          payload,
        }).catch(() => {});
        chan.track(payload).catch(() => {});
      }
    };

    if (activeChannel && channelSubscribed) {
      dispatchRealtime();
    } else {
      pendingBroadcastQueue.push(dispatchRealtime);
    }
  },

  initRadar: (user, sessionId) => {
    let activeChannel = get().channel;

    if (!activeChannel) {
      const presenceKey = sessionId || (user?.id ? user.id : `anon_${Date.now()}`);

      activeChannel = supabase.channel('radar:clients', {
        config: {
          broadcast: { self: false },
          presence: { key: presenceKey },
        },
      });

      // 1. Peer-to-peer instant broadcast for zero-latency tracking (<40ms)
      activeChannel
        .on('broadcast', { event: 'activity' }, ({ payload }) => {
          if (!payload || !payload.id) return;

          set((state) => {
            const now = Date.now();
            const cleanCity = payload.city || '';
            const coords = resolveCoordinates(cleanCity);
            const parsedX = payload.x !== null && payload.x !== undefined ? Number(payload.x) : NaN;
            const parsedY = payload.y !== null && payload.y !== undefined ? Number(payload.y) : NaN;
            const existingClient = state.clients.find((c) => c.id === payload.id);
            const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : (existingClient?.x ?? 48.8));
            const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : (existingClient?.y ?? 26.5));
            const isAnon = Boolean(payload.isAnonymous || !payload.email || payload.id.startsWith('anon_'));

            const updatedClient: ConnectedClient = {
              id: payload.id,
              sessionId: payload.sessionId,
              name: isAnon ? 'Visitante Anónimo' : cleanClientName(payload.name),
              email: isAnon ? '' : (payload.email || ''),
              city: cleanCity || 'Ecuador',
              country: payload.country || 'Ecuador',
              x: finalX,
              y: finalY,
              frequency: isAnon ? '1ª Vez' : (payload.frequency || resolveFrequency(payload.purchasesCount || 0)),
              purchasesCount: isAnon ? 0 : (Number(payload.purchasesCount) || 0),
              totalSpent: isAnon ? 0 : (Number(payload.totalSpent) || 0),
              currentSection: payload.currentSection || 'Explorando Tienda',
              intentScore: isAnon ? 15 : (payload.intentScore || 25),
              device: (payload.device as ConnectedClient['device']) || 'Computador',
              hasCart: Boolean(payload.hasCart),
              cartItemsCount: Number(payload.cartItemsCount) || 0,
              isRealUser: !isAnon,
              isAnonymous: isAnon,
              lastSeen: now,
              lastUpdated: now,
              isOnline: true,
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
              clients: state.clients.filter((c) => c.id !== payload.id && c.sessionId !== payload.sessionId),
            }));
          }
        });

      // 2. Pure Supabase Realtime Presence Synchronizer (reactive, zero-polling)
      const updatePresenceClients = () => {
        if (!activeChannel) return;
        const presenceState = activeChannel.presenceState();
        const clients = parsePresenceState(presenceState);
        set({ clients });
      };

      activeChannel
        .on('presence', { event: 'sync' }, updatePresenceClients)
        .on('presence', { event: 'join' }, updatePresenceClients)
        .on('presence', { event: 'leave' }, updatePresenceClients);

      // 3. Connect & flush pending queue
      activeChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelSubscribed = true;
          while (pendingBroadcastQueue.length > 0) {
            const fn = pendingBroadcastQueue.shift();
            fn?.();
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          channelSubscribed = false;
        }
      });

      set({ channel: activeChannel });
    }

    return activeChannel;
  },
}));
