-- ==============================================================================
-- LUMINA HOME — TABLA EXCLUSIVA PARA CONFIGURACIÓN DE PASARELA PAYPHONE
-- Pega y ejecuta este script en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA DEDICADA PARA CONFIGURACIÓN DE PAGOS
CREATE TABLE IF NOT EXISTS public.admin_payment_settings (
    id text PRIMARY KEY DEFAULT 'global',                           -- Identificador único de configuración global
    payment_mode text NOT NULL DEFAULT 'box',                      -- 'box' (Cajita de Pagos) o 'redirect' (Botón Redirección)
    payphone_store_id text,                                         -- StoreId de la sucursal de PayPhone
    is_active boolean NOT NULL DEFAULT true,                        -- Si la pasarela está activa
    updated_by text,                                                -- Email del administrador que modificó la configuración
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'box';
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS payphone_store_id text;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS updated_by text;
ALTER TABLE public.admin_payment_settings ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Fila por defecto si no existe
INSERT INTO public.admin_payment_settings (id, payment_mode, is_active, updated_by)
VALUES ('global', 'box', true, 'admin@lumina.com')
ON CONFLICT (id) DO NOTHING;

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.admin_payment_settings ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública: cualquier cliente puede consultar la modalidad activa (box vs redirect)
DROP POLICY IF EXISTS "Public read payment settings" ON public.admin_payment_settings;
CREATE POLICY "Public read payment settings" 
    ON public.admin_payment_settings 
    FOR SELECT 
    USING (true);

-- Política de escritura: solo el rol de servicio o administradores autenticados
DROP POLICY IF EXISTS "Admin write payment settings" ON public.admin_payment_settings;
CREATE POLICY "Admin write payment settings" 
    ON public.admin_payment_settings 
    FOR ALL 
    USING (
        auth.role() = 'service_role' 
        OR EXISTS (
            SELECT 1 FROM public.admin_invitations 
            WHERE lower(email) = lower(auth.jwt() ->> 'email') 
            AND is_active = true
        )
        OR lower(auth.jwt() ->> 'email') = 'admin@lumina.com'
    )
    WITH CHECK (
        auth.role() = 'service_role' 
        OR EXISTS (
            SELECT 1 FROM public.admin_invitations 
            WHERE lower(email) = lower(auth.jwt() ->> 'email') 
            AND is_active = true
        )
        OR lower(auth.jwt() ->> 'email') = 'admin@lumina.com'
    );
