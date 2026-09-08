-- ==============================================================================
-- LUMINA HOME — MIGRACIÓN ARQUITECTÓNICA COMPLETA
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- IMPORTANTE: Este script es ADITIVO. No elimina datos sin backup previo.
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 1: BACKUP DE SEGURIDAD                                               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DROP TABLE IF EXISTS _backup_orders;
DROP TABLE IF EXISTS _backup_addresses;
DROP TABLE IF EXISTS _backup_payment_cards;
DROP TABLE IF EXISTS _backup_favorites;
DROP TABLE IF EXISTS _backup_user_carts;

CREATE TABLE _backup_orders AS SELECT * FROM orders;
CREATE TABLE _backup_addresses AS SELECT * FROM addresses;
CREATE TABLE _backup_payment_cards AS SELECT * FROM payment_cards;
CREATE TABLE _backup_favorites AS SELECT * FROM favorites;
CREATE TABLE _backup_user_carts AS SELECT * FROM user_carts;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 2: NUEVAS TABLAS                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- 1. Tabla dedicada para administradores invitados
CREATE TABLE IF NOT EXISTS public.admin_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT admin_invitations_email_unique UNIQUE (email)
);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin invitations select" ON public.admin_invitations;
CREATE POLICY "Admin invitations select" ON public.admin_invitations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin invitations insert" ON public.admin_invitations;
CREATE POLICY "Admin invitations insert" ON public.admin_invitations
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = 'admin@lumina.com'
        OR auth.jwt() ->> 'email' = 'arteagae796@gmail.com'
    );

DROP POLICY IF EXISTS "Admin invitations delete" ON public.admin_invitations;
CREATE POLICY "Admin invitations delete" ON public.admin_invitations
    FOR DELETE USING (
        auth.jwt() ->> 'email' = 'admin@lumina.com'
        OR auth.jwt() ->> 'email' = 'arteagae796@gmail.com'
    );

DROP POLICY IF EXISTS "Admin invitations update" ON public.admin_invitations;
CREATE POLICY "Admin invitations update" ON public.admin_invitations
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'admin@lumina.com'
        OR auth.jwt() ->> 'email' = 'arteagae796@gmail.com'
    );

-- 2. Tabla de configuración del sistema (key-value)
CREATE TABLE IF NOT EXISTS public.system_config (
    key text PRIMARY KEY,
    value jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System config read" ON public.system_config;
CREATE POLICY "System config read" ON public.system_config
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "System config write" ON public.system_config;
CREATE POLICY "System config write" ON public.system_config
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'admin@lumina.com'
        OR auth.jwt() ->> 'email' = 'arteagae796@gmail.com'
    );

-- 3. Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    phone text,
    avatar_url text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own profile" ON public.user_profiles;
CREATE POLICY "Users can upsert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
CREATE POLICY "Admins can read all profiles" ON public.user_profiles
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'admin@lumina.com'
        OR auth.jwt() ->> 'email' = 'arteagae796@gmail.com'
        OR EXISTS (SELECT 1 FROM public.admin_invitations WHERE email = auth.jwt() ->> 'email' AND is_active = true)
    );

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 3: FUNCIÓN is_admin()                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' = 'admin@lumina.com'
    OR auth.jwt() ->> 'email' = 'arteagae796@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.admin_invitations 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_root_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' = 'admin@lumina.com'
    OR auth.jwt() ->> 'email' = 'arteagae796@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 4: ASEGURAR COLUMNAS EXTENDIDAS EN PRODUCTS                          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS materials text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS package_contents text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 20;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_specs jsonb;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 5: MIGRACIÓN DE DATOS                                                ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
  _items jsonb;
  _email text;
  _root_id uuid;
