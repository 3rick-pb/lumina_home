import { create } from 'zustand';
import { sileo } from 'sileo';
import { supabase } from './supabase';

export type AlertPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type AlertLayout = 'island' | 'card' | 'minimal' | 'bento';
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
    id: 'apple_white',
    name: 'Blanco Puro iPhone (Predeterminado)',
    description: 'Fondo blanco cristalino con tipografía negra profunda y máxima legibilidad',
    bgColor: '#ffffff',
    textColor: '#0a0a0a',
    subtextColor: '#4b5563',
    accentColor: '#111827',
    isLight: true,
  },
  {
    id: 'apple_dark',
    name: 'Negro Oled iPhone',
    description: 'Oscuro refinado estilo iOS nocturno con botones contrastantes',
    bgColor: '#121214',
    textColor: '#ffffff',
    subtextColor: '#9ca3af',
    accentColor: '#2563eb',
    isLight: false,
  },
  {
    id: 'lumina_studio',
    name: 'Lumina Studio (Oliva Atelier)',
    description: 'Estética nórdica de autor con acentos lima de alta gama',
    bgColor: '#1b1e17',
    textColor: '#f4f5f0',
    subtextColor: '#a8af8e',
    accentColor: '#ccff00',
    isLight: false,
  },
  {
    id: 'glacier_ice',
    name: 'Nieve Glaciar',
    description: 'Tono marfil frío suave con contrastes en azul cobalto',
    bgColor: '#f8fafc',
    textColor: '#0f172a',
    subtextColor: '#64748b',
    accentColor: '#2563eb',
    isLight: true,
  },
  {
    id: 'emerald_cyber',
    name: 'Verde Esmeralda Cyber',
    description: 'Contraste botánico oscuro con reflejos menta luminosos',
    bgColor: '#061a12',
    textColor: '#ffffff',
    subtextColor: '#6ee7b7',
    accentColor: '#10b981',
    isLight: false,
  },
  {
    id: 'royal_sapphire',
    name: 'Zafiro Medianoche',
    description: 'Azul cobalto nocturno con acentos celestes brillantes',
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
  roundness: number;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: 'island',
    title: 'Dynamic Island iPhone',
    badge: '📱 Cápsula Apple',
    description: 'Diseño tipo píldora ultra-redondeada con emojis de estado compactos y elegantes',
    roundness: 26,
  },
  {
    id: 'card',
    title: 'Tarjeta Boutique Lumina',
    badge: '🛍️ Doble Nivel',
    description: 'Estructura en dos alturas con división de cliente, ubicación y producto enmarcado',
    roundness: 18,
  },
  {
    id: 'minimal',
    title: 'Línea Minimalista',
    badge: '⚡ Ultra Limpia',
    description: 'Formato directo y sin distracciones, ideal para trabajar en paralelo',
    roundness: 14,
  },
  {
    id: 'bento',
    title: 'Bento Dimensional',
    badge: '📦 Foco en Producto',
    description: 'Diseño contemporáneo con énfasis visual en la pieza agregada al carrito',
    roundness: 20,
  },
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
      recommendation = `El fondo es claro y el texto actual tiene contraste bajo (${titleRatio.toFixed(1)}:1). Te recomendamos usar un texto negro o carbón (#0a0a0a) para garantizar visibilidad nítida.`;
    } else {
      recommendation = `El fondo es oscuro y el texto actual tiene contraste bajo (${titleRatio.toFixed(1)}:1). Te recomendamos usar texto blanco puro (#ffffff) para que no se pierda en la pantalla.`;
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
  const city = payload.location || 'Ubicación confidencial';
  const prodTitle = payload.product?.title || 'Artículo Lumina';
  const customer = payload.userName || 'Cliente registrado';

  switch (layout) {
    case 'island':
      return {
        title: customTitle || '🛒 Carrito Actualizado',
        description: `👤 ${customer} (📍 ${city}) sumó 📦 "${prodTitle}" • 🏷️ $${itemPrice}`,
      };
    case 'minimal':
      return {
        title: customTitle || '📦 Nuevo artículo agregado',
        description: `👤 ${customer} en 📍 ${city} • 🛍️ ${prodTitle} ($${itemPrice})`,
      };
    case 'bento':
      return {
        title: customTitle || '✨ Actividad de Compra en Vivo',
        description: `📦 ${prodTitle} (🏷️ $${itemPrice}) agregado por 👤 ${customer} desde 📍 ${city}`,
      };
    case 'card':
    default:
      return {
        title: customTitle || '🛍️ ¡Nuevo artículo en carrito!',
        description: `👤 ${customer} • 📍 ${city} — 📦 ${prodTitle} (🏷️ $${itemPrice})`,
      };
  }
};

