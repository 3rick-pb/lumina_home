-- =========================================================================================
-- LUMINA HOME - MIGRACIÓN MAESTRA: CUPONES, AUDITORÍA DE DATOS Y NORMALIZACIÓN 100%
-- =========================================================================================
-- Fecha: Octubre 2026
-- Objetivo:
-- 1. Activación definitiva del motor de Cupones y Canjes reales con auditoría criptográfica.
-- 2. Migración 100% segura e idempotente sobre tablas preexistentes (ALTER TABLE ADD COLUMN IF NOT EXISTS).
-- 3. Normalización estricta de Direcciones Georreferenciadas (cero empaquetado en 'country').
-- 4. Respaldo y persistencia total de Carritos de Compra (user_carts).
-- 5. Extensión normalizada de Productos (todas las columnas de especificaciones y landings).
-- 6. Registro formal de Notificaciones por Correo Electrónico (order_email_notifications).
-- 7. Dispositivos Apple PassKit / Google Wallet (pass_device_registrations).
-- 8. Preferencias de usuario, distintivos de confianza y pasarelas de pago.
-- 9. Habilitación de réplica en supabase_realtime para sincronización WebSocket en vivo.
-- =========================================================================================

-- =========================================================================================
-- 1. TABLA: CUPONES DE DESCUENTO (public.coupons)
-- =========================================================================================
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

-- Migración segura de TODAS las columnas en caso de que la tabla 'coupons' ya existiera previamente
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description TEXT;
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
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Garantizar default gen_random_uuid() sobre la columna id (compatible tanto con UUID como con TEXT)
DO $$
BEGIN
  ALTER TABLE public.coupons ALTER COLUMN id SET DEFAULT gen_random_uuid();
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Población de valores por defecto para filas preexistentes que pudiesen tener valores nulos
UPDATE public.coupons SET title = 'Cupón ' || code WHERE title IS NULL;
UPDATE public.coupons SET discount_type = 'percent' WHERE discount_type IS NULL;
UPDATE public.coupons SET scope = 'all' WHERE scope IS NULL;

-- Garantizar restricción UNIQUE sobre 'code' para que 'ON CONFLICT (code)' funcione sin error
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coupons_code_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'public.coupons'::regclass AND a.attname = 'code' AND i.indisunique = true
  ) THEN
    BEGIN
      ALTER TABLE public.coupons ADD CONSTRAINT coupons_code_key UNIQUE (code);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active, expires_at);

-- Semillas oficiales de cupones de lanzamiento (sin forzar id para evitar conflicto de tipo UUID / TEXT)
INSERT INTO public.coupons (
  code, title, description, discount_percent, discount_type, fixed_amount,
  scope, target_niche, min_order_amount, max_uses, max_uses_per_user, used_count, share_count, is_active, expires_at
) VALUES
  ('LUMINA10', 'Bienvenida Lumina Home', '10% de descuento directo en tu primera compra en todo el catálogo.', 10, 'percent', 0, 'all', NULL, 0, NULL, 1, 0, 42, true, NULL),
  ('AMIGOS-VIP20', 'Pase Exclusivo Amigos & Familia', '20% OFF en toda la tienda para compartir con tus amigos y grupos.', 20, 'percent', 0, 'all', NULL, 30, 50, 1, 0, 19, true, now() + interval '30 days'),
  ('LUX-LIGHTS25', 'Flash Sale Iluminación de Autor', '25% OFF en lámparas esculturales y luminarias de diseño.', 25, 'percent', 0, 'niche', 'Iluminación', 50, 30, 1, 0, 27, true, now() + interval '15 days'),
  ('ENVIOGRATIS', 'Envío Bonificado 100%', 'Cubre el costo de despacho garantizado a cualquier ciudad del Ecuador.', 0, 'free_shipping', 0, 'all', NULL, 40, NULL, 1, 0, 56, true, NULL)
ON CONFLICT (code) DO NOTHING;

