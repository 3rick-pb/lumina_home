-- =========================================================================
-- MIGRACIÓN DEDICADA: CONFIGURACIÓN CORPORATIVA COMPARTIDA DE GOOGLE DRIVE
-- =========================================================================
-- Crea la tabla centralizada para la cuenta de Google Drive compartida
-- por todos los administradores autorizados de Lumina Home.

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
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.admin_google_drive_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_google_drive_settings' AND policyname = 'Allow public read of google drive settings'
  ) THEN
    CREATE POLICY "Allow public read of google drive settings"
      ON public.admin_google_drive_settings FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_google_drive_settings' AND policyname = 'Allow write to google drive settings'
  ) THEN
    CREATE POLICY "Allow write to google drive settings"
      ON public.admin_google_drive_settings FOR ALL USING (true);
  END IF;
END $$;

-- Registro inicial por defecto si no existe
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
