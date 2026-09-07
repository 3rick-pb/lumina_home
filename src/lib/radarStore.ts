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

/**
 * Extracts connected clients from Supabase Realtime presenceState
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
        if (!p || !p.id || p.id.startsWith('vis_') || p.id.startsWith('guest_') || String(p.name).toLowerCase().includes('visitante')) {
          continue;
        }
        const cleanCity = p.city || '';
        const coords = resolveCoordinates(cleanCity);
        const parsedX = p.x !== null && p.x !== undefined ? Number(p.x) : NaN;
        const parsedY = p.y !== null && p.y !== undefined ? Number(p.y) : NaN;
        const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : -100);
        const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : -100);
        const purchases = Number(p.purchasesCount) || 0;
        const spent = Number(p.totalSpent) || 0;
        const hasCart = Boolean(p.hasCart);

        map.set(p.id, {
          id: p.id,
          sessionId: p.sessionId,
          name: cleanClientName(p.name),
          email: p.email || '',
          city: cleanCity,
          country: p.country || 'Ecuador',
          x: finalX,
          y: finalY,
          frequency: p.frequency || resolveFrequency(purchases),
          purchasesCount: purchases,
          totalSpent: spent,
          currentSection: p.currentSection || 'Explorando Tienda',
          intentScore: Number(p.intentScore) || calculateIntentScore(purchases, spent, hasCart),
          device: (p.device as ConnectedClient['device']) || 'Computador',
          hasCart,
          cartItemsCount: Number(p.cartItemsCount) || 0,
          isRealUser: true,
          isOnline: true,
          lastSeen: p.lastSeen || now,
          lastUpdated: p.lastUpdated || now,
        });
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
    user: { id: string; name?: string; email?: string } | null,
    city?: string,
    totalSpent?: number,
    purchasesCount?: number,
    currentSection?: string,
    hasCart?: boolean,
    cartItemsCount?: number,
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

/**
 * Reconciles current in-memory live clients with newly fetched background data.
 */
function reconcileClients(currentList: ConnectedClient[], fetchedList: ConnectedClient[]): ConnectedClient[] {
  const now = Date.now();
  const map = new Map<string, ConnectedClient>();

  // 1. Index fetched clients from backend
  for (const incoming of fetchedList) {
    if (
      incoming && 
      incoming.id && 
      !incoming.id.startsWith('vis_') && 
      !incoming.id.startsWith('guest_') && 
      !incoming.name?.toLowerCase().includes('visitante') &&
      incoming.isOnline !== false
    ) {
      const existing = currentList.find(c => c.id === incoming.id);
      const cleanCity = (incoming.city && incoming.city.trim()) ? incoming.city : (existing?.city || '');
      const coords = resolveCoordinates(cleanCity);
      const parsedX = incoming.x !== null && incoming.x !== undefined ? Number(incoming.x) : NaN;
      const parsedY = incoming.y !== null && incoming.y !== undefined ? Number(incoming.y) : NaN;
      const finalX = !isNaN(parsedX) && parsedX >= 0 ? parsedX : (coords.x >= 0 ? coords.x : (existing?.x ?? -100));
      const finalY = !isNaN(parsedY) && parsedY >= 0 ? parsedY : (coords.y >= 0 ? coords.y : (existing?.y ?? -100));

      // If existing had a very fresh WebSocket broadcast (<4s), preserve section to prevent race conditions
      const isVeryFreshLiveBroadcast = existing?.lastUpdated && (now - existing.lastUpdated < 4000);
      const sectionToUse = isVeryFreshLiveBroadcast 
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
        hasCart: Boolean(isVeryFreshLiveBroadcast ? existing?.hasCart : (incoming.hasCart !== undefined ? incoming.hasCart : existing?.hasCart)),
        cartItemsCount: Number(isVeryFreshLiveBroadcast ? existing?.cartItemsCount : (incoming.cartItemsCount !== undefined ? incoming.cartItemsCount : existing?.cartItemsCount)) || 0,
        lastSeen: Math.max(existing?.lastSeen || 0, incoming.lastSeen || 0, now),
        lastUpdated: existing?.lastUpdated || now,
        isOnline: true,
      });
    }
  }

  // 2. Retain existing active clients that haven't expired within the 60s TTL
  for (const existing of currentList) {
    if (
      existing && 
      existing.id && 
      !map.has(existing.id) &&
      !existing.id.startsWith('vis_') && 
      !existing.id.startsWith('guest_') && 
      !existing.name?.toLowerCase().includes('visitante') &&
      existing.isOnline !== false
    ) {
      const timeSinceLastSeen = now - (existing.lastSeen || existing.lastUpdated || 0);
      if (timeSinceLastSeen < RADAR_CLIENT_TTL_MS) {
        map.set(existing.id, existing);
      }
    }
  }

  const result: ConnectedClient[] = [];
  map.forEach((client) => result.push(client));
  return result;
}

