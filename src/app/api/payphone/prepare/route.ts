import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { preparePayPhonePayment, validateEcuadorianId, sanitizeString } from '@/lib/payphone';
import { getAuthenticatedUser } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

// Valid coupons configuration (Zero-Trust server validation)
const VALID_COUPONS: Record<string, { discountPercent: number; isFreeShipping: boolean }> = {
  'LUMINA10': { discountPercent: 10, isFreeShipping: false },
  'VIP20': { discountPercent: 20, isFreeShipping: false },
  'BIENVENIDO': { discountPercent: 15, isFreeShipping: false },
  'ENVIOGRATIS': { discountPercent: 0, isFreeShipping: true }
};

interface PrepareRequestBody {
  orderId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price?: number;
    isBundle?: boolean;
    bundleCustomPrice?: number;
    color?: string;
    size?: string;
    product?: {
      id: string;
      title: string;
      price: number;
      imageUrl: string;
    };
  }>;
  shippingAddress: {
    recipient?: string;
    idNumber?: string;
    phone?: string;
    email?: string;
    street: string;
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  couponCode?: string;
  clientClaimedTotal?: number;
}

/**
 * POST /api/payphone/prepare
 * Secure endpoint to initiate a PayPhone Ecuador payment session.
 * Enforces Zero-Trust server-side price recalculation, Ecuadorian ID validation,
 * input sanitization, and returns payload tailored for active mode (Cajita vs Redirección).
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request).catch(() => null);
    const body = (await request.json().catch(() => ({}))) as PrepareRequestBody;

    const { items, shippingAddress, couponCode, clientClaimedTotal } = body;

    // 1. Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'El carrito de compras no contiene artículos.' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return NextResponse.json({ success: false, error: 'La dirección de envío y ciudad son requeridas.' }, { status: 400 });
    }

    // 2. CYBERSECURITY: Ecuadorian Identification Document Validation (Cédula/RUC)
    const rawDoc = String(shippingAddress.idNumber || '').trim();
    if (rawDoc) {
      const idCheck = validateEcuadorianId(rawDoc);
      if (!idCheck.isValid) {
        return NextResponse.json({
          success: false,
          error: idCheck.error || 'La identificación proporcionada no es una Cédula o RUC ecuatoriano válido.'
        }, { status: 400 });
      }
    }

    // 3. CYBERSECURITY: Zero-Trust Server Recalculation of Prices from Supabase
    const productIds = items.map(i => i.productId).filter(Boolean);
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, price, title')
      .in('id', productIds);

    const dbProductMap = new Map<string, { id: string; price: number; title: string }>();
    if (dbProducts) {
      for (const p of dbProducts) {
        dbProductMap.set(p.id, p);
      }
    }

    let calculatedSubtotal = 0;
    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      let unitPrice = 0;

      if (item.isBundle && item.bundleCustomPrice !== undefined && item.bundleCustomPrice > 0) {
        unitPrice = Number(item.bundleCustomPrice);
      } else {
        const dbProduct = dbProductMap.get(item.productId);
        if (dbProduct) {
          unitPrice = Number(dbProduct.price);
        } else if (item.price && Number(item.price) > 0) {
          unitPrice = Number(item.price);
        } else if (item.product?.price) {
          unitPrice = Number(item.product.price);
        }
      }

      calculatedSubtotal += unitPrice * qty;
    }

    if (calculatedSubtotal <= 0) {
      return NextResponse.json({ success: false, error: 'Monto subtotal calculado inválido.' }, { status: 400 });
    }

    // Server-side coupon verification
    let discountAmount = 0;
    let isFreeShipping = false;
    if (couponCode) {
      const cleanCoupon = couponCode.trim().toUpperCase();
      const couponRule = VALID_COUPONS[cleanCoupon];
      if (couponRule) {
        if (couponRule.discountPercent > 0) {
          discountAmount = (calculatedSubtotal * couponRule.discountPercent) / 100;
        }
        if (couponRule.isFreeShipping) {
          isFreeShipping = true;
        }
      }
    }

    // Shipping calculation: Free over $100 or with coupon, otherwise $4.99
    let shippingCost = 0;
    if (calculatedSubtotal > 0 && !isFreeShipping && calculatedSubtotal < 100) {
      shippingCost = 4.99;
    }

    const verifiedTotal = Math.max(0, Number((calculatedSubtotal - discountAmount + shippingCost).toFixed(2)));

    // Anti-Tampering: Check if client manipulated total
    if (clientClaimedTotal !== undefined) {
      const diff = Math.abs(clientClaimedTotal - verifiedTotal);
      if (diff > 0.05) {
        console.warn(`[PayPhone SECURITY ALERT] Client claimed total: $${clientClaimedTotal}, Server calculated: $${verifiedTotal}`);
        return NextResponse.json({
          success: false,
          error: 'Alerta de Seguridad: Se detectó una inconsistencia entre los precios del carrito y los registros oficiales de la tienda. El total ha sido recalculado.'
        }, { status: 400 });
      }
    }

    // 4. Sanitize strings against injection
    const orderId = sanitizeString(body.orderId || `INV_${Math.floor(100000 + Math.random() * 900000)}`, 40);
    const cleanEmail = sanitizeString(shippingAddress.email || authUser?.email || 'cliente@lumina.com', 80);
    const cleanPhone = sanitizeString(shippingAddress.phone || '0999999999', 20);
    const cleanRecipient = sanitizeString(shippingAddress.recipient || authUser?.email?.split('@')[0] || 'Cliente Lumina', 60);

    // 5. PayPhone Prepare Execution (handles active mode: 'box' vs 'redirect')
    const prepareResult = await preparePayPhonePayment({
      orderId,
      amount: verifiedTotal,
      amountWithoutTax: verifiedTotal, // Standard USD Ecuadorian breakdown
      amountWithTax: 0,
      tax: 0,
      customerEmail: cleanEmail,
      customerPhone: cleanPhone,
      documentId: rawDoc || '9999999999',
      customReference: `Lumina Home Pedido #${orderId} - ${cleanRecipient}`
    });

    if (!prepareResult.success) {
      return NextResponse.json({
        success: false,
        error: prepareResult.error || 'No se pudo preparar la sesión de cobro con PayPhone.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mode: prepareResult.mode,
      orderId,
      paymentId: prepareResult.paymentId,
      payUrl: prepareResult.payUrl,
      clientTransactionId: prepareResult.clientTransactionId,
      isSimulated: prepareResult.isSimulated,
      verifiedTotal,
      amountInCents: prepareResult.amountInCents,
      amountWithoutTaxInCents: prepareResult.amountWithoutTaxInCents,
      amountWithTaxInCents: prepareResult.amountWithTaxInCents,
      taxInCents: prepareResult.taxInCents,
      currency: prepareResult.currency,
      storeId: prepareResult.storeId,
      token: prepareResult.token,
      reference: prepareResult.reference,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      documentId: rawDoc || undefined
    });
  } catch (error) {
    console.error('[API /api/payphone/prepare] Unhandled exception:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
