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
