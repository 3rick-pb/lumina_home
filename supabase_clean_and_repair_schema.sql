-- ==============================================================================
-- LUMINA HOME — SCRIPT MAESTRO DE SANEAMIENTO Y ORDEN DE BASE DE DATOS (DEFINITIVO)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 1: ELIMINAR DINÁMICAMENTE TODAS LAS POLÍTICAS PREVIAS                 ║
-- ║  (Necesario para que PostgreSQL permita cambiar tipos de columnas)          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DO $$ 
DECLARE 
    pol record;
BEGIN 
    -- Eliminar todas las políticas existentes en favorites
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'favorites' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.favorites', pol.policyname);
    END LOOP;
    
    -- Eliminar todas las políticas existentes en addresses
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.addresses', pol.policyname);
    END LOOP;
    
    -- Eliminar todas las políticas existentes en payment_cards
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_cards' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_cards', pol.policyname);
    END LOOP;
    
    -- Eliminar todas las políticas existentes en orders
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
    END LOOP;

    -- Eliminar todas las políticas existentes en admin_invitations
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_invitations' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_invitations', pol.policyname);
    END LOOP;

    -- Eliminar todas las políticas existentes en active_sessions
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'active_sessions' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.active_sessions', pol.policyname);
    END LOOP;
END $$;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 2: DESVINCULAR CONSTRAINTS Y CORREGIR TIPOS DE COLUMNAS               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- 1. Eliminar restricciones de clave foránea
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_product_id_fkey;
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE public.payment_cards DROP CONSTRAINT IF EXISTS payment_cards_user_id_fkey;

-- 2. TABLA FAVORITES: permitir tanto slugs de texto como UUIDs
ALTER TABLE public.favorites ALTER COLUMN product_id TYPE text;
ALTER TABLE public.favorites ALTER COLUMN user_id TYPE text;

-- 3. TABLA ADDRESSES: id y user_id deben admitir texto
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

-- 4. TABLA PAYMENT_CARDS: id y user_id deben admitir texto
ALTER TABLE public.payment_cards ALTER COLUMN id TYPE text;
ALTER TABLE public.payment_cards ALTER COLUMN user_id TYPE text;

-- Asegurar columnas en payment_cards
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS number text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS holder text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS exp text;
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS type text DEFAULT 'mastercard';
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- 5. TABLA ORDERS: asegurar columnas completas
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
-- ║  FASE 3: CREACIÓN DE NUEVAS POLÍTICAS RLS LIMPIAS Y RESILIENTES             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- 1. ADDRESSES
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public addresses policy" ON public.addresses
    FOR ALL USING (true) WITH CHECK (true);

-- 2. PAYMENT_CARDS
ALTER TABLE public.payment_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public payment_cards policy" ON public.payment_cards
    FOR ALL USING (true) WITH CHECK (true);

-- 3. FAVORITES
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public favorites policy" ON public.favorites
    FOR ALL USING (true) WITH CHECK (true);

-- 4. ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "Public admin invitations policy" ON public.admin_invitations
    FOR ALL USING (true) WITH CHECK (true);

-- 6. ACTIVE_SESSIONS (Permitir DELETE para que el sistema mantenga limpia la tabla)
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public active_sessions policy" ON public.active_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 4: MIGRACIÓN FORMAL DE ADMINISTRADORES INVITADOS                     ║
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
-- ║  FASE 5: PURGA TOTAL DE REGISTROS PARÁSITOS EN ACTIVE_SESSIONS             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Eliminar todos los registros residuales de direcciones, tarjetas, favoritos y pruebas
DELETE FROM public.active_sessions 
WHERE user_id LIKE 'SYS_%' 
   OR user_id LIKE 'test_%' 
   OR user_id LIKE 'TEST_%';

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FASE 6: RECARGA DE CACHÉ DE ESQUEMA EN SUPABASE POSTGREST                 ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

NOTIFY pgrst, 'reload schema';
