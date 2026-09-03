-- =========================================================================
-- LUMINA HOME: ARCHITECTURE DE PERSISTENCIA Y AISLAMIENTO EN BASE DE DATOS
-- =========================================================================

-- 1. TABLA DE CARRITOS DE USUARIO (user_carts)
CREATE TABLE IF NOT EXISTS public.user_carts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  coupon_code TEXT,
  discount_percent NUMERIC DEFAULT 0,
  is_free_shipping BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own cart" ON public.user_carts;
CREATE POLICY "Users can manage their own cart" ON public.user_carts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. TABLA DE TARJETAS DE PAGO (payment_cards)
CREATE TABLE IF NOT EXISTS public.payment_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number TEXT NOT NULL,
  holder TEXT NOT NULL,
  exp TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mastercard',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own payment cards" ON public.payment_cards;
CREATE POLICY "Users can manage their own payment cards" ON public.payment_cards
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. POLÍTICAS RLS EN ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'ADMIN' OR auth.users.email = 'admin@lumina.com')
    )
  );

-- 4. POLÍTICAS RLS EN ADDRESSES
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
CREATE POLICY "Users can manage their own addresses" ON public.addresses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. TABLA DE NICHOS / CATEGORÍAS 100% DINÁMICAS (categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
CREATE POLICY "Authenticated users can manage categories" ON public.categories
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
