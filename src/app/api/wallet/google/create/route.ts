import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin, getScopedSupabaseClient } from '@/lib/serverAuth';
import {
  createOrGetCustomerGoogleWalletPass,
  getGoogleWalletCredentials,
  type CustomerPassData,
} from '@/lib/wallet/googleCustomerPassService';

export const dynamic = 'force-dynamic';

function generateDeterministicCode(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) % 9000;
  }
  const num = 1000 + Math.abs(hash);
  return `LUM-${num}-PRV`;
}

/**
 * POST /api/wallet/google/create
 * Generates or retrieves the official Google Wallet Customer Pass for a client.
 */
export async function POST(request: Request) {
  try {
    const credentials = getGoogleWalletCredentials();
    if (!credentials) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales de Google Wallet no configuradas en el servidor.',
        },
        { status: 503 }
      );
    }

    let body: {
      customerId?: string;
      customerEmail?: string;
      customerName?: string;
      memberCode?: string;
      pointsBalance?: number;
      tierName?: string;
    } = {};

    try {
      body = await request.json();
    } catch {
      // Empty or non-JSON body allowed
    }

    // 1. Authenticate user
    const authUser = await getAuthenticatedUser(request);
    const client = getScopedSupabaseClient(request);

    let targetEmail = authUser?.email ? authUser.email.toLowerCase().trim() : '';

    // If an administrator requests on behalf of a customer, or target email is specified
    if (body.customerEmail || body.customerId || body.memberCode) {
      const requestedEmail = (body.customerEmail || '').toLowerCase().trim();
      const isAdmin = authUser?.email ? await verifyIsAdmin(authUser.email, request) : false;

      if (isAdmin && requestedEmail) {
        targetEmail = requestedEmail;
      } else if (!targetEmail && (body.memberCode || body.customerId || requestedEmail)) {
        // Fallback for customer scanning their own pass link
        targetEmail = requestedEmail;
      }
    }

    // 2. Fetch customer details from database
    let customerData: CustomerPassData | null = null;

    // Check loyalty_members table first
    if (targetEmail || body.memberCode || body.customerId) {
      let query = client.from('loyalty_members').select('*');
      if (targetEmail) {
        query = query.ilike('customer_email', targetEmail);
      } else if (body.memberCode) {
        query = query.eq('member_code', body.memberCode.trim());
      } else if (body.customerId) {
        query = query.eq('id', body.customerId.trim());
      }

      const { data: memberRow } = await query.maybeSingle();

      if (memberRow) {
        customerData = {
          customerId: String(memberRow.id),
          customerName: String(memberRow.customer_name || memberRow.customer_email.split('@')[0]),
          customerEmail: String(memberRow.customer_email),
          memberCode: String(memberRow.member_code || generateDeterministicCode(memberRow.customer_email)),
          pointsBalance: Number(memberRow.points_balance || 0),
          tierName: Number(memberRow.points_balance || 0) >= 1200 ? 'Nivel Oro' : 'Nivel Plata',
          status: String(memberRow.status || 'active'),
        };
      }
    }

    // If not in loyalty_members, check user_profiles
    if (!customerData && targetEmail) {
      const { data: profileRow } = await client
        .from('user_profiles')
        .select('*')
        .ilike('email', targetEmail)
        .maybeSingle();

      if (profileRow) {
        const name = String(profileRow.full_name || profileRow.name || targetEmail.split('@')[0]);
        customerData = {
          customerId: String(profileRow.id || profileRow.user_id || targetEmail),
          customerName: name,
          customerEmail: targetEmail,
          memberCode: generateDeterministicCode(targetEmail),
          pointsBalance: 200, // Welcome bonus
          tierName: 'Nivel Plata',
          status: 'active',
        };
      }
    }

    // Fallback if user is authenticated but not in custom tables yet
    if (!customerData && authUser) {
      const email = authUser.email || 'cliente@luminahome.ec';
      customerData = {
        customerId: authUser.id,
        customerName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0],
        customerEmail: email,
        memberCode: generateDeterministicCode(email),
        pointsBalance: 200,
        tierName: 'Nivel Plata',
        status: 'active',
      };
    }

    // Fallback if not found in database (e.g. initial setup or guest flow)
    if (!customerData) {
      const email = targetEmail || (body.customerEmail || '').trim() || (authUser?.email || 'cliente@luminahome.ec');
      const name = (body.customerName || '').trim() || (authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || (email ? email.split('@')[0] : 'Cliente Lumina'));
      const code = (body.memberCode || '').trim() || generateDeterministicCode(email);
      const points = typeof body.pointsBalance === 'number' ? body.pointsBalance : 200;
      const tier = body.tierName || (points >= 1200 ? 'Nivel Oro' : 'Nivel Plata');

      customerData = {
        customerId: body.customerId || code || email,
        customerName: name,
        customerEmail: email,
        memberCode: code,
        pointsBalance: points,
        tierName: tier,
        status: 'active',
      };
    }

    // 3. Create or retrieve Google Wallet GenericObject & sign JWT
    const result = await createOrGetCustomerGoogleWalletPass(customerData);

    if (!result.success || !result.saveUrl) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'No se pudo generar el pase en Google Wallet.',
        },
        { status: 500 }
      );
    }

    // 4. Return clean, non-sensitive response
    return NextResponse.json({
      success: true,
      saveUrl: result.saveUrl,
      objectId: result.objectId,
      isExisting: result.isExisting,
      memberCode: customerData.memberCode,
      customerName: customerData.customerName,
    });
  } catch (err) {
    console.error('[API /wallet/google/create] Exception:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Ocurrió un error inesperado al procesar la tarjeta de Google Wallet.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wallet/google/create
 * Convenient endpoint that directly redirects to the Google Wallet save URL
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  const email = searchParams.get('email') || '';
  const name = searchParams.get('name') || '';

  const origin = new URL(request.url).origin;

  if (!code && !email) {
    return NextResponse.redirect(`${origin}/loyalty/pass`);
  }

  const customerData: CustomerPassData = {
    customerId: code || email,
    customerName: name || 'Cliente Lumina',
    customerEmail: email || 'cliente@luminahome.ec',
    memberCode: code || (email ? generateDeterministicCode(email) : 'LUM-1042-PRV'),
    pointsBalance: Number(searchParams.get('pts') || 200),
    tierName: searchParams.get('tier') || 'Nivel Plata',
    status: 'active',
  };

  const result = await createOrGetCustomerGoogleWalletPass(customerData);
  if (result.success && result.saveUrl) {
    return NextResponse.redirect(result.saveUrl);
  }

  return NextResponse.redirect(`${origin}/loyalty/pass?code=${encodeURIComponent(customerData.memberCode)}&name=${encodeURIComponent(customerData.customerName)}`);
}
