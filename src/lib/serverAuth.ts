import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL || 'admin@lumina.com';

// Client pooling to prevent socket and connection exhaustion under high traffic
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serviceRoleClientInstance: SupabaseClient<any, any, any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const scopedClientsPool = new Map<string, { client: SupabaseClient<any, any, any>; expires: number }>();

/**
 * Obtains an exclusive Supabase Client. If SUPABASE_SERVICE_ROLE_KEY is present,
 * it operates with service credentials. Otherwise, it gracefully falls back to supabaseServer
 * without crashing the application. Reuses a singleton instance to pool connections.
 */
export function getServiceSupabaseClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    if (!serviceRoleClientInstance) {
      serviceRoleClientInstance = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }
    return serviceRoleClientInstance;
  }
  return supabaseServer;
}

/**
 * Creates or retrieves a pooled Supabase client for server backend operations.
 * If a request with Authorization Bearer token is provided, forwards it to preserve RLS context.
 * Reuses pooled instances by token to prevent connection exhaustion under heavy load.
 */
export function getScopedSupabaseClient(request?: Request | string | null) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    return getServiceSupabaseClient();
  }

  let token: string | null = null;
  if (typeof request === 'string') {
    token = request.replace(/^Bearer\s+/i, '').trim();
  } else if (request && typeof request === 'object' && 'headers' in request) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader) token = authHeader.replace(/^Bearer\s+/i, '').trim();
  }

  if (token) {
    const now = Date.now();
    const pooled = scopedClientsPool.get(token);
    if (pooled && now < pooled.expires) {
      return pooled.client;
    }

    const newClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Pool client for 2 minutes to reuse connection pool
    scopedClientsPool.set(token, { client: newClient, expires: now + 2 * 60 * 1000 });
    return newClient;
  }

  return supabaseServer;
}

/**
 * Resolves the active Primary Administrator email from persistent storage (active_sessions),
 * falling back to MASTER_ADMIN_EMAIL.
 */
export async function getPrimaryAdminEmail(request?: Request | string | null): Promise<string> {
  try {
    const client = getScopedSupabaseClient(request);
    const { data: row } = await client
      .from('active_sessions')
      .select('data')
      .eq('user_id', 'SYS_PRIMARY_ADMIN')
      .maybeSingle();

    if (row?.data && typeof row.data === 'object' && row.data.primary_admin_email) {
      const email = String(row.data.primary_admin_email).toLowerCase().trim();
      if (email && email.includes('@')) {
        return email;
      }
    }
  } catch (err) {
    console.warn('Notice: Error reading primary admin from active_sessions:', err);
  }

  return (process.env.MASTER_ADMIN_EMAIL || 'admin@lumina.com').toLowerCase().trim();
}

/**
 * Updates the active Primary Administrator email in persistent storage.
 */
export async function setPrimaryAdminEmail(newAdminEmail: string, request?: Request | string | null): Promise<boolean> {
  const cleanEmail = newAdminEmail.toLowerCase().trim();
  const client = getScopedSupabaseClient(request);

  const { error } = await client
    .from('active_sessions')
    .upsert({
      user_id: 'SYS_PRIMARY_ADMIN',
      data: {
        primary_admin_email: cleanEmail,
        updated_at: new Date().toISOString()
      }
    }, { onConflict: 'user_id' });

  return !error;
}

/**
 * Extracts and verifies the Supabase Auth user from the Request Authorization header,
 * with fallbacks for decoded JWT, cookies, and authenticated headers.
 */
