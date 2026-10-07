import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wegtielydjzrckbafbfv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_8eJA4C3xm-7PGjwiFN8juQ_Cj1TWxhA";

/**
 * Cliente Supabase aislado exclusivamente para la conexión OAuth de Google Drive.
 * Al usar un storageKey independiente ('lumina_drive_auth_token'), NUNCA colisiona
 * ni sobrescribe la sesión activa de la tienda ni del administrador.
 */
export const supabaseDrive = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "lumina_drive_auth_token",
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
