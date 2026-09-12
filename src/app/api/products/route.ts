import { NextResponse } from 'next/server';
import { verifyIsAdmin, getAuthenticatedUser, getScopedSupabaseClient } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: List all products from Supabase (Public)
export async function GET(request: Request) {
  try {
    const supabase = getScopedSupabaseClient(request);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, products: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// Helper to detect missing column / schema cache errors in Supabase PostgREST
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isMissingColumn = (err: any): boolean => {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '').toLowerCase();
  return code === 'PGRST204' || code === '42703' || msg.includes('column') || msg.includes('schema cache');
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
  delete clean.landing_specs;
  delete clean.landing_reviews;
  delete clean.landing_benefits;
  delete clean.landing_bundle;
  delete clean.combos;
  delete clean.how_to_use;
  return clean;
};

// DELETE: Delete a product by ID (Admin only)
export async function DELETE(request: Request) {
  try {
    // 1. Mandatory JWT Authentication
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere autenticación administrativa.' },
        { status: 401 }
      );
    }

    // 2. Strict Admin Role Verification
    const isAdmin = await verifyIsAdmin(authUser.email);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes. Acción reservada para administradores.' },
        { status: 403 }
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
    // 1. Mandatory JWT Authentication
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere autenticación administrativa.' },
        { status: 401 }
      );
    }

    // 2. Strict Admin Role Verification
    const isAdmin = await verifyIsAdmin(authUser.email);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes. Acción reservada para administradores.' },
        { status: 403 }
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

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// PUT: Update product (Admin only)
export async function PUT(request: Request) {
  try {
    // 1. Mandatory JWT Authentication
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere autenticación administrativa.' },
        { status: 401 }
      );
    }

    // 2. Strict Admin Role Verification
    const isAdmin = await verifyIsAdmin(authUser.email);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes. Acción reservada para administradores.' },
        { status: 403 }
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

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
