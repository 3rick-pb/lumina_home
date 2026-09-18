import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export const MASTER_ADMIN_EMAIL = 'admin@lumina.com';

/**
 * Obtains an exclusive Supabase Client. If SUPABASE_SERVICE_ROLE_KEY is present,
 * it operates with service credentials. Otherwise, it gracefully falls back to supabaseServer
 * without crashing the application.
 */
export function getServiceSupabaseClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return supabaseServer;
}

/**
 * Creates a Supabase client for server backend operations.
 * If a request with Authorization Bearer token is provided, forwards it to preserve RLS context.
 */
export function getScopedSupabaseClient(request?: Request | string | null) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  let token: string | null = null;
  if (typeof request === 'string') {
    token = request.replace(/^Bearer\s+/i, '').trim();
  } else if (request && typeof request === 'object' && 'headers' in request) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader) token = authHeader.replace(/^Bearer\s+/i, '').trim();
  }

  if (token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  return supabaseServer;
}

/**
 * Extracts and verifies the Supabase Auth user from the Request Authorization header
 */
export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Checks whether an email belongs to an authorized administrator (master or invited)
 */
export async function verifyIsAdmin(email?: string | null, request?: Request | string | null): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Master admin checks
  if (cleanEmail === MASTER_ADMIN_EMAIL || cleanEmail === 'arteagae796@gmail.com') {
    return true;
  }

  // 2. Query dedicated admin_invitations table with scoped client
  try {
    const client = getScopedSupabaseClient(request);
    const { data: invRow } = await client
      .from('admin_invitations')
      .select('id')
      .ilike('email', cleanEmail)
      .eq('is_active', true)
      .maybeSingle();

    if (invRow) {
      return true;
    }
  } catch (err) {
    console.warn('Notice: Error verifying admin in admin_invitations:', err);
  }

  return false;
}

/**
 * Checks whether an email belongs to a registered or active account in Lumina Home.
 * Checks master administrators, Supabase auth (via service role if available),
 * user_profiles, addresses, and orders.
 */
export async function checkIfUserExists(
  email: string, 
  request?: Request | string | null
): Promise<{ exists: boolean; reason?: string }> {
  if (!email) return { exists: false, reason: 'Correo electrónico vacío.' };
  const cleanEmail = email.toLowerCase().trim();

  // 1. Master admin accounts are always valid
  if (cleanEmail === MASTER_ADMIN_EMAIL || cleanEmail === 'arteagae796@gmail.com') {
    return { exists: true };
  }

  // 2. Try Supabase Auth Admin API if service role key is present
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    try {
      const client = getServiceSupabaseClient();
      const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (!error && data?.users) {
        const found = data.users.some(
          (u) => u.email?.toLowerCase().trim() === cleanEmail
        );
        if (found) return { exists: true };
      }
    } catch (e) {
      console.warn('Notice: Error verifying user in auth.admin.listUsers:', e);
    }
  }

  // 3. Query public.user_profiles table
  try {
    const client = getScopedSupabaseClient(request);
    const { data: profile, error } = await client
      .from('user_profiles')
      .select('user_id, email')
      .ilike('email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (!error && profile) {
      return { exists: true };
    }
  } catch (e) {
    console.warn('Notice: Error checking user_profiles for email:', e);
  }

  // 4. Query public.addresses table (saved user customer addresses)
  try {
    const client = getScopedSupabaseClient(request);
    const { data: addr, error } = await client
      .from('addresses')
      .select('id')
      .ilike('email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (!error && addr) {
      return { exists: true };
    }
  } catch {}

  // 5. Query public.orders table (customer order records)
  try {
    const client = getScopedSupabaseClient(request);
    const { data: ord, error } = await client
      .from('orders')
      .select('id')
      .ilike('customer_email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (!error && ord) {
      return { exists: true };
    }
  } catch {}

  return {
    exists: false,
    reason: `El correo '${email}' no está registrado en el sistema. Para ser agregado como administrador, el usuario debe tener una cuenta creada previamente en Lumina Home.`,
  };
}