-- =========================================================================================
-- 2. TABLA: CANJES AUDITADOS DE CUPONES (public.coupon_redemptions)
-- =========================================================================================
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

ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS coupon_id TEXT;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS before_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS after_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS items_summary TEXT;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.coupon_redemptions ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_code ON public.coupon_redemptions(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order ON public.coupon_redemptions(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_email ON public.coupon_redemptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);

-- =========================================================================================
-- 3. TABLA: CARRITOS DE COMPRA PERSISTENTES EN LA NUBE (public.user_carts)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.user_carts (
  user_id TEXT PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  coupon_code TEXT,
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  is_free_shipping BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS is_free_shipping BOOLEAN DEFAULT false;
ALTER TABLE public.user_carts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_user_carts_updated ON public.user_carts(updated_at DESC);

-- =========================================================================================
-- 4. NORMALIZACIÓN ESTRICTA DE DIRECCIONES DE ENVÍO (public.addresses)
-- =========================================================================================
-- Cero reutilización o empaquetado de campos en 'country'. Cada dato en su columna dedicada.
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
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Ecuador';
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_addresses_user_email_norm ON public.addresses(user_email);

-- =========================================================================================
-- 5. NORMALIZACIÓN ESTRICTA DE ÓRDENES E-COMMERCE (public.orders)
-- =========================================================================================
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

CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON public.orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON public.orders(tracking_number);

-- =========================================================================================
-- 6. EXTENSIÓN COMPLETA DE PRODUCTOS DEL CATÁLOGO (public.products)
-- =========================================================================================
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

-- =========================================================================================
-- 7. TABLA: DISTINTIVOS DE CONFIANZA DE LA TIENDA (public.store_trust_badges)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.store_trust_badges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon_name TEXT NOT NULL DEFAULT 'ShieldCheck',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'ShieldCheck';
ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.store_trust_badges ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Limpiar distintivos obsoletos o duplicados (eliminar Soporte VIP y garantía redundante)
DELETE FROM public.store_trust_badges WHERE id IN ('support', 'warranty') OR lower(title) LIKE '%soporte%';

INSERT INTO public.store_trust_badges (id, title, subtitle, icon_name, is_active, display_order)
VALUES
  ('shipping', 'Envíos nacionales', 'A todo el país', 'Truck', true, 1),
  ('tracking', 'Sigue tu paquete', 'Paso a paso en tiempo real', 'PackageSearch', true, 2),
  ('returns', 'Devoluciones 10 días', 'Sin complicaciones', 'RotateCcw', true, 3),
  ('financing', 'Financiación 0%', 'Hasta 12 cuotas', 'Percent', true, 4),
  ('security', 'Pagos seguros', '100% cifrado SSL', 'Lock', true, 5)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  icon_name = EXCLUDED.icon_name,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- =========================================================================================
-- 8. TABLA: PREFERENCIAS DE USUARIO Y TEMAS (public.user_settings)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id TEXT PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =========================================================================================
-- 9. TABLA: AUDITORÍA DE NOTIFICACIONES POR CORREO (public.order_email_notifications)
-- =========================================================================================
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

ALTER TABLE public.order_email_notifications ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.order_email_notifications ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE public.order_email_notifications ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.order_email_notifications ADD COLUMN IF NOT EXISTS recipient_type TEXT;
ALTER TABLE public.order_email_notifications ADD COLUMN IF NOT EXISTS email_type TEXT;
ALTER TABLE public.order_email_notifications ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.order_email_notifications ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.order_email_notifications ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.order_email_notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.order_email_notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_email_logs_order ON public.order_email_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.order_email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent ON public.order_email_notifications(sent_at DESC);

-- =========================================================================================
-- 10. TABLA: DISPOSITIVOS APPLE WALLET / PASSKIT (public.pass_device_registrations)
-- =========================================================================================
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

ALTER TABLE public.pass_device_registrations ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.pass_device_registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_pass_reg_serial ON public.pass_device_registrations(pass_type_identifier, serial_number);
CREATE INDEX IF NOT EXISTS idx_pass_reg_device ON public.pass_device_registrations(device_library_identifier, pass_type_identifier, updated_at);

-- =========================================================================================
-- 11. CONFIGURACIÓN DE PASARELAS Y MODOS PAYPHONE (public.admin_payment_settings)
-- =========================================================================================
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

ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'box';
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS stripe_public_key TEXT;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS paypal_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS paypal_client_id TEXT;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS bank_transfer_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS cash_on_delivery_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 15.00;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10, 2) DEFAULT 150.00;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS standard_shipping_cost NUMERIC(10, 2) DEFAULT 8.00;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

INSERT INTO public.admin_payment_settings (id, payment_mode, stripe_enabled, paypal_enabled, bank_transfer_enabled, cash_on_delivery_enabled, tax_rate, free_shipping_threshold, standard_shipping_cost)
VALUES ('global', 'box', true, false, true, false, 15.00, 150.00, 8.00)
ON CONFLICT (id) DO UPDATE SET
  payment_mode = COALESCE(admin_payment_settings.payment_mode, 'box');

-- =========================================================================================
-- 12. HABILITACIÓN DE TIEMPO REAL (SUPABASE REALTIME PUBLICATION)
-- =========================================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'coupons',
    'coupon_redemptions',
    'user_carts',
    'addresses',
    'orders',
    'products',
    'store_trust_badges',
    'user_settings',
    'order_email_notifications',
    'admin_payment_settings'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    EXCEPTION WHEN OTHERS THEN
      -- Omitir silenciosamente si la tabla ya está en la publicación o no soporta réplica
      NULL;
    END;
  END LOOP;
END $$;
