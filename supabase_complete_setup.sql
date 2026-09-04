-- ==============================================================================
-- LUMINA HOME - SCRIPT MAESTRO DE CONFIGURACIÓN DE BASE DE DATOS SUPABASE
-- Pega y ejecuta este script en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. TABLA DE PRODUCTOS: Agregar especificaciones completas y stock
ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS materials text,
ADD COLUMN IF NOT EXISTS shipping text,
ADD COLUMN IF NOT EXISTS dimensions text,
ADD COLUMN IF NOT EXISTS warranty text,
ADD COLUMN IF NOT EXISTS care_instructions text,
ADD COLUMN IF NOT EXISTS package_contents text,
ADD COLUMN IF NOT EXISTS stock integer DEFAULT 20;

-- Habilitar RLS en products y permitir lectura y administración
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert products" ON public.products;
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update products" ON public.products;
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete products" ON public.products;
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);


-- 2. TABLA DE CATEGORÍAS / NICHOS
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert categories" ON public.categories;
CREATE POLICY "Public insert categories" ON public.categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update categories" ON public.categories;
CREATE POLICY "Public update categories" ON public.categories FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete categories" ON public.categories;
CREATE POLICY "Public delete categories" ON public.categories FOR DELETE USING (true);

-- Sembrar nichos por defecto de la tienda Lumina
INSERT INTO public.categories (name) VALUES
    ('Iluminación'),
    ('Decoración'),
    ('Mobiliario'),
    ('Textiles'),
    ('Velas & Aromas'),
    ('Cocina'),
    ('Comedor'),
    ('Accesorios')
ON CONFLICT (name) DO NOTHING;


-- 3. TABLA DE PEDIDOS (ORDERS): Corregir error de RLS 42501 (auth.users)
CREATE TABLE IF NOT EXISTS public.orders (
    id text PRIMARY KEY,
    user_id text,
    customer_name text,
    customer_email text,
    recipient text,
    shipping_address jsonb,
    payment_method text,
    date text,
    time text,
    status text DEFAULT 'Procesando',
    tracking_number text,
    total numeric(10, 2) DEFAULT 0.00,
    items jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas restrictivas o rotas que consultaban auth.users
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
DROP POLICY IF EXISTS "Public delete orders" ON public.orders;

-- Políticas limpias y robustas para órdenes de compra
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Public delete orders" ON public.orders FOR DELETE USING (true);


-- 4. TABLA DE DIRECCIONES DE ENVÍO
CREATE TABLE IF NOT EXISTS public.addresses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    recipient text NOT NULL,
    street text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL DEFAULT 'España',
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public addresses policy" ON public.addresses;
CREATE POLICY "Public addresses policy" ON public.addresses FOR ALL USING (true) WITH CHECK (true);


-- 5. TABLA DE CARRITO EN NUBE
CREATE TABLE IF NOT EXISTS public.user_carts (
    user_id text PRIMARY KEY,
    items jsonb DEFAULT '[]'::jsonb,
    coupon_code text,
    discount_percent numeric DEFAULT 0,
    is_free_shipping boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public user_carts policy" ON public.user_carts;
CREATE POLICY "Public user_carts policy" ON public.user_carts FOR ALL USING (true) WITH CHECK (true);


-- 6. TABLA DE FAVORITOS
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    product_id text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public favorites policy" ON public.favorites;
CREATE POLICY "Public favorites policy" ON public.favorites FOR ALL USING (true) WITH CHECK (true);


-- 7. TABLA DE TARJETAS DE PAGO
CREATE TABLE IF NOT EXISTS public.payment_cards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    number text NOT NULL,
    holder text NOT NULL,
    exp text NOT NULL,
    type text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public payment_cards policy" ON public.payment_cards;
CREATE POLICY "Public payment_cards policy" ON public.payment_cards FOR ALL USING (true) WITH CHECK (true);

-- Recargar caché de esquema en Supabase PostgREST
NOTIFY pgrst, 'reload schema';