BEGIN
  SELECT id INTO _root_id FROM auth.users WHERE email = 'admin@lumina.com' LIMIT 1;
  SELECT items INTO _items FROM public.orders WHERE id = 'SYS_CONFIG_ADMIN_INVITES';
  
  IF _items IS NOT NULL AND jsonb_array_length(_items) > 0 THEN
    FOR _email IN
      SELECT LOWER(TRIM(
        CASE 
          WHEN jsonb_typeof(elem) = 'object' THEN elem->>'email'
          ELSE elem #>> '{}'
        END
      ))
      FROM jsonb_array_elements(_items) AS elem
    LOOP
      IF _email IS NOT NULL AND _email != '' THEN
        INSERT INTO public.admin_invitations (email, invited_by, is_active)
        VALUES (_email, _root_id, true)
        ON CONFLICT (email) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  DELETE FROM public.orders WHERE id = 'SYS_CONFIG_ADMIN_INVITES';
  RAISE NOTICE 'Migration complete. Admin invitations moved to dedicated table.';
END $$;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 6: INDEXES                                                            ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_cards_user_id ON public.payment_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON public.admin_invitations(email);

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 7: NUEVAS POLÍTICAS RLS RESTRICTIVAS                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── PRODUCTS ──
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public insert products" ON public.products;
DROP POLICY IF EXISTS "Public update products" ON public.products;
DROP POLICY IF EXISTS "Public delete products" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Products insert policy" ON public.products;
DROP POLICY IF EXISTS "Products update policy" ON public.products;
DROP POLICY IF EXISTS "Products delete policy" ON public.products;

CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products
    FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update products" ON public.products
    FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete products" ON public.products
    FOR DELETE USING (public.is_admin());

-- ── CATEGORIES ──
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public insert categories" ON public.categories;
DROP POLICY IF EXISTS "Public update categories" ON public.categories;
DROP POLICY IF EXISTS "Public delete categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;

CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories
    FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update categories" ON public.categories
    FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete categories" ON public.categories
    FOR DELETE USING (public.is_admin());

-- ── ORDERS ──
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
DROP POLICY IF EXISTS "Public delete orders" ON public.orders;
DROP POLICY IF EXISTS "Orders select policy" ON public.orders;
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
DROP POLICY IF EXISTS "Orders update policy" ON public.orders;

CREATE POLICY "Users and admins can view orders" ON public.orders
    FOR SELECT USING (
        user_id::text = auth.uid()::text
        OR customer_email = auth.jwt() ->> 'email'
        OR public.is_admin()
    );
CREATE POLICY "Authenticated users can create orders" ON public.orders
    FOR INSERT WITH CHECK (
        user_id::text = auth.uid()::text
        OR user_id IS NULL
        OR public.is_admin()
    );
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (
        user_id::text = auth.uid()::text
        OR public.is_admin()
    );
CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- ── ADDRESSES ──
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public addresses policy" ON public.addresses;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
CREATE POLICY "Users manage own addresses" ON public.addresses
    FOR ALL USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

ALTER TABLE public.addresses ALTER COLUMN country SET DEFAULT 'Ecuador';

-- ── PAYMENT_CARDS ──
ALTER TABLE public.payment_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public payment_cards policy" ON public.payment_cards;
DROP POLICY IF EXISTS "Users can manage their own payment cards" ON public.payment_cards;
CREATE POLICY "Users manage own cards" ON public.payment_cards
    FOR ALL USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- ── FAVORITES ──
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public favorites policy" ON public.favorites;
CREATE POLICY "Users manage own favorites" ON public.favorites
    FOR ALL USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- ── USER_CARTS ──
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public user_carts policy" ON public.user_carts;
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.user_carts;
CREATE POLICY "Users manage own cart" ON public.user_carts
    FOR ALL USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- ── ACTIVE_SESSIONS ──
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public active_sessions policy" ON public.active_sessions;
CREATE POLICY "Anyone can read sessions" ON public.active_sessions
    FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sessions" ON public.active_sessions
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.active_sessions
    FOR UPDATE USING (true);
CREATE POLICY "Users or admins delete sessions" ON public.active_sessions
    FOR DELETE USING (user_id::text = auth.uid()::text OR public.is_admin());

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 8: RELOAD SCHEMA CACHE                                               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

NOTIFY pgrst, 'reload schema';
