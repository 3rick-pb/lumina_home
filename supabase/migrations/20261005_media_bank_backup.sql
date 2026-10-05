-- =========================================================================
-- MIGRACIÓN DEDICADA: BANCO DE FOTOS Y RESPALDO MULTIMEDIA EN BASE DE DATOS
-- =========================================================================
-- Crea y actualiza las estructuras en Supabase para el Banco de Fotos,
-- permitiendo respaldo completo de activos visuales, metadatos, carpetas
-- y trazabilidad de copias de seguridad de Lumina Home.

-- 1. Actualizar / Asegurar la tabla de configuración y resumen
CREATE TABLE IF NOT EXISTS public.admin_google_drive_settings (
  id text PRIMARY KEY DEFAULT 'global',
  is_connected boolean NOT NULL DEFAULT true,
  connected_email text NOT NULL DEFAULT 'multimedia.lumina@gmail.com',
  connected_account_name text NOT NULL DEFAULT 'Lumina Home Media Assets',
  connected_at timestamptz NOT NULL DEFAULT now(),
  selected_folder_id text NOT NULL DEFAULT 'folder_lumina_catalog_2026',
  selected_folder_name text NOT NULL DEFAULT 'Lumina Home - Catálogo Fotográfico 2026',
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

-- 4. Inserción inicial de configuración por defecto si la fila global no existe
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
  true,
  'multimedia.lumina@gmail.com',
  'Lumina Home Media Assets',
  'folder_lumina_catalog_2026',
  'Lumina Home - Catálogo Fotográfico 2026'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Semilla inicial de fotografías de catálogo curadas Lumina Home
INSERT INTO public.admin_media_assets (id, name, mime_type, cdn_url, thumbnail_url, size, dimensions, folder_id, folder_name, source)
VALUES
  ('lumina_drive_img_01', 'LUMINA-AURA-PENDANT-01.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400&auto=format&fit=crop', '2.4 MB', '2400 x 1800', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_02', 'LUMINA-NORDIC-FLOOR-LAMP-02.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=400&auto=format&fit=crop', '3.1 MB', '2600 x 1950', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_03', 'LUMINA-CERAMIC-VASE-MATTE-03.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=400&auto=format&fit=crop', '1.8 MB', '2000 x 2000', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_04', 'LUMINA-LINEN-CUSHIONS-SAND-04.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=400&auto=format&fit=crop', '2.8 MB', '2500 x 1667', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_05', 'LUMINA-MARBLE-ACCENT-TABLE-05.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=400&auto=format&fit=crop', '3.4 MB', '2800 x 2100', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_06', 'LUMINA-BRASS-CHANDELIER-06.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=400&auto=format&fit=crop', '2.1 MB', '2200 x 1650', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_07', 'LUMINA-MINIMALIST-SCONCE-07.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?q=80&w=400&auto=format&fit=crop', '2.7 MB', '2400 x 1800', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_08', 'LUMINA-SCANDINAVIAN-ARMCHAIR-08.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400&auto=format&fit=crop', '3.6 MB', '3000 x 2000', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_09', 'LUMINA-ORGANIC-WOOD-BENCH-09.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop', '2.9 MB', '2600 x 1733', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_10', 'LUMINA-WOVEN-RUG-NATURAL-10.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=400&auto=format&fit=crop', '2.5 MB', '2400 x 1800', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_11', 'LUMINA-ARCHITECTURAL-VASE-11.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=400&auto=format&fit=crop', '1.9 MB', '2100 x 2100', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive'),
  ('lumina_drive_img_12', 'LUMINA-ECLIPSE-DESK-LAMP-12.jpg', 'image/jpeg', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=90&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400&auto=format&fit=crop', '2.3 MB', '2400 x 1800', 'folder_lumina_catalog_2026', 'Lumina Home - Catálogo Fotográfico 2026', 'google_drive')
ON CONFLICT (id) DO NOTHING;
