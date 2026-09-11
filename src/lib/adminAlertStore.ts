import { create } from 'zustand';
import { supabase } from './supabase';

export type AlertPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type AlertLayout = 'flight_route' | 'stacked_ticket' | 'split_capsule' | 'bento_grid';
export type AlertToastType = 'action' | 'success' | 'info';

export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  textColor: string;
  subtextColor: string;
  accentColor: string;
  isLight: boolean;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'white_clean',
    name: 'Blanco Puro (Predeterminado)',
    description: 'Fondo blanco con tipografía oscura profunda y máxima legibilidad',
    bgColor: '#ffffff',
    textColor: '#0a0a0a',
    subtextColor: '#4b5563',
    accentColor: '#0f172a',
    isLight: true,
  },
  {
    id: 'dark_graphite',
    name: 'Negro Grafito',
    description: 'Fondo oscuro refinado con tipografía blanca y alta visibilidad',
    bgColor: '#121214',
    textColor: '#ffffff',
    subtextColor: '#9ca3af',
    accentColor: '#3b82f6',
    isLight: false,
  },
  {
    id: 'lumina_studio',
    name: 'Lumina Studio',
    description: 'Oliva atelier nocturno con acentos esmeralda de autor',
    bgColor: '#1b1e17',
    textColor: '#f4f5f0',
    subtextColor: '#a8af8e',
    accentColor: '#10b981',
    isLight: false,
  },
  {
    id: 'glacier_ice',
    name: 'Nieve Glaciar',
    description: 'Marfil frío suave con contrastes en azul cobalto',
    bgColor: '#f8fafc',
    textColor: '#0f172a',
    subtextColor: '#64748b',
    accentColor: '#2563eb',
    isLight: true,
  },
  {
    id: 'emerald_deep',
    name: 'Esmeralda',
    description: 'Verde botánico oscuro con acentos luminosos en verde menta',
    bgColor: '#061a12',
    textColor: '#ffffff',
    subtextColor: '#6ee7b7',
    accentColor: '#10b981',
    isLight: false,
  },
  {
    id: 'royal_sapphire',
    name: 'Zafiro',
    description: 'Azul cobalto profundo con acentos en azul celeste',
    bgColor: '#0a1128',
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#38bdf8',
    isLight: false,
  },
];

export interface LayoutOption {
  id: AlertLayout;
  title: string;
  badge: string;
  description: string;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: 'flight_route',
    title: 'Ruta de Despacho',
    badge: 'Con Trayectoria',
    description: 'Arco curvo con paquete animado en tránsito, datos en pila y ficha asimétrica',
  },
  {
    id: 'stacked_ticket',
    title: 'Ficha Escalonada',
    badge: 'Desglose Segmentado',
    description: 'Ticket vertical con corte perforado, imagen de producto y comprador',
  },
  {
    id: 'split_capsule',
    title: 'Cápsula Dividida',
    badge: 'Compacta Dúo',
    description: 'Formato horizontal segmentado con cliente a la izquierda y producto a la derecha',
  },
  {
    id: 'bento_grid',
    title: 'Bento Modular',
    badge: 'Cuadrícula 2x2',
    description: 'Cuatro cuadrantes organizados con cliente, precio, producto y acción directa',
  },
];

export const DURATION_OPTIONS = [
  { ms: 4000, label: '4s (Rápido)' },
  { ms: 6000, label: '6s (Estándar)' },
  { ms: 10000, label: '10s (Extendido)' },
  { ms: 15000, label: '15s (Fijo)' },
];

export interface CartAlertConfig {
  position: AlertPosition;
  layout: AlertLayout;
  presetId: string;
  bgColor: string;
  textColor: string;
  subtextColor: string;
  accentColor: string;
  title: string;
  duration: number; // ms
  soundEnabled: boolean;
  toastType: AlertToastType;
}

export interface CartItemAddedPayload {
  userId: string;
  userName: string;
  userEmail: string;
  location: string;
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    quantity: number;
  };
  timestamp: number;
}

// -------------------------------------------------------------
// City Airport Code Helper (for Flight Route Trajectory)
// -------------------------------------------------------------
export function getCityAirportCode(location?: string | null): string {
  if (!location || typeof location !== 'string') return 'ECU';
  try {
    const clean = location.toLowerCase().trim();
    if (clean.includes('guayaquil')) return 'GYE';
    if (clean.includes('quito')) return 'UIO';
    if (clean.includes('cuenca')) return 'CUE';
    if (clean.includes('manta')) return 'MEC';
    if (clean.includes('ambato')) return 'ATF';
    if (clean.includes('loja')) return 'LOH';
    if (clean.includes('machala')) return 'MCH';
    if (clean.includes('galapagos') || clean.includes('galápagos')) return 'GPS';
    if (clean.includes('bogota') || clean.includes('bogotá')) return 'BOG';
    if (clean.includes('lima')) return 'LIM';
    if (clean.includes('madrid')) return 'MAD';
    if (clean.includes('miami')) return 'MIA';
    const firstWord = (location.split(',')[0] || '').replace(/[^a-zA-Z]/g, '').trim();
    return (firstWord.slice(0, 3) || 'LUM').toUpperCase();
  } catch {
    return 'LUM';
  }
}

