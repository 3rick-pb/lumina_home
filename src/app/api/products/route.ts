import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyIsAdmin, getAuthenticatedUser } from '@/lib/serverAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: List all products from Supabase (Public)
export async function GET() {
  try {
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
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let requesterEmail = searchParams.get('requesterEmail');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
        if (body.requesterEmail) requesterEmail = body.requesterEmail;
      } catch {
        // No body
      }
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de producto requerido' }, { status: 400 });
    }

    // Verify admin privileges
    const authUser = await getAuthenticatedUser(request);
    const emailToCheck = authUser?.email || requesterEmail;
    if (emailToCheck) {
      const isAdmin = await verifyIsAdmin(emailToCheck);
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'No autorizado para eliminar productos' }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('API /api/products DELETE error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const deletedCount = data ? data.length : 0;

    return NextResponse.json({
      success: true,
      deletedId: id,
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
    const body = await request.json();

    if (!body || !body.title) {
      return NextResponse.json({ success: false, error: 'Título de producto requerido' }, { status: 400 });
    }

    // Verify admin privileges
    const authUser = await getAuthenticatedUser(request);
    const emailToCheck = authUser?.email || body.requesterEmail;
    if (emailToCheck) {
      const isAdmin = await verifyIsAdmin(emailToCheck);
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'No autorizado para agregar productos' }, { status: 403 });
      }
    }

    const productPayload = { ...body };
    delete productPayload.requesterEmail;

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
    const body = await request.json();
    const { id, requesterEmail, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido para actualizar' }, { status: 400 });
    }

    // Verify admin privileges
    const authUser = await getAuthenticatedUser(request);
    const emailToCheck = authUser?.email || requesterEmail;
    if (emailToCheck) {
      const isAdmin = await verifyIsAdmin(emailToCheck);
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'No autorizado para actualizar productos' }, { status: 403 });
      }
    }

    let { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (isMissingColumn(error)) {
      const basic = stripExtendedFields(updates);
      const retry = await supabase.from('products').update(basic).eq('id', id).select().single();
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
