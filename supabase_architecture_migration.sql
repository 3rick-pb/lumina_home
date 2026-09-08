-- ==============================================================================
-- LUMINA HOME — MIGRACIÓN ARQUITECTÓNICA COMPLETA Y DEFINITIVA
-- Pega y ejecuta este script en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 1: BACKUP DE SEGURIDAD (Con RLS habilitado)                          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DO $$
BEGIN
    -- Respaldar órdenes si la tabla existe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        DROP TABLE IF EXISTS public._backup_orders;
        CREATE TABLE public._backup_orders AS SELECT * FROM public.orders;
        ALTER TABLE public._backup_orders ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Respaldar direcciones si la tabla existe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'addresses') THEN
        DROP TABLE IF EXISTS public._backup_addresses;
        CREATE TABLE public._backup_addresses AS SELECT * FROM public.addresses;
        ALTER TABLE public._backup_addresses ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Respaldar tarjetas si la tabla existe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_cards') THEN
        DROP TABLE IF EXISTS public._backup_payment_cards;
        CREATE TABLE public._backup_payment_cards AS SELECT * FROM public.payment_cards;
        ALTER TABLE public._backup_payment_cards ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Respaldar favoritos si la tabla existe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'favorites') THEN
        DROP TABLE IF EXISTS public._backup_favorites;
        CREATE TABLE public._backup_favorites AS SELECT * FROM public.favorites;
        ALTER TABLE public._backup_favorites ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Respaldar carritos si la tabla existe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_carts') THEN
        DROP TABLE IF EXISTS public._backup_user_carts;
        CREATE TABLE public._backup_user_carts AS SELECT * FROM public.user_carts;
        ALTER TABLE public._backup_user_carts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 2: ASEGURAR COLUMNAS DE TODAS LAS TABLAS EXISTENTES                  ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- 1. TABLA ORDERS (Garantiza customer_email y todos los campos de pedidos)
