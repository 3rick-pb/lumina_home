-- =========================================================================
-- MIGRACIÓN DEDICADA: BANCO DE FOTOS Y RESPALDO MULTIMEDIA EN BASE DE DATOS
-- =========================================================================
-- Crea y actualiza las estructuras en Supabase para el Banco de Fotos,
-- permitiendo respaldo completo de activos visuales, metadatos, carpetas
-- y trazabilidad de copias de seguridad de Lumina Home.

-- 1. Actualizar / Asegurar la tabla de configuración y resumen
CREATE TABLE IF NOT EXISTS public.admin_google_drive_settings (
  id text PRIMARY KEY DEFAULT 'global',
  is_connected boolean NOT NULL DEFAULT false,
  connected_email text DEFAULT NULL,
  connected_account_name text DEFAULT NULL,
  connected_at timestamptz,
  selected_folder_id text NOT NULL DEFAULT 'folder_lumina_catalog_2026',
  selected_folder_name text NOT NULL DEFAULT 'Fotoproductos - Catálogo Lumina',
  folders_list jsonb NOT NULL DEFAULT '[
    {"id": "folder_lumina_catalog_2026", "name": "Lumina Home - Catálogo Fotográfico 2026", "itemCount": 12},
    {"id": "folder_iluminacion_premium", "name": "Iluminación & Lámparas de Autor", "itemCount": 6},
    {"id": "folder_textiles_tapiceria", "name": "Textiles Naturales & Lino", "itemCount": 4},
    {"id": "folder_ceramica_decoracion", "name": "Cerámica & Accesorios Minimalistas", "itemCount": 5}
  ]'::jsonb,
  files_cache jsonb NOT NULL DEFAULT '[]'::jsonb,
  backup_at timestamptz,
  backup_count integer DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Si la tabla ya existía, agregar columnas de respaldo si no estuvieran presentes
ALTER TABLE public.admin_google_drive_settings 
  ADD COLUMN IF NOT EXISTS backup_at timestamptz,
  ADD COLUMN IF NOT EXISTS backup_count integer DEFAULT 0;

-- 2. Tabla Relacional Dedicada para cada fotografía respaldada
CREATE TABLE IF NOT EXISTS public.admin_media_assets (
  id text PRIMARY KEY,
  name text NOT NULL,
  cdn_url text NOT NULL,
  thumbnail_url text,
  mime_type text DEFAULT 'image/jpeg',
  size text,
  dimensions text,
  folder_id text NOT NULL DEFAULT 'folder_lumina_catalog_2026',
  folder_name text DEFAULT 'Lumina Home - Catálogo Fotográfico 2026',
  source text DEFAULT 'google_drive',
  tags text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices de alto rendimiento para búsqueda y filtrado por colección
CREATE INDEX IF NOT EXISTS idx_media_assets_folder_id ON public.admin_media_assets (folder_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON public.admin_media_assets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_name ON public.admin_media_assets (name);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.admin_google_drive_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_media_assets ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para admin_google_drive_settings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_google_drive_settings' AND policyname = 'Allow public read of drive settings'
  ) THEN
    CREATE POLICY "Allow public read of drive settings"
      ON public.admin_google_drive_settings FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_google_drive_settings' AND policyname = 'Allow write to drive settings'
  ) THEN
    CREATE POLICY "Allow write to drive settings"
      ON public.admin_google_drive_settings FOR ALL USING (true);
  END IF;
END $$;

-- Políticas de seguridad para admin_media_assets
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_media_assets' AND policyname = 'Allow public read of media assets'
  ) THEN
    CREATE POLICY "Allow public read of media assets"
      ON public.admin_media_assets FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_media_assets' AND policyname = 'Allow write to media assets'
  ) THEN
    CREATE POLICY "Allow write to media assets"
      ON public.admin_media_assets FOR ALL USING (true);
  END IF;
END $$;

-- 4. Limpieza de cuentas demo anteriores
UPDATE public.admin_google_drive_settings
SET is_connected = false,
    connected_email = NULL,
    connected_account_name = NULL,
    connected_at = NULL
WHERE connected_email = 'multimedia.lumina@gmail.com';

-- 5. Inserción inicial de configuración por defecto si la fila global no existe
INSERT INTO public.admin_google_drive_settings (
  id,
  is_connected,
  connected_email,
  connected_account_name,
  selected_folder_id,
  selected_folder_name
)
VALUES (
  'global',
  false,
  NULL,
  NULL,
  'folder_lumina_catalog_2026',
  'Fotoproductos - Catálogo Lumina'
)
ON CONFLICT (id) DO UPDATE SET
  is_connected = false,
  connected_email = NULL,
  connected_account_name = NULL
WHERE public.admin_google_drive_settings.connected_email = 'multimedia.lumina@gmail.com';

