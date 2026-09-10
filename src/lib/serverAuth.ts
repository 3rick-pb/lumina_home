import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export const MASTER_ADMIN_EMAIL = 'admin@lumina.com';
export const ROOT_ADMIN_EMAILS = ['admin@lumina.com', 'arteagae796@gmail.com'];

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
 * Checks whether an email belongs to an authorized administrator (master, root or invited)
 */
export async function verifyIsAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Master & Root admin check
  if (cleanEmail === MASTER_ADMIN_EMAIL || ROOT_ADMIN_EMAILS.includes(cleanEmail)) {
    return true;
  }

  // 2. Query active_sessions SYS_ADMIN_INVITES (sole cloud source of truth)
  try {
    const { data: sysRow } = await supabaseServer
      .from('active_sessions')
      .select('email')
      .eq('user_id', 'SYS_ADMIN_INVITES')
      .maybeSingle();

    if (sysRow?.email) {
      const parsed = JSON.parse(sysRow.email);
      if (Array.isArray(parsed) && parsed.map(e => String(e).toLowerCase().trim()).includes(cleanEmail)) {
        return true;
      }
    }
  } catch {
    // Non-critical fallback
  }

  return false;
}
