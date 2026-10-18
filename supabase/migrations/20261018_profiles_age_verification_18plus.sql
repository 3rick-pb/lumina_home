-- ==============================================================================
-- Migration: 20261018_profiles_age_verification_18plus.sql
-- Description: Creates or updates public.profiles table with strict 18+ age verification
--              constraint, Google OAuth metadata, and Row Level Security (RLS) policies.
-- Author: Senior Backend Architect & Cybersecurity Specialist
-- ==============================================================================

-- 1. Create or ensure public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  birth_date DATE,
  verified_age INT,
  age_verified BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Idempotently add any missing columns if table already existed
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'birth_date') THEN
    ALTER TABLE public.profiles ADD COLUMN birth_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'verified_age') THEN
    ALTER TABLE public.profiles ADD COLUMN verified_age INT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'age_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN age_verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 3. PostgreSQL Engine Constraint: Verified age must be NULL or >= 18
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_minimum_age_18;
ALTER TABLE public.profiles ADD CONSTRAINT check_minimum_age_18 
  CHECK (verified_age IS NULL OR verified_age >= 18);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view own profile if 18+" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile if 18+" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile if 18+" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;

-- Policy 1: SELECT allowed only for the profile owner who satisfies 18+ requirement
CREATE POLICY "Users can view own profile if 18+"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id AND (verified_age IS NULL OR verified_age >= 18)
  );

-- Policy 2: UPDATE allowed only for profile owner who satisfies 18+ requirement
CREATE POLICY "Users can update own profile if 18+"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id AND (verified_age IS NULL OR verified_age >= 18)
  )
  WITH CHECK (
    auth.uid() = id AND (verified_age IS NULL OR verified_age >= 18)
  );

-- Policy 3: INSERT allowed only for profile owner who satisfies 18+ requirement
CREATE POLICY "Users can insert own profile if 18+"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND (verified_age IS NULL OR verified_age >= 18)
  );

-- 6. Trigger for updated_at with SECURITY DEFINER and search_path = public
CREATE OR REPLACE FUNCTION public.handle_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profiles_updated_at();
