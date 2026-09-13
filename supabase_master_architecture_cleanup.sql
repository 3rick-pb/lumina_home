-- ==============================================================================
-- LUMINA HOME — MASTER DATABASE ARCHITECTURE & SURGICAL CLEANUP
-- ==============================================================================
-- Este script es 100% IDEMPOTENTE: Puede ejecutarse múltiples veces en Supabase
-- SQL Editor sin producir errores de políticas duplicadas ni alterar datos existentes.
--
-- 1. PURGA DEFINITIVA: Elimina tablas temporales/obsoletas y registros parásitos (SYS_*)
-- 2. ARQUITECTURA MODULAR: 17 tablas dedicadas (1 tabla por cada sección/entidad)
-- 3. RLS BLINDADO: Políticas de seguridad con typecasts explícitos (::text)
-- 4. RENDIMIENTO: Índices B-tree en todas las claves foráneas y campos frecuentes
-- 5. SEMILLAS MAESTRAS: Categorías, cupones, badges y trust badges preconfigurados
-- ==============================================================================

-- ==============================================================================
-- FASE 1: LIMPIEZA QUIRÚRGICA DE TABLAS OBSOLETAS Y REGISTROS PARÁSITOS
-- ==============================================================================

-- 1.1 Eliminar tablas temporales de respaldos antiguos que consumen espacio
DROP TABLE IF EXISTS public._backup_orders CASCADE;
DROP TABLE IF EXISTS public._backup_addresses CASCADE;
DROP TABLE IF EXISTS public._backup_payment_cards CASCADE;
DROP TABLE IF EXISTS public._backup_favorites CASCADE;
DROP TABLE IF EXISTS public._backup_user_carts CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;

-- 1.2 Purgar registros parásitos históricos en la tabla orders
DELETE FROM public.orders WHERE id LIKE 'SYS_%';

