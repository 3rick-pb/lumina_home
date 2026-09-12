import { NextResponse } from 'next/server';
import { supabaseServer, getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimit';

export interface ShippingAddress {
  id: string;
  recipient: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface PaymentCard {
  id: string;
  number: string;
  holder: string;
  exp: string;
  type: 'mastercard' | 'visa';
  isDefault?: boolean;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/user/data
 * Retrieves addresses, cards, and favorites directly from their dedicated tables in Supabase.
 * Strictly protected against IDOR: Users can only query their own data.
 */
export async function GET(request: Request) {
  // Rate limiting check (30 requests / 60 seconds per IP)
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'user_data_get',
    maxRequests: 30,
    windowMs: 60 * 1000
  });
  if (!rateLimit.isAllowed) {
    return createRateLimitResponse('Demasiadas consultas de datos de usuario.', rateLimit.resetTimeMs);
  }

  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.id) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user session found',
        addresses: [],
        cards: [],
        favorites: [],
        address: null,
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');
    const isAdmin = authUser.email ? await verifyIsAdmin(authUser.email) : false;

    // Strict Anti-IDOR: Only verified administrators can view another user's data
    const targetUserId = isAdmin && queryUserId && UUID_REGEX.test(queryUserId)
      ? queryUserId
      : authUser.id;

    let addresses: ShippingAddress[] = [];
    let cards: PaymentCard[] = [];
    let favorites: string[] = [];
    let defaultAddress: ShippingAddress | null = null;

    // 1. Fetch addresses from public.addresses
    try {
      const { data: dbAddrs, error: addrErr } = await supabaseServer
        .from('addresses')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (!addrErr && dbAddrs && dbAddrs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addresses = dbAddrs.map((a: any) => ({
          id: a.id,
          recipient: a.recipient || 'Destinatario',
          idNumber: a.id_number || '',
          phone: a.phone || '',
          email: a.email || '',
          street: a.street || '',
          city: a.city || '',
          state: a.state || '',
          postalCode: a.postal_code || '',
          country: a.country || 'Ecuador',
          isDefault: !!a.is_default,
        }));
      }
    } catch (err) {
      console.warn('Notice: Error reading addresses table:', err);
    }

    // 2. Fetch cards from public.payment_cards
    try {
      const { data: dbCards, error: cardErr } = await supabaseServer
        .from('payment_cards')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (!cardErr && dbCards && dbCards.length > 0) {
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
    } catch (err) {
      console.warn('Notice: Error reading payment_cards table:', err);
    }

    // 3. Fetch favorites from public.favorites
    try {
      const { data: dbFavs, error: favErr } = await supabaseServer
        .from('favorites')
        .select('product_id')
        .eq('user_id', targetUserId);

      if (!favErr && dbFavs && dbFavs.length > 0) {
        favorites = dbFavs.map(f => String(f.product_id));
      }
    } catch (err) {
      console.warn('Notice: Error reading favorites table:', err);
    }

    // Determine default address
    defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      addresses,
      address: defaultAddress,
      cards,
      favorites,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Database error';
    return NextResponse.json({
      success: false,
      error: msg,
      addresses: [],
      cards: [],
      favorites: [],
      address: null,
    }, { status: 500 });
  }
}

/**
 * POST /api/user/data
 * Mutates and stores addresses, cards, or favorites directly into dedicated tables
 */
export async function POST(request: Request) {
  // Rate limiting check (20 mutations / 60 seconds per IP)
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'user_data_post',
    maxRequests: 20,
    windowMs: 60 * 1000
  });
  if (!rateLimit.isAllowed) {
    return createRateLimitResponse('Demasiadas solicitudes de modificación.', rateLimit.resetTimeMs);
  }

  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.id) {
      return NextResponse.json({ success: false, error: 'Acceso no autorizado: se requiere sesión de usuario activa' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const isAdmin = authUser.email ? await verifyIsAdmin(authUser.email) : false;

    // Strict Anti-IDOR: Only verified administrators can mutate another user's data
    const targetUserId = isAdmin && body.userId && UUID_REGEX.test(body.userId)
      ? body.userId
      : authUser.id;

    const action = body.action || 'sync_all';

    // 1. Action: Save addresses exclusively to public.addresses
    if (action === 'save_addresses' || action === 'sync_all') {
      if (Array.isArray(body.addresses)) {
        const addresses: ShippingAddress[] = body.addresses;
        try {
          await supabaseServer.from('addresses').delete().eq('user_id', targetUserId);
          if (addresses.length > 0) {
            const rows = addresses.map(a => ({
              id: a.id,
              user_id: targetUserId,
              recipient: a.recipient || 'Destinatario',
              id_number: a.idNumber || null,
              phone: a.phone || null,
              email: a.email || null,
              street: a.street || '',
              city: a.city || '',
              state: a.state || '',
              postal_code: a.postalCode || '',
              country: a.country || 'Ecuador',
              is_default: !!a.isDefault,
            }));
            const { error: insErr } = await supabaseServer.from('addresses').insert(rows);
            if (insErr) console.warn('Warning inserting addresses:', insErr.message);
          }
        } catch (err) {
          console.error('Error saving to addresses table:', err);
        }
      }
    }

    // 2. Action: Save cards exclusively to public.payment_cards
    if (action === 'save_cards' || action === 'sync_all') {
      if (Array.isArray(body.cards)) {
        const cards: PaymentCard[] = body.cards;
        try {
          await supabaseServer.from('payment_cards').delete().eq('user_id', targetUserId);
          if (cards.length > 0) {
            const rows = cards.map(c => ({
              id: c.id,
              user_id: targetUserId,
              number: c.number,
              holder: c.holder,
              exp: c.exp,
              type: c.type || 'mastercard',
              is_default: !!c.isDefault,
            }));
            const { error: insErr } = await supabaseServer.from('payment_cards').insert(rows);
            if (insErr) console.warn('Warning inserting payment_cards:', insErr.message);
          }
        } catch (err) {
          console.error('Error saving to payment_cards table:', err);
        }
      }
    }

    // 3. Action: Save favorites exclusively to public.favorites
    if (action === 'save_favorites' || action === 'sync_all') {
      if (Array.isArray(body.favorites)) {
        const favorites: string[] = body.favorites.map((f: unknown) => String(f).trim()).filter(Boolean);
        try {
          await supabaseServer.from('favorites').delete().eq('user_id', targetUserId);
          if (favorites.length > 0) {
            const rows = favorites.map(pid => ({
              user_id: targetUserId,
              product_id: pid,
            }));
            const { error: insErr } = await supabaseServer.from('favorites').insert(rows);
            if (insErr) console.warn('Warning inserting favorites:', insErr.message);
          }
        } catch (err) {
          console.error('Error saving to favorites table:', err);
        }
      }
    }

    // Opportunistic cleanup: remove any old parasite SYS_ rows for this user in active_sessions
    try {
      await supabaseServer.from('active_sessions').delete().eq('user_id', `SYS_USER_ADDR_${targetUserId}`);
      await supabaseServer.from('active_sessions').delete().eq('user_id', `SYS_USER_CARDS_${targetUserId}`);
      await supabaseServer.from('active_sessions').delete().eq('user_id', `SYS_USER_FAVS_${targetUserId}`);
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'User data successfully synchronized to dedicated tables',
      action,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Database sync error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
