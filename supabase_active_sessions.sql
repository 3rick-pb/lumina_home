-- ==============================================================================
-- LUMINA HOME - TABLA DE SESIONES ACTIVAS EN VIVO PARA RADAR
-- Pega y ejecuta este script en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.active_sessions (
    user_id text PRIMARY KEY,
    name text,
    email text,
    city text DEFAULT 'Quito',
    country text DEFAULT 'Ecuador',
    x numeric DEFAULT 48.8,
    y numeric DEFAULT 26.5,
    current_section text DEFAULT 'Explorando Tienda',
    is_online boolean DEFAULT true,
    has_cart boolean DEFAULT false,
    cart_items_count integer DEFAULT 0,
    total_spent numeric DEFAULT 0,
    purchases_count integer DEFAULT 0,
    device text DEFAULT 'Computador',
    last_seen timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS y permitir lectura/escritura pública para sincronización en vivo
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public active_sessions policy" ON public.active_sessions;
CREATE POLICY "Public active_sessions policy" ON public.active_sessions FOR ALL USING (true) WITH CHECK (true);

-- Habilitar replicación de Realtime en Supabase para capturar cambios instantáneos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'active_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
