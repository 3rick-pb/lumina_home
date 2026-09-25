import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin, getScopedSupabaseClient } from '@/lib/serverAuth';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimit';

import type { RawGpsHardwareData } from '@/lib/locationUtils';

export interface ShippingAddress {
  id: string;
  recipient: string; // Used as full_name
  idNumber?: string;
  phone?: string;
  email?: string;
  
  // Mandatory Location
  country: string;
  state: string;
  city: string;
  postalCode: string;
  street: string; // Name only
  exteriorNumber?: string;
  neighborhood?: string;
  
  // Optional Details
  interiorNumber?: string;
  crossStreets?: string;
  reference?: string; // Used as landmark
  addressType?: 'casa' | 'departamento' | 'oficina';
  deliveryInstructions?: string;
  hasElevator?: boolean;
  floorLevel?: string;
  label?: string; // e.g. Casa, Trabajo
  
  // Geo
  lat?: number;
  lng?: number;
  rawGps?: RawGpsHardwareData;
  rawGpsString?: string;
  
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
    return createRateLimitResponse('Demasiadas solicitudes de consulta.', rateLimit.resetTimeMs);
  }

  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.id) {
      return NextResponse.json({ success: false, error: 'Acceso no autorizado: se requiere sesión de usuario activa' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');
    const isAdmin = authUser.email ? await verifyIsAdmin(authUser.email) : false;

    // Strict Anti-IDOR: Only verified administrators can view another user's data
    const targetUserId = isAdmin && queryUserId && UUID_REGEX.test(queryUserId)
      ? queryUserId
      : authUser.id;

    const supabase = getScopedSupabaseClient(request);

    // Parallel execution of all user data queries (Eliminates sequential waterfalls)
    const fetchAddresses = async (): Promise<ShippingAddress[]> => {
      try {
        let { data: dbAddrs, error: addrErr } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', targetUserId)
          .order('updated_at', { ascending: false });

        if (addrErr && addrErr.message?.includes('addresses.updated_at does not exist')) {
          const alt = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });
          dbAddrs = alt.data;
          addrErr = alt.error;
        } else if (addrErr) {
          const fallback = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', targetUserId);
          dbAddrs = fallback.data;
          addrErr = fallback.error;
        }

        if (!addrErr && dbAddrs && dbAddrs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return dbAddrs.map((a: any) => {
            let cleanCountry = String(a.country || 'Ecuador');
            let packedMeta: {
              lat?: number;
              lng?: number;
              reference?: string;
              rawGps?: unknown;
              rawGpsString?: string;
              exteriorNumber?: string;
              neighborhood?: string;
              interiorNumber?: string;
              crossStreets?: string;
              addressType?: 'casa' | 'departamento' | 'oficina';
              deliveryInstructions?: string;
              hasElevator?: boolean;
              floorLevel?: string;
              label?: string;
            } = {};
            if (cleanCountry.includes('||LUMINA_RAW_GPS||')) {
              const [baseCountry, rawJson] = cleanCountry.split('||LUMINA_RAW_GPS||');
              cleanCountry = baseCountry || 'Ecuador';
              try {
                packedMeta = JSON.parse(rawJson || '{}');
              } catch {}
            }
            const resolvedLat =
              typeof a.lat === 'number'
                ? a.lat
                : typeof packedMeta.lat === 'number'
                ? packedMeta.lat
                : undefined;
            const resolvedLng =
              typeof a.lng === 'number'
                ? a.lng
                : typeof packedMeta.lng === 'number'
                ? packedMeta.lng
                : undefined;

            return {
              id: a.id,
              recipient: a.recipient || 'Destinatario',
              idNumber: a.id_number || '',
              phone: a.phone || '',
              email: a.email || '',
              street: a.street || '',
              city: a.city || '',
              state: a.state || '',
              postalCode: a.postal_code || '',
              country: cleanCountry,
              exteriorNumber: packedMeta.exteriorNumber,
              neighborhood: packedMeta.neighborhood,
              interiorNumber: packedMeta.interiorNumber,
              crossStreets: packedMeta.crossStreets,
              reference: a.reference || packedMeta.reference || '',
              addressType: packedMeta.addressType,
              deliveryInstructions: packedMeta.deliveryInstructions,
              hasElevator: packedMeta.hasElevator,
              floorLevel: packedMeta.floorLevel,
              label: packedMeta.label,
              lat: resolvedLat,
              lng: resolvedLng,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              rawGps: (a.raw_gps || packedMeta.rawGps || undefined) as any,
              rawGpsString: a.raw_gps_string || packedMeta.rawGpsString || undefined,
              isDefault: !!a.is_default,
            };
          });
        }
      } catch (err) {
        console.warn('Notice: Error reading addresses table:', err);
      }
      return [];
    };

    const fetchCards = async (): Promise<PaymentCard[]> => {
      try {
        let { data: dbCards, error: cardErr } = await supabase
          .from('payment_cards')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (cardErr) {
          const fallback = await supabase
            .from('payment_cards')
            .select('*')
            .eq('user_id', targetUserId);
          dbCards = fallback.data;
          cardErr = fallback.error;
        }

        if (!cardErr && dbCards && dbCards.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return dbCards.map((c: any) => ({
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
      return [];
    };

    const fetchFavorites = async (): Promise<string[]> => {
      try {
        const { data: dbFavs, error: favErr } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', targetUserId);

        if (!favErr && dbFavs && dbFavs.length > 0) {
          return dbFavs.map(f => String(f.product_id));
        }
      } catch (err) {
        console.warn('Notice: Error reading favorites table:', err);
      }
      return [];
    };

    const fetchProfile = async (): Promise<{ displayName?: string; phone?: string; avatarUrl?: string } | null> => {
      try {
        const { data: dbProf } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();
        if (dbProf) {
          return {
            displayName: dbProf.display_name || undefined,
            phone: dbProf.phone || undefined,
            avatarUrl: dbProf.avatar_url || undefined,
          };
        }
      } catch {}
      return null;
    };

    const [addresses, cards, favorites, profile] = await Promise.all([
      fetchAddresses(),
      fetchCards(),
      fetchFavorites(),
      fetchProfile(),
    ]);

    // Determine default address
    const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      addresses,
      address: defaultAddress,
      cards,
      favorites,
      profile,
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

    const supabase = getScopedSupabaseClient(request);
    const action = body.action || 'sync_all';

    // 1. Action: Save addresses exclusively to public.addresses
    if (action === 'save_addresses' || action === 'sync_all') {
      if (Array.isArray(body.addresses)) {
        const addresses: ShippingAddress[] = body.addresses;
        // CRITICAL PROTECTION: On sync_all, never wipe out cloud addresses if guest array is empty!
        if (action === 'sync_all' && addresses.length === 0) {
          // Keep existing cloud addresses untouched
        } else {
          try {
            await supabase.from('addresses').delete().eq('user_id', targetUserId);
            if (addresses.length > 0) {
              const rowsWithGeo = addresses.map(a => {
                const baseCountry = String(a.country || 'Ecuador').split('||LUMINA_RAW_GPS||')[0] || 'Ecuador';
                const packedCountry = `${baseCountry}||LUMINA_RAW_GPS||${JSON.stringify({
                  lat: typeof a.lat === 'number' ? a.lat : a.rawGps?.latitude,
                  lng: typeof a.lng === 'number' ? a.lng : a.rawGps?.longitude,
                  reference: a.reference || undefined,
                  rawGps: a.rawGps || undefined,
                  rawGpsString: a.rawGpsString || a.rawGps?.rawCoordsString || undefined,
                  exteriorNumber: a.exteriorNumber,
                  neighborhood: a.neighborhood,
                  interiorNumber: a.interiorNumber,
                  crossStreets: a.crossStreets,
                  addressType: a.addressType,
                  deliveryInstructions: a.deliveryInstructions,
                  hasElevator: a.hasElevator,
                  floorLevel: a.floorLevel,
                  label: a.label,
                })}`;
                return {
                  id: a.id && UUID_REGEX.test(a.id) ? a.id : crypto.randomUUID(),
                  user_id: targetUserId,
                  recipient: a.recipient || 'Destinatario',
                  id_number: a.idNumber || null,
                  phone: a.phone || null,
                  email: a.email || null,
                  street: a.street || '',
                  city: a.city || '',
                  state: a.state || '',
                  postal_code: a.postalCode || '',
                  country: packedCountry,
                  reference: a.reference || null,
                  lat: typeof a.lat === 'number' ? a.lat : a.rawGps?.latitude ?? null,
                  lng: typeof a.lng === 'number' ? a.lng : a.rawGps?.longitude ?? null,
                  is_default: !!a.isDefault,
                  updated_at: new Date().toISOString(),
                };
              });
              const { error: insErr } = await supabase.from('addresses').insert(rowsWithGeo);
              if (insErr) {
                const rowsBase = rowsWithGeo.map(row => ({
                  id: row.id,
                  user_id: row.user_id,
                  recipient: row.recipient,
                  id_number: row.id_number,
                  phone: row.phone,
                  email: row.email,
                  street: row.street,
                  city: row.city,
                  state: row.state,
                  postal_code: row.postal_code,
                  country: row.country, // Preserves ||LUMINA_RAW_GPS|| envelope 100% intact!
                  is_default: row.is_default,
                  updated_at: row.updated_at,
                }));
                await supabase.from('addresses').insert(rowsBase);
              }
            }
          } catch (err) {
            console.error('Error saving to addresses table:', err);
          }
        }
      }
    }

    // 2. Action: Save cards exclusively to public.payment_cards
    if (action === 'save_cards' || action === 'sync_all') {
      if (Array.isArray(body.cards)) {
        const cards: PaymentCard[] = body.cards;
        // CRITICAL PROTECTION: On sync_all, never wipe out cloud cards if guest array is empty!
        if (action === 'sync_all' && cards.length === 0) {
          // Keep existing cloud cards untouched
        } else {
          try {
            await supabase.from('payment_cards').delete().eq('user_id', targetUserId);
            if (cards.length > 0) {
              const rows = cards.map(c => ({
                id: c.id && UUID_REGEX.test(c.id) ? c.id : crypto.randomUUID(),
                user_id: targetUserId,
                number: c.number,
                holder: c.holder,
                exp: c.exp,
                type: c.type || 'mastercard',
                is_default: !!c.isDefault,
              }));
              const { error: insErr } = await supabase.from('payment_cards').insert(rows);
              if (insErr) console.warn('Warning inserting payment_cards:', insErr.message);
            }
          } catch (err) {
            console.error('Error saving to payment_cards table:', err);
          }
        }
      }
    }

    // 3. Action: Save favorites exclusively to public.favorites
    if (action === 'save_favorites' || action === 'sync_all') {
      if (Array.isArray(body.favorites)) {
        const favorites: string[] = body.favorites.map((f: unknown) => String(f).trim()).filter(Boolean);
        // CRITICAL PROTECTION: On sync_all, never wipe out cloud favorites if guest array is empty!
        if (action === 'sync_all' && favorites.length === 0) {
          // Keep existing cloud favorites untouched
        } else {
          try {
            await supabase.from('favorites').delete().eq('user_id', targetUserId);
            if (favorites.length > 0) {
              const rows = favorites.map(pid => ({
                user_id: targetUserId,
                product_id: pid,
              }));
              const { error: insErr } = await supabase.from('favorites').insert(rows);
              if (insErr) console.warn('Warning inserting favorites:', insErr.message);
            }
          } catch (err) {
            console.error('Error saving to favorites table:', err);
          }
        }
      }
    }

    // 4. Action: Save profile directly to public.user_profiles
    if (action === 'save_profile' && body.profile) {
      try {
        await supabase.from('user_profiles').upsert({
          user_id: targetUserId,
          display_name: body.profile.displayName || null,
          email: authUser?.email || body.profile.email || null,
          phone: body.profile.phone || null,
          avatar_url: body.profile.avatarUrl || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.error('Error saving to user_profiles table:', err);
      }
    }

    // Opportunistic cleanup: remove any old parasite SYS_ rows for this user in active_sessions
    try {
      await supabase.from('active_sessions').delete().eq('user_id', `SYS_USER_ADDR_${targetUserId}`);
      await supabase.from('active_sessions').delete().eq('user_id', `SYS_USER_CARDS_${targetUserId}`);
      await supabase.from('active_sessions').delete().eq('user_id', `SYS_USER_FAVS_${targetUserId}`);
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
