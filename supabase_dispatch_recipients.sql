-- ==============================================================================
-- LUMINA HOME — TABLA EXCLUSIVA PARA RECEPTORES EXTRAS DE DESPACHO
-- Ejecuta este script en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA DEDICADA: public.admin_dispatch_recipients
CREATE TABLE IF NOT EXISTS public.admin_dispatch_recipients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    label text DEFAULT 'Logística / Despacho',
    is_active boolean NOT NULL DEFAULT true,
    added_by text DEFAULT 'admin@lumina.com',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.admin_dispatch_recipients ADD COLUMN IF NOT EXISTS email text NOT NULL;
ALTER TABLE public.admin_dispatch_recipients ADD COLUMN IF NOT EXISTS label text DEFAULT 'Logística / Despacho';
ALTER TABLE public.admin_dispatch_recipients ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.admin_dispatch_recipients ADD COLUMN IF NOT EXISTS added_by text DEFAULT 'admin@lumina.com';
ALTER TABLE public.admin_dispatch_recipients ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Índice único insensible a mayúsculas/minúsculas para el email
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_dispatch_recipients_lower_email 
    ON public.admin_dispatch_recipients (lower(email));

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.admin_dispatch_recipients ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública
DROP POLICY IF EXISTS "Public read dispatch recipients" ON public.admin_dispatch_recipients;
CREATE POLICY "Public read dispatch recipients" 
    ON public.admin_dispatch_recipients 
    FOR SELECT 
    USING (true);

-- Política de escritura para administradores y backend
DROP POLICY IF EXISTS "Admin write dispatch recipients" ON public.admin_dispatch_recipients;
CREATE POLICY "Admin write dispatch recipients" 
    ON public.admin_dispatch_recipients 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 3. HABILITAR REPLICACIÓN REALTIME EN SUPABASE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'admin_dispatch_recipients'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_dispatch_recipients;
    END IF;
END $$;

-- 4. Notificar recarga de caché del schema PostgREST
NOTIFY pgrst, 'reload schema';
