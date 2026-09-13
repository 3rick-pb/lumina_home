-- ==============================================================================
-- LUMINA HOME — REPARACIÓN DEFINITIVA DE TABLA ADDRESSES (UBICACIONES)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. Eliminar la restricción UNIQUE errónea sobre user_id en addresses
-- Esto permite que los usuarios puedan guardar hasta 4 direcciones distintas (casa, oficina, etc.)
ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_key;

-- 2. Asegurar columnas temporales completas (created_at y updated_at)
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Asegurar columnas de contacto y ubicación física
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

-- 4. Asegurar índice sobre user_id para búsquedas ultra-rápidas
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);

-- 5. Asegurar políticas RLS para lectura y escritura administrativa y de usuario
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS Users manage own addresses ON public.addresses;
CREATE POLICY Users manage own addresses ON public.addresses
  FOR ALL USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

-- 6. Recargar la caché del esquema en el motor PostgREST de Supabase
NOTIFY pgrst, 'reload schema';
