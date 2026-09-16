-- =========================================================================
-- LUMINA HOME: SOLUCIÓN DEFINITIVA DE PERSISTENCIA Y RLS PARA PRODUCTOS
-- Tabla objetivo: public.products
-- =========================================================================

-- 1. Habilitar Row Level Security (RLS) en public.products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Asegurar que todas las columnas extendidas existan en la tabla
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_anatomy_image TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS materials TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS package_contents TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 20;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'standard';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_specs JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_reviews JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_benefits JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_bundle JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS combos JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS how_to_use TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. Limpiar cualquier política restrictiva o duplicada previa
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Products select policy" ON public.products;
DROP POLICY IF EXISTS "Products insert policy" ON public.products;
DROP POLICY IF EXISTS "Products update policy" ON public.products;
DROP POLICY IF EXISTS "Products delete policy" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can insert products" ON public.products;
DROP POLICY IF EXISTS "Users can update products" ON public.products;
DROP POLICY IF EXISTS "Users can delete products" ON public.products;
DROP POLICY IF EXISTS "Allow all for products" ON public.products;

-- 4. POLÍTICA DE LECTURA PÚBLICA (SELECT): Todos los visitantes de la tienda pueden ver los productos
CREATE POLICY "Public can view products" ON public.products
  FOR SELECT
  USING (true);

-- 5. POLÍTICA DE INSERCIÓN (INSERT): Permite agregar nuevos productos al catálogo
CREATE POLICY "Products insert policy" ON public.products
  FOR INSERT
  WITH CHECK (true);

-- 6. POLÍTICA DE ACTUALIZACIÓN (UPDATE): Permite actualizar productos del catálogo
CREATE POLICY "Products update policy" ON public.products
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 7. POLÍTICA DE ELIMINACIÓN (DELETE): Permite retirar productos del catálogo
CREATE POLICY "Products delete policy" ON public.products
  FOR DELETE
  USING (true);

-- 8. Verificación de políticas y columnas aplicadas
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'products';
