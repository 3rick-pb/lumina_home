-- ==============================================================================
-- LUMINA HOME: ESTANDARIZACION DEFINITIVA DE LA COLUMNA how_to_use EN public.products
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

DO $$
BEGIN
  -- Si how_to_use existe como ARRAY (text[]), convertirlo limpiamente a TEXT
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'how_to_use' 
      AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.products 
      ALTER COLUMN how_to_use TYPE TEXT 
      USING array_to_string(how_to_use, E'\n\n');
  ELSIF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'how_to_use'
  ) THEN
    ALTER TABLE public.products 
      ADD COLUMN how_to_use TEXT;
  END IF;
END $$;

-- Recargar la cache del esquema de PostgREST para reflejar el cambio al instante
NOTIFY pgrst, 'reload schema';