// -------------------------------------------------------------
// WCAG 2.1 Contrast Calculation Utilities
// -------------------------------------------------------------
export const hexToRgb = (hex: string): [number, number, number] => {
  let clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return [255, 255, 255];
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [255, 255, 255];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

export interface ContrastAudit {
  ratio: number;
  isAccessible: boolean;
  score: 'AAA' | 'AA' | 'FAIL';
  recommendation?: string;
  suggestedTextColor: string;
  suggestedSubtextColor: string;
}

export const auditContrast = (bgColor: string, textColor: string): ContrastAudit => {
  const titleRatio = getContrastRatio(bgColor, textColor);
  const isAccessible = titleRatio >= 4.5;
  const score = titleRatio >= 7 ? 'AAA' : titleRatio >= 4.5 ? 'AA' : 'FAIL';

  const [bgR, bgG, bgB] = hexToRgb(bgColor);
  const bgLum = getLuminance(bgR, bgG, bgB);
  const isLightBg = bgLum > 0.45;

  const suggestedTextColor = isLightBg ? '#0a0a0a' : '#ffffff';
  const suggestedSubtextColor = isLightBg ? '#4b5563' : '#d1d5db';

  let recommendation: string | undefined;
  if (!isAccessible) {
    if (isLightBg) {
      recommendation = `El fondo es claro y el texto actual tiene contraste bajo (${titleRatio.toFixed(1)}:1). Te recomendamos usar texto negro o carbón (#0a0a0a) para que se lea con total claridad.`;
    } else {
      recommendation = `El fondo es oscuro y el texto actual tiene contraste bajo (${titleRatio.toFixed(1)}:1). Te recomendamos usar texto blanco (#ffffff) para garantizar lectura nítida.`;
    }
  }

  return {
    ratio: Math.round(titleRatio * 10) / 10,
    isAccessible,
    score,
    recommendation,
    suggestedTextColor,
    suggestedSubtextColor,
  };
};

export const formatAlertContent = (
  layout: AlertLayout,
  payload: CartItemAddedPayload,
  customTitle?: string
): { title: string; description: string } => {
  const itemPrice = typeof payload.product?.price === 'number'
    ? payload.product.price.toFixed(2)
    : String(payload.product?.price || '0.00');
  const city = payload.location ? payload.location : 'Ubicación reservada';
  const prodTitle = payload.product?.title || 'Artículo Lumina';
  const customer = payload.userName || 'Cliente';

  switch (layout) {
    case 'flight_route':
      return {
        title: customTitle || 'Ruta de Despacho',
        description: `${customer} (${city}) sumó ${prodTitle} ($${itemPrice})`,
      };
    case 'stacked_ticket':
      return {
        title: customTitle || 'Ficha de Carrito',
        description: `${customer} (${city}) sumó ${prodTitle} ($${itemPrice})`,
      };
    case 'split_capsule':
      return {
        title: customTitle || 'Adición de Carrito',
        description: `${customer} (${city}) sumó ${prodTitle} ($${itemPrice})`,
      };
    case 'bento_grid':
    default:
      return {
        title: customTitle || 'Actividad de Carrito',
        description: `${customer} (${city}) sumó ${prodTitle} ($${itemPrice})`,
      };
  }
};

// Default Configuration: Clean White with Deep Dark Text
const DEFAULT_CONFIG: CartAlertConfig = {
  position: 'bottom-right',
  layout: 'flight_route',
  presetId: 'white_clean',
  bgColor: '#ffffff',
  textColor: '#0a0a0a',
  subtextColor: '#4b5563',
  accentColor: '#0f172a',
  title: 'Nuevo producto en el carrito',
  duration: 6000,
  soundEnabled: true,
  toastType: 'action',
};

const STORAGE_KEY = 'lumina_admin_cart_alert_config_v5';

const loadSavedConfig = (): CartAlertConfig => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validLayouts: AlertLayout[] = ['flight_route', 'stacked_ticket', 'split_capsule', 'bento_grid'];
      if (!validLayouts.includes(parsed.layout)) {
        parsed.layout = 'flight_route';
      }
      if (parsed.presetId === 'apple_white') {
        parsed.presetId = 'white_clean';
      }
      if (parsed.presetId === 'apple_dark') {
        parsed.presetId = 'dark_graphite';
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_CONFIG;
};

// Acoustic glass chime using Web Audio API
export const playAcousticChime = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Note 2: G#5 harmonic sparkle
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(830.61, now + 0.08);
    gain2.gain.setValueAtTime(0.05, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.6);
  } catch {}
};

