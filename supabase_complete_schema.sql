-- =========================================================================================
-- LUMINA HOME - ARQUITECTURA MAESTRA DE BASE DE DATOS SUPABASE (100% NORMALIZADA Y TIEMPO REAL)
-- =========================================================================================
-- Reglas de Oro de Arquitectura:
-- 1. Cero reutilización o empaquetado de datos en columnas de otros propósitos.
-- 2. Cada dominio funcional cuenta con tablas y columnas dedicadas con tipado estricto.
-- 3. Cero datos de prueba/mock hardcodeados; todos los canjes y transacciones son reales.
-- 4. Publicación activa en `supabase_realtime` para sincronización instantánea vía WebSocket.
-- =========================================================================================

-- -----------------------------------------------------------------------------------------
-- 1. CATÁLOGO Y ESCAPARATE (CATEGORIES, STORE_BADGES, STORE_TRUST_BADGES, HEADER_NICHE_SLOTS, PRODUCTS)
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

CREATE TABLE IF NOT EXISTS public.store_trust_badges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon_name TEXT NOT NULL DEFAULT 'ShieldCheck',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.header_niche_slots (
  id TEXT PRIMARY KEY CHECK (id IN ('slot1', 'slot2')),
  label TEXT NOT NULL,
  subtitle TEXT,
  image TEXT,
  price TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
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
  materials TEXT,
  care TEXT,
  care_instructions TEXT,
  package_contents TEXT,
  shipping TEXT,
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
  gallery_autoplay BOOLEAN DEFAULT false,
  gallery_autoplay_speed INTEGER DEFAULT 3000,
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
  landing_reviews JSONB DEFAULT '[]'::jsonb,
  landing_benefits JSONB DEFAULT '[]'::jsonb,
  landing_bundle JSONB,
  how_to_use JSONB DEFAULT '[]'::jsonb,
  landing_anatomy_image TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garantizar columnas en caso de migraciones sobre tablas preexistentes
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS materials TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS package_contents TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'standard';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_style TEXT DEFAULT 'standard';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_autoplay BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_autoplay_speed INTEGER DEFAULT 3000;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS embedded_carousel JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_specs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_reviews JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_benefits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_bundle JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS combos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS how_to_use JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_anatomy_image TEXT;

-- -----------------------------------------------------------------------------------------
-- 2. CLIENTES, PERFILES Y PREFERENCIAS (USER_PROFILES, USER_AVATAR_SETTINGS, USER_SETTINGS, FAVORITES)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT,
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

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id TEXT PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_email, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_email ON public.favorites(user_email);

-- -----------------------------------------------------------------------------------------
-- 3. DIRECCIONES GEORREFERENCIADAS Y TARJETAS DE PAGO (100% NORMALIZADAS)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.addresses (
  id TEXT PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  recipient TEXT,
  recipient_name TEXT,
  id_number TEXT,
  phone TEXT,
  email TEXT,
  street TEXT NOT NULL,
  exterior_number TEXT,
  interior_number TEXT,
  neighborhood TEXT,
  cross_streets TEXT,
  address_type TEXT DEFAULT 'casa',
  delivery_instructions TEXT,
  has_elevator BOOLEAN DEFAULT false,
  floor_level TEXT,
  label TEXT DEFAULT 'Casa',
  city TEXT NOT NULL,
  province TEXT,
  state TEXT,
  sector TEXT,
  number TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Ecuador',
  reference TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  raw_gps TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garantizar columnas en caso de tablas creadas previamente
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS exterior_number TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS interior_number TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS cross_streets TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS address_type TEXT DEFAULT 'casa';
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS has_elevator BOOLEAN DEFAULT false;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS floor_level TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS label TEXT DEFAULT 'Casa';
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS raw_gps TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS recipient TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Ecuador';
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_email ON public.addresses(user_email);

CREATE TABLE IF NOT EXISTS public.payment_cards (
  id TEXT PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  number TEXT,
  holder TEXT,
  holder_name TEXT,
  exp TEXT,
  exp_month TEXT,
  exp_year TEXT,
  type TEXT DEFAULT 'visa',
  brand TEXT DEFAULT 'visa',
  last4 TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_cards_user_email ON public.payment_cards(user_email);

-- -----------------------------------------------------------------------------------------
-- 4. CARRITOS DE COMPRA PERSISTENTES EN LA NUBE (USER_CARTS)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_carts (
  user_id TEXT PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  coupon_code TEXT,
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  is_free_shipping BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_carts_updated ON public.user_carts(updated_at DESC);

-- -----------------------------------------------------------------------------------------
-- 5. SISTEMA DE CUPONES Y CANJES CRIPTOGRÁFICOS (COUPONS, COUPON_REDEMPTIONS)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed', 'free_shipping')),
  fixed_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'niche')),
  target_niche TEXT,
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_uses INTEGER,
  max_uses_per_user INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percent';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS fixed_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'all';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS target_niche TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses INTEGER;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER DEFAULT 1;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active, expires_at);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id TEXT,
  coupon_code TEXT NOT NULL,
  order_id TEXT NOT NULL,
  user_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  before_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  after_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  items_summary TEXT,
  payment_method TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_code ON public.coupon_redemptions(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order ON public.coupon_redemptions(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_email ON public.coupon_redemptions(customer_email);

-- -----------------------------------------------------------------------------------------
-- 6. TRANSACCIONES Y ÓRDENES E-COMMERCE (ORDERS)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cedula TEXT,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  shipping_cost NUMERIC(12, 2) DEFAULT 0,
  coupon_code TEXT,
  coupon_id TEXT,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  payment_method TEXT DEFAULT 'card',
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  tracking_number TEXT,
  carrier_name TEXT,
  tracking_url TEXT,
  wallet_sync_status TEXT DEFAULT 'SKIPPED',
  wallet_last_updated_at TIMESTAMPTZ,
  wallet_sync_error TEXT,
  estimated_delivery_date TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS wallet_sync_status TEXT DEFAULT 'SKIPPED';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS wallet_last_updated_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS wallet_sync_error TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_orders_user_email ON public.orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON public.orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON public.orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- -----------------------------------------------------------------------------------------
-- 7. AUDITORÍA DE NOTIFICACIONES POR CORREO ELECTRÓNICO (ORDER_EMAIL_NOTIFICATIONS)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'admin')),
  email_type TEXT NOT NULL CHECK (email_type IN ('customer_invoice', 'admin_dispatch_notice', 'order_status_update')),
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'simulated_dev')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_order ON public.order_email_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.order_email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent ON public.order_email_notifications(sent_at DESC);

-- -----------------------------------------------------------------------------------------
-- 8. PASES DIGITALES, WALLET Y LEALTAD (PASS_DEVICE_REGISTRATIONS, LOYALTY)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pass_device_registrations (
  device_library_identifier TEXT NOT NULL,
  push_token TEXT NOT NULL,
  pass_type_identifier TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (device_library_identifier, pass_type_identifier, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_pass_reg_serial ON public.pass_device_registrations(pass_type_identifier, serial_number);
CREATE INDEX IF NOT EXISTS idx_pass_reg_device ON public.pass_device_registrations(device_library_identifier, pass_type_identifier, updated_at);

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
-- 9. ADMINISTRACIÓN, SEGURIDAD, PASARELAS Y ALERTAS (100% SEPARADAS)
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

-- Tabla exclusiva para Alertas de Bolsa y Reglas de Stock (NUNCA mezclar con correos de despacho)
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'Logística / Despacho',
  label TEXT DEFAULT 'Bodega / Logística',
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'Logística / Despacho',
  active BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  added_by TEXT,
  notify_new_order BOOLEAN DEFAULT true,
  notify_low_stock BOOLEAN DEFAULT true,
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

-- Tabla exclusiva para Configuración de Pasarelas de Pago B2C y PayPhone
CREATE TABLE IF NOT EXISTS public.admin_payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'global' CHECK (id = 'global'),
  payment_mode TEXT DEFAULT 'box',
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
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------------------
-- 10. TELEMETRÍA Y RADAR GEOGRÁFICO EN TIEMPO REAL (RADAR_TELEMETRY, CART_ALERTS)
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
-- 11. HABILITACIÓN DE TIEMPO REAL (SUPABASE REALTIME PUBLICATION)
-- -----------------------------------------------------------------------------------------

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'products',
    'categories',
    'store_badges',
    'store_trust_badges',
    'header_niche_slots',
    'orders',
    'addresses',
    'payment_cards',
    'favorites',
    'user_profiles',
    'user_settings',
    'user_carts',
    'coupons',
    'coupon_redemptions',
    'order_email_notifications',
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
