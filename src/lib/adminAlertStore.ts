import { create } from 'zustand';
import { sileo } from 'sileo';
import { supabase } from './supabase';

export type AlertPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type AlertTheme = 'obsidian' | 'lumina' | 'emerald' | 'sapphire';
export type AlertToastType = 'action' | 'success' | 'info';

export interface CartAlertConfig {
  position: AlertPosition;
  theme: AlertTheme;
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

const DEFAULT_CONFIG: CartAlertConfig = {
  position: 'bottom-right',
  theme: 'obsidian',
  title: '¡Nuevo artículo en carrito!',
  duration: 6500,
  soundEnabled: true,
  toastType: 'action',
};

const STORAGE_KEY = 'lumina_admin_cart_alert_config';

const loadSavedConfig = (): CartAlertConfig => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
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
    
    // Smooth multi-tone luxury boutique chime
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

export const THEME_FILL_MAP: Record<AlertTheme, { fill: string; badge: string; accentBorder: string; buttonBg: string; name: string }> = {
  obsidian: {
    name: 'Obsidian Liquid',
    fill: '#101014',
    badge: 'bg-white/10 text-white',
    accentBorder: 'border-white/15',
    buttonBg: 'bg-white/15 hover:bg-white/25 text-white',
  },
  lumina: {
    name: 'Lumina Studio',
    fill: '#1b1e17',
    badge: 'bg-[#8c9276]/25 text-[#a8af8e]',
    accentBorder: 'border-[#8c9276]/30',
    buttonBg: 'bg-[#8c9276]/30 hover:bg-[#8c9276]/50 text-white',
  },
  emerald: {
    name: 'Emerald Neon',
    fill: '#081c14',
    badge: 'bg-[#ccff00]/20 text-[#ccff00]',
    accentBorder: 'border-emerald-500/30',
    buttonBg: 'bg-[#ccff00]/25 hover:bg-[#ccff00]/40 text-emerald-100',
  },
  sapphire: {
    name: 'Royal Sapphire',
    fill: '#0c1427',
    badge: 'bg-sky-500/20 text-sky-300',
    accentBorder: 'border-sky-500/30',
    buttonBg: 'bg-sky-500/25 hover:bg-sky-500/40 text-sky-100',
  },
};

interface AdminAlertState {
  config: CartAlertConfig;
  updateConfig: (patch: Partial<CartAlertConfig>) => void;
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

    const themeColors = THEME_FILL_MAP[config.theme] || THEME_FILL_MAP.obsidian;
    const titleText = config.title || '¡Nuevo artículo en carrito!';
    const itemPrice = typeof payload.product.price === 'number' ? payload.product.price.toFixed(2) : String(payload.product.price);

    const descriptionContent = `${payload.userName} (${payload.location}) sumó "${payload.product.title}" ($${itemPrice})`;

    const commonOptions = {
      title: titleText,
      description: descriptionContent,
      position: config.position,
      duration: config.duration,
      fill: themeColors.fill,
      roundness: 18,
      styles: {
        title: 'font-display font-bold text-sm tracking-tight text-white!',
        description: 'text-xs text-white/80! font-medium leading-relaxed',
        badge: `${themeColors.badge} font-bold text-[10px] tracking-wider uppercase`,
        button: `${themeColors.buttonBg} text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer`,
      },
    };

    if (config.toastType === 'action') {
      sileo.action({
        ...commonOptions,
        button: {
          title: 'Ver Radar',
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
