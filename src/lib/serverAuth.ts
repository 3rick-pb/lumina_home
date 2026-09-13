import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export const MASTER_ADMIN_EMAIL = 'admin@lumina.com';

/**
 * Obtains an exclusive Supabase Client operating strictly with the master SUPABASE_SERVICE_ROLE_KEY.
 * Bypasses RLS on the server, ensuring 100% reliable persistence.
 * Throws a descriptive configuration error if SUPABASE_SERVICE_ROLE_KEY is not defined in environment (Vercel / .env.local).
 */
export function getServiceSupabaseClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    throw new Error('CONFIG_ERROR: SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno (Vercel / .env.local). El backend opera exclusivamente con clave root.');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/**
 * Creates a Supabase client for server backend operations.
 * Operates exclusively with SUPABASE_SERVICE_ROLE_KEY.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getScopedSupabaseClient(_request?: Request | string | null) {
  return getServiceSupabaseClient();
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

  // 1. Master admin check
  if (cleanEmail === MASTER_ADMIN_EMAIL) {
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
