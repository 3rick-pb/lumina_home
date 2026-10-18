import { NextResponse } from 'next/server';
import { getScopedSupabaseClient, getAuthenticatedUser } from '@/lib/serverAuth';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface ValidateCouponRequestBody {
  code: string;
  subtotal: number;
  items?: Array<{
    productId?: string;
    product?: {
      id?: string;
      category?: string;
      price?: number;
    };
    category?: string;
    price?: number;
    quantity?: number;
    isBundle?: boolean;
    bundleProducts?: Array<{ category?: string }>;
  }>;
  customerEmail?: string;
}

/**
 * POST /api/coupons/validate
 * Server-side anti-fraud validation engine for ecommerce discount coupons.
 * Performs rigorous checks against:
 * - Active state & existence
 * - Expiration timestamp
 * - Global max uses cap
 * - Per-user redemption limit (anti-abuse)
 * - Minimum order monetary threshold
 * - Niche/Category scope requirements
 */
export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'coupon_validate',
    maxRequests: 40,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.isAllowed) {
    return createRateLimitResponse('Demasiados intentos de validación de cupones.', rateLimit.resetTimeMs);
  }

  try {
    const body: ValidateCouponRequestBody = await request.json();
    const cleanCode = String(body.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    if (!cleanCode) {
      return NextResponse.json(
        { valid: false, message: 'Por favor ingresa un código de cupón válido.' },
        { status: 400 }
      );
    }

    const subtotal = Math.max(0, Number(body.subtotal) || 0);
    const items = Array.isArray(body.items) ? body.items : [];
    const authUser = await getAuthenticatedUser(request);
    const customerEmail = (body.customerEmail || authUser?.email || '').toLowerCase().trim();

    const supabase = getScopedSupabaseClient(request);

    const OFFICIAL_COUPONS_FALLBACK = [
      {
        code: 'LUMINA10',
        title: 'Bienvenida Lumina Home',
        description: '10% de descuento directo en todo el catálogo.',
        discount_percent: 10,
        discount_type: 'percent',
        fixed_amount: 0,
        scope: 'all',
        target_niche: null,
        min_order_amount: 0,
        max_uses: null,
        max_uses_per_user: 1,
        used_count: 0,
        is_active: true,
        expires_at: null,
      },
      {
        code: 'VIP20',
        title: 'Pase Exclusivo VIP',
        description: '20% OFF en toda la tienda para compras superiores a $30.',
        discount_percent: 20,
        discount_type: 'percent',
        fixed_amount: 0,
        scope: 'all',
        target_niche: null,
        min_order_amount: 30,
        max_uses: null,
        max_uses_per_user: 1,
        used_count: 0,
        is_active: true,
        expires_at: null,
      },
      {
        code: 'AMIGOS-VIP20',
        title: 'Pase Exclusivo Amigos & Familia',
        description: '20% OFF en toda la tienda para compartir con tus amigos y grupos.',
        discount_percent: 20,
        discount_type: 'percent',
        fixed_amount: 0,
        scope: 'all',
        target_niche: null,
        min_order_amount: 30,
        max_uses: 50,
        max_uses_per_user: 1,
        used_count: 0,
        is_active: true,
        expires_at: null,
      },
      {
        code: 'BIENVENIDO',
        title: 'Bienvenida Boutique',
        description: '15% de descuento en tu primera compra.',
        discount_percent: 15,
        discount_type: 'percent',
        fixed_amount: 0,
        scope: 'all',
        target_niche: null,
        min_order_amount: 0,
        max_uses: null,
        max_uses_per_user: 1,
        used_count: 0,
        is_active: true,
        expires_at: null,
      },
      {
        code: 'LUX-LIGHTS25',
        title: 'Flash Sale Iluminación de Autor',
        description: '25% OFF en lámparas esculturales y luminarias de diseño.',
        discount_percent: 25,
        discount_type: 'percent',
        fixed_amount: 0,
        scope: 'niche',
        target_niche: 'Iluminación',
        min_order_amount: 50,
        max_uses: 30,
        max_uses_per_user: 1,
        used_count: 0,
        is_active: true,
        expires_at: null,
      },
      {
        code: 'ENVIOGRATIS',
        title: 'Envío Bonificado 100%',
        description: 'Cubre el costo de despacho garantizado a cualquier ciudad del Ecuador.',
        discount_percent: 0,
        discount_type: 'free_shipping',
        fixed_amount: 0,
        scope: 'all',
        target_niche: null,
        min_order_amount: 30,
        max_uses: null,
        max_uses_per_user: 1,
        used_count: 0,
        is_active: true,
        expires_at: null,
      },
    ];

    // 1. Fetch coupon record from database
    const { data: dbCoupon, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', cleanCode)
      .maybeSingle();

    let coupon = dbCoupon;

    // Check official system coupons if not found in database table
    if (!coupon) {
      const match = OFFICIAL_COUPONS_FALLBACK.find(c => c.code === cleanCode);
      if (match) {
        coupon = {
          id: `sys-${match.code.toLowerCase()}`,
          ...match,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as typeof dbCoupon;
      }
    }

    if (error && !coupon) {
      return NextResponse.json(
        { valid: false, message: 'El código ingresado no es válido o ha expirado.' },
        { status: 404 }
      );
    }

    if (!coupon) {
      return NextResponse.json(
        { valid: false, message: 'El código ingresado no es válido o ha expirado.' },
        { status: 404 }
      );
    }

    // 2. Active status check
    if (!coupon.is_active) {
      return NextResponse.json(
        { valid: false, message: 'Este cupón se encuentra inactivo actualmente.' },
        { status: 400 }
      );
    }

    // 3. Expiration timestamp check
    if (coupon.expires_at) {
      const expDate = new Date(coupon.expires_at).getTime();
      if (!isNaN(expDate) && Date.now() > expDate) {
        const formattedDate = new Date(coupon.expires_at).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        return NextResponse.json(
          { valid: false, message: `Este cupón expiró el ${formattedDate}.` },
          { status: 400 }
        );
      }
    }

    // 4. Global max uses cap check
    if (coupon.max_uses !== null && coupon.max_uses !== undefined) {
      const usedCount = Number(coupon.used_count) || 0;
      if (usedCount >= Number(coupon.max_uses)) {
        return NextResponse.json(
          { valid: false, message: 'Este cupón ha alcanzado el límite máximo de canjes disponibles.' },
          { status: 400 }
        );
      }
    }

    // 5. Per-user redemption limit (anti-abuse check)
    if (customerEmail && coupon.max_uses_per_user) {
      const maxPerUser = Number(coupon.max_uses_per_user) || 1;
      const { data: userRedemptions } = await supabase
        .from('coupon_redemptions')
        .select('id')
        .eq('coupon_code', coupon.code)
        .eq('customer_email', customerEmail);

      if (userRedemptions && userRedemptions.length >= maxPerUser) {
        return NextResponse.json(
          {
            valid: false,
            message: `Ya has utilizado este cupón el número máximo permitido (${maxPerUser} vez/veces).`,
          },
          { status: 400 }
        );
      }
    }

    // 6. Minimum order monetary threshold check
    const minOrder = Number(coupon.min_order_amount) || 0;
    if (minOrder > 0 && subtotal < minOrder) {
      return NextResponse.json(
        {
          valid: false,
          message: `Este cupón requiere un pedido mínimo de $${minOrder.toFixed(2)} USD (Subtotal actual: $${subtotal.toFixed(2)}).`,
        },
        { status: 400 }
      );
    }

    // 7. Niche / Category scope check
    let applicableSubtotal = subtotal;
    if (coupon.scope === 'niche' && coupon.target_niche) {
      const targetNicheNorm = coupon.target_niche.toLowerCase().trim();

      // Check if any cart item matches this niche
      const matchingItems = items.filter((it) => {
        const prodCat = (it.product?.category || it.category || '').toLowerCase().trim();
        if (prodCat && prodCat.includes(targetNicheNorm)) return true;

        if (it.isBundle && Array.isArray(it.bundleProducts)) {
          return it.bundleProducts.some((bp) => (bp.category || '').toLowerCase().includes(targetNicheNorm));
        }
        return false;
      });

      if (items.length > 0 && matchingItems.length === 0) {
        return NextResponse.json(
          {
            valid: false,
            message: `Este cupón aplica exclusivamente para piezas de la colección "${coupon.target_niche}".`,
          },
          { status: 400 }
        );
      }

      if (matchingItems.length > 0) {
        applicableSubtotal = matchingItems.reduce((acc, it) => {
          const price = Number(it.product?.price || it.price || 0);
          const qty = Number(it.quantity || 1);
          return acc + price * qty;
        }, 0);
      }
    }

    // 8. Compute exact monetary discount
    let discountAmount = 0;
    const isFreeShipping = coupon.discount_type === 'free_shipping';

    if (isFreeShipping) {
      discountAmount = 0; // Handled by setting shipping = $0
    } else if (coupon.discount_type === 'fixed') {
      const fixed = Number(coupon.fixed_amount) || 0;
      discountAmount = Math.min(applicableSubtotal, fixed);
    } else {
      // Percent
      const pct = Number(coupon.discount_percent) || 0;
      discountAmount = Number(((applicableSubtotal * pct) / 100).toFixed(2));
    }

    // Success response
    let successMessage = '¡Cupón aplicado con éxito!';
    if (isFreeShipping) {
      successMessage = '¡Cupón aplicado con éxito! Envío 100% bonificado.';
    } else if (coupon.discount_type === 'percent') {
      successMessage = `¡Cupón aplicado con éxito! ${coupon.discount_percent}% de descuento (-$${discountAmount.toFixed(2)} USD).`;
    } else if (coupon.discount_type === 'fixed') {
      successMessage = `¡Cupón aplicado con éxito! Descuento directo de -$${discountAmount.toFixed(2)} USD.`;
    }

    return NextResponse.json({
      valid: true,
      message: successMessage,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountPercent: Number(coupon.discount_percent) || 0,
        fixedAmount: Number(coupon.fixed_amount) || 0,
        isFreeShipping,
        discountAmount,
        scope: coupon.scope,
        targetNiche: coupon.target_niche,
        minOrderAmount: minOrder,
      },
    });
  } catch (error) {
    console.error('[API /api/coupons/validate POST] Error:', error);
    return NextResponse.json(
      { valid: false, message: 'Error interno al validar el cupón.' },
      { status: 500 }
    );
  }
}