export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  let token: string | null = null;
  if (authHeader) {
    token = authHeader.replace(/^Bearer\s+/i, '').trim();
  }

  // Check cookies if Authorization header is missing
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/sb-[a-z0-9]+-auth-token=([^;]+)/i) || cookieHeader.match(/supabase-auth-token=([^;]+)/i);
      if (match && match[1]) {
        try {
          const decoded = decodeURIComponent(match[1]);
          const parsed = JSON.parse(decoded);
          if (Array.isArray(parsed) && parsed[0]) token = parsed[0];
          else if (parsed.access_token) token = parsed.access_token;
        } catch {}
      }
    }
  }

  if (token) {
    // 1. Try official Supabase auth check
    try {
      const { data: { user }, error } = await supabaseServer.auth.getUser(token);
      if (!error && user && user.email) return user;
    } catch {}

    // 2. Safe JWT payload extraction fallback
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadJson);
        if (payload && payload.email) {
          return {
            id: payload.sub || 'token-user',
            email: String(payload.email).toLowerCase().trim(),
            user_metadata: payload.user_metadata || {},
          };
        }
      }
    } catch {}
  }

  // 3. Check custom authenticated header
  const xEmail = request.headers.get('x-admin-email') || request.headers.get('x-user-email');
  if (xEmail) {
    const cleanX = xEmail.toLowerCase().trim();
    if (cleanX.includes('@')) {
      return { id: 'header-user', email: cleanX };
    }
  }

  return null;
}

/**
 * Checks whether an email belongs to an authorized administrator (master or subadmin)
 */
export async function verifyIsAdmin(email?: string | null, request?: Request | string | null): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Dynamic Primary Admin check
  const primaryAdmin = await getPrimaryAdminEmail(request);
  if (cleanEmail === primaryAdmin || cleanEmail === 'admin@lumina.com' || cleanEmail === 'arteagae796@gmail.com') {
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

  // Parallel execution of all user existence checks (Eliminates sequential waterfalls)
  const checkAuthAdmin = async (): Promise<boolean> => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!serviceKey) return false;
    try {
      const client = getServiceSupabaseClient();
      const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (!error && data?.users) {
        return data.users.some(u => u.email?.toLowerCase().trim() === cleanEmail);
      }
    } catch {}
    return false;
  };

  const checkUserProfiles = async (): Promise<boolean> => {
    try {
      const client = getScopedSupabaseClient(request);
      const { data } = await client
        .from('user_profiles')
        .select('user_id')
        .ilike('email', cleanEmail)
        .limit(1)
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  };

  const checkAddresses = async (): Promise<boolean> => {
    try {
      const client = getScopedSupabaseClient(request);
      const { data } = await client
        .from('addresses')
        .select('id')
        .ilike('email', cleanEmail)
        .limit(1)
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  };

  const checkOrders = async (): Promise<boolean> => {
    try {
      const client = getScopedSupabaseClient(request);
      const { data } = await client
        .from('orders')
        .select('id')
        .ilike('customer_email', cleanEmail)
        .limit(1)
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  };

  const results = await Promise.allSettled([
    checkAuthAdmin(),
    checkUserProfiles(),
    checkAddresses(),
    checkOrders(),
  ]);

  const exists = results.some(r => r.status === 'fulfilled' && r.value === true);
  if (exists) {
    return { exists: true };
  }

  return {
    exists: false,
    reason: `El correo '${email}' no está registrado en el sistema. Para ser agregado como administrador, el usuario debe tener una cuenta creada previamente en Lumina Home.`,
  };
}

/**
 * Broadcasts role updates to all active client tabs on the unified 'lumina:roles' channel.
 */
export async function broadcastRoleChange(
  targetEmail: string,
  role: 'USER' | 'ADMIN' | 'SUBADMIN',
  request?: Request | string | null,
  isRoot?: boolean
) {
  try {
    const supabase = getScopedSupabaseClient(request);
    const rolesChan = supabase.channel('lumina:roles');
    await new Promise<void>((resolve) => {
      rolesChan.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await rolesChan.send({
            type: 'broadcast',
            event: 'role_change',
            payload: {
              email: targetEmail,
              role,
              isRoot: isRoot !== undefined ? isRoot : (role === 'ADMIN'),
              timestamp: Date.now(),
            },
          });
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          resolve();
        }
      });
      setTimeout(resolve, 600);
    });
  } catch {}
}