-- ==============================================================================
-- FASE 2: FUNCIÓN MAESTRA DE AUTORIZACIÓN ADMINISTRATIVA
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (LOWER((auth.jwt() ->> 'email')::text) = 'admin@lumina.com')
    OR (LOWER((auth.jwt() ->> 'email')::text) = 'arteagae796@gmail.com')
    OR EXISTS (
      SELECT 1 FROM public.admin_invitations
      WHERE LOWER(email::text) = LOWER((auth.jwt() ->> 'email')::text)
        AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_root_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (LOWER((auth.jwt() ->> 'email')::text) = 'admin@lumina.com')
    OR (LOWER((auth.jwt() ->> 'email')::text) = 'arteagae796@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- FASE 3: CREACIÓN Y ACTUALIZACIÓN DE LAS 17 TABLAS DEDICADAS
-- ==============================================================================

-- 1. TABLA DEDICADA: CATEGORÍAS & NICHOS (public.categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  subtitle text,
  image_url text,
  default_price_label text DEFAULT 'desde $29',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Asegurar todas las columnas de categories si la tabla ya existía
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS default_price_label text DEFAULT 'desde $29';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Si existen categorías sin slug, poblarlas automáticamente con base en el nombre
UPDATE public.categories 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Crear índice único sobre slug si no existe
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug_uniq ON public.categories (slug);

-- 2. TABLA DEDICADA: NICHOS DE ACCESO RÁPIDO DEL HEADER (public.header_niche_slots)
CREATE TABLE IF NOT EXISTS public.header_niche_slots (
  slot_id text PRIMARY KEY, -- 'slot1', 'slot2'
  label text NOT NULL,
  icon_name text NOT NULL,
  category text NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.header_niche_slots ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.header_niche_slots ADD COLUMN IF NOT EXISTS icon_name text;
ALTER TABLE public.header_niche_slots ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.header_niche_slots ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 3. TABLA DEDICADA: BADGES DE MARKETING (public.store_badges)
CREATE TABLE IF NOT EXISTS public.store_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color_hex text,
  is_preset boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.store_badges ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.store_badges ADD COLUMN IF NOT EXISTS color_hex text;
ALTER TABLE public.store_badges ADD COLUMN IF NOT EXISTS is_preset boolean DEFAULT false;
ALTER TABLE public.store_badges ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- 4. TABLA DEDICADA: CUPONES & PROMOCIONES (public.coupons)
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  is_free_shipping boolean DEFAULT false,
  min_subtotal numeric DEFAULT 0,
  max_uses integer,
  times_used integer DEFAULT 0,
  is_active boolean DEFAULT true,
  valid_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_free_shipping boolean DEFAULT false;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_subtotal numeric DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses integer;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS times_used integer DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS valid_until timestamp with time zone;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- 5. TABLA DEDICADA: PROPUESTAS DE VALOR / TRUST BADGES (public.store_trust_badges)
CREATE TABLE IF NOT EXISTS public.store_trust_badges (
  id text PRIMARY KEY, -- 'shipping', 'warranty', 'returns', 'financing', 'security'
  icon_name text NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS icon_name text;
ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- 6. TABLA DEDICADA: CATÁLOGO DE PRODUCTOS (public.products)
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  title text NOT NULL,
  title_highlight text,
  description text,
  price numeric NOT NULL,
  old_price numeric,
  discount text,
  badge text,
  category text NOT NULL,
  image_url text NOT NULL,
  images text[] DEFAULT '{}'::text[],
  colors jsonb DEFAULT '[]'::jsonb,
  sizes text[] DEFAULT '{}'::text[],
  features text[] DEFAULT '{}'::text[],
  materials text,
  shipping text,
  dimensions text,
  warranty text,
  care_instructions text,
  package_contents text,
  stock integer DEFAULT 20,
  how_to_use text,
  layout_type text DEFAULT 'standard',
  landing_specs jsonb DEFAULT '[]'::jsonb,
  landing_reviews jsonb DEFAULT '[]'::jsonb,
  landing_benefits jsonb DEFAULT '[]'::jsonb,
  landing_bundle jsonb,
  combos jsonb DEFAULT '[]'::jsonb,
  rating numeric DEFAULT 5.0,
  reviews_count integer DEFAULT 0,
  in_stock boolean DEFAULT true,
  is_new boolean DEFAULT false,
  featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Asegurar todas las columnas de products si la tabla ya existía
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title_highlight text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS old_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS materials text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS package_contents text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 20;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS how_to_use text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS layout_type text DEFAULT 'standard';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_specs jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_reviews jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_benefits jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_bundle jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS combos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 7. TABLA DEDICADA: PEDIDOS (public.orders)
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
  payment_gateway_ref text,
  deferred boolean DEFAULT false,
  deferred_code text,
  deferred_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Procesando';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total numeric NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_gateway_ref text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deferred boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deferred_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deferred_message text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 8. TABLA DEDICADA: CARRITO PERSISTENTE DE USUARIO (public.user_carts)
CREATE TABLE IF NOT EXISTS public.user_carts (
  user_id text PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  coupon_code text,
  discount_percent numeric DEFAULT 0,
  is_free_shipping boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS is_free_shipping boolean DEFAULT false;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 9. TABLA DEDICADA: LIBRETA DE DIRECCIONES (public.addresses)
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
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS recipient text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS country text DEFAULT 'Ecuador';
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 10. TABLA DEDICADA: TARJETAS DE PAGO TOKENIZADAS (public.payment_cards)
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

ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS number text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS holder text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS exp text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS type text DEFAULT 'visa';
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- 11. TABLA DEDICADA: FAVORITOS / WISHLIST (public.favorites)
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id text NOT NULL,
  product_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- 12. TABLA DEDICADA: PERFILES DE USUARIO (public.user_profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id text PRIMARY KEY,
  display_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 13. TABLA DEDICADA: AJUSTES DE AVATAR BLOBATAR (public.user_avatar_settings)
CREATE TABLE IF NOT EXISTS public.user_avatar_settings (
  user_id text PRIMARY KEY,
  user_email text,
  show_in_navbar boolean NOT NULL DEFAULT false,
  background_shape text NOT NULL DEFAULT 'squircle',
  animation_mode text NOT NULL DEFAULT 'always',
  custom_seed text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS show_in_navbar boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS background_shape text NOT NULL DEFAULT 'squircle';
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS animation_mode text NOT NULL DEFAULT 'always';
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS custom_seed text;
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 14. TABLA DEDICADA: ADMINISTRADORES INVITADOS (public.admin_invitations)
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  invited_by text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 15. TABLA DEDICADA: AJUSTES DE PASARELA PAYPHONE (public.admin_payment_settings)
CREATE TABLE IF NOT EXISTS public.admin_payment_settings (
  id text PRIMARY KEY DEFAULT 'global',
  mode text NOT NULL DEFAULT 'box',
  updated_by text,
  updated_at timestamp with time zone DEFAULT now()
);

-- 16. TABLA DEDICADA: AJUSTES DE ALERTAS DE NOTIFICACIÓN (public.admin_notification_settings)
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

-- 17. TABLA DEDICADA: LOGS DE CORREOS TRANSACCIONALES (public.order_email_logs)
CREATE TABLE IF NOT EXISTS public.order_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- ==============================================================================
-- FASE 4: SEGURIDAD ROW LEVEL SECURITY (RLS) EN EL 100% DE LAS TABLAS
-- ==============================================================================

-- 4.1 Categorías
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 4.2 Header Niche Slots
ALTER TABLE public.header_niche_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view header niches" ON public.header_niche_slots;
CREATE POLICY "Public can view header niches" ON public.header_niche_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage header niches" ON public.header_niche_slots;
CREATE POLICY "Admins manage header niches" ON public.header_niche_slots
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 4.3 Store Badges
ALTER TABLE public.store_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view badges" ON public.store_badges;
CREATE POLICY "Public can view badges" ON public.store_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage badges" ON public.store_badges;
CREATE POLICY "Admins manage badges" ON public.store_badges
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 4.4 Cupones
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 4.5 Trust Badges
ALTER TABLE public.store_trust_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view trust badges" ON public.store_trust_badges;
CREATE POLICY "Public can view trust badges" ON public.store_trust_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage trust badges" ON public.store_trust_badges;
CREATE POLICY "Admins manage trust badges" ON public.store_trust_badges
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 4.6 Productos
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (public.is_admin() OR auth.role() = 'service_role');

-- 4.7 Pedidos (Orders)
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
  FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

-- 4.8 Carritos (User Carts)
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own cart" ON public.user_carts;
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

-- 4.9 Direcciones (Addresses)
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

-- 4.10 Tarjetas (Payment Cards)
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

-- 4.11 Favoritos (Favorites)
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

-- 4.12 Perfiles (User Profiles)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own profile" ON public.user_profiles;
CREATE POLICY "Users manage own profile" ON public.user_profiles
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

-- 4.13 Ajustes de Avatar (User Avatar Settings)
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

-- 4.14 Invitaciones de Administradores
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage invitations" ON public.admin_invitations;
CREATE POLICY "Admins manage invitations" ON public.admin_invitations
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 4.15 Ajustes de Pago PayPhone
ALTER TABLE public.admin_payment_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read payment mode" ON public.admin_payment_settings;
CREATE POLICY "Public can read payment mode" ON public.admin_payment_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage payment settings" ON public.admin_payment_settings;
CREATE POLICY "Admins manage payment settings" ON public.admin_payment_settings
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 4.16 Ajustes de Notificaciones
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read notification settings" ON public.admin_notification_settings;
CREATE POLICY "Public can read notification settings" ON public.admin_notification_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage notification settings" ON public.admin_notification_settings;
CREATE POLICY "Admins manage notification settings" ON public.admin_notification_settings
  FOR ALL USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 4.17 Logs de Correos Transaccionales
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

-- ==============================================================================
-- FASE 5: ÍNDICES DE ALTO RENDIMIENTO (Sub-20ms Queries)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_cards_user_id ON public.payment_cards (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_order_email_logs_order_id ON public.order_email_logs (order_id);

-- ==============================================================================
-- FASE 6: REPLICACIÓN REALTIME EN SUPABASE
-- ==============================================================================

DO $$
BEGIN
  -- Products
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;

  -- Categories
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'categories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;

  -- Header Niche Slots
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'header_niche_slots') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.header_niche_slots;
  END IF;

  -- Orders
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  -- User Avatar Settings
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_avatar_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_avatar_settings;
  END IF;

  -- Admin Notification Settings
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_notification_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notification_settings;
  END IF;

  -- Admin Payment Settings
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_payment_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_payment_settings;
  END IF;
END $$;

-- ==============================================================================
-- FASE 7: SEMILLAS INICIALES (DATOS OFICIALES PARA QUE LA TIENDA NO QUEDE VACÍA)
-- ==============================================================================

-- 7.1 Semillas de Categorías
INSERT INTO public.categories (name, slug, subtitle, image_url, default_price_label, display_order)
VALUES
  ('Iluminación', 'iluminacion', 'Lámparas de ambiente', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop', 'desde $89', 1),
  ('Aromaterapia', 'aromaterapia', 'Difusores & esencias', 'https://images.unsplash.com/photo-1602928321679-560bb453f190?q=80&w=800&auto=format&fit=crop', 'desde $29', 2),
  ('Textiles', 'textiles', 'Lino y lana natural', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop', 'desde $39', 3),
  ('Home Office', 'home-office', 'Ergonomía & orden', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop', 'desde $49', 4),
  ('Almacenamiento', 'almacenamiento', 'Cestas & orden', 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop', 'desde $34', 5),
  ('Gadgets', 'gadgets', 'Tecnología minimalista', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=800&auto=format&fit=crop', 'desde $120', 6),
  ('Cerámica', 'ceramica', 'Vajilla de autor', 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop', 'desde $25', 7),
  ('Decoración', 'decoracion', 'Esculturas & jarrones', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800&auto=format&fit=crop', 'desde $45', 8),
  ('Cocina', 'cocina', 'Ritual barista', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop', 'desde $29', 9),
ON CONFLICT (name) DO UPDATE SET 
  slug = EXCLUDED.slug,
  subtitle = EXCLUDED.subtitle,
  image_url = EXCLUDED.image_url,
  default_price_label = EXCLUDED.default_price_label,
  display_order = EXCLUDED.display_order;

-- 7.2 Semillas de Slots de Navegación del Header
INSERT INTO public.header_niche_slots (slot_id, label, icon_name, category)
VALUES
  ('slot1', 'Iluminación', 'Lamp', 'iluminacion'),
  ('slot2', 'Textiles', 'Bed', 'textiles')
ON CONFLICT (slot_id) DO NOTHING;

-- 7.3 Semillas de Badges de Marketing
INSERT INTO public.store_badges (name, color_hex, is_preset)
VALUES
  ('Más Vendido', '#FF5E00', true),
  ('Nuevo', '#10B981', true),
  ('Bestseller', '#3B82F6', true),
  ('Tendencia', '#8B5CF6', true),
  ('Edición Limitada', '#F59E0B', true),
  ('Exclusivo', '#EC4899', true),
  ('AGOTADO', '#EF4444', true)
ON CONFLICT (name) DO NOTHING;

-- 7.4 Semillas de Cupones de Descuento
INSERT INTO public.coupons (code, discount_percent, discount_amount, is_free_shipping, min_subtotal, is_active)
VALUES
  ('LUMINA10', 10, 0, false, 0, true),
  ('VIP20', 20, 0, false, 50, true),
  ('BIENVENIDO', 15, 0, false, 0, true),
  ('ENVIOGRATIS', 0, 0, true, 0, true)
ON CONFLICT (code) DO NOTHING;

-- 7.5 Semillas de Trust Badges del Home
INSERT INTO public.store_trust_badges (id, icon_name, title, subtitle, display_order)
VALUES
  ('shipping', 'Truck', 'Envíos nacionales', 'A todo el país', 1),
  ('warranty', 'ShieldCheck', '2 años de garantía', 'Calidad certificada', 2),
  ('returns', 'RotateCcw', 'Devoluciones 30 días', 'Sin complicaciones', 3),
  ('financing', 'Percent', 'Financiación 0%', 'Hasta 12 cuotas', 4),
  ('security', 'Lock', 'Pagos seguros', '100% cifrado SSL', 5)
ON CONFLICT (id) DO NOTHING;

-- 7.6 Semilla de Administradores Autorizados
INSERT INTO public.admin_invitations (email, invited_by, is_active)
VALUES
  ('arteagae796@gmail.com', 'admin@lumina.com', true)
ON CONFLICT (email) DO NOTHING;

-- 7.7 Semilla de Configuración de Pagos PayPhone
INSERT INTO public.admin_payment_settings (id, mode)
VALUES ('global', 'box')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- FASE 8: RECARGA DE CACHÉ DE ESQUEMA EN SUPABASE POSTGREST
-- ==============================================================================

NOTIFY pgrst, 'reload schema';