interface AdminAlertState {
  config: CartAlertConfig;
  activeAlert: CartItemAddedPayload | null;
  activeAlertKey: number;
  onViewDetailsCallback?: () => void;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  loadConfigFromCloud: () => Promise<void>;
  saveConfigToCloud: (newConfig?: CartAlertConfig) => Promise<void>;
  updateConfig: (patch: Partial<CartAlertConfig>) => void;
  applyPreset: (presetId: string) => void;
  applyRecommendedContrast: () => void;
  resetConfig: () => void;
  fireToast: (payload: CartItemAddedPayload, onViewDetails?: () => void) => void;
  dismissAlert: () => void;
}

let saveDebounceTimer: NodeJS.Timeout | null = null;
let isRealtimeAlertListenerAttached = false;

const triggerDebouncedCloudSave = (
  newConfig: CartAlertConfig,
  saveFn: (cfg: CartAlertConfig) => Promise<void>
) => {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    saveFn(newConfig);
  }, 400);
};

export const useAdminAlertStore = create<AdminAlertState>((set, get) => ({
  config: loadSavedConfig(),
  activeAlert: null,
  activeAlertKey: 0,
  onViewDetailsCallback: undefined,
  isSyncing: false,
  lastSyncedAt: null,
  syncError: null,

  loadConfigFromCloud: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Attach realtime listener once for multi-tab synchronization
      if (!isRealtimeAlertListenerAttached) {
        isRealtimeAlertListenerAttached = true;
        const chan = supabase.channel('admin:cart_alerts');
        chan.on('broadcast', { event: 'config_updated' }, ({ payload }) => {
          if (payload?.config) {
            const currentConfig = get().config;
            if (JSON.stringify(currentConfig) !== JSON.stringify(payload.config)) {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.config));
              } catch {}
              set({ config: payload.config, lastSyncedAt: Date.now(), isSyncing: false });
            }
          }
        }).subscribe();
      }

      const res = await fetch('/api/admin/cart-alerts/config', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.config));
          } catch {}
          set({
            config: data.config,
            lastSyncedAt: Date.now(),
            isSyncing: false,
            syncError: null,
          });
        }
      }
    } catch (err) {
      console.warn('Could not load cart alerts config from cloud:', err);
    }
  },

  saveConfigToCloud: async (newConfig?: CartAlertConfig) => {
    const targetConfig = newConfig || get().config;
    set({ isSyncing: true, syncError: null });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        set({ isSyncing: false });
        return;
      }

      const res = await fetch('/api/admin/cart-alerts/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(targetConfig),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          set({
            config: data.config,
            lastSyncedAt: Date.now(),
            isSyncing: false,
            syncError: null,
          });
          return;
        }
      }
      set({ isSyncing: false, syncError: 'No se pudo sincronizar con la nube.' });
    } catch {
      set({ isSyncing: false, syncError: 'Error de conexión al guardar.' });
    }
  },

  updateConfig: (patch) => {
    const next = { ...get().config, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    set({ config: next });
    triggerDebouncedCloudSave(next, get().saveConfigToCloud);
  },

  applyPreset: (presetId: string) => {
    const preset = COLOR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const next: CartAlertConfig = {
      ...get().config,
      presetId,
      bgColor: preset.bgColor,
      textColor: preset.textColor,
      subtextColor: preset.subtextColor,
      accentColor: preset.accentColor,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    set({ config: next });
    triggerDebouncedCloudSave(next, get().saveConfigToCloud);
  },

  applyRecommendedContrast: () => {
    const { config } = get();
    const audit = auditContrast(config.bgColor, config.textColor);
    const next: CartAlertConfig = {
      ...config,
      textColor: audit.suggestedTextColor,
      subtextColor: audit.suggestedSubtextColor,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    set({ config: next });
    triggerDebouncedCloudSave(next, get().saveConfigToCloud);
  },

  resetConfig: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
    } catch {}
    set({ config: DEFAULT_CONFIG });
    get().saveConfigToCloud(DEFAULT_CONFIG);
  },

  fireToast: (payload, onViewDetails) => {
    const { config } = get();
    if (config.soundEnabled) {
      playAcousticChime();
    }

    set({
      activeAlert: payload,
      activeAlertKey: Date.now(),
      onViewDetailsCallback: onViewDetails,
    });
  },

  dismissAlert: () => {
    set({ activeAlert: null });
  },
}));

// Realtime broadcast for registered customers adding items to their cart
export const broadcastCartAddition = async (payload: CartItemAddedPayload) => {
  try {
    const channel = supabase.channel('radar:clients', {
      config: { broadcast: { self: false } },
    });

    await new Promise<void>((resolve) => {
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'cart_item_added',
            payload,
          });
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          resolve();
        }
      });
      setTimeout(resolve, 600);
    });
  } catch (err) {
    console.warn('Could not broadcast cart addition:', err);
  }
};
