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
  frequency: "Semanal" | "Quincenal" | "Mensual" | "Ocasional" | "Primera vez";
  purchasesCount: number;
  totalSpent: number;
  currentSection: string;
  intentScore: number;
  device: "Computador" | "Celular" | "Tablet";
  hasCart: boolean;
  cartItemsCount?: number;
  isRealUser?: boolean;
}

export const cleanClientName = (rawName?: string) => {
  if (!rawName) return "Cliente Lumina";
  const formatted = rawName.trim().replace(/([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])ADMIN\b/g, '$1 ADMIN').trim();
  return formatted;
};

// ── Province coordinate lookup table (mirrors AnalyticsRadarView) ──
// Maps lowercase city/province names to calibrated x/y map percentages
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
  "guayaquil": { x: 29.5, y: 53.5 },
  "guayas": { x: 29.5, y: 53.5 },
  "manta": { x: 21.0, y: 39.5 },
  "portoviejo": { x: 24.5, y: 41.0 },
  "manabi": { x: 24.5, y: 41.0 },
  "santo domingo": { x: 41.0, y: 29.5 },
  "machala": { x: 27.5, y: 69.5 },
  "el oro": { x: 27.5, y: 69.5 },
  "esmeraldas": { x: 38.0, y: 12.0 },
  "santa elena": { x: 19.5, y: 52.0 },
  "salinas": { x: 17.5, y: 53.5 },
  "babahoyo": { x: 34.0, y: 49.0 },
  "los rios": { x: 34.0, y: 49.0 },
  // Galápagos
  "galapagos": { x: 10.0, y: 22.0 },
  "baquerizo moreno": { x: 10.0, y: 22.0 },
  "santa cruz": { x: 9.0, y: 21.0 },
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
  "macas": { x: 61.0, y: 61.0 },
  "morona santiago": { x: 61.0, y: 61.0 },
  "zamora": { x: 48.0, y: 83.0 },
  "zamora chinchipe": { x: 48.0, y: 83.0 },
};

/**
 * Resolve city string to calibrated x/y map coordinates.
 * Tries exact match first, then partial substring match.
 * Falls back to Quito coordinates if no match found.
 */
function resolveCoordinates(city?: string): { x: number; y: number } {
  const fallback = { x: 48.8, y: 26.5 }; // Quito default
  if (!city) return fallback;

  const normalized = city.toLowerCase().trim();

  // 1. Exact match
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }

  // 2. Partial match: check if the city string contains any known key
  for (const key of Object.keys(CITY_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return CITY_COORDINATES[key];
    }
  }

  return fallback;
}

/**
 * Calculate a simple purchase frequency label from the purchase count.
 */
function resolveFrequency(purchasesCount: number): ConnectedClient['frequency'] {
  if (purchasesCount >= 12) return 'Semanal';
  if (purchasesCount >= 6) return 'Quincenal';
  if (purchasesCount >= 3) return 'Mensual';
  if (purchasesCount >= 1) return 'Ocasional';
  return 'Primera vez';
}

/**
 * Calculate a basic intent score (0-100) from user behavior signals.
 */
function calculateIntentScore(purchasesCount: number, totalSpent: number, hasCart: boolean): number {
  let score = 10; // base
  if (purchasesCount > 0) score += Math.min(purchasesCount * 8, 40);
  if (totalSpent > 0) score += Math.min(Math.floor(totalSpent / 50) * 5, 30);
  if (hasCart) score += 20;
  return Math.min(score, 100);
}

interface RadarStore {
  clients: ConnectedClient[];
  channel: RealtimeChannel | null;
  initRadar: (
    user: { id: string; name?: string; email?: string } | null,
    city?: string,
    totalSpent?: number,
    purchasesCount?: number,
    currentSection?: string
  ) => void;
  cleanup: () => void;
}

/**
 * Parse presence state into a ConnectedClient array.
 * Used by sync, join, and leave handlers to keep a single source of truth.
 */
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
    console.error('Error parsing presence state');
    return [];
  }
}

export const useRadarStore = create<RadarStore>((set, get) => ({
  clients: [],
  channel: null,

  cleanup: () => {
    const ch = get().channel;
    if (ch) {
      supabase.removeChannel(ch);
      set({ channel: null, clients: [] });
    }
  },

  initRadar: (user, city = 'Quito', totalSpent = 0, purchasesCount = 0, currentSection = 'Explorando Tienda') => {
    let activeChannel = get().channel;

    // ── Resolve dynamic coordinates from city ──
    const coords = resolveCoordinates(city);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
    const device: ConnectedClient['device'] = isMobile ? 'Celular' : isTablet ? 'Tablet' : 'Computador';
    const frequency = resolveFrequency(purchasesCount);
    const intentScore = calculateIntentScore(purchasesCount, totalSpent, false);

    const trackPayload = {
      id: user?.id || '',
      name: cleanClientName(user?.name || user?.email?.split('@')[0] || 'Cliente Lumina'),
      email: user?.email || '',
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
      hasCart: false,
      cartItemsCount: 0,
      isRealUser: true,
    };

    if (!activeChannel) {
      activeChannel = supabase.channel('radar:clients');

      activeChannel
        // ── SYNC: Full state reconciliation (fires on initial load + any change) ──
        .on('presence', { event: 'sync' }, () => {
          const clientList = parsePresenceState(activeChannel);
          set({ clients: clientList });
        })
        // ── JOIN: New client connected — immediate reactivity ──
        .on('presence', { event: 'join' }, () => {
          const clientList = parsePresenceState(activeChannel);
          set({ clients: clientList });
        })
        // ── LEAVE: Client disconnected — immediate reactivity ──
        .on('presence', { event: 'leave' }, () => {
          const clientList = parsePresenceState(activeChannel);
          set({ clients: clientList });
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && user?.id) {
            try {
              await activeChannel?.track(trackPayload);
            } catch (trackErr) {
              console.error('Error tracking user presence:', trackErr);
            }
          }
        });

      set({ channel: activeChannel });
    } else if (user?.id) {
      // Channel already exists — just update the track payload (re-track with new data)
      activeChannel.track(trackPayload).catch(() => {});
    }
  },
}));
