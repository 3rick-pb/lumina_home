-- =========================================================================================
-- LUMINA HOME - ARQUITECTURA DE BASE DE DATOS SUPABASE (100% NORMALIZADA Y TIEMPO REAL)
-- =========================================================================================
-- Regla de Oro de Arquitectura:
-- 1. Cero reutilización de tablas o columnas para propósitos mixtos.
-- 2. Cada dominio funcional tiene su propia tabla dedicada con tipado estricto.
-- 3. Cero datos de demostración, semillas falsas o registros fantasma.
-- 4. Publicación activa en `supabase_realtime` para sincronización WebSocket instantánea.
-- =========================================================================================

-- -----------------------------------------------------------------------------------------
-- 1. CATÁLOGO Y ESCAPARATE (PRODUCTS, CATEGORIES, STORE_BADGES, HEADER_NICHE_SLOTS)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT,
  subtitle TEXT DEFAULT 'Explorar Colección',
  image_url TEXT,
  default_price_label TEXT DEFAULT 'Desde $15',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color_hex TEXT NOT NULL DEFAULT '#171717',
  is_preset BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  original_price NUMERIC(12, 2),
  category TEXT NOT NULL,
  sub_category TEXT,
  description TEXT,
  dimensions TEXT,
  weight TEXT,
  material TEXT,
  care TEXT,
  origin TEXT,
  warranty TEXT,
  badge TEXT DEFAULT 'NONE',
  badge_color TEXT DEFAULT '#171717',
  stock INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 4.90,
  reviews INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  layout_type TEXT DEFAULT 'standard',
  gallery_style TEXT DEFAULT 'standard',
  lifestyle_layout TEXT DEFAULT 'grid',
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  color_views JSONB DEFAULT '{}'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  combos JSONB DEFAULT '[]'::jsonb,
  lifestyle_images JSONB DEFAULT '[]'::jsonb,
  embedded_carousel JSONB,
  landing_specs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.header_niche_slots (
  id TEXT PRIMARY KEY CHECK (id IN ('slot1', 'slot2')),
  label TEXT NOT NULL,
  subtitle TEXT,
  image TEXT,
  price TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------------------
-- 2. CLIENTES, PERFILES Y PREFERENCIAS (USER_PROFILES, USER_AVATAR_SETTINGS, FAVORITES)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  cedula TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_avatar_settings (
  user_email TEXT PRIMARY KEY,
  avatar_style TEXT DEFAULT 'editorial',
  bg_color TEXT DEFAULT '#171717',
  accent_color TEXT DEFAULT '#8c9276',
  custom_initials TEXT,
  avatar_image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_email, product_id)
);