CREATE TABLE IF NOT EXISTS public.orders (
    id text PRIMARY KEY,
    user_id text,
    customer_name text,
    customer_email text,
    recipient text,
    shipping_address jsonb,
    payment_method text,
    date text,
    time text,
    status text DEFAULT 'Procesando',
    tracking_number text,
    total numeric(10, 2) DEFAULT 0.00,
    items jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS date text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS time text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'Procesando';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total numeric(10, 2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. TABLA PRODUCTS (Garantiza especificaciones extendidas y stock)
CREATE TABLE IF NOT EXISTS public.products (
    id text PRIMARY KEY,
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title_highlight text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS old_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS materials text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS package_contents text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 20;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS layout_type text DEFAULT 'standard';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_specs jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_reviews jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_benefits jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_bundle jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS combos jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS how_to_use text[];

-- 3. TABLA ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    recipient text NOT NULL,
    street text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL DEFAULT 'Ecuador',
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS recipient text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS country text DEFAULT 'Ecuador';
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
ALTER TABLE public.addresses ALTER COLUMN country SET DEFAULT 'Ecuador';

-- 4. TABLA PAYMENT_CARDS
CREATE TABLE IF NOT EXISTS public.payment_cards (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    number text NOT NULL,
    holder text NOT NULL,
    exp text NOT NULL,
    type text NOT NULL DEFAULT 'mastercard',
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS number text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS holder text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS exp text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS type text DEFAULT 'mastercard';
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- 5. TABLA FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    product_id text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS product_id text;

-- 6. TABLA USER_CARTS
CREATE TABLE IF NOT EXISTS public.user_carts (
    user_id text PRIMARY KEY,
    items jsonb DEFAULT '[]'::jsonb,
    coupon_code text,
    discount_percent numeric DEFAULT 0,
    is_free_shipping boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS is_free_shipping boolean DEFAULT false;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 3: NUEVAS TABLAS DEDICADAS (Con RLS habilitado de inmediato)          ║
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

-- 2. Tabla de configuración del sistema (key-value)
CREATE TABLE IF NOT EXISTS public.system_config (
    key text PRIMARY KEY,
    value jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- 3. Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    phone text,
    avatar_url text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 4: FUNCIONES DE SEGURIDAD EN POSTGRESQL                              ║
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
-- ║  FASE 5: MIGRACIÓN DE DATOS (Órdenes -> Admin Invitations)                  ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
  _items jsonb;
  _email text;
  _root_id uuid;
BEGIN
  SELECT id INTO _root_id FROM auth.users WHERE email = 'admin@lumina.com' LIMIT 1;
  
  -- Verificar si existe el registro residual
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = 'SYS_CONFIG_ADMIN_INVITES') THEN
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
    
    -- Eliminar registro contaminante
    DELETE FROM public.orders WHERE id = 'SYS_CONFIG_ADMIN_INVITES';
  END IF;
  
  -- Insertar administrador secundario conocido de prueba
  INSERT INTO public.admin_invitations (email, invited_by, is_active)
  VALUES ('arteagae796@gmail.com', _root_id, true)
  ON CONFLICT (email) DO NOTHING;
END $$;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 6: ÍNDICES DE RENDIMIENTO                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_cards_user_id ON public.payment_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON public.admin_invitations(email);


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 7: POLÍTICAS DE SEGURIDAD (RLS)                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── ADMIN_INVITATIONS ──
DROP POLICY IF EXISTS "Admin invitations select" ON public.admin_invitations;
CREATE POLICY "Admin invitations select" ON public.admin_invitations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin invitations insert" ON public.admin_invitations;
CREATE POLICY "Admin invitations insert" ON public.admin_invitations
    FOR INSERT WITH CHECK (public.is_root_admin());

DROP POLICY IF EXISTS "Admin invitations delete" ON public.admin_invitations;
CREATE POLICY "Admin invitations delete" ON public.admin_invitations
    FOR DELETE USING (public.is_root_admin());

DROP POLICY IF EXISTS "Admin invitations update" ON public.admin_invitations;
CREATE POLICY "Admin invitations update" ON public.admin_invitations
    FOR UPDATE USING (public.is_root_admin());

-- ── SYSTEM_CONFIG ──
DROP POLICY IF EXISTS "System config read" ON public.system_config;
CREATE POLICY "System config read" ON public.system_config
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "System config write" ON public.system_config;
CREATE POLICY "System config write" ON public.system_config
    FOR ALL USING (public.is_root_admin());

-- ── USER_PROFILES ──
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
    FOR SELECT USING (public.is_admin());

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
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

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
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

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
DROP POLICY IF EXISTS "Users and admins can view orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Users and admins can view orders" ON public.orders
    FOR SELECT USING (
        user_id::text = auth.uid()::text
        OR (customer_email IS NOT NULL AND customer_email = auth.jwt() ->> 'email')
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
DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;

CREATE POLICY "Users manage own addresses" ON public.addresses
    FOR ALL USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- ── PAYMENT_CARDS ──
ALTER TABLE public.payment_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public payment_cards policy" ON public.payment_cards;
DROP POLICY IF EXISTS "Users can manage their own payment cards" ON public.payment_cards;
DROP POLICY IF EXISTS "Users manage own cards" ON public.payment_cards;

CREATE POLICY "Users manage own cards" ON public.payment_cards
    FOR ALL USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- ── FAVORITES ──
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public favorites policy" ON public.favorites;
DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;

CREATE POLICY "Users manage own favorites" ON public.favorites
    FOR ALL USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- ── USER_CARTS ──
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public user_carts policy" ON public.user_carts;
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.user_carts;
DROP POLICY IF EXISTS "Users manage own cart" ON public.user_carts;

CREATE POLICY "Users manage own cart" ON public.user_carts
    FOR ALL USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- ── ACTIVE_SESSIONS ──
CREATE TABLE IF NOT EXISTS public.active_sessions (
    user_id text PRIMARY KEY,
    name text,
    email text,
    city text DEFAULT 'Quito',
    country text DEFAULT 'Ecuador',
    x numeric DEFAULT 48.8,
    y numeric DEFAULT 26.5,
    current_section text DEFAULT 'Explorando Tienda',
    is_online boolean DEFAULT true,
    has_cart boolean DEFAULT false,
    cart_items_count integer DEFAULT 0,
    total_spent numeric DEFAULT 0,
    purchases_count integer DEFAULT 0,
    device text DEFAULT 'Computador',
    last_seen timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public active_sessions policy" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can read sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Users or admins delete sessions" ON public.active_sessions;

CREATE POLICY "Anyone can read sessions" ON public.active_sessions
    FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sessions" ON public.active_sessions
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.active_sessions
    FOR UPDATE USING (true);
CREATE POLICY "Users or admins delete sessions" ON public.active_sessions
    FOR DELETE USING (user_id::text = auth.uid()::text OR public.is_admin());


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 8: RECARGA DE CACHÉ DE ESQUEMA EN SUPABASE POSTGREST                   ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

NOTIFY pgrst, 'reload schema';
