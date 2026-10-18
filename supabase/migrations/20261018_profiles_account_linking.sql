-- ==============================================================================
-- Migration: 20261018_profiles_account_linking.sql
-- Description: Adds account unification, Google linking status and merge tracking
--              columns to public.profiles and public.user_profiles idempotently.
-- ==============================================================================

DO $$ 
BEGIN
  -- 1. Ensure columns on public.profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'google_connected') THEN
    ALTER TABLE public.profiles ADD COLUMN google_connected BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'account_merged') THEN
    ALTER TABLE public.profiles ADD COLUMN account_merged BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'merged_email') THEN
    ALTER TABLE public.profiles ADD COLUMN merged_email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'auth_provider') THEN
    ALTER TABLE public.profiles ADD COLUMN auth_provider TEXT DEFAULT 'email';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'merged_at') THEN
    ALTER TABLE public.profiles ADD COLUMN merged_at TIMESTAMPTZ;
  END IF;

  -- 2. Ensure columns on public.user_profiles if present
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'google_connected') THEN
      ALTER TABLE public.user_profiles ADD COLUMN google_connected BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'account_merged') THEN
      ALTER TABLE public.user_profiles ADD COLUMN account_merged BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;
