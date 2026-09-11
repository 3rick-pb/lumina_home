import { NextResponse } from 'next/server';
import { supabaseServer, getAuthenticatedUser } from '@/lib/serverAuth';

export interface ShippingAddress {
  id: string;
  recipient: string;
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

function resolveTargetUserId(authUser: { id: string; email?: string } | null, queryUserId?: string | null): string | null {
  if (authUser?.id) return authUser.id;
  if (queryUserId && (UUID_REGEX.test(queryUserId) || queryUserId.startsWith('user_') || queryUserId.length >= 8)) {
    return queryUserId;
  }
  return null;
}

/**
 * GET /api/user/data
 * Retrieves addresses, cards, and favorites directly from the Database (Supabase)
 */
export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    const targetUserId = resolveTargetUserId(authUser, queryUserId);
    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user session found',
        addresses: [],
        cards: [],
        favorites: [],
        address: null,
      }, { status: 401 });
    }

    let addresses: ShippingAddress[] = [];
    let cards: PaymentCard[] = [];
    let favorites: string[] = [];
    let defaultAddress: ShippingAddress | null = null;

    // 1. Fetch addresses from Database (active_sessions cloud store + addresses native table)
    try {
      const { data: addrRow } = await supabaseServer
        .from('active_sessions')
        .select('email')
        .eq('user_id', `SYS_USER_ADDR_${targetUserId}`)
        .maybeSingle();

      if (addrRow?.email) {
        try {
          const parsed = JSON.parse(addrRow.email);
          if (Array.isArray(parsed)) {
            addresses = parsed;
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.addresses)) addresses = parsed.addresses;
            if (parsed.activeAddress) defaultAddress = parsed.activeAddress;
          }
        } catch {}
      }
    } catch {}

    // Check native addresses table if active_sessions had no addresses
    if (addresses.length === 0 && UUID_REGEX.test(targetUserId)) {
      try {
        const { data: dbAddrs } = await supabaseServer
          .from('addresses')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (dbAddrs && dbAddrs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addresses = dbAddrs.map((a: any) => ({
            id: a.id,
            recipient: a.recipient || 'Destinatario',
            street: a.street || '',
            city: a.city || '',
            state: a.state || '',
            postalCode: a.postal_code || '',
            country: a.country || 'Ecuador',
            isDefault: !!a.is_default,
          }));
        }
      } catch {}
    }

    // 2. Fetch cards from Database (active_sessions cloud store + payment_cards native table)
    try {
      const { data: cardsRow } = await supabaseServer
        .from('active_sessions')
        .select('email')
        .eq('user_id', `SYS_USER_CARDS_${targetUserId}`)
        .maybeSingle();

      if (cardsRow?.email) {
        try {
          const parsed = JSON.parse(cardsRow.email);
          if (Array.isArray(parsed)) cards = parsed;
          else if (Array.isArray(parsed?.cards)) cards = parsed.cards;
        } catch {}
      }
    } catch {}

    if (cards.length === 0 && UUID_REGEX.test(targetUserId)) {
      try {
        const { data: dbCards } = await supabaseServer
          .from('payment_cards')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (dbCards && dbCards.length > 0) {
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
      } catch {}
    }

    // 3. Fetch favorites from Database
    try {
      const { data: favsRow } = await supabaseServer
        .from('active_sessions')
        .select('email')
        .eq('user_id', `SYS_USER_FAVS_${targetUserId}`)
        .maybeSingle();

      if (favsRow?.email) {
        try {
          const parsed = JSON.parse(favsRow.email);
          const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.favorites) ? parsed.favorites : [];
          favorites = list.map((id: unknown) => String(id));
        } catch {}
      }
    } catch {}

    if (favorites.length === 0 && UUID_REGEX.test(targetUserId)) {
      try {
        const { data: dbFavs } = await supabaseServer
          .from('favorites')
          .select('product_id')
          .eq('user_id', targetUserId);

        if (dbFavs && dbFavs.length > 0) {
          favorites = dbFavs.map(f => String(f.product_id));
        }
      } catch {}
    }

    // Determine default address
    if (!defaultAddress) {
      defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;
    }

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
 * Mutates and stores addresses, cards, or favorites directly into the Database
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const body = await request.json().catch(() => ({}));
    const targetUserId = resolveTargetUserId(authUser, body.userId);

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: valid user session required' }, { status: 401 });
    }

    const action = body.action || 'sync_all';

    // 1. Action: Save addresses
    if (action === 'save_addresses' || action === 'sync_all') {
      if (Array.isArray(body.addresses)) {
        const addresses: ShippingAddress[] = body.addresses;
        const activeAddress: ShippingAddress | null = body.activeAddress || addresses.find(a => a.isDefault) || addresses[0] || null;

        // Persist to active_sessions cloud store
        await supabaseServer.from('active_sessions').upsert({
          user_id: `SYS_USER_ADDR_${targetUserId}`,
          name: 'SYS_USER_ADDR',
          email: JSON.stringify({ addresses, activeAddress }),
          city: activeAddress?.city || addresses[0]?.city || 'Quito',
          country: activeAddress?.country || addresses[0]?.country || 'Ecuador',
          current_section: 'USER_ADDRESS_STORE',
          is_online: false,
          last_seen: new Date().toISOString()
        }, { onConflict: 'user_id' });

        // Native table sync if UUID
        if (UUID_REGEX.test(targetUserId)) {
          try {
            await supabaseServer.from('addresses').delete().eq('user_id', targetUserId);
            if (addresses.length > 0) {
              const rows = addresses.map(a => ({
                id: a.id,
                user_id: targetUserId,
                recipient: a.recipient || 'Destinatario',
                street: a.street || '',
                city: a.city || '',
                state: a.state || '',
                postal_code: a.postalCode || '',
                country: a.country || 'Ecuador',
                is_default: !!a.isDefault,
              }));
              await supabaseServer.from('addresses').insert(rows);
            }
          } catch {}
        }
      }
    }

    // 2. Action: Save cards
    if (action === 'save_cards' || action === 'sync_all') {
      if (Array.isArray(body.cards)) {
        const cards: PaymentCard[] = body.cards;

        await supabaseServer.from('active_sessions').upsert({
          user_id: `SYS_USER_CARDS_${targetUserId}`,
          name: 'SYS_USER_CARDS',
          email: JSON.stringify(cards),
          city: 'Quito',
          country: 'Ecuador',
          current_section: 'USER_CARDS_STORE',
          is_online: false,
          last_seen: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (UUID_REGEX.test(targetUserId)) {
          try {
            await supabaseServer.from('payment_cards').delete().eq('user_id', targetUserId);
            if (cards.length > 0) {
              const rows = cards.map(c => ({
                id: c.id,
                user_id: targetUserId,
                number: c.number,
                holder: c.holder,
                exp: c.exp,
                type: c.type,
                is_default: !!c.isDefault,
              }));
              await supabaseServer.from('payment_cards').insert(rows);
            }
          } catch {}
        }
      }
    }

    // 3. Action: Save favorites
    if (action === 'save_favorites' || action === 'sync_all') {
      if (Array.isArray(body.favorites)) {
        const favorites: string[] = body.favorites.map((f: unknown) => String(f));

        await supabaseServer.from('active_sessions').upsert({
          user_id: `SYS_USER_FAVS_${targetUserId}`,
          name: 'SYS_USER_FAVS',
          email: JSON.stringify(favorites),
          city: 'Quito',
          country: 'Ecuador',
          current_section: 'USER_FAVORITES_STORE',
          is_online: false,
          last_seen: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (UUID_REGEX.test(targetUserId)) {
          try {
            await supabaseServer.from('favorites').delete().eq('user_id', targetUserId);
            const validUuids = favorites.filter(f => UUID_REGEX.test(f));
            if (validUuids.length > 0) {
              const rows = validUuids.map(pid => ({
                user_id: targetUserId,
                product_id: pid,
              }));
              await supabaseServer.from('favorites').insert(rows);
            }
          } catch {}
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User data successfully synchronized to database',
      action,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Database sync error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
