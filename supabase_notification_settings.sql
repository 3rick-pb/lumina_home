-- ==============================================================================
-- LUMINA HOME — TABLA EXCLUSIVA PARA CONFIGURACIÓN DE NOTIFICACIONES Y ALERTAS
-- Pega y ejecuta este script en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA DEDICADA CON COLUMNAS TIPADAS INDIVIDUALES
CREATE TABLE IF NOT EXISTS public.admin_notification_settings (
    id text PRIMARY KEY,                                      -- 'global' o el email/UUID del administrador
    admin_email text,                                         -- Email del administrador responsable
    position text NOT NULL DEFAULT 'bottom-right',             -- Posición en pantalla ('bottom-right', 'bottom-left', 'top-right', 'top-left')
    layout text NOT NULL DEFAULT 'flight_route',              -- Estilo de tarjeta ('flight_route', 'stacked_ticket', 'split_capsule', 'bento_grid')
    preset_id text NOT NULL DEFAULT 'white_clean',            -- Preset visual activo
    bg_color text NOT NULL DEFAULT '#ffffff',                 -- Color de fondo HEX
    text_color text NOT NULL DEFAULT '#0a0a0a',               -- Color del texto principal HEX
    subtext_color text NOT NULL DEFAULT '#4b5563',            -- Color del texto secundario HEX
    accent_color text NOT NULL DEFAULT '#0f172a',             -- Color de acento / botón HEX
    title text NOT NULL DEFAULT 'NOTIFICACIÓN',               -- Título del banner de alerta
    duration integer NOT NULL DEFAULT 6000,                   -- Duración visible en ms (ej. 4000, 6000, 10000, 15000)
    sound_enabled boolean NOT NULL DEFAULT true,              -- Si emite timbre acústico
    toast_type text NOT NULL DEFAULT 'custom_preset',         -- 'custom_preset', 'monochrome', 'high_contrast'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS admin_email text;
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS position text DEFAULT 'bottom-right';
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS layout text DEFAULT 'flight_route';
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS preset_id text DEFAULT 'white_clean';
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS bg_color text DEFAULT '#ffffff';
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#0a0a0a';
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS subtext_color text DEFAULT '#4b5563';
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#0f172a';
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS title text DEFAULT 'NOTIFICACIÓN';
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS duration integer DEFAULT 6000;
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS sound_enabled boolean DEFAULT true;
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS toast_type text DEFAULT 'custom_preset';
ALTER TABLE public.admin_notification_settings ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) CON POLÍTICAS CLARAS
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read notification settings" ON public.admin_notification_settings;
CREATE POLICY "Public read notification settings" 
    ON public.admin_notification_settings 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Admin write notification settings" ON public.admin_notification_settings;
CREATE POLICY "Admin write notification settings" 
    ON public.admin_notification_settings 
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
        AND tablename = 'admin_notification_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notification_settings;
    END IF;
END $$;

-- 4. INSERTAR VALORES INICIALES POR DEFECTO PARA 'global'
INSERT INTO public.admin_notification_settings (
    id,
    admin_email,
    position,
    layout,
    preset_id,
    bg_color,
    text_color,
    subtext_color,
    accent_color,
    title,
    duration,
    sound_enabled,
    toast_type,
    updated_at
) VALUES (
    'global',
    'admin@lumina.com',
    'bottom-right',
    'flight_route',
    'white_clean',
    '#ffffff',
    '#0a0a0a',
    '#4b5563',
    '#0f172a',
    'NOTIFICACIÓN',
    6000,
    true,
    'custom_preset',
    timezone('utc'::text, now())
) ON CONFLICT (id) DO NOTHING;

-- 5. LIMPIEZA DE REGISTROS RESIDUALES EN active_sessions (Elimina datos parásitos)
DELETE FROM public.active_sessions 
WHERE user_id LIKE 'SYS_ALERT_CFG_%' 
   OR user_id = 'SYS_ADMIN_CART_ALERT_CONFIG';

-- Notificar recarga de caché del schema PostgREST
NOTIFY pgrst, 'reload schema';
