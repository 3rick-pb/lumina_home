import { create } from 'zustand';
import { supabase } from './supabase';

export interface CouponRedemptionRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerAvatarSeed?: string;
  customerAvatarShape?: 'squircle' | 'circle';
  usedAt: string; // ISO date string e.g. "2026-10-01T18:24:00Z"
  beforeAmount: number; // Subtotal before discount
  discountAmount: number; // Monetary discount subtracted
  afterAmount: number; // Final amount paid
  itemsSummary: string; // Brief summary of items bought
  paymentMethod?: string;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountPercent: number;
  discountType: 'percent' | 'fixed' | 'free_shipping';
  fixedAmount?: number;
  scope: 'all' | 'niche';
  targetNiche?: string;
  minOrderAmount: number;
  maxUses?: number | null;
  maxUsesPerUser?: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  shareCount: number;
  redemptions?: CouponRedemptionRecord[];
  metrics?: {
    totalRedemptions: number;
    totalSaved: number;
    averageTicket: number;
    shareCount: number;
  };
}

interface CouponState {
  coupons: DiscountCoupon[];
  isLoading: boolean;
  activeFilter: 'all' | 'storewide' | 'niche' | 'active';
  searchQuery: string;
  
  // Actions
  fetchCoupons: () => Promise<void>;
  generateRandomCoupon: (options?: { preferredScope?: 'all' | 'niche'; targetNiche?: string }) => DiscountCoupon;
  createCoupon: (coupon: Omit<DiscountCoupon, 'id' | 'createdAt' | 'usedCount' | 'shareCount'>) => DiscountCoupon;
  toggleCouponStatus: (id: string) => void;
  deleteCoupon: (id: string) => void;
  recordShare: (id: string) => void;
  getCouponByCode: (code: string) => DiscountCoupon | null;
  getShareMessage: (coupon: DiscountCoupon) => string;
  setActiveFilter: (filter: 'all' | 'storewide' | 'niche' | 'active') => void;
  setSearchQuery: (query: string) => void;
}

const STORAGE_KEY = 'lumina_discount_coupons_v3';

const INITIAL_DEFAULT_COUPONS: DiscountCoupon[] = [
  {
    id: 'coup-lumina10',
    code: 'LUMINA10',
    title: 'Bienvenida Lumina',
    description: '10% de descuento en tu primera compra en toda la tienda.',
    discountPercent: 10,
    discountType: 'percent',
    scope: 'all',
    minOrderAmount: 0,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    shareCount: 0,
    redemptions: [],
    metrics: {
      totalRedemptions: 0,
      totalSaved: 0,
      averageTicket: 0,
      shareCount: 0,
    },
  },
  {
    id: 'coup-amigos20',
    code: 'AMIGOS-VIP20',
    title: 'Pase Exclusivo Amigos & Familia',
    description: '20% OFF en toda la tienda para compartir con tus amigos y grupos.',
    discountPercent: 20,
    discountType: 'percent',
    scope: 'all',
    minOrderAmount: 30,
    maxUses: 50,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    shareCount: 0,
    redemptions: [],
    metrics: {
      totalRedemptions: 0,
      totalSaved: 0,
      averageTicket: 0,
      shareCount: 0,
    },
  },
  {
    id: 'coup-luxlights25',
    code: 'LUX-LIGHTS25',
    title: 'Flash Sale Iluminación de Autor',
    description: '25% OFF en lámparas esculturales y luminarias de diseño.',
    discountPercent: 25,
    discountType: 'percent',
    scope: 'niche',
    targetNiche: 'Iluminación',
    minOrderAmount: 50,
    maxUses: 30,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    shareCount: 0,
    redemptions: [],
    metrics: {
      totalRedemptions: 0,
      totalSaved: 0,
      averageTicket: 0,
      shareCount: 0,
    },
  },
  {
    id: 'coup-enviogratis',
    code: 'ENVIOGRATIS',
    title: 'Envío Bonificado 100%',
    description: 'Cubre el costo de despacho a cualquier ciudad del país.',
    discountPercent: 0,
    discountType: 'free_shipping',
    scope: 'all',
    minOrderAmount: 40,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    shareCount: 0,
    redemptions: [],
    metrics: {
      totalRedemptions: 0,
      totalSaved: 0,
      averageTicket: 0,
      shareCount: 0,
    },
  }
];

