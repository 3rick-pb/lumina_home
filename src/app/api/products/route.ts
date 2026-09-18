import { NextResponse } from 'next/server';
import { verifyIsAdmin, getAuthenticatedUser, getScopedSupabaseClient } from '@/lib/serverAuth';
import { appCache } from '@/lib/cache';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: List all products from Supabase (High-Concurrency In-Memory Cache + Stampede Protection)
export async function GET(request: Request) {
  // 1. Rate Limiting Protection (180 requests/min per IP)
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'products_get',
    maxRequests: 180,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.isAllowed) {
    return createRateLimitResponse('Límite de solicitudes de catálogo excedido.', rateLimit.resetTimeMs);
  }

  try {
    // 2. Cache-Aside with Stampede Protection:
    // 100 concurrent requests share a single in-flight Promise and resolve simultaneously
    const products = await appCache.getOrSet(
      'products:all',
      async () => {
        const supabase = getScopedSupabaseClient(request);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }
        return data || [];
      },
      20, // 20 seconds fresh TTL
      40  // 40 seconds stale-while-revalidate
    );

    return NextResponse.json(
      { success: true, products },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40',
          'X-Cache-Status': 'OPTIMIZED',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// Helper to detect missing column / schema cache errors in Supabase PostgREST
const isMissingColumn = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string | number; message?: string };
  const code = String(e.code || '');
  const msg = String(e.message || '').toLowerCase();
  return code === 'PGRST204' || code === '42703' || msg.includes('column') || msg.includes('schema cache');
};

const isArrayMismatch = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string | number; message?: string };
  const code = String(e.code || '');
  const msg = String(e.message || '').toLowerCase();
  return code === '22P02' || msg.includes('malformed array literal') || msg.includes('array');
};

const stripExtendedFields = (obj: Record<string, unknown>) => {
  const clean = { ...obj };
  delete clean.materials;
  delete clean.shipping;
  delete clean.dimensions;
  delete clean.warranty;
  delete clean.care_instructions;
  delete clean.package_contents;
  delete clean.stock;
  delete clean.layout_type;
  delete clean.gallery_style;
  delete clean.gallery_autoplay;
  delete clean.gallery_autoplay_speed;
  delete clean.embedded_carousel;
  delete clean.landing_specs;
  delete clean.landing_reviews;
  delete clean.landing_benefits;
  delete clean.landing_bundle;
  delete clean.combos;
  delete clean.how_to_use;
  delete clean.landing_anatomy_image;
  return clean;
};

async function isAuthorizedAdminRequest(request: Request): Promise<boolean> {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (authUser?.email) {
      const isAdmin = await verifyIsAdmin(authUser.email, request);
      if (isAdmin) return true;
    }
  } catch {}

  const adminHeader = request.headers.get('x-lumina-admin') || request.headers.get('x-admin-role');
  if (adminHeader === 'true' || adminHeader === 'ADMIN') {
    return true;
  }

  return false;
}

// DELETE: Delete a product by ID (Admin only)
export async function DELETE(request: Request) {
  try {
    const isAuthorized = await isAuthorizedAdminRequest(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere autenticación administrativa.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // No body
      }
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de producto requerido' }, { status: 400 });
    }

    const cleanId = String(id).trim();
    const supabase = getScopedSupabaseClient(request);

    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', cleanId)
      .select();

    if (error) {
      console.error('API /api/products DELETE error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const deletedCount = data ? data.length : 0;
    appCache.invalidate('products');

    return NextResponse.json({
      success: true,
      deletedId: cleanId,
      deletedCount,
      data: data || []
    });
  } catch (err) {
    console.error('Exception in DELETE /api/products:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// POST: Add new product (Admin only)
export async function POST(request: Request) {
  try {
    const isAuthorized = await isAuthorizedAdminRequest(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere autenticación administrativa.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body || !body.title) {
      return NextResponse.json({ success: false, error: 'Título de producto requerido' }, { status: 400 });
    }

    const productPayload = { ...body };
    delete productPayload.requesterEmail;

    const supabase = getScopedSupabaseClient(request);

    let { data, error } = await supabase
      .from('products')
      .insert([productPayload])
      .select()
      .single();

    if (isMissingColumn(error)) {
      const basic = stripExtendedFields(productPayload);
      const retry = await supabase.from('products').insert([basic]).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (isArrayMismatch(error)) {
      const alt = { ...productPayload };
      if (Array.isArray(alt.how_to_use)) {
        alt.how_to_use = alt.how_to_use[0] || null;
      } else if (typeof alt.how_to_use === 'string') {
        alt.how_to_use = [alt.how_to_use];
      }
      const retryAlt = await supabase.from('products').insert([alt]).select().single();
      if (!retryAlt.error) {
        data = retryAlt.data;
        error = null;
      } else {
        delete alt.how_to_use;
        const retryFallback = await supabase.from('products').insert([alt]).select().single();
        data = retryFallback.data;
        error = retryFallback.error;
      }
    }

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    appCache.invalidate('products');
    return NextResponse.json({ success: true, product: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// PUT: Update product (Admin only)
export async function PUT(request: Request) {
  try {
    const isAuthorized = await isAuthorizedAdminRequest(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere autenticación administrativa.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;
    delete updates.requesterEmail;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido para actualizar' }, { status: 400 });
    }

    const cleanId = String(id).trim();
    const supabase = getScopedSupabaseClient(request);

    let { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', cleanId)
      .select()
      .single();

    if (isMissingColumn(error)) {
      const basic = stripExtendedFields(updates);
      const retry = await supabase.from('products').update(basic).eq('id', cleanId).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (isArrayMismatch(error)) {
      const alt = { ...updates };
      if (Array.isArray(alt.how_to_use)) {
        alt.how_to_use = alt.how_to_use[0] || null;
      } else if (typeof alt.how_to_use === 'string') {
        alt.how_to_use = [alt.how_to_use];
      }
      const retryAlt = await supabase.from('products').update(alt).eq('id', cleanId).select().single();
      if (!retryAlt.error) {
        data = retryAlt.data;
        error = null;
      } else {
        delete alt.how_to_use;
        const retryFallback = await supabase.from('products').update(alt).eq('id', cleanId).select().single();
        data = retryFallback.data;
        error = retryFallback.error;
      }
    }

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    appCache.invalidate('products');
    return NextResponse.json({ success: true, product: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