-- -----------------------------------------------------------------------------------------
-- 3. DIRECCIONES GEORREFERENCIADAS Y MÉTODOS DE PAGO DE CLIENTES (ADDRESSES, PAYMENT_CARDS)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.addresses (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Casa',
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT,
  sector TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT,
  reference TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_email ON public.addresses(user_email);

CREATE TABLE IF NOT EXISTS public.payment_cards (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'visa',
  last4 TEXT NOT NULL,
  exp_month TEXT NOT NULL,
  exp_year TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_cards_user_email ON public.payment_cards(user_email);

-- -----------------------------------------------------------------------------------------
-- 4. TRANSACCIONES Y ÓRDENES E-COMMERCE (ORDERS)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_cedula TEXT,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  shipping_cost NUMERIC(12, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT DEFAULT 'card',
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_email ON public.orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- -----------------------------------------------------------------------------------------
-- 5. PROGRAMA DE LEALTAD Y PASES DIGITALES (LOYALTY_PROGRAM_SETTINGS, LOYALTY_MEMBERS, LOYALTY_POINT_LEDGER)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.loyalty_program_settings (
  id TEXT PRIMARY KEY DEFAULT 'global' CHECK (id = 'global'),
  program_name TEXT NOT NULL DEFAULT 'Lumina Member Pass',
  issuer_name TEXT NOT NULL DEFAULT 'Lumina Home',
  tagline TEXT NOT NULL DEFAULT 'Espacios con Alma y Diseño de Autor',
  points_per_dollar INTEGER NOT NULL DEFAULT 10,
  welcome_bonus_points INTEGER NOT NULL DEFAULT 200,
  reward_threshold INTEGER NOT NULL DEFAULT 1500,
  reward_description TEXT NOT NULL DEFAULT '$25 USD de saldo a favor en tu próxima orden + Envío Preferencial',
  bg_color TEXT NOT NULL DEFAULT '#171717',
  accent_color TEXT NOT NULL DEFAULT '#8c9276',
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  qr_fg_color TEXT NOT NULL DEFAULT '#171717',
  qr_bg_color TEXT NOT NULL DEFAULT '#ffffff',
  qr_corner_style TEXT NOT NULL DEFAULT 'rounded',
  custom_logo_data_url TEXT DEFAULT '',
  tier_silver_min INTEGER NOT NULL DEFAULT 0,
  tier_gold_min INTEGER NOT NULL DEFAULT 1200,
  tier_black_min INTEGER NOT NULL DEFAULT 3000,
  push_message TEXT DEFAULT 'Tus puntos de lealtad se han actualizado tras tu compra.',
  auto_sync_purchases BOOLEAN DEFAULT true,
  apple_team_id TEXT DEFAULT 'LUMINA99EC',
  apple_pass_type_id TEXT DEFAULT 'pass.ec.luminahome.member',
  google_issuer_id TEXT DEFAULT '3388000000022194812',
  google_class_id TEXT DEFAULT 'lumina_member_pass_v2',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_members (
  id TEXT PRIMARY KEY,
  member_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL UNIQUE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  purchases_count INTEGER NOT NULL DEFAULT 0,
  wallet_platform TEXT NOT NULL DEFAULT 'apple' CHECK (wallet_platform IN ('apple', 'google', 'both')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_members_email ON public.loyalty_members(customer_email);

CREATE TABLE IF NOT EXISTS public.loyalty_point_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL REFERENCES public.loyalty_members(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  points_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------------------
-- 6. ADMINISTRACIÓN, ACCESOS, PASARELAS Y COMUNICACIONES SMTP (100% SEPARADAS)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

-- Tabla exclusiva para Alertas de Bolsa y Reglas de Stock (NUNCA mezclar con destinatarios SMTP)
CREATE TABLE IF NOT EXISTS public.admin_notification_settings (
  id TEXT PRIMARY KEY DEFAULT 'global' CHECK (id = 'global'),
  title TEXT NOT NULL DEFAULT '¡Alta demanda detectada!',
  subtitle TEXT NOT NULL DEFAULT 'Otro cliente acaba de agregar este artículo a su bolsa.',
  accent_color TEXT NOT NULL DEFAULT '#8c9276',
  position TEXT NOT NULL DEFAULT 'bottom-right',
  duration_seconds INTEGER NOT NULL DEFAULT 6,
  show_stock_warning BOOLEAN DEFAULT true,
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  sound_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla exclusiva para Destinatarios de Despacho de Órdenes por Correo
CREATE TABLE IF NOT EXISTS public.admin_dispatch_recipients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'Logística / Despacho',
  active BOOLEAN NOT NULL DEFAULT true,
  notify_new_order BOOLEAN NOT NULL DEFAULT true,
  notify_low_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla exclusiva para Configuración del Servidor SMTP
CREATE TABLE IF NOT EXISTS public.admin_smtp_settings (
  id TEXT PRIMARY KEY DEFAULT 'global' CHECK (id = 'global'),
  host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
  port INTEGER NOT NULL DEFAULT 465,
  secure BOOLEAN NOT NULL DEFAULT true,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL DEFAULT 'Lumina Home — Operaciones & Despacho',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla exclusiva para Configuración de Pasarelas de Pago B2C
CREATE TABLE IF NOT EXISTS public.admin_payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'global' CHECK (id = 'global'),
  stripe_enabled BOOLEAN DEFAULT true,
  stripe_public_key TEXT,
  paypal_enabled BOOLEAN DEFAULT false,
  paypal_client_id TEXT,
  bank_transfer_enabled BOOLEAN DEFAULT true,
  bank_details JSONB DEFAULT '[]'::jsonb,
  cash_on_delivery_enabled BOOLEAN DEFAULT false,
  tax_rate NUMERIC(5, 2) DEFAULT 15.00,
  free_shipping_threshold NUMERIC(10, 2) DEFAULT 150.00,
  standard_shipping_cost NUMERIC(10, 2) DEFAULT 8.00,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------------------
-- 7. TELEMETRÍA Y RADAR GEOGRÁFICO EN TIEMPO REAL (RADAR_TELEMETRY_SESSIONS, CART_ALERT_EVENTS)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.radar_telemetry_sessions (
  session_id TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'EC',
  user_id TEXT,
  client_name TEXT NOT NULL DEFAULT 'Visitante',
  city TEXT NOT NULL,
  region_state TEXT,
  coordinate_x DOUBLE PRECISION NOT NULL,
  coordinate_y DOUBLE PRECISION NOT NULL,
  device_type TEXT DEFAULT 'desktop',
  current_section TEXT DEFAULT 'Explorando Tienda',
  cart_amount NUMERIC(12, 2) DEFAULT 0,
  purchases_count INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT true,
  is_guest BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, country_code)
);

CREATE INDEX IF NOT EXISTS idx_radar_telemetry_active ON public.radar_telemetry_sessions(country_code, is_online, last_seen DESC);

CREATE TABLE IF NOT EXISTS public.cart_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  buyer_city TEXT DEFAULT 'Quito',
  remaining_stock INTEGER DEFAULT 1,
  triggered_by_session TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------------------
-- 8. HABILITACIÓN DE TIEMPO REAL (SUPABASE REALTIME PUBLICATION)
-- -----------------------------------------------------------------------------------------

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'products',
    'categories',
    'store_badges',
    'header_niche_slots',
    'orders',
    'addresses',
    'payment_cards',
    'favorites',
    'user_profiles',
    'loyalty_program_settings',
    'loyalty_members',
    'admin_notification_settings',
    'admin_dispatch_recipients',
    'admin_smtp_settings',
    'admin_payment_settings',
    'radar_telemetry_sessions',
    'cart_alert_events'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;
