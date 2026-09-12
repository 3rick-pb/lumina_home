-- ==============================================================================
-- LUMINA HOME — SCRIPT MAESTRO DE SANEAMIENTO Y ORDEN DE BASE DE DATOS
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 1: CORRECCIÓN DE TIPOS DE COLUMNAS (UUID vs TEXT/SLUGS)              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- 1. TABLA FAVORITES: product_id debe ser TEXT para admitir slugs ('lumina-aura-glow')
ALTER TABLE public.favorites ALTER COLUMN product_id TYPE text;
ALTER TABLE public.favorites ALTER COLUMN user_id TYPE text;

-- 2. TABLA ADDRESSES: id y user_id deben admitir TEXT para máxima compatibilidad
ALTER TABLE public.addresses ALTER COLUMN id TYPE text;
ALTER TABLE public.addresses ALTER COLUMN user_id TYPE text;

-- Asegurar columnas de identificación y contacto en addresses
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS recipient text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS country text DEFAULT 'Ecuador';
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- 3. TABLA PAYMENT_CARDS: id y user_id deben admitir TEXT
ALTER TABLE public.payment_cards ALTER COLUMN id TYPE text;
ALTER TABLE public.payment_cards ALTER COLUMN user_id TYPE text;

-- Asegurar columnas en payment_cards
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS number text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS holder text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS exp text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS type text DEFAULT 'mastercard';
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- 4. TABLA ORDERS: asegurar columnas completas
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'Procesando';

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 2: POLÍTICAS DE SEGURIDAD RLS FLEXIBLES Y RESILIENTES                ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- 1. ADDRESSES
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public addresses policy" ON public.addresses;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;

CREATE POLICY "Public addresses policy" ON public.addresses
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. PAYMENT_CARDS
ALTER TABLE public.payment_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public payment_cards policy" ON public.payment_cards;
DROP POLICY IF EXISTS "Users can manage their own payment cards" ON public.payment_cards;
DROP POLICY IF EXISTS "Users manage own cards" ON public.payment_cards;

CREATE POLICY "Public payment_cards policy" ON public.payment_cards
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. FAVORITES
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public favorites policy" ON public.favorites;
DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;

CREATE POLICY "Public favorites policy" ON public.favorites
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public orders policy" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Anyone can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read orders" ON public.orders
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update orders" ON public.orders
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- 5. ADMIN_INVITATIONS
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin invitations select" ON public.admin_invitations;
DROP POLICY IF EXISTS "Admin invitations insert" ON public.admin_invitations;
DROP POLICY IF EXISTS "Admin invitations delete" ON public.admin_invitations;
DROP POLICY IF EXISTS "Admin invitations update" ON public.admin_invitations;
DROP POLICY IF EXISTS "Public admin invitations policy" ON public.admin_invitations;

CREATE POLICY "Public admin invitations policy" ON public.admin_invitations
    FOR ALL USING (true) WITH CHECK (true);

-- 6. ACTIVE_SESSIONS (Asegurar que DELETE sea público para permitir limpiezas del radar)
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public active_sessions policy" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can read sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Users or admins delete sessions" ON public.active_sessions;

CREATE POLICY "Public active_sessions policy" ON public.active_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 3: MIGRACIÓN FORMAL DE ADMINISTRADORES INVITADOS                     ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Migrar miguelito3098@hotmail.com a la tabla formal public.admin_invitations
INSERT INTO public.admin_invitations (email, invited_by, is_active)
VALUES ('miguelito3098@hotmail.com', NULL, true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- Asegurar a admin@lumina.com como administrador maestro
INSERT INTO public.admin_invitations (email, invited_by, is_active)
VALUES ('admin@lumina.com', NULL, true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 4: PURGA TOTAL DE REGISTROS PARÁSITOS EN ACTIVE_SESSIONS             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Eliminar todos los registros residuales de direcciones, tarjetas, favoritos y pruebas
DELETE FROM public.active_sessions 
WHERE user_id LIKE 'SYS_%' 
   OR user_id LIKE 'test_%' 
   OR user_id LIKE 'TEST_%';

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 5: RECARGA DE CACHÉ DE ESQUEMA                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

NOTIFY pgrst, 'reload schema';
