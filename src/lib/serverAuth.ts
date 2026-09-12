import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export const MASTER_ADMIN_EMAIL = 'admin@lumina.com';

/**
 * Creates a Supabase client scoped to the incoming request.
 * - If SUPABASE_SERVICE_ROLE_KEY is set in environment, uses it to bypass RLS with superuser permissions.
 * - If not, forwards the user's Bearer token so Supabase PostgREST evaluates RLS with the authentic user session.
 * - Otherwise falls back to supabaseServer.
 */
export function getScopedSupabaseClient(request?: Request | string | null) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey && serviceKey !== '') {
    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  let token: string | null = null;
  if (typeof request === 'string') {
    token = request.replace(/^Bearer\s+/i, '').trim();
  } else if (request && typeof request === 'object' && 'headers' in request) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader) {
      token = authHeader.replace(/^Bearer\s+/i, '').trim();
    }
  }

  if (token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
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
export async function verifyIsAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Master admin check
  if (cleanEmail === MASTER_ADMIN_EMAIL) {
    return true;
  }

  // 2. Query dedicated admin_invitations table
  try {
    const { data: invRow } = await supabaseServer
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
