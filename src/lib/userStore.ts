import { create } from 'zustand';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { CartItem, useCartStore } from './store';
import { useThemeStore } from './themeStore';
import { useRadarStore } from './radarStore';
import { useAvatarSettingsStore, setupAvatarRealtimeListener, cleanupAvatarRealtimeListener } from './avatarSettingsStore';
import { useCatalogStore } from './catalogStore';
import { playFavoriteSound, playStepperTickSound } from './soundUtils';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  isRootAdmin?: boolean;
}

export interface Order {
  id: string;
  date: string;
  time?: string;
  createdAt?: string;
  status: 'Procesando' | 'Enviado' | 'Entregado';
  trackingNumber?: string;
  trackingUrl?: string;
  carrierName?: string;
  total: number;
  items: CartItem[];
  customerName?: string;
  customerEmail?: string;
  customerIdNumber?: string;
  customerPhone?: string;
  recipient?: string;
  shippingAddress?: ShippingAddress;
  paymentMethod?: string;
  userId?: string;
  customerAvatarSeed?: string;
  customerAvatarShape?: 'squircle' | 'circle';
  customerRole?: 'USER' | 'ADMIN';
}

export function serializeTrackingField(
  trackingNumber?: string,
  trackingUrl?: string,
  carrierName?: string
): string {
  const cleanCode = (trackingNumber || '').trim();
  if (!cleanCode) return '';
  const cleanUrl = (trackingUrl || '').trim();
  const cleanCarrier = (carrierName || '').trim();
  if (cleanUrl || cleanCarrier) {
    return `${cleanCode}||${cleanUrl}||${cleanCarrier}`;
  }
  return cleanCode;
}

export function parseTrackingField(
  rawTracking?: string | null,
  status?: string
): {
  trackingNumber?: string;
  trackingUrl?: string;
  carrierName?: string;
} {
  if (!rawTracking || status === 'Procesando') {
    return { trackingNumber: undefined, trackingUrl: undefined, carrierName: undefined };
  }
  const str = String(rawTracking).trim();
  if (!str) {
    return { trackingNumber: undefined, trackingUrl: undefined, carrierName: undefined };
  }
  if (str.includes('||')) {
    const [code, url, carrier] = str.split('||');
    return {
      trackingNumber: code?.trim() || undefined,
      trackingUrl: url?.trim() || undefined,
      carrierName: carrier?.trim() || undefined,
    };
  }
  return {
    trackingNumber: str,
    trackingUrl: undefined,
    carrierName: undefined,
  };
}

export interface PaymentCard {
  id: string;
  number: string;
  holder: string;
  exp: string;
  type: 'mastercard' | 'visa';
  isDefault?: boolean;
}

export interface ShippingAddress {
  id: string;
  recipient: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  street: string;
  reference?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthInitialized: boolean;
  favorites: string[]; // array of product IDs
  orders: Order[];
  cards: PaymentCard[];
  address: ShippingAddress | null;
  addresses: ShippingAddress[];
  isGuestMode: boolean;
  
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
  
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  
  addCard: (card: Omit<PaymentCard, 'id'>) => void;
  removeCard: (id: string) => void;
  setDefaultCard: (id: string) => void;
  
  addOrder: (order: Order) => void;
  updateOrderStatus: (
    orderId: string,
    status: Order['status'],
    trackingInfo?: { trackingNumber?: string; trackingUrl?: string; carrierName?: string }
  ) => void;
  refreshOrders: () => Promise<void>;

  addAddress: (address: Omit<ShippingAddress, 'id'>) => Promise<boolean>;
  removeAddress: (id?: string) => void;
  setDefaultAddress: (id: string) => void;
  setAddress: (address: ShippingAddress | Omit<ShippingAddress, 'id'>) => void;

  updateUserName: (name: string) => Promise<{ error: string | null }>;
  updateUserPassword: (password: string) => Promise<{ error: string | null }>;
  recheckUserRole: () => Promise<boolean>;
}

const COMMON_FIRST_NAMES = [
  'alejandro', 'sebastian', 'valeria', 'fernando', 'gabriel', 'carlos', 
  'daniel', 'manuel', 'miguel', 'javier', 'erick', 'david', 'jorge', 
  'pedro', 'mateo', 'camila', 'paula', 'sofia', 'pablo', 'mario', 
  'maria', 'diego', 'luis', 'jose', 'juan', 'eric', 'ana'
];

