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
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  shareCount: number;
  redemptions?: CouponRedemptionRecord[];
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

const STORAGE_KEY = 'lumina_discount_coupons_v2';

const INITIAL_DEFAULT_COUPONS: DiscountCoupon[] = [
  {
    id: 'coup-1',
    code: 'LUMINA10',
    title: 'Bienvenida Lumina',
    description: '10% de descuento en tu primera compra en toda la tienda.',
    discountPercent: 10,
    discountType: 'percent',
    scope: 'all',
    minOrderAmount: 0,
    maxUses: null,
    usedCount: 18,
    expiresAt: null,
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    shareCount: 42,
    redemptions: [
      {
        id: 'red-101',
        orderId: 'ORD-92810',
        customerName: 'Mateo Cárdenas',
        customerEmail: 'mateo.cardenas@gmail.com',
        customerAvatarSeed: 'mateo.cardenas',
        customerAvatarShape: 'squircle',
        usedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        beforeAmount: 120.00,
        discountAmount: 12.00,
        afterAmount: 108.00,
        itemsSummary: 'Lámpara Japandi Kumo (x1)',
        paymentMethod: 'PayPhone · Tarjeta Crédito',
      },
      {
        id: 'red-102',
        orderId: 'ORD-91745',
        customerName: 'Andrea Morales',
        customerEmail: 'andrea.morales@outlook.com',
        customerAvatarSeed: 'andrea.morales',
        customerAvatarShape: 'circle',
        usedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        beforeAmount: 240.00,
        discountAmount: 24.00,
        afterAmount: 216.00,
        itemsSummary: 'Difusor Cerámico Zen (x1), Esencia Cedro (x2)',
        paymentMethod: 'PayPhone · Tarjeta Débito',
      },
      {
        id: 'red-103',
        orderId: 'ORD-90231',
        customerName: 'Carlos Andrade',
        customerEmail: 'carlos.andrade@yahoo.es',
        customerAvatarSeed: 'carlos.andrade',
        customerAvatarShape: 'squircle',
        usedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        beforeAmount: 85.00,
        discountAmount: 8.50,
        afterAmount: 76.50,
        itemsSummary: 'Vela Aromática Santal (x1)',
        paymentMethod: 'Transferencia Bancaria',
      },
    ],
  },
  {
    id: 'coup-2',
    code: 'AMIGOS-VIP20',
    title: 'Pase Exclusivo Amigos & Familia',
    description: '20% OFF en toda la tienda para compartir con tus amigos y grupos.',
    discountPercent: 20,
    discountType: 'percent',
    scope: 'all',
    minOrderAmount: 30,
    maxUses: 50,
    usedCount: 7,
    expiresAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    shareCount: 19,
    redemptions: [
      {
        id: 'red-201',
        orderId: 'ORD-88730',
        customerName: 'Gabriel Ponce',
        customerEmail: 'gabriel.ponce@gmail.com',
        customerAvatarSeed: 'gabriel.ponce',
        customerAvatarShape: 'squircle',
        usedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        beforeAmount: 150.00,
        discountAmount: 30.00,
        afterAmount: 120.00,
        itemsSummary: 'Manta de Lana Merino (x1)',
        paymentMethod: 'PayPhone · Tarjeta Crédito',
      },
      {
        id: 'red-202',
        orderId: 'ORD-87910',
        customerName: 'Lorena Silva',
        customerEmail: 'lorena.silva@hotmail.com',
        customerAvatarSeed: 'lorena.silva',
        customerAvatarShape: 'circle',
        usedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        beforeAmount: 210.00,
        discountAmount: 42.00,
        afterAmount: 168.00,
        itemsSummary: 'Set Cojines Lino Lavado (x2)',
        paymentMethod: 'PayPhone · Tarjeta Crédito',
      },
    ],
  },
  {
    id: 'coup-3',
    code: 'AROMA-ZEN15',
    title: 'Especial Aromaterapia & Calma',
    description: '15% OFF en difusores, esencias y ambientadores naturales.',
    discountPercent: 15,
    discountType: 'percent',
    scope: 'niche',
    targetNiche: 'Aromaterapia',
    minOrderAmount: 25,
    maxUses: 100,
    usedCount: 12,
    expiresAt: new Date(Date.now() + 20 * 86400000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    shareCount: 8,
    redemptions: [
      {
        id: 'red-301',
        orderId: 'ORD-89410',
        customerName: 'Valeria Espinoza',
        customerEmail: 'valeria.espinoza@hotmail.com',
        customerAvatarSeed: 'valeria.espinoza',
        customerAvatarShape: 'circle',
        usedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        beforeAmount: 95.00,
        discountAmount: 14.25,
        afterAmount: 80.75,
        itemsSummary: 'Pack Esencias Botánicas (x3)',
        paymentMethod: 'PayPhone · Tarjeta Débito',
      },
    ],
  },
  {
    id: 'coup-4',
    code: 'LUX-LIGHTS25',
    title: 'Flash Sale Iluminación de Autor',
    description: '25% OFF en lámparas esculturales y luminarias de diseño.',
    discountPercent: 25,
    discountType: 'percent',
    scope: 'niche',
    targetNiche: 'Iluminación',
    minOrderAmount: 50,
    maxUses: 30,
    usedCount: 14,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    shareCount: 27,
    redemptions: [
      {
        id: 'red-401',
        orderId: 'ORD-93512',
        customerName: 'Sofía Benalcázar',
        customerEmail: 'sofia.benalcazar@gmail.com',
        customerAvatarSeed: 'sofia.benalcazar',
        customerAvatarShape: 'squircle',
        usedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        beforeAmount: 320.00,
        discountAmount: 80.00,
        afterAmount: 240.00,
        itemsSummary: 'Lámpara Nórdica Aurora (x1), Luminaria Halo (x1)',
        paymentMethod: 'PayPhone · Tarjeta Crédito',
      },
      {
        id: 'red-402',
        orderId: 'ORD-92140',
        customerName: 'David Viteri',
        customerEmail: 'david.viteri@gmail.com',
        customerAvatarSeed: 'david.viteri',
        customerAvatarShape: 'squircle',
        usedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        beforeAmount: 180.00,
        discountAmount: 45.00,
        afterAmount: 135.00,
        itemsSummary: 'Lámpara de Mesa Eclipse (x1)',
        paymentMethod: 'PayPhone · Tarjeta Crédito',
      },
    ],
  },
  {
    id: 'coup-5',
    code: 'ENVIOGRATIS',
    title: 'Envío Bonificado 100%',
    description: 'Cubre el costo de despacho a cualquier ciudad del país.',
    discountPercent: 0,
    discountType: 'free_shipping',
    scope: 'all',
    minOrderAmount: 40,
    maxUses: null,
    usedCount: 31,
    expiresAt: null,
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    shareCount: 56,
    redemptions: [
      {
        id: 'red-501',
        orderId: 'ORD-94110',
        customerName: 'Lucía Paredes',
        customerEmail: 'lucia.paredes@gmail.com',
        customerAvatarSeed: 'lucia.paredes',
        customerAvatarShape: 'circle',
        usedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        beforeAmount: 65.00,
        discountAmount: 5.00,
        afterAmount: 60.00,
        itemsSummary: 'Jarrón Cerámica Wabi-Sabi (x1)',
        paymentMethod: 'PayPhone · Tarjeta Débito',
      },
    ],
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

export const useCouponStore = create<CouponState>((set, get) => ({
  coupons: typeof window !== 'undefined' ? loadLocalCoupons() : INITIAL_DEFAULT_COUPONS,
  isLoading: false,
  activeFilter: 'all',
  searchQuery: '',

  fetchCoupons: async () => {
    set({ isLoading: true });
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
          is_free_shipping?: boolean;
          target_niche?: string | null;
          min_order_amount?: number | string;
          max_uses?: number | null;
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
          discountType: item.is_free_shipping ? 'free_shipping' : (Number(item.discount_percent) > 0 ? 'percent' : 'fixed'),
          scope: item.target_niche ? 'niche' : 'all',
          targetNiche: item.target_niche || undefined,
          minOrderAmount: Number(item.min_order_amount) || 0,
          maxUses: item.max_uses !== undefined ? item.max_uses : null,
          usedCount: Number(item.used_count) || 0,
          expiresAt: item.expires_at || null,
          isActive: item.is_active !== false,
          createdAt: item.created_at || new Date().toISOString(),
          shareCount: Number(item.share_count) || 0,
        }));

        // Merge cloud with local, avoiding duplicates
        const current = get().coupons;
        const mergedMap = new Map<string, DiscountCoupon>();
        current.forEach(c => mergedMap.set(c.code.toUpperCase(), c));
        cloudCoupons.forEach(c => mergedMap.set(c.code.toUpperCase(), c));
        const merged = Array.from(mergedMap.values());

        saveLocalCoupons(merged);
        set({ coupons: merged, isLoading: false });
        return;
      }
    } catch (e) {
      console.warn('Could not sync coupons with cloud:', e);
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
      scope: isStorewide ? 'all' : 'niche',
      targetNiche: chosenNiche,
      minOrderAmount: minOrder,
      maxUses,
      usedCount: 0,
      expiresAt,
      isActive: true,
      createdAt: new Date().toISOString(),
      shareCount: 0,
    };

    const updated = [newCoupon, ...get().coupons];
    saveLocalCoupons(updated);
    set({ coupons: updated });

    // Sync to Supabase in background
    try {
      supabase.from('coupons').insert({
        code: newCoupon.code,
        title: newCoupon.title,
        description: newCoupon.description,
        discount_percent: newCoupon.discountPercent,
        is_free_shipping: false,
        min_order_amount: newCoupon.minOrderAmount,
        target_niche: newCoupon.targetNiche || null,
        max_uses: newCoupon.maxUses,
        expires_at: newCoupon.expiresAt,
        is_active: true,
      }).then(() => {}, () => {});
    } catch {}

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
    };

    const updated = [newCoupon, ...get().coupons.filter(c => c.code !== cleanCode)];
    saveLocalCoupons(updated);
    set({ coupons: updated });

    // Sync to Supabase in background
    try {
      supabase.from('coupons').upsert({
        code: newCoupon.code,
        title: newCoupon.title,
        description: newCoupon.description,
        discount_percent: newCoupon.discountPercent,
        is_free_shipping: newCoupon.discountType === 'free_shipping',
        min_order_amount: newCoupon.minOrderAmount,
        target_niche: newCoupon.targetNiche || null,
        max_uses: newCoupon.maxUses,
        expires_at: newCoupon.expiresAt,
        is_active: newCoupon.isActive,
      }, { onConflict: 'code' }).then(() => {}, () => {});
    } catch {}

    return newCoupon;
  },

  toggleCouponStatus: (id) => {
    const updated = get().coupons.map(c => {
      if (c.id === id) {
        const nextState = !c.isActive;
        // Sync to Supabase in background
        try {
          supabase.from('coupons').update({ is_active: nextState }).eq('code', c.code).then(() => {});
        } catch {}
        return { ...c, isActive: nextState };
      }
      return c;
    });
    saveLocalCoupons(updated);
    set({ coupons: updated });
  },

  deleteCoupon: (id) => {
    const target = get().coupons.find(c => c.id === id);
    if (target) {
      try {
        supabase.from('coupons').delete().eq('code', target.code).then(() => {});
      } catch {}
    }
    const updated = get().coupons.filter(c => c.id !== id);
    saveLocalCoupons(updated);
    set({ coupons: updated });
  },

  recordShare: (id) => {
    const updated = get().coupons.map(c => {
      if (c.id === id) {
        const nextCount = (c.shareCount || 0) + 1;
        try {
          supabase.from('coupons').update({ share_count: nextCount }).eq('code', c.code).then(() => {});
        } catch {}
        return { ...c, shareCount: nextCount };
      }
      return c;
    });
    saveLocalCoupons(updated);
    set({ coupons: updated });
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
