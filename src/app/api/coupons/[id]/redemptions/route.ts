import { NextResponse } from 'next/server';
import { getScopedSupabaseClient, getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/coupons/[id]/redemptions
 * Returns all real customer redemptions and cryptographic audit records for a given coupon.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de cupón requerido' }, { status: 400 });
    }

    const authUser = await getAuthenticatedUser(request);
    const cleanEmail = (authUser?.email || '').toLowerCase().trim();
    const isAdmin = cleanEmail ? await verifyIsAdmin(cleanEmail) : false;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const supabase = getScopedSupabaseClient(request);

    // Fetch the coupon details
    const { data: coupon, error: coupErr } = await supabase
      .from('coupons')
      .select('*')
      .or(`id.eq.${id},code.eq.${id.toUpperCase()}`)
      .maybeSingle();

    if (coupErr || !coupon) {
      return NextResponse.json({ success: false, error: 'Cupón no encontrado' }, { status: 404 });
    }

    // Fetch all redemptions for this coupon
    const { data: redemptions, error: redErr } = await supabase
      .from('coupon_redemptions')
      .select('*')
      .or(`coupon_id.eq.${coupon.id},coupon_code.eq.${coupon.code}`)
      .order('redeemed_at', { ascending: false });

    if (redErr) {
      console.error('[API /api/coupons/[id]/redemptions GET] Error:', redErr);
      return NextResponse.json({ success: false, error: redErr.message }, { status: 500 });
    }

    const list = redemptions || [];
    const totalRedemptions = list.length;
    const totalSaved = list.reduce((sum, r) => sum + (Number(r.discount_amount) || 0), 0);
    const totalSpend = list.reduce((sum, r) => sum + (Number(r.after_amount) || 0), 0);
    const averageTicket = totalRedemptions > 0 ? totalSpend / totalRedemptions : 0;

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        discountPercent: Number(coupon.discount_percent) || 0,
        discountType: coupon.discount_type,
        shareCount: Number(coupon.share_count) || 0,
      },
      metrics: {
        totalRedemptions,
        totalSaved,
        averageTicket,
        shareCount: Number(coupon.share_count) || 0,
      },
      redemptions: list.map((r) => ({
        id: r.id,
        orderId: r.order_id,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        customerAvatarSeed: r.customer_email || r.customer_name,
        customerAvatarShape: 'squircle',
        usedAt: r.redeemed_at,
        beforeAmount: Number(r.before_amount) || 0,
        discountAmount: Number(r.discount_amount) || 0,
        afterAmount: Number(r.after_amount) || 0,
        itemsSummary: r.items_summary || 'Piezas Lumina Home',
        paymentMethod: r.payment_method || 'Tarjeta de Crédito',
      })),
    });
  } catch (error) {
    console.error('[API /api/coupons/[id]/redemptions GET] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