export const formatCleanName = (rawName: string) => {
  if (!rawName) return '';
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

export const MASTER_ADMIN_EMAIL = 'admin@lumina.com';

/**
 * Security: Validates email against standard RFC 5322 pattern and blocks SQL/PostgREST injection attempts
 */
export const isValidEmail = (email?: string | null): boolean => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  if (clean.length > 100 || clean.length < 5) return false;
  // Block any dangerous injection characters (quotes, semicolons, parentheses, null bytes)
  if (/['";`<>\\\0\r\n]/.test(clean)) return false;
  // RFC 5322 standard email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(clean);
};

/**
 * Security: Strips all HTML/script tags and special characters from user inputs to prevent stored XSS
 */
export const sanitizeText = (text?: string | null, maxLength = 80): string => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/['";`<>\\\0]/g, '') // Strip script injection chars
    .trim()
    .slice(0, maxLength);
};

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  isStrong: boolean;
  checks: {
    minLength: boolean;
    hasUpperAndLower: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
    notCommonOrSequential: boolean;
  };
}

const WEAK_PASSWORD_BLACKLIST = [
  '123456', '1234567', '12345678', '123456789', '1234567890',
  '654321', '987654321', '0123456', '0123456789',
  'password', 'password1', 'password123', 'pass1234',
  'contrasena', 'contraseña', 'clave123', 'clave1234',
  'qwerty', 'qwertyuiop', 'qwerty123', 'asdfgh', 'asdfghjkl', 'zxcvbnm',
  '111111', '11111111', '000000', '00000000', '22222222', '99999999',
  'abcdef', 'abcdefg', 'abcdefgh', 'abcd1234', '1234abcd',
  'lumina', 'lumina123', 'admin123', 'welcome1', 'iloveyou'
];

export const evaluatePasswordStrength = (password?: string | null): PasswordStrengthResult => {
  const pwd = typeof password === 'string' ? password : '';
  const lower = pwd.toLowerCase().trim();

  const minLength = pwd.length >= 8;
  const hasUpperAndLower = /[a-záéíóúñ]/.test(pwd) && /[A-ZÁÉÍÓÚÑ]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`¡¿]/.test(pwd);

  // Check blacklist, repeated single char (e.g. aaaaaaaa), or pure numeric sequences
  const isBlacklisted = WEAK_PASSWORD_BLACKLIST.some(
    (weak) => lower === weak || lower.includes('123456') || lower.includes('654321') || lower.includes('qwerty')
  );
  const isRepeatedChar = pwd.length > 0 && /^(.)\1+$/.test(pwd);
  const isPureSequentialDigits = pwd.length >= 5 && ('01234567890'.includes(pwd) || '9876543210'.includes(pwd));

  const notCommonOrSequential = pwd.length > 0 && !isBlacklisted && !isRepeatedChar && !isPureSequentialDigits;

  const passedCount = [minLength, hasUpperAndLower, hasNumber, hasSymbol].filter(Boolean).length;
  let score: 0 | 1 | 2 | 3 | 4 = 0;

  if (!pwd) {
    score = 0;
  } else if (!notCommonOrSequential) {
    score = 1;
  } else {
    score = passedCount as 0 | 1 | 2 | 3 | 4;
  }

  const labels: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: 'Ingresa una contraseña',
    1: 'Muy débil (No permitida)',
    2: 'Débil (Faltan requisitos)',
    3: 'Buena (Casi lista)',
    4: 'Contraseña Fuerte y Segura',
  };

  const isStrong = minLength && hasUpperAndLower && hasNumber && hasSymbol && notCommonOrSequential;

  return {
    score: isStrong ? 4 : score,
    label: isStrong ? labels[4] : labels[score],
    isStrong,
    checks: {
      minLength,
      hasUpperAndLower,
      hasNumber,
      hasSymbol,
      notCommonOrSequential,
    },
  };
};

export const validateStrongPassword = (password?: string | null): { isValid: boolean; error: string | null } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Por favor, ingresa una contraseña.' };
  }
  if (password.length > 72) {
    return { isValid: false, error: 'La contraseña excede el límite máximo de 72 caracteres.' };
  }
  const evaluation = evaluatePasswordStrength(password);
  if (!evaluation.checks.notCommonOrSequential) {
    return {
      isValid: false,
      error: 'No se permiten contraseñas comunes ni secuencias simples como "123456" o "qwerty". Usa una combinación segura.',
    };
  }
  if (!evaluation.checks.minLength) {
    return {
      isValid: false,
      error: 'La contraseña debe tener al menos 8 caracteres.',
    };
  }
  if (!evaluation.checks.hasUpperAndLower) {
    return {
      isValid: false,
      error: 'La contraseña debe incluir al menos una letra mayúscula y una letra minúscula.',
    };
  }
  if (!evaluation.checks.hasNumber) {
    return {
      isValid: false,
      error: 'La contraseña debe incluir al menos un número (0-9).',
    };
  }
  if (!evaluation.checks.hasSymbol) {
    return {
      isValid: false,
      error: 'La contraseña debe incluir al menos un carácter especial (ej. !@#$%&*).',
    };
  }
  return { isValid: true, error: null };
};

const adminCache = new Map<string, { role: 'USER' | 'ADMIN'; isRootAdmin: boolean; timestamp: number }>();
const ADMIN_CACHE_TTL_MS = 30 * 1000; // 30 seconds

export const clearAdminCache = () => {
  adminCache.clear();
};

export const checkIsAdmin = async (
  email: string, 
  skipCache = false
): Promise<{ role: 'USER' | 'ADMIN'; isRootAdmin: boolean }> => {
  const normalized = (email || '').toLowerCase().trim();
  if (!normalized || !isValidEmail(normalized)) {
    return { role: 'USER', isRootAdmin: false };
  }

  // 1. Master system account
  if (normalized === MASTER_ADMIN_EMAIL) {
    return { role: 'ADMIN', isRootAdmin: true };
  }

  // Fast in-memory cache
  if (!skipCache) {
    const cached = adminCache.get(normalized);
    if (cached && (Date.now() - cached.timestamp < ADMIN_CACHE_TTL_MS)) {
      return { role: cached.role, isRootAdmin: cached.isRootAdmin };
    }
  }

  // 2. Dedicated admin_invitations table
  try {
    const { data: invRow } = await supabase
      .from('admin_invitations')
      .select('id')
      .ilike('email', normalized)
      .eq('is_active', true)
      .maybeSingle();

    if (invRow) {
      const res = { role: 'ADMIN' as const, isRootAdmin: false };
      adminCache.set(normalized, { ...res, timestamp: Date.now() });
      return res;
    }
  } catch {}

  // 4. Secondary fallback: query server API route
  try {
    const res = await fetch('/api/admin/invitations', { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.invitedAdmins)) {
        const cleanList = data.invitedAdmins.map((e: string) => String(e).toLowerCase().trim());
        if (cleanList.includes(normalized)) {
          const res = { role: 'ADMIN' as const, isRootAdmin: false };
          adminCache.set(normalized, { ...res, timestamp: Date.now() });
          return res;
        }
      }
    }
  } catch {}

  const finalRes = { role: 'USER' as const, isRootAdmin: false };
  adminCache.set(normalized, { ...finalRes, timestamp: Date.now() });
  return finalRes;
};

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getGuestDeviceId(): string {
  if (typeof window === 'undefined') return 'guest_default';
  try {
    let gId = localStorage.getItem('lumina_guest_device_id');
    if (!gId) {
      gId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('lumina_guest_device_id', gId);
    }
    return gId;
  } catch {
    return 'guest_default';
  }
}

const GUEST_ADDR_KEY = 'lumina_guest_addresses';
const GUEST_ACTIVE_ADDR_KEY = 'lumina_guest_active_address';
const GUEST_CARDS_KEY = 'lumina_guest_cards';
const GUEST_FAVS_KEY = 'lumina_guest_favorites';

export function getGuestAddresses(): ShippingAddress[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_ADDR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export function getGuestActiveAddress(): ShippingAddress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GUEST_ACTIVE_ADDR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.street) return parsed;
    }
  } catch {}
  return null;
}

export function saveGuestAddresses(addresses: ShippingAddress[], activeAddress: ShippingAddress | null) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_ADDR_KEY, JSON.stringify(addresses));
    if (activeAddress) {
      localStorage.setItem(GUEST_ACTIVE_ADDR_KEY, JSON.stringify(activeAddress));
    } else {
      localStorage.removeItem(GUEST_ACTIVE_ADDR_KEY);
    }
  } catch {}
}

export function getGuestCards(): PaymentCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CARDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export function saveGuestCards(cards: PaymentCard[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CARDS_KEY, JSON.stringify(cards));
  } catch {}
}

export function getGuestFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_FAVS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export function saveGuestFavorites(favorites: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_FAVS_KEY, JSON.stringify(favorites));
  } catch {}
}

export function clearGuestStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_ADDR_KEY);
    localStorage.removeItem(GUEST_ACTIVE_ADDR_KEY);
    localStorage.removeItem(GUEST_CARDS_KEY);
    localStorage.removeItem(GUEST_FAVS_KEY);
  } catch {}
}

// Backward-compatible adapters: Authenticated users NEVER read from or write to localStorage!
export const getLocalAddresses = (userId?: string | null): ShippingAddress[] => {
  if (userId) return []; // Authenticated users read purely from Database
  return getGuestAddresses();
};

export const getLocalActiveAddress = (userId?: string | null): ShippingAddress | null => {
  if (userId) return null; // Authenticated users read purely from Database
  return getGuestActiveAddress();
};

export const saveLocalAddresses = (userId: string | null | undefined, addresses: ShippingAddress[], activeAddress: ShippingAddress | null) => {
  if (userId) return; // Authenticated users write purely to Database!
  saveGuestAddresses(addresses, activeAddress);
};

export const getLocalCards = (userId?: string | null): PaymentCard[] => {
  if (userId) return [];
  return getGuestCards();
};

export const saveLocalCards = (userId: string | null | undefined, cards: PaymentCard[]) => {
  if (userId) return;
  saveGuestCards(cards);
};

export const getLocalFavorites = (userId?: string | null): string[] => {
  if (userId) return [];
  return getGuestFavorites();
};

export const saveLocalFavorites = (userId: string | null | undefined, favorites: string[]) => {
  if (userId) return;
  saveGuestFavorites(favorites);
};

export async function syncAddressesToCloud(
  userId: string | null | undefined,
  addresses: ShippingAddress[],
  activeAddress: ShippingAddress | null
) {
  if (!userId) {
    saveGuestAddresses(addresses, activeAddress);
    return;
  }

  // Exclusive Root persistence: Dispatch to server API route with authentic session Bearer token
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    const res = await fetch('/api/user/data', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'save_addresses',
        userId,
        addresses,
        activeAddress
      })
    });
    if (!res.ok) {
      console.warn('[userStore] Server root sync status:', res.status);
    }
  } catch (err) {
    console.warn('[userStore] Error syncing addresses to root backend:', err);
  }
}

export async function syncCardsToCloud(userId: string | null | undefined, cards: PaymentCard[]) {
  if (!userId) {
    saveGuestCards(cards);
    return;
  }

  // Exclusive Root persistence: Dispatch to server API route with authentic session Bearer token
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    const res = await fetch('/api/user/data', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'save_cards',
        userId,
        cards
      })
    });
    if (!res.ok) {
      console.warn('[userStore] Server root sync status for cards:', res.status);
    }
  } catch (err) {
    console.warn('[userStore] Error syncing cards to root backend:', err);
  }
}

export async function syncFavoritesToCloud(userId: string | null | undefined, favorites: string[]) {
  if (!userId) {
    saveGuestFavorites(favorites);
    return;
  }

  // Exclusive Root persistence: Dispatch to server API route with authentic session Bearer token
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    const res = await fetch('/api/user/data', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'save_favorites',
        userId,
        favorites
      })
    });
    if (!res.ok) {
      console.warn('[userStore] Server root sync status for favorites:', res.status);
    }
  } catch (err) {
    console.warn('[userStore] Error syncing favorites to root backend:', err);
  }
}

const fetchUserDataFromDatabase = async (userId: string, role: 'USER' | 'ADMIN' = 'USER', email: string = '') => {
  try {
    // 1. Fetch store/user orders from persistent API with instant synchronization
    let orders: Order[] = [];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`, {
        headers,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders)) {
          orders = json.orders;
        }
      }
    } catch {}

    // 2. Fetch user data (addresses, cards, favorites) from unified backend database API route
    let addresses: ShippingAddress[] = [];
    let address: ShippingAddress | null = null;
    let cards: PaymentCard[] = [];
    let favorites: string[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/user/data?userId=${encodeURIComponent(userId)}`, {
        headers,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (Array.isArray(json.addresses)) addresses = json.addresses;
          if (json.address) address = json.address;
          if (Array.isArray(json.cards)) cards = json.cards;
          if (Array.isArray(json.favorites)) favorites = json.favorites;
        }
      }
    } catch {}

    // Direct Database fallback if API was temporarily unreachable
    if (addresses.length === 0) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let dbAddrs: any[] | null = null;
        const queryRes = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (!queryRes.error && queryRes.data) {
          dbAddrs = queryRes.data;
        } else {
          const fallback = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId);
          dbAddrs = fallback.data;
        }

        if (dbAddrs && dbAddrs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addresses = dbAddrs.map((a: any) => ({
            id: a.id,
            recipient: a.recipient || 'Destinatario',
            idNumber: a.id_number || '',
            phone: a.phone || '',
            email: a.email || '',
            street: a.street || '',
            city: a.city || '',
            state: a.state || '',
            postalCode: a.postal_code || '',
            country: a.country || 'Ecuador',
            isDefault: !!a.is_default,
          }));
        }
      } catch {}
    }

    if (cards.length === 0) {
      try {
        const { data: dbCards } = await supabase
          .from('payment_cards')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (dbCards && dbCards.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cards = dbCards.map((c: any) => ({
            id: c.id,
            number: c.number,
            holder: c.holder,
            exp: c.exp,
            type: c.type,
            isDefault: !!c.is_default,
          }));
        }
      } catch {}
    }

    if (favorites.length === 0) {
      try {
        const { data: dbFavs } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', userId);

        if (dbFavs && dbFavs.length > 0) {
          favorites = dbFavs.map(f => String(f.product_id));
        }
      } catch {}
    }

    if (!address) {
      address = addresses.find(a => a.isDefault) || addresses[0] || null;
    }

    // 4. Fetch user profile display_name directly from public.user_profiles
    let profileName: string | null = null;
    try {
      const { data: dbProfile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', userId)
        .maybeSingle();

      if (dbProfile?.display_name) {
        profileName = formatCleanName(dbProfile.display_name);
      }
    } catch {}

    // Zero LocalStorage writes for authenticated users! Everything is strictly stored in the Database.
    return { cards, orders, addresses, address, favorites, profileName };
  } catch {
    return {
      cards: [],
      orders: [],
      addresses: [],
      address: null,
      favorites: [],
      profileName: null,
    };
  }
};

let isAuthListenerAttached = false;
let isInitializingAuth = false;
let rolesChannel: RealtimeChannel | null = null;

function setupRolesRealtimeListener(
  get: () => UserState,
  set: (partial: Partial<UserState> | ((state: UserState) => Partial<UserState>)) => void
) {
  if (rolesChannel) return;
  rolesChannel = supabase.channel('lumina:roles', {
    config: { broadcast: { self: true } }
  });

  rolesChannel
    .on('broadcast', { event: 'role_change' }, async ({ payload }) => {
      if (!payload || !payload.email) return;
      const currentUser = get().user;
      if (!currentUser?.email) return;

      const currentNorm = currentUser.email.toLowerCase().trim();
      const targetNorm = String(payload.email).toLowerCase().trim();

      if (currentNorm === targetNorm) {
        clearAdminCache();
        const newRole: 'USER' | 'ADMIN' = payload.role === 'ADMIN' ? 'ADMIN' : 'USER';
        const isRoot = currentUser.isRootAdmin || false;

        const updatedUser: User = {
          ...currentUser,
          role: newRole,
          isRootAdmin: isRoot,
        };

        set({ user: updatedUser });

        if (newRole === 'ADMIN') {
          try {
            const personalData = await fetchUserDataFromDatabase(currentUser.id, 'ADMIN', currentUser.email);
            set({ orders: personalData.orders });
          } catch {}
        }
      }
    })
    .subscribe();
}

export const getInitialGuestMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem('lumina_guest_mode') === 'true') return true;
    if (document.cookie.split('; ').some(row => row.startsWith('lumina_guest_mode=true'))) return true;
    return false;
  } catch {
    return false;
  }
};

export const setGuestModeStorage = (val: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    if (val) {
      sessionStorage.setItem('lumina_guest_mode', 'true');
      document.cookie = "lumina_guest_mode=true; path=/; SameSite=Lax";
    } else {
      sessionStorage.removeItem('lumina_guest_mode');
      document.cookie = "lumina_guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }
  } catch {}
};

let userSyncPromise: Promise<{
  cards: PaymentCard[];
  orders: Order[];
  addresses: ShippingAddress[];
  address: ShippingAddress | null;
  favorites: string[];
  profileName: string | null;
}> | null = null;
let userSyncTargetId: string | null = null;

async function syncAndFetchMergedUserData(
  userId: string,
  role: 'USER' | 'ADMIN',
  email: string,
  accessToken?: string,
  currentStoreState?: {
    isAuthenticated: boolean;
    favorites: string[];
    addresses: ShippingAddress[];
    cards: PaymentCard[];
  }
) {
  if (userSyncPromise && userSyncTargetId === userId) {
    return userSyncPromise;
  }

  userSyncTargetId = userId;
  userSyncPromise = (async () => {
    // 1. Capture ALL guest data from localStorage AND unauthenticated in-memory store BEFORE clearing
    const memFavs = currentStoreState && !currentStoreState.isAuthenticated ? currentStoreState.favorites : [];
    const memAddrs = currentStoreState && !currentStoreState.isAuthenticated ? currentStoreState.addresses : [];
    const memCards = currentStoreState && !currentStoreState.isAuthenticated ? currentStoreState.cards : [];

    const guestFavs = Array.from(new Set([...getGuestFavorites(), ...memFavs]));
    const guestAddrsMap = new Map<string, ShippingAddress>();
    for (const a of [...getGuestAddresses(), ...memAddrs]) {
      if (a && a.street) guestAddrsMap.set(a.id || `${a.street}-${a.city}`, a);
    }
    const guestAddrs = Array.from(guestAddrsMap.values());

    const guestCardsMap = new Map<string, PaymentCard>();
    for (const c of [...getGuestCards(), ...memCards]) {
      if (c && c.number) guestCardsMap.set(c.id || c.number, c);
    }
    const guestCards = Array.from(guestCardsMap.values());

    if (guestAddrs.length > 0 || guestCards.length > 0 || guestFavs.length > 0) {
      clearGuestStorage();
      try {
        let token = accessToken;
        if (!token) {
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token;
        }
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const syncPayload: Record<string, any> = {
          action: 'sync_all',
          userId,
        };
        if (guestAddrs.length > 0) syncPayload.addresses = guestAddrs;
        if (guestCards.length > 0) syncPayload.cards = guestCards;
        if (guestFavs.length > 0) syncPayload.favorites = guestFavs;

        await fetch('/api/user/data', {
          method: 'POST',
          headers,
          body: JSON.stringify(syncPayload)
        });
      } catch {}

      // Direct Supabase fallback for favorites so they are guaranteed in DB
      if (guestFavs.length > 0) {
        try {
          const favRows = guestFavs.map(pid => ({
            user_id: userId,
            product_id: String(pid),
          }));
          await supabase.from('favorites').upsert(favRows, { onConflict: 'user_id,product_id' });
        } catch {}
      }
    }

    // 2. Fetch existing account data from database
    const personalData = await fetchUserDataFromDatabase(userId, role, email);

    // 3. Merge guest snapshot with database response so UI is immediately 100% complete
    const mergedFavorites = Array.from(new Set([...personalData.favorites, ...guestFavs]));

    const mergedAddrMap = new Map<string, ShippingAddress>();
    for (const a of personalData.addresses) {
      mergedAddrMap.set(a.id || `${a.street}-${a.city}`, a);
    }
    for (const ga of guestAddrs) {
      const key = ga.id || `${ga.street}-${ga.city}`;
      if (!mergedAddrMap.has(key)) mergedAddrMap.set(key, ga);
    }
    const mergedAddresses = Array.from(mergedAddrMap.values());
    const mergedActiveAddress =
      personalData.address ||
      mergedAddresses.find(a => a.isDefault) ||
      mergedAddresses[0] ||
      null;

    const mergedCardsMap = new Map<string, PaymentCard>();
    for (const c of personalData.cards) {
      mergedCardsMap.set(c.id || c.number, c);
    }
    for (const gc of guestCards) {
      const key = gc.id || gc.number;
      if (!mergedCardsMap.has(key)) mergedCardsMap.set(key, gc);
    }
    const mergedCards = Array.from(mergedCardsMap.values());

    return {
      cards: mergedCards,
      orders: personalData.orders,
      addresses: mergedAddresses,
      address: mergedActiveAddress,
      favorites: mergedFavorites,
      profileName: personalData.profileName,
    };
  })().finally(() => {
    userSyncPromise = null;
    userSyncTargetId = null;
  });

  return userSyncPromise;
}

/**
 * Hydrates the client-side user store from localStorage safely after React mount.
 * Eliminates SSR hydration mismatches completely.
 */
export const hydrateStoreFromClient = () => {
  if (typeof window === 'undefined') return;
  try {
    const state = useUserStore.getState();
    if (state.user?.id) return;

    const isGuest = getInitialGuestMode();
    const addresses = getGuestAddresses();
    const address = getGuestActiveAddress() || addresses.find(a => a.isDefault) || addresses[0] || null;
    const cards = getGuestCards();
    const favorites = getGuestFavorites();

    useUserStore.setState({
      isGuestMode: isGuest || addresses.length > 0 || cards.length > 0 || favorites.length > 0,
      addresses,
      address,
      cards,
      favorites,
    });
    useCartStore.getState().initCartForUser(null);
  } catch {}
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAuthInitialized: false,
  isGuestMode: false,
  favorites: [],
  orders: [],
  cards: [],
  addresses: [],
  address: null,

  continueAsGuest: () => {
    setGuestModeStorage(true);
    set({ isGuestMode: true });
  },

  exitGuestMode: () => {
    setGuestModeStorage(false);
    set({ isGuestMode: false });
  },
  
  initializeAuth: async () => {
    // Attach realtime role listener once
    setupRolesRealtimeListener(get, set);

    // Attach onAuthStateChange listener ONCE across application lifetime
    if (!isAuthListenerAttached) {
      isAuthListenerAttached = true;

      supabase.auth.onAuthStateChange(async (event, session) => {
        // Explicit Sign out event
        if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
          cleanupAvatarRealtimeListener();
          useAvatarSettingsStore.setState({
            showAvatarInNavbar: false,
            backgroundShape: 'squircle',
            animationMode: 'always',
            customSeed: null,
          });
          setGuestModeStorage(false);
          clearGuestStorage();
          await useCartStore.getState().initCartForUser(null);
          set({
            user: null,
            isAuthenticated: false,
            isGuestMode: false,
            favorites: [],
            cards: [],
            orders: [],
            address: null,
            addresses: [],
            isLoading: false,
            isAuthInitialized: true,
          });
          return;
        }

        // Active Session Events: INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED
        if (session?.user) {
          const email = session.user.email || '';
          const { role, isRootAdmin } = await checkIsAdmin(email);
          const name = formatCleanName(session.user.user_metadata?.name || email.split('@')[0]);
          const userObj: User = { id: session.user.id, email, name, role, isRootAdmin };

          // Instant Avatar & Realtime Sync across all browsers/tabs
          useAvatarSettingsStore.getState().loadSettingsFromDatabase(session.user.id);
          setupAvatarRealtimeListener(session.user.id);

          // Proactively ensure profile and email are indexed in user_profiles
          if (session.user.id && email) {
            supabase
              .from('user_profiles')
              .upsert({
                user_id: session.user.id,
                display_name: name,
                email: email.toLowerCase().trim(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' })
              .then(() => {});
          }

          const currentUserId = get().user?.id;
          if (currentUserId !== session.user.id) {
            const snapshotBeforeAuth = {
              isAuthenticated: get().isAuthenticated,
              favorites: [...get().favorites],
              addresses: [...get().addresses],
              cards: [...get().cards],
            };

            set({ 
              user: userObj, 
              isAuthenticated: true, 
              isLoading: true,
              isAuthInitialized: true,
            });

            const newUserId = session.user.id;
            setTimeout(async () => {
              try {
                await useCartStore.getState().initCartForUser(newUserId);
                const personalData = await syncAndFetchMergedUserData(
                  newUserId,
                  role,
                  email,
                  session.access_token,
                  snapshotBeforeAuth
                );
                set((state) => ({
                  user: state.user ? { ...state.user, name: personalData.profileName || state.user.name } : null,
                  cards: personalData.cards,
                  orders: personalData.orders,
                  addresses: personalData.addresses,
                  address: personalData.address,
                  favorites: personalData.favorites,
                  isLoading: false,
                }));
              } catch {}
            }, 0);
          } else {
            set((state) => ({
              user: state.user ? { ...state.user, email, name, role, isRootAdmin } : userObj,
              isAuthenticated: true,
              isLoading: false,
              isAuthInitialized: true,
            }));
          }
        }
      });
    }

    if (isInitializingAuth) return;
    isInitializingAuth = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const email = session.user.email || '';
        const { role, isRootAdmin } = await checkIsAdmin(email);
        const name = formatCleanName(session.user.user_metadata?.name || email.split('@')[0]);
        const userObj: User = { id: session.user.id, email, name, role, isRootAdmin };

        // Instant Avatar & Realtime Sync across all browsers/tabs
        useAvatarSettingsStore.getState().loadSettingsFromDatabase(session.user.id);
        setupAvatarRealtimeListener(session.user.id);

        const snapshotBeforeAuth = {
          isAuthenticated: get().isAuthenticated,
          favorites: [...get().favorites],
          addresses: [...get().addresses],
          cards: [...get().cards],
        };

        set({ 
          user: userObj, 
          isAuthenticated: true, 
          isLoading: true, 
          isAuthInitialized: true,
        });

        const currentUserId = session.user.id;
        setTimeout(async () => {
          try {
            await useCartStore.getState().initCartForUser(currentUserId);
            const personalData = await syncAndFetchMergedUserData(
              currentUserId,
              role,
              email,
              session.access_token,
              snapshotBeforeAuth
            );
            set((state) => ({
              user: state.user ? { ...state.user, name: personalData.profileName || state.user.name } : null,
              cards: personalData.cards,
              orders: personalData.orders,
              addresses: personalData.addresses,
              address: personalData.address,
              favorites: personalData.favorites,
              isLoading: false,
            }));
          } catch {}
        }, 0);
      } else {
        const isGuest = getInitialGuestMode();
        const guestAddrs = getGuestAddresses();
        const guestCards = getGuestCards();
        const guestFavs = getGuestFavorites();
        await useCartStore.getState().initCartForUser(null);
        set({ 
          user: null, 
          isAuthenticated: false, 
          isGuestMode: isGuest || guestAddrs.length > 0 || guestCards.length > 0 || guestFavs.length > 0,
          isLoading: false, 
          isAuthInitialized: true,
          cards: guestCards,
          addresses: guestAddrs,
          address: getGuestActiveAddress() || guestAddrs.find(a => a.isDefault) || guestAddrs[0] || null,
          favorites: guestFavs,
        });
      }
    } catch {
      set({ isLoading: false, isAuthInitialized: true });
    } finally {
      isInitializingAuth = false;
    }
  },

  login: async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { error: 'Por favor, ingresa un formato de correo electrónico válido.' };
    }
    if (!password || typeof password !== 'string') {
      return { error: 'Por favor, introduce tu contraseña.' };
    }
    if (password.length > 72) {
      return { error: 'La contraseña excede el límite máximo de seguridad permitido.' };
    }

    const snapshotBeforeLogin = {
      isAuthenticated: get().isAuthenticated,
      favorites: [...get().favorites],
      addresses: [...get().addresses],
      cards: [...get().cards],
    };

    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (!error && data?.user) {
      setGuestModeStorage(false);
      const userEmail = data.user.email || cleanEmail;
      const { role, isRootAdmin } = await checkIsAdmin(userEmail);
      const name = formatCleanName(data.user.user_metadata?.name || userEmail.split('@')[0]);

      // Synchronize and merge user's private cart + guest data atomically
      await useCartStore.getState().initCartForUser(data.user.id);
      const personalData = await syncAndFetchMergedUserData(
        data.user.id,
        role,
        userEmail,
        data.session?.access_token,
        snapshotBeforeLogin
      );
      const userObj: User = { id: data.user.id, email: userEmail, name: personalData.profileName || name, role, isRootAdmin };

      // Ensure user_profiles has latest email and display name
      try {
        await supabase.from('user_profiles').upsert({
          user_id: data.user.id,
          display_name: userObj.name,
          email: userEmail.toLowerCase().trim(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch {}

      set({ 
        user: userObj, 
        isAuthenticated: true, 
        isGuestMode: false, 
        isLoading: false, 
        isAuthInitialized: true,
        cards: personalData.cards,
        orders: personalData.orders,
        addresses: personalData.addresses,
        address: personalData.address,
        favorites: personalData.favorites,
      });

      await useThemeStore.getState().loadFromDB(data.user.id);
      await useAvatarSettingsStore.getState().loadSettingsFromDatabase(data.user.id);
      setupAvatarRealtimeListener(data.user.id);
    }
    return { error: error?.message || null };
  },
  
  logout: async () => {
    // 1. Immediately reset in-memory user and authentication state (0ms instant UI feedback!)
    cleanupAvatarRealtimeListener();
    useAvatarSettingsStore.setState({
      showAvatarInNavbar: false,
      backgroundShape: 'squircle',
      animationMode: 'always',
      customSeed: null,
    });

    set({
      user: null,
      isAuthenticated: false,
      isGuestMode: false,
      favorites: [],
      cards: [],
      orders: [],
      address: null,
      addresses: [],
      isLoading: false,
      isAuthInitialized: true,
    });

    setGuestModeStorage(false);
    clearGuestStorage();

    // 2. Perform all teardown and cleanup concurrently without blocking
    try {
      const activeChan = useRadarStore.getState().channel;
      if (activeChan) {
        try {
          activeChan.untrack().catch(() => {});
        } catch {}
      }
      useRadarStore.getState().cleanup();
    } catch {}

    // Reset cart for unauthenticated state immediately
    try {
      useCartStore.getState().initCartForUser(null).catch(() => {});
    } catch {}

    // Formal Supabase sign out with a 1200ms race guard to guarantee network latency never hangs logout
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);
    } catch {}
  },
  
  register: async (email, password, name) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { error: 'Por favor, ingresa un correo electrónico válido (ej. usuario@dominio.com).' };
    }

    const cleanName = sanitizeText(name, 70);
    if (!cleanName || cleanName.length < 2) {
      return { error: 'Por favor, ingresa un nombre válido (mínimo 2 caracteres, sin símbolos).' };
    }

    const pwdCheck = validateStrongPassword(password);
    if (!pwdCheck.isValid) {
      return { error: pwdCheck.error || 'La contraseña no cumple con los requisitos de seguridad.' };
    }

    const snapshotBeforeRegister = {
      isAuthenticated: get().isAuthenticated,
      favorites: [...get().favorites],
      addresses: [...get().addresses],
      cards: [...get().cards],
    };

    const { role, isRootAdmin } = await checkIsAdmin(cleanEmail);
    // Security: Never allow client to control metadata role; role is computed by server-checked logic
    const { data, error } = await supabase.auth.signUp({ 
      email: cleanEmail, 
      password,
      options: { data: { name: cleanName, role } } 
    });
    if (!error && data?.user) {
      setGuestModeStorage(false);
      const userObj: User = { id: data.user.id, email: cleanEmail, name: cleanName, role, isRootAdmin };

      // Upsert profile into user_profiles table
      try {
        await supabase.from('user_profiles').upsert({
          user_id: data.user.id,
          display_name: cleanName,
          email: cleanEmail,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch {}

      // Synchronize and merge guest cart + guest favorites/addresses/cards into the new account
      await useCartStore.getState().initCartForUser(data.user.id);
      const mergedData = await syncAndFetchMergedUserData(
        data.user.id,
        role,
        cleanEmail,
        data.session?.access_token,
        snapshotBeforeRegister
      );

      set({ 
        user: userObj, 
        isAuthenticated: true, 
        isGuestMode: false, 
        isLoading: false, 
        cards: mergedData.cards,
        orders: mergedData.orders,
        address: mergedData.address,
        addresses: mergedData.addresses,
        favorites: mergedData.favorites
      });

      await useThemeStore.getState().loadFromDB(data.user.id);
      await useAvatarSettingsStore.getState().loadSettingsFromDatabase(data.user.id);
      setupAvatarRealtimeListener(data.user.id);
    }
    return { error: error?.message || null };
  },

  addCard: async (card) => {
    const user = get().user;
    const newCard: PaymentCard = {
      ...card,
      id: generateUUID(),
      isDefault: get().cards.length === 0 || !!card.isDefault,
    };
    let nextCards: PaymentCard[];
    if (newCard.isDefault) {
      nextCards = [newCard, ...get().cards.map(c => ({ ...c, isDefault: false }))];
    } else {
      nextCards = [newCard, ...get().cards];
    }
    set({ cards: nextCards });

    if (user?.id) {
      // Authenticated: Persist to Database exclusively
      await syncCardsToCloud(user.id, nextCards);
    } else {
      // Guest: Store in guest local storage
      saveGuestCards(nextCards);
    }
  },

  removeCard: async (id) => {
    const user = get().user;
    const removedWasDefault = get().cards.find(c => c.id === id)?.isDefault;
    let nextCards = get().cards.filter(c => c.id !== id);
    if (removedWasDefault && nextCards.length > 0) {
      nextCards = nextCards.map((c, idx) => ({ ...c, isDefault: idx === 0 }));
    }
    set({ cards: nextCards });

    if (user?.id) {
      await syncCardsToCloud(user.id, nextCards);
    } else {
      saveGuestCards(nextCards);
    }
  },

  setDefaultCard: async (id) => {
    const user = get().user;
    const nextCards = get().cards.map(c => ({
      ...c,
      isDefault: c.id === id
    }));
    set({ cards: nextCards });

    if (user?.id) {
      await syncCardsToCloud(user.id, nextCards);
    } else {
      saveGuestCards(nextCards);
    }
  },
  
  toggleFavorite: async (productId) => {
    const { user, favorites } = get();
    const pidStr = String(productId);
    const isFav = favorites.includes(pidStr);
    const nextFavs = isFav
      ? favorites.filter(id => id !== pidStr)
      : [...favorites, pidStr];

    // Elegant crystalline chime when adding to favorites, subtle tick when removing
    if (!isFav) {
      playFavoriteSound();
    } else {
      playStepperTickSound('down');
    }

    set({ favorites: nextFavs });

    if (user?.id) {
      await syncFavoritesToCloud(user.id, nextFavs);
    } else {
      saveGuestFavorites(nextFavs);
    }
  },
  
  isFavorite: (productId) => get().favorites.includes(productId),
  
  addOrder: async (order) => {
    const user = get().user;
    const enrichedOrder: Order = {
      ...order,
      userId: user?.id,
      customerName: order.customerName || user?.name || 'Cliente Lumina',
      customerEmail: order.customerEmail || order.shippingAddress?.email || user?.email || 'cliente@lumina.com',
      customerIdNumber: order.customerIdNumber || order.shippingAddress?.idNumber,
      customerPhone: order.customerPhone || order.shippingAddress?.phone,
      recipient: order.recipient || order.shippingAddress?.recipient || order.customerName || user?.name || 'Cliente',
      time: order.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      createdAt: order.createdAt || new Date().toISOString()
    };
    const nextOrders = [enrichedOrder, ...get().orders];
    set({ orders: nextOrders });

    // Deduct stock optimistically in memory so the catalog reflects the purchase instantly
    if (enrichedOrder.items && enrichedOrder.items.length > 0) {
      try {
        useCatalogStore.getState().decrementStockOptimistic(
          enrichedOrder.items.map(it => ({ productId: it.product.id, quantity: it.quantity }))
        );
      } catch (err) {
        console.error("Error updating local stock:", err);
      }
    }

    // 1. Sync via API route for store-wide live persistence
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ order: enrichedOrder })
      });
    } catch {}

    // 2. Sync to Supabase
    if (user) {
      try {
        await supabase.from('orders').upsert({
          id: enrichedOrder.id,
          user_id: user.id,
          status: enrichedOrder.status,
          total: enrichedOrder.total,
          items: enrichedOrder.items,
          tracking_number: enrichedOrder.trackingNumber,
          customer_name: enrichedOrder.customerName,
          customer_email: enrichedOrder.customerEmail,
          customer_id_number: enrichedOrder.customerIdNumber || enrichedOrder.shippingAddress?.idNumber || null,
          customer_phone: enrichedOrder.customerPhone || enrichedOrder.shippingAddress?.phone || null,
          recipient: enrichedOrder.recipient,
          shipping_address: enrichedOrder.shippingAddress,
          payment_method: enrichedOrder.paymentMethod,
          created_at: enrichedOrder.createdAt
        });
      } catch {}
    }
  },

  updateOrderStatus: async (orderId, status, trackingInfo) => {
    const user = get().user;
    const nextOrders = get().orders.map(order => {
      if (order.id !== orderId) return order;
      const nextTrackingNumber =
        status === 'Procesando'
          ? undefined
          : trackingInfo?.trackingNumber !== undefined
            ? trackingInfo.trackingNumber
            : order.trackingNumber;
      const nextTrackingUrl =
        status === 'Procesando'
          ? undefined
          : trackingInfo?.trackingUrl !== undefined
            ? trackingInfo.trackingUrl
            : order.trackingUrl;
      const nextCarrierName =
        status === 'Procesando'
          ? undefined
          : trackingInfo?.carrierName !== undefined
            ? trackingInfo.carrierName
            : order.carrierName;
      return {
        ...order,
        status,
        trackingNumber: nextTrackingNumber,
        trackingUrl: nextTrackingUrl,
        carrierName: nextCarrierName,
      };
    });
    set({ orders: nextOrders });

    const updatedOrder = nextOrders.find(o => o.id === orderId);
    const serializedTracking =
      status === 'Procesando'
        ? ''
        : serializeTrackingField(
            updatedOrder?.trackingNumber,
            updatedOrder?.trackingUrl,
            updatedOrder?.carrierName
          );

    // Emit Wallet Pass Push Notification event on client
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('lumina:wallet-order-push', {
            detail: {
              orderId,
              status,
              trackingNumber: updatedOrder?.trackingNumber,
              trackingUrl: updatedOrder?.trackingUrl,
              carrierName: updatedOrder?.carrierName,
              timestamp: new Date().toISOString(),
            },
          })
        );
        if ('Notification' in window && Notification.permission === 'granted') {
          const title =
            status === 'Enviado'
              ? `📦 Tu pedido #${orderId} ha sido Enviado`
              : status === 'Entregado'
                ? `✅ Tu pedido #${orderId} fue Entregado`
                : `🔄 Actualización de Pedido #${orderId}`;
          const body =
            status === 'Enviado' && updatedOrder?.trackingNumber
              ? `Guía de rastreo: ${updatedOrder.trackingNumber}${updatedOrder.carrierName ? ` (${updatedOrder.carrierName})` : ''}. Toca tu tarjeta Wallet para rastrear.`
              : `El estado de tu pedido en Wallet se actualizó a: ${status}.`;
          new Notification(title, { body });
        }
      } catch {}
    }

    // 1. Sync status change to /api/orders
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      await fetch('/api/orders', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          orderId,
          status,
          trackingNumber: updatedOrder?.trackingNumber,
          trackingUrl: updatedOrder?.trackingUrl,
          carrierName: updatedOrder?.carrierName,
        }),
      });
    } catch {}

    // 2. Sync to Supabase
    if (user) {
      try {
        await supabase
          .from('orders')
          .update({
            status,
            tracking_number: serializedTracking || null,
          })
          .eq('id', orderId);
      } catch {}
    }
  },

  refreshOrders: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/orders?userId=${encodeURIComponent(user.id)}&role=${encodeURIComponent(user.role)}&email=${encodeURIComponent(user.email)}`, {
        headers,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders)) {
          set({ orders: json.orders });
        }
      }
    } catch {}
  },

  addAddress: async (addrData) => {
    const current = get().addresses;
    if (current.length >= 4) return false;

    const user = get().user;
    const newId = generateUUID();
    const shouldBeDefault = current.length === 0 || !!addrData.isDefault;

    const newAddr: ShippingAddress = {
      ...addrData,
      recipient: addrData.recipient?.trim() || user?.name || 'Destinatario',
      id: newId,
      isDefault: shouldBeDefault,
    };

    let nextAddresses: ShippingAddress[];
    if (shouldBeDefault) {
      nextAddresses = [newAddr, ...current.map(a => ({ ...a, isDefault: false }))];
    } else {
      nextAddresses = [...current, newAddr];
    }

    const activeAddr = nextAddresses.find(a => a.isDefault) || nextAddresses[0] || null;
    set({ addresses: nextAddresses, address: activeAddr });

    if (user?.id) {
      // Authenticated: Persist to Database exclusively
      await syncAddressesToCloud(user.id, nextAddresses, activeAddr);

      try {
        const orders = get().orders;
        const totalSpent = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
        const purchasesCount = orders?.length || 0;
        const section = user.role === 'ADMIN' ? 'Mi Perfil / Mapa' : 'Mi Perfil / Pedidos';
        useRadarStore.getState().trackActivity(user, activeAddr?.city || '', totalSpent, purchasesCount, section);
      } catch {}
    } else {
      // Guest: Store in guest local storage
      saveGuestAddresses(nextAddresses, activeAddr);
    }
    return true;
  },

  removeAddress: async (id) => {
    const current = get().addresses;
    const targetId = id || get().address?.id || current[0]?.id;
    if (!targetId) {
      set({ addresses: [], address: null });
      if (get().user?.id) {
        await syncAddressesToCloud(get().user?.id, [], null);
      } else {
        saveGuestAddresses([], null);
      }
      return;
    }

    const removedWasDefault = current.find(a => a.id === targetId)?.isDefault;
    let nextAddresses = current.filter(a => a.id !== targetId);
    if (removedWasDefault && nextAddresses.length > 0) {
      nextAddresses = nextAddresses.map((a, idx) => ({ ...a, isDefault: idx === 0 }));
    }
    const activeAddr = nextAddresses.find(a => a.isDefault) || nextAddresses[0] || null;
    set({ addresses: nextAddresses, address: activeAddr });

    const user = get().user;
    if (user?.id) {
      await syncAddressesToCloud(user.id, nextAddresses, activeAddr);
    } else {
      saveGuestAddresses(nextAddresses, activeAddr);
    }
  },

  setDefaultAddress: async (id) => {
    const current = get().addresses;
    const nextAddresses = current.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    const activeAddr = nextAddresses.find(a => a.id === id) || null;
    set({ addresses: nextAddresses, address: activeAddr });

    const user = get().user;
    if (user?.id) {
      await syncAddressesToCloud(user.id, nextAddresses, activeAddr);
    } else {
      saveGuestAddresses(nextAddresses, activeAddr);
    }
  },

  setAddress: async (addressInput) => {
    const current = get().addresses;
    const user = get().user;

    if ('id' in addressInput && addressInput.id && current.some(a => a.id === addressInput.id)) {
      const selected = current.find(a => a.id === addressInput.id) || (addressInput as ShippingAddress);
      set({ address: selected });
      if (user?.id) {
        await syncAddressesToCloud(user.id, current, selected);
      } else {
        saveGuestAddresses(current, selected);
      }
      return;
    }
    if (current.length === 0) {
      await get().addAddress(addressInput);
      return;
    }
    const targetId = get().address?.id || current[0].id;
    const nextAddresses = current.map(a => a.id === targetId ? { ...a, ...addressInput } : a);
    const activeAddr = nextAddresses.find(a => a.id === targetId) || nextAddresses[0];
    set({ addresses: nextAddresses, address: activeAddr });

    if (user?.id) {
      await syncAddressesToCloud(user.id, nextAddresses, activeAddr);
    } else {
      saveGuestAddresses(nextAddresses, activeAddr);
    }
  },

  updateUserName: async (name) => {
    const cleanName = formatCleanName(name);
    const { error } = await supabase.auth.updateUser({ data: { name: cleanName } });
    if (!error) {
      set((state) => ({
        user: state.user ? { ...state.user, name: cleanName } : null
      }));
      const currentUser = get().user;
      if (currentUser?.id) {
        try {
          await supabase.from('user_profiles').upsert({
            user_id: currentUser.id,
            display_name: cleanName,
            email: currentUser.email?.toLowerCase().trim() || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        } catch {}
      }
    }
    return { error: error?.message || null };
  },

  updateUserPassword: async (password) => {
    const pwdCheck = validateStrongPassword(password);
    if (!pwdCheck.isValid) {
      return { error: pwdCheck.error || 'La contraseña no cumple con los requisitos de seguridad.' };
    }
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message || null };
  },

  recheckUserRole: async () => {
    const currentUser = get().user;
    if (!currentUser || !currentUser.email) return false;

    const { role, isRootAdmin } = await checkIsAdmin(currentUser.email, true);
    if (role !== currentUser.role || isRootAdmin !== currentUser.isRootAdmin) {
      const updatedUser: User = {
        ...currentUser,
        role,
        isRootAdmin,
      };

      set({ user: updatedUser });

      if (role === 'ADMIN') {
        // Refresh store orders and administrative data immediately
        try {
          const personalData = await fetchUserDataFromDatabase(currentUser.id, 'ADMIN', currentUser.email);
          set({
            orders: personalData.orders,
          });
        } catch {}
      }

      return true;
    }
    return false;
  },
}));
