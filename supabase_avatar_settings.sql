-- ==============================================================================
-- LUMINA HOME — TABLA EXCLUSIVA PARA CONFIGURACIÓN INDIVIDUAL DE AVATARES
-- Pega y ejecuta este script en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA DEDICADA user_avatar_settings
-- Esta tabla almacena de forma aislada y limpia la configuración de cada cuenta
-- sin tocar ni ensuciar ninguna tabla existente del sistema.
CREATE TABLE IF NOT EXISTS public.user_avatar_settings (
    user_id text PRIMARY KEY,                                      -- Identificador de cuenta (UUID o string de usuario)
    user_email text,                                               -- Correo electrónico asociado para trazabilidad
    show_in_navbar boolean NOT NULL DEFAULT false,                 -- Mostrar avatar en la pastilla Liquid Glass del Home (por defecto false)
    background_shape text NOT NULL DEFAULT 'squircle',             -- 'squircle' o 'circle'
    animation_mode text NOT NULL DEFAULT 'always',                 -- 'always', 'hover' o 'none'
    custom_seed text,                                              -- Semilla de personalización opcional
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar columnas si se ejecuta incrementalmente
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS show_in_navbar boolean DEFAULT false;
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS background_shape text DEFAULT 'squircle';
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS animation_mode text DEFAULT 'always';
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS custom_seed text;
ALTER TABLE public.user_avatar_settings ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_avatar_settings ENABLE ROW LEVEL SECURITY;

-- Lectura: Pública/autenticada para que los avatares se visualicen en pedidos, radar y perfiles
DROP POLICY IF EXISTS "Allow read avatar settings" ON public.user_avatar_settings;
CREATE POLICY "Allow read avatar settings" 
    ON public.user_avatar_settings 
    FOR SELECT 
    USING (true);

-- Escritura: Permitir a los usuarios y API guardar sus preferencias individuales
DROP POLICY IF EXISTS "Allow write avatar settings" ON public.user_avatar_settings;
CREATE POLICY "Allow write avatar settings" 
    ON public.user_avatar_settings 
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
        AND tablename = 'user_avatar_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_avatar_settings;
    END IF;
END $$;

-- 4. RECARGAR CACHÉ DE ESQUEMA POSTGREST
NOTIFY pgrst, 'reload schema';