// Default Configuration: Clean White iPhone Glass with Deep Black Text
const DEFAULT_CONFIG: CartAlertConfig = {
  position: 'bottom-right',
  layout: 'island',
  presetId: 'apple_white',
  bgColor: '#ffffff',
  textColor: '#0a0a0a',
  subtextColor: '#4b5563',
  accentColor: '#111827',
  title: '🛒 ¡Nuevo artículo en carrito!',
  duration: 6500,
  soundEnabled: true,
  toastType: 'action',
};

const STORAGE_KEY = 'lumina_admin_cart_alert_config_v2';

const loadSavedConfig = (): CartAlertConfig => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_CONFIG;
};

// Acoustic glass chime using Web Audio API (zero external audio file dependencies)
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
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18); // C6
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
  updateConfig: (patch: Partial<CartAlertConfig>) => void;
  applyPreset: (presetId: string) => void;
  applyRecommendedContrast: () => void;
  resetConfig: () => void;
  fireToast: (payload: CartItemAddedPayload, onViewDetails?: () => void) => void;
}

export const useAdminAlertStore = create<AdminAlertState>((set, get) => ({
  config: loadSavedConfig(),

  updateConfig: (patch) => {
    const next = { ...get().config, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    set({ config: next });
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
  },

  resetConfig: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
    } catch {}
    set({ config: DEFAULT_CONFIG });
  },

  fireToast: (payload, onViewDetails) => {
    const { config } = get();
    if (config.soundEnabled) {
      playAcousticChime();
    }

    const { title, description } = formatAlertContent(config.layout, payload, config.title);

    const [bgR, bgG, bgB] = hexToRgb(config.bgColor);
    const isLightBg = getLuminance(bgR, bgG, bgB) > 0.45;

    const layoutMeta = LAYOUT_OPTIONS.find((l) => l.id === config.layout) || LAYOUT_OPTIONS[0];

    const commonOptions = {
      title,
      description,
      position: config.position,
      duration: config.duration,
      fill: config.bgColor,
      roundness: layoutMeta.roundness,
      styles: {
        title: `font-display font-extrabold text-sm tracking-tight ${isLightBg ? 'text-gray-950!' : 'text-white!'}`,
        description: `text-xs font-medium leading-relaxed ${isLightBg ? 'text-gray-700!' : 'text-gray-300!'}`,
        badge: `font-bold text-[10px] tracking-wider uppercase ${isLightBg ? 'bg-black/10 text-gray-900!' : 'bg-white/15 text-white!'}`,
        button: `text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${isLightBg ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-950 hover:bg-gray-100'}`,
      },
    };

    if (config.toastType === 'action') {
      sileo.action({
        ...commonOptions,
        button: {
          title: '⚡ Ver Radar',
          onClick: () => {
            if (onViewDetails) {
              onViewDetails();
            } else if (typeof window !== 'undefined') {
              window.location.href = '/profile?tab=analytics';
            }
          },
        },
      });
    } else if (config.toastType === 'info') {
      sileo.info(commonOptions);
    } else {
      sileo.success(commonOptions);
    }
  },
}));

// Broadcast to radar:clients channel when a registered customer adds a product
export const broadcastCartAddition = async (payload: CartItemAddedPayload) => {
  try {
    const channel = supabase.channel('radar:clients');
    await channel.send({
      type: 'broadcast',
      event: 'cart_item_added',
      payload,
    });
  } catch (err) {
    console.warn('Could not broadcast cart addition:', err);
  }
};