/**
 * Merge two client lists without duplicates, preserving newer live timestamps and valid coordinates
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
      !c.name?.toLowerCase().includes('visitante') &&
      c.isOnline !== false
    ) {
      if (now - (c.lastSeen || c.lastUpdated || now) < RADAR_CLIENT_TTL_MS) {
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
      !c.name?.toLowerCase().includes('visitante') &&
      c.isOnline !== false
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
          isOnline: true,
        });
      } else {
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
          isOnline: true,
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
  pollIntervalId: null,

  cleanup: () => {
    const { channel, pollIntervalId } = get();
    channelSubscribed = false;
    pendingBroadcastQueue = [];
    if (channel) {
      supabase.removeChannel(channel);
    }
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
    }
    set({ channel: null, pollIntervalId: null });
  },

  fetchActiveClients: async () => {
    try {
      const res = await fetch('/api/radar/activity', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.clients)) {
          set((state) => ({
            clients: reconcileClients(state.clients, json.clients),
          }));
        }
      }
    } catch {
      // Network fallback
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
    if (!user?.id || user.id.startsWith('vis_') || user.id.startsWith('guest_') || user.name?.toLowerCase().includes('visitante')) return;

    // Self-heal: ensure channel is initialized
    let activeChannel = get().channel;
    if (!activeChannel) {
      activeChannel = get().initRadar(user, city, totalSpent, purchasesCount, currentSection, hasCart, cartItemsCount, sessionId);
    }

    // ── Handle Offline Transition ──
    if (isOnline === false) {
      if (allSessions) {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== user.id),
        }));
      }

      const offlinePromises: Promise<unknown>[] = [];

      if (activeChannel) {
        offlinePromises.push(
          activeChannel.send({
            type: 'broadcast',
            event: 'offline',
            payload: { id: user.id, sessionId, allSessions },
          }).catch(() => {})
        );
        offlinePromises.push(activeChannel.untrack().catch(() => {}));
      }

      offlinePromises.push(
        fetch('/api/radar/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, sessionId, isOnline: false, allSessions }),
          keepalive: true,
        }).catch(() => {})
      );

      if (allSessions) {
        offlinePromises.push(
          (async () => {
            try {
              await supabase.from('active_sessions').update({ is_online: false }).eq('user_id', user.id);
              await supabase.from('active_sessions').delete().eq('user_id', user.id);
            } catch {}
          })()
        );
      }

      await Promise.allSettled(offlinePromises);
      return;
    }

    // ── Handle Online Heartbeat / Navigation ──
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
      sessionId,
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

    // Immediately reflect in local state
    set((state) => ({
      clients: mergeClientLists(state.clients, [payload]),
    }));

    // 1. Send Peer-to-Peer WebSocket Broadcast & update Presence cluster
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

    // 2. Send to /api/radar/activity (updates server multi-session cache + DB)
    fetch('/api/radar/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  },

  initRadar: (user, _city = '', _totalSpent = 0, _purchasesCount = 0, _currentSection = '', _hasCart = false, _cartItemsCount = 0, sessionId) => {
    void _city; void _totalSpent; void _purchasesCount; void _currentSection; void _hasCart; void _cartItemsCount; void sessionId;
    if (!user?.id || user.id.startsWith('vis_') || user.id.startsWith('guest_')) return null;

    let activeChannel = get().channel;

    // Initial fetch from activity endpoint
    get().fetchActiveClients();

    // Unified 5-second maintenance cycle: purges expired clients (>60s TTL) and syncs from backend
    if (!get().pollIntervalId) {
      const intervalId = setInterval(() => {
        const now = Date.now();
        set((state) => {
          const activeOnly = state.clients.filter((c) => {
            if (c.isOnline === false) return false;
            const idle = now - (c.lastSeen || c.lastUpdated || now);
            return idle < RADAR_CLIENT_TTL_MS;
          });
          if (activeOnly.length !== state.clients.length) {
            return { clients: activeOnly };
          }
          return state;
        });

        get().fetchActiveClients();
      }, 5000);
      set({ pollIntervalId: intervalId });
    }

    // ── Setup Realtime Broadcast & Presence channel ──
    if (!activeChannel) {
      activeChannel = supabase.channel('radar:clients', {
        config: {
          broadcast: { self: false },
          presence: { key: user.id },
        },
      });

      // 1. Peer-to-peer instant broadcast for zero-latency tracking (<40ms)
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
              sessionId: payload.sessionId,
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
          if (payload?.id && payload?.allSessions) {
            set((state) => ({
              clients: state.clients.filter((c) => c.id !== payload.id),
            }));
          }
        });

      // 2. Global Presence Synchronization (Discovers all online clients across all browsers without page reload)
      activeChannel
        .on('presence', { event: 'sync' }, () => {
          if (!activeChannel) return;
          const presenceState = activeChannel.presenceState();
          const presenceClients = parsePresenceState(presenceState);
          if (presenceClients.length > 0) {
            set((state) => ({
              clients: mergeClientLists(state.clients, presenceClients),
            }));
          }
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          if (Array.isArray(newPresences) && newPresences.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const joinedClients = parsePresenceState({ join: newPresences } as any);
            if (joinedClients.length > 0) {
              set((state) => ({
                clients: mergeClientLists(state.clients, joinedClients),
              }));
            }
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          if (Array.isArray(leftPresences) && leftPresences.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const leftIds = new Set(leftPresences.map((p: any) => p.id).filter(Boolean));
            if (leftIds.size > 0) {
              set((state) => ({
                clients: state.clients.filter(c => !leftIds.has(c.id)),
              }));
            }
          }
        });

      // 3. Connect & flush pending queue once subscribed
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
