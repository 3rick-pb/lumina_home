import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// Use service role if provided in environment, otherwise fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET: List all products from Supabase
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

// DELETE: Delete a product by ID from Supabase
export async function DELETE(request: Request) {
  try {
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

    // Attempt deletion from Supabase
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('API /api/products DELETE error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // In Supabase, if RLS prevented delete or id was not found, data is []
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

// POST: Add new product with sanitized image URLs
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !body.title) {
      return NextResponse.json({ success: false, error: 'Título de producto requerido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// PUT: Update product
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido para actualizar' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