const NICHES_LIST = [
  'Iluminación',
  'Aromaterapia',
  'Home Office',
  'Textiles',
  'Cerámica',
  'Decoración',
  'Cocina',
  'Bienestar'
];

const CODE_PREFIXES = [
  'LUMINA',
  'AMIGOS',
  'VIP',
  'FLASH',
  'DECO',
  'CLUB',
  'ZEN',
  'DESIGN',
  'HOGAR',
  'VIBE',
  'SPECIAL',
  'REGALO'
];

function loadLocalCoupons(): DiscountCoupon[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_COUPONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_DEFAULT_COUPONS;
}

function saveLocalCoupons(coupons: DiscountCoupon[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  } catch {}
}

let realtimeCouponsSubscribed = false;
function subscribeToCouponsRealtime(onUpdate: () => void) {
  if (typeof window === 'undefined' || realtimeCouponsSubscribed) return;
  realtimeCouponsSubscribed = true;
  try {
    supabase
      .channel('lumina_coupons_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupon_redemptions' }, () => {
        onUpdate();
      })
      .subscribe();
  } catch (err) {
    console.warn('Realtime subscription error on coupons:', err);
  }
}

export const useCouponStore = create<CouponState>((set, get) => ({
  coupons: typeof window !== 'undefined' ? loadLocalCoupons() : INITIAL_DEFAULT_COUPONS,
  isLoading: false,
  activeFilter: 'all',
  searchQuery: '',

  fetchCoupons: async () => {
    set({ isLoading: true });

    // Enable Supabase Realtime synchronization on first fetch
    subscribeToCouponsRealtime(() => {
      get().fetchCoupons();
    });

    try {
      const res = await fetch('/api/coupons', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.coupons) && json.coupons.length > 0) {
          const apiCoupons: DiscountCoupon[] = json.coupons;
          saveLocalCoupons(apiCoupons);
          set({ coupons: apiCoupons, isLoading: false });
          return;
        }
      }
    } catch (apiErr) {
      console.warn('Could not fetch coupons via /api/coupons, checking Supabase direct:', apiErr);
    }

    // Direct Supabase fallback
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        interface CloudCouponRecord {
          id?: string;
          code: string;
          title?: string;
          description?: string;
          discount_percent?: number | string;
          discount_type?: 'percent' | 'fixed' | 'free_shipping';
          fixed_amount?: number | string;
          scope?: 'all' | 'niche';
          is_free_shipping?: boolean;
          target_niche?: string | null;
          min_order_amount?: number | string;
          max_uses?: number | null;
          max_uses_per_user?: number | null;
          used_count?: number | string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          share_count?: number | string;
        }

        const cloudCoupons: DiscountCoupon[] = (data as unknown as CloudCouponRecord[]).map((item) => ({
          id: item.id || `cloud-${item.code}`,
          code: item.code,
          title: item.title || `Cupón ${item.code}`,
          description: item.description || `${item.discount_percent || 0}% de descuento`,
          discountPercent: Number(item.discount_percent) || 0,
          discountType: item.discount_type || (item.is_free_shipping ? 'free_shipping' : (Number(item.discount_percent) > 0 ? 'percent' : 'fixed')),
          fixedAmount: Number(item.fixed_amount) || 0,
          scope: item.scope || (item.target_niche ? 'niche' : 'all'),
          targetNiche: item.target_niche || undefined,
          minOrderAmount: Number(item.min_order_amount) || 0,
          maxUses: item.max_uses !== undefined ? item.max_uses : null,
          maxUsesPerUser: Number(item.max_uses_per_user) || 1,
          usedCount: Number(item.used_count) || 0,
          expiresAt: item.expires_at || null,
          isActive: item.is_active !== false,
          createdAt: item.created_at || new Date().toISOString(),
          shareCount: Number(item.share_count) || 0,
          redemptions: [],
          metrics: {
            totalRedemptions: Number(item.used_count) || 0,
            totalSaved: 0,
            averageTicket: 0,
            shareCount: Number(item.share_count) || 0,
          },
        }));

        saveLocalCoupons(cloudCoupons);
        set({ coupons: cloudCoupons, isLoading: false });
        return;
      }
    } catch (e) {
      console.warn('Could not sync coupons directly from cloud:', e);
    }
    set({ isLoading: false });
  },

  generateRandomCoupon: (options) => {
    // 1. Choose Scope
    const isStorewide = options?.preferredScope === 'all' 
      ? true 
      : options?.preferredScope === 'niche' 
      ? false 
      : Math.random() > 0.45; // 55% storewide, 45% niche
    
    const chosenNiche = isStorewide 
      ? undefined 
      : (options?.targetNiche || NICHES_LIST[Math.floor(Math.random() * NICHES_LIST.length)]);

    // 2. Choose Discount Value
    const discountPool = [10, 15, 20, 25, 30, 35];
    const discountVal = discountPool[Math.floor(Math.random() * discountPool.length)];

    // 3. Generate Catchy Code Name
    const prefix = CODE_PREFIXES[Math.floor(Math.random() * CODE_PREFIXES.length)];
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const nicheShort = chosenNiche ? chosenNiche.replace(/\s+/g, '').slice(0, 5).toUpperCase() : 'ALL';
    const code = Math.random() > 0.5 
      ? `${prefix}${discountVal}` 
      : `${prefix}-${nicheShort}${discountVal}`;

    // 4. Min order and duration
    const minOrderPool = [0, 20, 35, 50];
    const minOrder = minOrderPool[Math.floor(Math.random() * minOrderPool.length)];
    const durationDaysPool = [7, 15, 30, null];
    const chosenDuration = durationDaysPool[Math.floor(Math.random() * durationDaysPool.length)];
    const expiresAt = chosenDuration 
      ? new Date(Date.now() + chosenDuration * 86400000).toISOString() 
      : null;

    const maxUsesPool = [15, 30, 50, 100, null];
    const maxUses = maxUsesPool[Math.floor(Math.random() * maxUsesPool.length)];

    const title = isStorewide 
      ? `Cupón Sorpresa ${discountVal}% Tienda Completa`
      : `Promoción Especial ${discountVal}% en ${chosenNiche}`;

    const description = isStorewide
      ? `Aplica un ${discountVal}% de descuento inmediato en cualquier producto del catálogo Lumina.`
      : `Aplica un ${discountVal}% de descuento exclusivo para piezas y accesorios de la colección ${chosenNiche}.`;

    const newCoupon: DiscountCoupon = {
      id: `coup-${Date.now()}-${randomSuffix}`,
      code: code.toUpperCase(),
      title,
      description,
      discountPercent: discountVal,
      discountType: 'percent',
      fixedAmount: 0,
      scope: isStorewide ? 'all' : 'niche',
      targetNiche: chosenNiche,
      minOrderAmount: minOrder,
      maxUses,
      maxUsesPerUser: 1,
      usedCount: 0,
      expiresAt,
      isActive: true,
      createdAt: new Date().toISOString(),
      shareCount: 0,
      redemptions: [],
      metrics: {
        totalRedemptions: 0,
        totalSaved: 0,
        averageTicket: 0,
        shareCount: 0,
      },
    };

    const updated = [newCoupon, ...get().coupons];
    saveLocalCoupons(updated);
    set({ coupons: updated });

    // Sync to PostgreSQL via /api/coupons
    fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newCoupon.code,
        title: newCoupon.title,
        description: newCoupon.description,
        discountPercent: newCoupon.discountPercent,
        discountType: newCoupon.discountType,
        fixedAmount: 0,
        scope: newCoupon.scope,
        targetNiche: newCoupon.targetNiche || null,
        minOrderAmount: newCoupon.minOrderAmount,
        maxUses: newCoupon.maxUses,
        maxUsesPerUser: 1,
        expiresAt: newCoupon.expiresAt,
        isActive: true,
      }),
    }).then(res => res.json()).then(data => {
      if (data.coupon) {
        const refreshed = get().coupons.map(c => c.code === newCoupon.code ? { ...c, id: data.coupon.id } : c);
        set({ coupons: refreshed });
        saveLocalCoupons(refreshed);
      }
    }).catch(err => {
      console.warn('Could not post generated coupon to API:', err);
    });

    return newCoupon;
  },

  createCoupon: (couponData) => {
    const cleanCode = couponData.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const newCoupon: DiscountCoupon = {
      ...couponData,
      id: `coup-${Date.now()}`,
      code: cleanCode,
      usedCount: 0,
      shareCount: 0,
      createdAt: new Date().toISOString(),
      redemptions: [],
      metrics: {
        totalRedemptions: 0,
        totalSaved: 0,
        averageTicket: 0,
        shareCount: 0,
      },
    };

    const updated = [newCoupon, ...get().coupons.filter(c => c.code !== cleanCode)];
    saveLocalCoupons(updated);
    set({ coupons: updated });

    // Persist via /api/coupons
    fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newCoupon.code,
        title: newCoupon.title,
        description: newCoupon.description,
        discountPercent: newCoupon.discountPercent,
        discountType: newCoupon.discountType,
        fixedAmount: newCoupon.fixedAmount || 0,
        scope: newCoupon.scope,
        targetNiche: newCoupon.targetNiche || null,
        minOrderAmount: newCoupon.minOrderAmount,
        maxUses: newCoupon.maxUses,
        maxUsesPerUser: newCoupon.maxUsesPerUser || 1,
        expiresAt: newCoupon.expiresAt,
        isActive: newCoupon.isActive,
      }),
    }).then(res => res.json()).then(data => {
      if (data.coupon) {
        const refreshed = get().coupons.map(c => c.code === cleanCode ? { ...c, id: data.coupon.id } : c);
        set({ coupons: refreshed });
        saveLocalCoupons(refreshed);
      }
    }).catch(err => {
      console.warn('Could not create coupon via API:', err);
    });

    return newCoupon;
  },

  toggleCouponStatus: (id) => {
    const target = get().coupons.find(c => c.id === id);
    if (!target) return;
    const nextState = !target.isActive;

    const updated = get().coupons.map(c => {
      if (c.id === id) {
        return { ...c, isActive: nextState };
      }
      return c;
    });
    saveLocalCoupons(updated);
    set({ coupons: updated });

    fetch('/api/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: target.id,
        action: 'toggle_status',
      }),
    }).catch(err => {
      console.warn('Could not toggle coupon status via API:', err);
    });
  },

  deleteCoupon: (id) => {
    const target = get().coupons.find(c => c.id === id);
    if (target) {
      fetch(`/api/coupons?id=${encodeURIComponent(target.id)}`, {
        method: 'DELETE',
      }).catch(err => {
        console.warn('Could not delete coupon via API:', err);
      });
    }
    const updated = get().coupons.filter(c => c.id !== id);
    saveLocalCoupons(updated);
    set({ coupons: updated });
  },

  recordShare: (id) => {
    const target = get().coupons.find(c => c.id === id);
    if (!target) return;
    const nextCount = (target.shareCount || 0) + 1;

    const updated = get().coupons.map(c => {
      if (c.id === id) {
        return { ...c, shareCount: nextCount };
      }
      return c;
    });
    saveLocalCoupons(updated);
    set({ coupons: updated });

    fetch('/api/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: target.id,
        action: 'record_share',
      }),
    }).catch(err => {
      console.warn('Could not record share via API:', err);
    });
  },

  getCouponByCode: (code) => {
    const clean = code.trim().toUpperCase();
    const found = get().coupons.find(c => c.code === clean);
    if (!found) return null;

    // Check active
    if (!found.isActive) return null;

    // Check expiration
    if (found.expiresAt) {
      const exp = new Date(found.expiresAt).getTime();
      if (Date.now() > exp) return null;
    }

    // Check max uses
    if (found.maxUses !== null && found.maxUses !== undefined && found.usedCount >= found.maxUses) {
      return null;
    }

    return found;
  },

  getShareMessage: (coupon) => {
    const discountText = coupon.discountType === 'free_shipping' 
      ? '¡Envío Gratis Bonificado!' 
      : `${coupon.discountPercent}% de descuento directo`;

    const scopeText = coupon.scope === 'niche' && coupon.targetNiche 
      ? `exclusivo en la colección ${coupon.targetNiche}` 
      : 'válido en toda la tienda';

    const minOrderText = coupon.minOrderAmount > 0 
      ? `\n📌 Pedido mínimo: $${coupon.minOrderAmount} USD` 
      : '';

    const expiresText = coupon.expiresAt 
      ? `\n⏳ Válido hasta: ${new Date(coupon.expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` 
      : '\n⏳ ¡Aprovecha antes de que se agoten los cupos!';

    return `✨ ¡Hola! Te comparto este cupón para Lumina Home:\n\n🎟️ Código: *${coupon.code}*\n🏷️ Beneficio: *${discountText}* (${scopeText})${minOrderText}${expiresText}\n\n👉 Úsalo directamente en tu carrito aquí: https://lumina-home.vercel.app/shop\n\n¡Disfrútalo y decora tus espacios! 🌿`;
  },

  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
