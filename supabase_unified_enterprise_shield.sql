-- ==============================================================================
-- LUMINA HOME — UNIFIED ENTERPRISE SHIELD (PostgreSQL / Supabase RLS)
-- ==============================================================================
-- Este script es 100% IDEMPOTENTE: Puede ejecutarse múltiples veces en Supabase
-- SQL Editor sin producir errores de políticas duplicadas (42710) ni alterar datos.
-- Incluye typecasts explícitos (::text) para evitar errores 42883 (text = uuid).
-- ==============================================================================

-- 1. FUNCIÓN MAESTRA DE AUTORIZACIÓN ADMINISTRATIVA
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Permite acceso si es el Master Admin o si figura activo en admin_invitations
  RETURN (
    (LOWER((auth.jwt() ->> 'email')::text) = 'admin@lumina.com')
    OR EXISTS (
      SELECT 1 FROM public.admin_invitations
      WHERE LOWER(email::text) = LOWER((auth.jwt() ->> 'email')::text)
        AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TABLA: PRODUCTS (Catálogo Público + Mutaciones Solo Admin)
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  title text NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  category text,
  rating numeric DEFAULT 5,
  reviews_count integer DEFAULT 0,
  image_url text,
  images text[],
  description text,
  in_stock boolean DEFAULT true,
  is_new boolean DEFAULT false,
  featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (public.is_admin() OR auth.role() = 'service_role');

-- 3. TABLA: ORDERS (Aislamiento de Clientes + Acceso Global a Administradores)
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  user_id text,
  status text NOT NULL DEFAULT 'Procesando',
  total numeric NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  tracking_number text,
  customer_name text,
  customer_email text,
  customer_id_number text,
  customer_phone text,
  recipient text,
  shipping_address jsonb,
  payment_method text,
  deferred boolean DEFAULT false,
  deferred_code text,
  deferred_message text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR auth.role() = 'anon'
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (
    public.is_admin() OR auth.role() = 'service_role'
  );

-- 4. TABLA: ADDRESSES (Direcciones Privadas de Usuario)
CREATE TABLE IF NOT EXISTS public.addresses (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  recipient text NOT NULL,
  id_number text,
  phone text,
  email text,
  street text NOT NULL,
  city text NOT NULL,
  state text,
  postal_code text,
  country text DEFAULT 'Ecuador',
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;
CREATE POLICY "Users manage own addresses" ON public.addresses
  FOR ALL USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

-- 5. TABLA: PAYMENT_CARDS (Tarjetas Tokenizadas Privadas)
CREATE TABLE IF NOT EXISTS public.payment_cards (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  number text NOT NULL,
  holder text NOT NULL,
  exp text NOT NULL,
  type text DEFAULT 'visa',
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payment_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own cards" ON public.payment_cards;
CREATE POLICY "Users manage own cards" ON public.payment_cards
  FOR ALL USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

-- 6. TABLA: FAVORITES (Favoritos Privados)
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id text NOT NULL,
  product_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;
CREATE POLICY "Users manage own favorites" ON public.favorites
  FOR ALL USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

-- 7. TABLA: USER_CARTS (Carritos Persistentes en la Nube)
CREATE TABLE IF NOT EXISTS public.user_carts (
  user_id text PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  coupon_code text,
  discount_percent numeric DEFAULT 0,
  is_free_shipping boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own cart" ON public.user_carts;
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.user_carts;
DROP POLICY IF EXISTS "Public user_carts policy" ON public.user_carts;

CREATE POLICY "Users manage own cart" ON public.user_carts
  FOR ALL USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

-- 8. TABLA: USER_AVATAR_SETTINGS (Personalización Visual)
CREATE TABLE IF NOT EXISTS public.user_avatar_settings (
  user_id text PRIMARY KEY,
  avatar_seed text,
  avatar_style text DEFAULT 'glass',
  primary_color text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_avatar_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own avatar settings" ON public.user_avatar_settings;
CREATE POLICY "Users manage own avatar settings" ON public.user_avatar_settings
  FOR ALL USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

-- 9. TABLAS ADMINISTRATIVAS (Restringidas Estrictamente a Administradores)

-- A. ADMIN_INVITATIONS
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  invited_by text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage invitations" ON public.admin_invitations;
CREATE POLICY "Admins manage invitations" ON public.admin_invitations
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- B. ADMIN_PAYMENT_SETTINGS
CREATE TABLE IF NOT EXISTS public.admin_payment_settings (
  id text PRIMARY KEY DEFAULT 'global',
  mode text NOT NULL DEFAULT 'box',
  updated_by text,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read payment mode" ON public.admin_payment_settings;
CREATE POLICY "Public can read payment mode" ON public.admin_payment_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage payment settings" ON public.admin_payment_settings;
CREATE POLICY "Admins manage payment settings" ON public.admin_payment_settings
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- C. ADMIN_NOTIFICATION_SETTINGS
CREATE TABLE IF NOT EXISTS public.admin_notification_settings (
  id text PRIMARY KEY DEFAULT 'global',
  admin_email text,
  position text DEFAULT 'bottom-right',
  layout text DEFAULT 'flight_route',
  preset_id text DEFAULT 'monochrome_dark',
  bg_color text DEFAULT '#111827',
  text_color text DEFAULT '#ffffff',
  subtext_color text DEFAULT '#9ca3af',
  accent_color text DEFAULT '#10b981',
  title text DEFAULT 'NOTIFICACIÓN',
  duration integer DEFAULT 6000,
  sound_enabled boolean DEFAULT true,
  toast_type text DEFAULT 'custom_preset',
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read notification settings" ON public.admin_notification_settings;
CREATE POLICY "Public can read notification settings" ON public.admin_notification_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage notification settings" ON public.admin_notification_settings;
CREATE POLICY "Admins manage notification settings" ON public.admin_notification_settings
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- D. ORDER_EMAIL_LOGS
CREATE TABLE IF NOT EXISTS public.order_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.order_email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins or recipient view email logs" ON public.order_email_logs;
CREATE POLICY "Admins or recipient view email logs" ON public.order_email_logs
  FOR SELECT USING (
    public.is_admin()
    OR auth.role() = 'service_role'
    OR (LOWER((auth.jwt() ->> 'email')::text) = LOWER(recipient_email::text))
  );

DROP POLICY IF EXISTS "Server insert email logs" ON public.order_email_logs;
CREATE POLICY "Server insert email logs" ON public.order_email_logs
  FOR INSERT WITH CHECK (true);

-- 10. ÍNDICES DE ALTO RENDIMIENTO (Sub-20ms Queries)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_cards_user_id ON public.payment_cards (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_order_email_logs_order_id ON public.order_email_logs (order_id);
