import { create } from 'zustand';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { CartItem, useCartStore } from './store';
import { useThemeStore } from './themeStore';
import { useRadarStore } from './radarStore';

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
  total: number;
  items: CartItem[];
  customerName?: string;
  customerEmail?: string;
  recipient?: string;
  shippingAddress?: ShippingAddress;
  paymentMethod?: string;
  userId?: string;
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
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
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
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
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

  // 2. Primary cloud source of truth: active_sessions SYS_ADMIN_INVITES
  try {
    const { data: sysRow } = await supabase
      .from('active_sessions')
      .select('email')
      .eq('user_id', 'SYS_ADMIN_INVITES')
      .maybeSingle();

    if (sysRow?.email) {
      try {
        const parsed = JSON.parse(sysRow.email);
        if (Array.isArray(parsed) && parsed.map(e => String(e).toLowerCase().trim()).includes(normalized)) {
          const res = { role: 'ADMIN' as const, isRootAdmin: false };
          adminCache.set(normalized, { ...res, timestamp: Date.now() });
          return res;
        }
      } catch {}
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

const fetchUserDataFromDatabase = async (userId: string, role: 'USER' | 'ADMIN' = 'USER', email: string = '') => {
  try {
    const cleanEmail = (email || '').toLowerCase().trim();
    const isAdmin = role === 'ADMIN' || cleanEmail === MASTER_ADMIN_EMAIL;

    // 1. Fetch store/user orders from persistent API with instant synchronization
    let orders: Order[] = [];
    try {
      const res = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders)) {
          orders = json.orders;
        }
      }
    } catch (apiErr) {
      console.warn("Could not fetch orders from /api/orders, checking Supabase/metadata fallback", apiErr);
    }

    // Supabase fallback if API returned no orders
    if (orders.length === 0) {
      try {
        let query = supabase
          .from('orders')
          .select('*')
          .not('id', 'like', 'SYS_%')
          .order('created_at', { ascending: false });
        if (!isAdmin) {
          query = query.eq('user_id', userId);
        }
        const { data: dbOrders } = await query;
        if (dbOrders && dbOrders.length > 0) {
          orders = (dbOrders as Array<Record<string, unknown>>)
            .filter((o) => !String(o.id || '').startsWith('SYS_'))
            .map((o) => ({
              id: String(o.id || ''),
              userId: String(o.user_id || ''),
              customerName: String(o.customer_name || 'Cliente Lumina'),
              customerEmail: String(o.customer_email || email),
              recipient: String(o.recipient || ''),
              shippingAddress: o.shipping_address as Order['shippingAddress'],
              paymentMethod: String(o.payment_method || ''),
              date: o.created_at ? new Date(String(o.created_at)).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Reciente',
              time: o.created_at ? new Date(String(o.created_at)).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '12:00',
              createdAt: String(o.created_at || new Date().toISOString()),
              status: (o.status as Order['status']) || 'Procesando',
              trackingNumber: o.tracking_number ? String(o.tracking_number) : undefined,
              total: Number(o.total) || 0,
              items: Array.isArray(o.items) ? (o.items as Order['items']) : [],
          }));
        }
      } catch {}
    }

    // 2. Fetch addresses from Supabase addresses table (single source of truth)
    let addresses: ShippingAddress[] = [];
    try {
      const { data: dbAddrs, error: aErr } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(4);

      if (dbAddrs && !aErr && dbAddrs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addresses = dbAddrs.map((dbAddr: any, index: number) => ({
          id: dbAddr.id || `addr-${index}`,
          recipient: dbAddr.recipient || dbAddr.receiver_name || '',
          street: dbAddr.street || '',
          city: dbAddr.city || '',
          state: dbAddr.state || '',
          postalCode: dbAddr.postal_code || '',
          country: dbAddr.country || 'Ecuador',
          isDefault: dbAddr.is_default !== undefined ? !!dbAddr.is_default : index === 0,
        }));
      }
    } catch {}

    // 3. Fetch cards directly from Supabase payment_cards table (single source of truth)
    let cards: PaymentCard[] = [];
    try {
      const { data: dbCards, error: cErr } = await supabase
        .from('payment_cards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (dbCards && !cErr && dbCards.length > 0) {
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

    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0] || null;

    return { cards, orders, addresses, address: defaultAddr };
  } catch (e) {
    console.error("Error fetching user data from Supabase:", e);
    return { cards: [], orders: [], addresses: [], address: null };
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

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAuthInitialized: false,
  isGuestMode: getInitialGuestMode(),
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
          setGuestModeStorage(false);
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

          const currentUserId = get().user?.id;
          if (currentUserId !== session.user.id) {
            set({ 
              user: userObj, 
              isAuthenticated: true, 
              isLoading: false,
              isAuthInitialized: true,
            });

            const newUserId = session.user.id;
            setTimeout(async () => {
              try {
                const personalData = await fetchUserDataFromDatabase(newUserId, role, email);
                set({
                  cards: personalData.cards,
                  orders: personalData.orders,
                  addresses: personalData.addresses,
                  address: personalData.address
                });

                useCartStore.getState().initCartForUser(newUserId);
                const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', newUserId);
                if (favs) set({ favorites: favs.map(f => f.product_id) });
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

        set({ 
          user: userObj, 
          isAuthenticated: true, 
          isLoading: false,
          isAuthInitialized: true,
        });

        const currentUserId = session.user.id;
        setTimeout(async () => {
          try {
            useCartStore.getState().initCartForUser(currentUserId);
            const personalData = await fetchUserDataFromDatabase(currentUserId, role, email);
            set({
              cards: personalData.cards,
              orders: personalData.orders,
              addresses: personalData.addresses,
              address: personalData.address
            });

            const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', currentUserId);
            if (favs) set({ favorites: favs.map(f => f.product_id) });
          } catch {}
        }, 0);
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isGuestMode: getInitialGuestMode(),
          isLoading: false, 
          isAuthInitialized: true 
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

    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (!error && data?.user) {
      setGuestModeStorage(false);
      const userEmail = data.user.email || cleanEmail;
      const { role, isRootAdmin } = await checkIsAdmin(userEmail);
      const name = formatCleanName(data.user.user_metadata?.name || userEmail.split('@')[0]);
      const personalData = await fetchUserDataFromDatabase(data.user.id, role, userEmail);
      const userObj: User = { id: data.user.id, email: userEmail, name, role, isRootAdmin };

      set({ 
        user: userObj, 
        isAuthenticated: true, 
        isGuestMode: false,
        isLoading: false, 
        isAuthInitialized: true,
        cards: personalData.cards,
        orders: personalData.orders,
        addresses: personalData.addresses,
        address: personalData.address
      });

      // Synchronize and load user's private cart from Supabase
      await useCartStore.getState().initCartForUser(data.user.id);
      await useThemeStore.getState().loadFromDB(data.user.id);

      const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', data.user.id);
      if (favs) set({ favorites: favs.map(f => f.product_id) });
    }
    return { error: error?.message || null };
  },
  
  logout: async () => {
    // 1. Immediately reset in-memory user and authentication state (0ms instant UI feedback!)
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

    if (!password || typeof password !== 'string' || password.length < 6) {
      return { error: 'La contraseña debe contener al menos 6 caracteres.' };
    }
    if (password.length > 72) {
      return { error: 'La contraseña excede el límite máximo de seguridad permitido.' };
    }

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
          updated_at: new Date().toISOString()
        });
      } catch {}

      set({ 
        user: userObj, 
        isAuthenticated: true,
        isGuestMode: false,
        isLoading: false,
        cards: [],
        orders: [],
        address: null,
        favorites: []
      });

      // Initialize empty private cart for new user in Supabase
      await useCartStore.getState().initCartForUser(data.user.id);
      await useThemeStore.getState().loadFromDB(data.user.id);
    }
    return { error: error?.message || null };
  },

  addCard: async (card) => {
    const user = get().user;
    const newCard: PaymentCard = {
      ...card,
      id: Math.random().toString(36).substring(7)
    };
    const nextCards = [newCard, ...get().cards];
    set({ cards: nextCards });

    if (user) {
      try {
        await supabase.from('payment_cards').insert({
          id: newCard.id,
          user_id: user.id,
          number: card.number,
          holder: card.holder,
          exp: card.exp,
          type: card.type,
          is_default: card.isDefault || false,
        });
      } catch (err) {
        console.warn('Error saving card to payment_cards table:', err);
      }
    }
  },

  removeCard: async (id) => {
    const user = get().user;
    const nextCards = get().cards.filter(c => c.id !== id);
    set({ cards: nextCards });

    if (user) {
      try {
        await supabase.from('payment_cards').delete().eq('id', id);
      } catch (err) {
        console.warn('Error deleting card from payment_cards table:', err);
      }
    }
  },

  setDefaultCard: async (id) => {
    const user = get().user;
    const nextCards = get().cards.map(c => ({
      ...c,
      isDefault: c.id === id
    }));
    set({ cards: nextCards });

    if (user) {
      try {
        await supabase.from('payment_cards').update({ is_default: false }).eq('user_id', user.id);
        await supabase.from('payment_cards').update({ is_default: true }).eq('id', id);
      } catch (err) {
        console.warn('Error updating default card in payment_cards table:', err);
      }
    }
  },
  
  toggleFavorite: async (productId) => {
    const { user, favorites } = get();
    if (!user) return;
    
    const isFav = favorites.includes(productId);
    if (isFav) {
      set({ favorites: favorites.filter(id => id !== productId) });
      await supabase.from('favorites').delete().match({ user_id: user.id, product_id: productId });
    } else {
      set({ favorites: [...favorites, productId] });
      await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
    }
  },
  
  isFavorite: (productId) => get().favorites.includes(productId),
  
  addOrder: async (order) => {
    const user = get().user;
    const enrichedOrder: Order = {
      ...order,
      userId: user?.id,
      customerName: order.customerName || user?.name || 'Cliente Lumina',
      customerEmail: order.customerEmail || user?.email || 'cliente@lumina.com',
      time: order.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      createdAt: order.createdAt || new Date().toISOString()
    };
    const nextOrders = [enrichedOrder, ...get().orders];
    set({ orders: nextOrders });

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
    } catch (e) {
      console.warn("Could not sync order to /api/orders", e);
    }

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
          recipient: enrichedOrder.recipient,
          shipping_address: enrichedOrder.shippingAddress,
          payment_method: enrichedOrder.paymentMethod,
          created_at: enrichedOrder.createdAt
        });
      } catch (e) {
        console.warn("Error saving order to Supabase:", e);
      }
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const user = get().user;
    const nextOrders = get().orders.map(order => order.id === orderId ? { ...order, status } : order);
    set({ orders: nextOrders });

    // 1. Sync status change to /api/orders
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      await fetch('/api/orders', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ orderId, status })
      });
    } catch (e) {
      console.warn("Could not sync status change to /api/orders", e);
    }

    // 2. Sync to Supabase
    if (user) {
      try {
        await supabase.from('orders').update({ status }).eq('id', orderId);
      } catch (e) {
        console.warn("Error updating order status in Supabase:", e);
      }
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
    const newId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
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

    if (user) {
      try {
        const orders = get().orders;
        const totalSpent = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
        const purchasesCount = orders?.length || 0;
        const section = user.role === 'ADMIN' ? 'Mi Perfil / Mapa' : 'Mi Perfil / Pedidos';
        useRadarStore.getState().trackActivity(user, activeAddr?.city || '', totalSpent, purchasesCount, section);
      } catch {}
      try {
        await supabase.from('addresses').insert({
          id: newAddr.id,
          user_id: user.id,
          recipient: newAddr.recipient,
          street: newAddr.street,
          city: newAddr.city,
          state: newAddr.state,
          postal_code: newAddr.postalCode,
          country: newAddr.country,
          is_default: newAddr.isDefault,
        });
      } catch (err) {
        console.warn('Error saving address to addresses table:', err);
      }
    }
    return true;
  },

  removeAddress: async (id) => {
    const current = get().addresses;
    const targetId = id || get().address?.id || current[0]?.id;
    if (!targetId) {
      set({ addresses: [], address: null });
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
    if (user) {
      try {
        const orders = get().orders;
        const totalSpent = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
        const purchasesCount = orders?.length || 0;
        const section = user.role === 'ADMIN' ? 'Mi Perfil / Mapa' : 'Mi Perfil / Pedidos';
        useRadarStore.getState().trackActivity(user, activeAddr?.city || '', totalSpent, purchasesCount, section);
      } catch {}
      try {
        await supabase.from('addresses').delete().eq('id', targetId);
      } catch (err) {
        console.warn('Error deleting address from addresses table:', err);
      }
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
    if (user) {
      try {
        const orders = get().orders;
        const totalSpent = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
        const purchasesCount = orders?.length || 0;
        const section = user.role === 'ADMIN' ? 'Mi Perfil / Mapa' : 'Mi Perfil / Pedidos';
        useRadarStore.getState().trackActivity(user, activeAddr?.city || '', totalSpent, purchasesCount, section);
      } catch {}
      try {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
        await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      } catch (err) {
        console.warn('Error updating default address in addresses table:', err);
      }
    }
  },

  setAddress: async (addressInput) => {
    const current = get().addresses;
    // If it has an id and already exists in addresses, set it as the active address
    if ('id' in addressInput && addressInput.id && current.some(a => a.id === addressInput.id)) {
      set({ address: addressInput as ShippingAddress });
      return;
    }
    // If no addresses registered yet, add it
    if (current.length === 0) {
      await get().addAddress(addressInput);
      return;
    }
    // Otherwise update the active/default address
    const targetId = get().address?.id || current[0].id;
    const nextAddresses = current.map(a => a.id === targetId ? { ...a, ...addressInput } : a);
    const activeAddr = nextAddresses.find(a => a.id === targetId) || nextAddresses[0];
    set({ addresses: nextAddresses, address: activeAddr });
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
            updated_at: new Date().toISOString()
          });
        } catch {}
      }
    }
    return { error: error?.message || null };
  },

  updateUserPassword: async (password) => {
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
