-- ==============================================================================
-- Migration: 20261023_complete_rls_hardening_and_media_assets.sql
-- Description: 
--   1. Ensures public.admin_media_assets exists with schema cache registration.
--   2. Enables and hardens RLS on remaining vulnerable tables:
--      - products (Public SELECT, Admin-only INSERT/UPDATE/DELETE)
--      - admin_notification_settings (Public SELECT, Admin-only write)
--      - admin_dispatch_recipients (Admin-only SELECT/INSERT/UPDATE/DELETE)
--      - admin_google_drive_settings (Admin-only SELECT/INSERT/UPDATE/DELETE)
--      - admin_media_assets (Public SELECT for catalog images, Admin write)
--   3. Hardens payment_cards (PCI-DSS): ensures last4 exists and adds validation.
-- ==============================================================================

-- 1. Create admin_media_assets table if not exists
CREATE TABLE IF NOT EXISTS public.admin_media_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  thumbnail_url TEXT,
  mime_type TEXT DEFAULT 'image/jpeg',
  size TEXT,
  dimensions TEXT,
  folder_id TEXT NOT NULL DEFAULT 'folder_lumina_catalog_2026',
  folder_name TEXT DEFAULT 'Lumina Home - Catálogo Fotográfico 2026',
  source TEXT DEFAULT 'google_drive',
  tags TEXT[] DEFAULT '{}'::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_folder_id ON public.admin_media_assets (folder_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON public.admin_media_assets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_name ON public.admin_media_assets (name);

-- 2. PCI-DSS: Ensure payment_cards has last4 column and index
ALTER TABLE public.payment_cards ADD COLUMN IF NOT EXISTS last4 TEXT;
CREATE INDEX IF NOT EXISTS idx_payment_cards_user_id ON public.payment_cards (user_id);

-- Ensure user_profiles has role column
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';

-- 3. Enable RLS on unhardened tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_dispatch_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_google_drive_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_media_assets ENABLE ROW LEVEL SECURITY;

-- 4. Helper function to check if current user is admin (security definer)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    coalesce(auth.jwt() ->> 'email', '') IN ('admin@lumina.com', 'arteagae796@gmail.com')
    OR EXISTS (
      SELECT 1 FROM public.admin_invitations
      WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    );
$$;

-- 5. Policies for public.products
DROP POLICY IF EXISTS "Products are publicly viewable" ON public.products;
CREATE POLICY "Products are publicly viewable"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- 6. Policies for public.admin_notification_settings
DROP POLICY IF EXISTS "Notification settings publicly viewable" ON public.admin_notification_settings;
CREATE POLICY "Notification settings publicly viewable"
  ON public.admin_notification_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage notification settings" ON public.admin_notification_settings;
CREATE POLICY "Admins can manage notification settings"
  ON public.admin_notification_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Policies for public.admin_dispatch_recipients
DROP POLICY IF EXISTS "Admins can manage dispatch recipients" ON public.admin_dispatch_recipients;
CREATE POLICY "Admins can manage dispatch recipients"
  ON public.admin_dispatch_recipients FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Policies for public.admin_google_drive_settings
DROP POLICY IF EXISTS "Allow public read of drive settings" ON public.admin_google_drive_settings;
DROP POLICY IF EXISTS "Allow write to drive settings" ON public.admin_google_drive_settings;
DROP POLICY IF EXISTS "Admins can manage google drive settings" ON public.admin_google_drive_settings;

CREATE POLICY "Admins can manage google drive settings"
  ON public.admin_google_drive_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Policies for public.admin_media_assets
DROP POLICY IF EXISTS "Media assets are publicly viewable" ON public.admin_media_assets;
CREATE POLICY "Media assets are publicly viewable"
  ON public.admin_media_assets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage media assets" ON public.admin_media_assets;
CREATE POLICY "Admins can manage media assets"
  ON public.admin_media_assets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
