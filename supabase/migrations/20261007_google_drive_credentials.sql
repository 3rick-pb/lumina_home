-- =========================================================================
-- MIGRACIÓN DE ARQUITECTURA SEGURA: CREDENCIALES Y ESTADO OAUTH GOOGLE DRIVE
-- =========================================================================
-- Separa completamente la identidad de Lumina Home de la delegación de Google Drive.
-- Vincula las credenciales y el estado criptográfico de forma estricta al admin_id.

-- 1. Tabla de Credenciales de Google Drive vinculada 1:1 al admin_id de Lumina Home
CREATE TABLE IF NOT EXISTS public.google_drive_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  google_account_email text,
  google_account_name text,
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text,
  token_expiry timestamptz,
  scopes text DEFAULT 'https://www.googleapis.com/auth/drive.readonly',
  drive_folder_id text NOT NULL DEFAULT 'folder_lumina_catalog_2026',
  drive_folder_name text NOT NULL DEFAULT 'Catálogo General',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT uq_admin_google_drive UNIQUE (admin_id)
);

-- Índices de búsqueda por admin_id
CREATE INDEX IF NOT EXISTS idx_google_drive_credentials_admin_id ON public.google_drive_credentials (admin_id);

-- 2. Tabla de Estado Criptográfico (OAuth State) para prevención de CSRF y fijación de sesión
CREATE TABLE IF NOT EXISTS public.google_drive_oauth_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL UNIQUE,
  admin_id uuid NOT NULL,
  session_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_google_drive_oauth_state_lookup ON public.google_drive_oauth_state (state, used, expires_at);

-- 3. Row Level Security (RLS)
ALTER TABLE public.google_drive_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_oauth_state ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_drive_credentials' AND policyname = 'Allow service role all on drive credentials'
  ) THEN
    CREATE POLICY "Allow service role all on drive credentials"
      ON public.google_drive_credentials FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_drive_oauth_state' AND policyname = 'Allow service role all on drive state'
  ) THEN
    CREATE POLICY "Allow service role all on drive state"
      ON public.google_drive_oauth_state FOR ALL USING (true);
  END IF;
END $$;
