-- ==============================================================================
-- LUMINA HOME — SCRIPT MAESTRO DE HARDENING Y BLINDAJE DE SEGURIDAD RLS (v2.0)
-- Pega y ejecuta este script en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================
-- Este script es 100% IDEMPOTENTE: elimina automáticamente cualquier política previa
-- (evitando el error 42710: policy already exists) y aplica el principio de
-- mínimo privilegio (Least Privilege) con RLS estricto en todas las tablas.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- FASE PRELIMINAR: LIMPIEZA AUTOMÁTICA DE POLÍTICAS EXISTENTES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'products', 'categories', 'orders', 'addresses', 
            'user_carts', 'favorites', 'payment_cards', 
            'admin_payment_settings', 'admin_invitations', 
            'user_avatar_settings', 'order_email_notifications'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 0. FUNCIÓN DE SEGURIDAD: VERIFICACIÓN DE ROL ADMINISTRATIVO
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- 1. Si es service_role del backend (API Routes de Next.js con clave segura)
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  -- 2. Si el usuario autenticado es el administrador raíz
  IF lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@lumina.com' THEN
    RETURN true;
  END IF;

  -- 3. Si el usuario autenticado tiene metadato role = 'ADMIN'
  IF (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'ADMIN' 
     OR (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'ADMIN' THEN
    RETURN true;
  END IF;

  -- 4. Si el email figura en la tabla de administradores activos
  IF EXISTS (
    SELECT 1 FROM public.admin_invitations 
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND is_active = true
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 1. TABLA: PRODUCTS (Catálogo de productos)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public insert products" ON public.products;
DROP POLICY IF EXISTS "Public update products" ON public.products;
DROP POLICY IF EXISTS "Public delete products" ON public.products;
DROP POLICY IF EXISTS "Admin write products" ON public.products;
DROP POLICY IF EXISTS "Admin insert products" ON public.products;
DROP POLICY IF EXISTS "Admin update products" ON public.products;
DROP POLICY IF EXISTS "Admin delete products" ON public.products;

-- Lectura pública para cualquier visitante de la tienda
CREATE POLICY "Public read products" 
  ON public.products 
  FOR SELECT 
  USING (true);

-- Modificaciones exclusivas de administradores / backend service_role
CREATE POLICY "Admin insert products" 
  ON public.products 
  FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update products" 
  ON public.products 
  FOR UPDATE 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete products" 
  ON public.products 
  FOR DELETE 
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. TABLA: CATEGORIES (Nichos / Categorías)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public insert categories" ON public.categories;
DROP POLICY IF EXISTS "Public update categories" ON public.categories;
DROP POLICY IF EXISTS "Public delete categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;

CREATE POLICY "Public read categories" 
  ON public.categories 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admin manage categories" 
  ON public.categories 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. TABLA: ORDERS (Órdenes y Transacciones PayPhone)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- Agregar columnas de diferidos si no existiesen
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deferred boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deferred_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deferred_message text;

DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
DROP POLICY IF EXISTS "Public delete orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users and admins select orders" ON public.orders;
DROP POLICY IF EXISTS "Authorized insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin delete orders" ON public.orders;

-- Lectura: El cliente solo puede ver sus propias órdenes. El Admin puede ver todas.
CREATE POLICY "Users and admins select orders" 
  ON public.orders 
  FOR SELECT 
  USING (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR (auth.jwt() ->> 'email' IS NOT NULL AND lower(auth.jwt() ->> 'email') = lower(customer_email))
  );

-- Inserción: Usuario autenticado para sí mismo, o service_role / API de confirmación
CREATE POLICY "Authorized insert orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR auth.role() = 'service_role'
  );

-- Actualización y Cancelación: Exclusivamente administradores o backend autorizado (Previene adulteración)
CREATE POLICY "Admin update orders" 
  ON public.orders 
  FOR UPDATE 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete orders" 
  ON public.orders 
  FOR DELETE 
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. TABLA: ADDRESSES (Direcciones del usuario)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public addresses policy" ON public.addresses;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;

CREATE POLICY "Users manage own addresses" 
  ON public.addresses 
  FOR ALL 
  USING (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  )
  WITH CHECK (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  );

-- ------------------------------------------------------------------------------
-- 5. TABLA: USER_CARTS (Carritos persistentes en la nube)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.user_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public user_carts policy" ON public.user_carts;
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.user_carts;
DROP POLICY IF EXISTS "Users manage own cart" ON public.user_carts;

CREATE POLICY "Users manage own cart" 
  ON public.user_carts 
  FOR ALL 
  USING (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  )
  WITH CHECK (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  );

-- ------------------------------------------------------------------------------
-- 6. TABLA: FAVORITES (Favoritos de usuario)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public favorites policy" ON public.favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;

CREATE POLICY "Users manage own favorites" 
  ON public.favorites 
  FOR ALL 
  USING (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  )
  WITH CHECK (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  );

-- ------------------------------------------------------------------------------
-- 7. TABLA: PAYMENT_CARDS (Métodos de pago guardados - tokens y últimos 4 dígitos)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.payment_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public payment_cards policy" ON public.payment_cards;
DROP POLICY IF EXISTS "Users can manage their own payment cards" ON public.payment_cards;
DROP POLICY IF EXISTS "Users manage own payment cards" ON public.payment_cards;

CREATE POLICY "Users manage own payment cards" 
  ON public.payment_cards 
  FOR ALL 
  USING (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  )
  WITH CHECK (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  );

-- ------------------------------------------------------------------------------
-- 8. TABLA: ADMIN_PAYMENT_SETTINGS (Configuración de PayPhone Modalidad Box vs Redirect)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.admin_payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read payment settings" ON public.admin_payment_settings;
DROP POLICY IF EXISTS "Admin write payment settings" ON public.admin_payment_settings;

-- Lectura pública para que el checkout conozca qué modalidad renderizar (box vs redirect)
CREATE POLICY "Public read payment settings" 
  ON public.admin_payment_settings 
  FOR SELECT 
  USING (true);

-- Escritura estrictamente restringida a administradores
CREATE POLICY "Admin write payment settings" 
  ON public.admin_payment_settings 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. TABLA: ADMIN_INVITATIONS (Permisos y roles de administradores)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.admin_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage invitations" ON public.admin_invitations;

CREATE POLICY "Admin manage invitations" 
  ON public.admin_invitations 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. TABLA: USER_AVATAR_SETTINGS (Personalización de avatar)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.user_avatar_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own avatar settings" ON public.user_avatar_settings;
DROP POLICY IF EXISTS "Users can manage their own avatar settings" ON public.user_avatar_settings;

CREATE POLICY "Users manage own avatar settings" 
  ON public.user_avatar_settings 
  FOR ALL 
  USING (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  )
  WITH CHECK (
    public.is_admin() 
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
  );

-- ------------------------------------------------------------------------------
-- 11. TABLA: ORDER_EMAIL_NOTIFICATIONS (Logs de correos transaccionales)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_email_notifications (
  id text PRIMARY KEY,
  order_id text NOT NULL,
  recipient_type text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL,
  response_summary text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE IF EXISTS public.order_email_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read email notifications" ON public.order_email_notifications;
DROP POLICY IF EXISTS "Service role write email notifications" ON public.order_email_notifications;
DROP POLICY IF EXISTS "Admin write email notifications" ON public.order_email_notifications;

CREATE POLICY "Admin read email notifications" 
  ON public.order_email_notifications 
  FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Admin write email notifications" 
  ON public.order_email_notifications 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- REFRESCAR CACHÉ DE POSTGREST
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
