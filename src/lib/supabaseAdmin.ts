import { getServiceSupabaseClient } from './serverAuth';

/**
 * Shared server-side Supabase client with service role credentials
 * for administrative and background operations (APNs push, wallet sync).
 */
export const supabaseAdmin = getServiceSupabaseClient();
