-- =========================================================================
-- LUMINA HOME: POLÍTICAS DE SEGURIDAD RLS PARA PRODUCTOS (public.products)
-- Habilita SELECT, INSERT, UPDATE y DELETE de forma persistente
-- =========================================================================

-- 1. Asegurar que Row Level Security (RLS) esté habilitado
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas previas potencialmente restrictivas
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Products select policy" ON public.products;
DROP POLICY IF EXISTS "Products insert policy" ON public.products;
DROP POLICY IF EXISTS "Products update policy" ON public.products;
DROP POLICY IF EXISTS "Products delete policy" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can insert products" ON public.products;
DROP POLICY IF EXISTS "Users can update products" ON public.products;
DROP POLICY IF EXISTS "Users can delete products" ON public.products;
DROP POLICY IF EXISTS "Allow all for products" ON public.products;

-- 3. POLÍTICA DE LECTURA (SELECT): Acceso público para que cualquier visitante vea el catálogo
CREATE POLICY "Public can view products" ON public.products
  FOR SELECT
  USING (true);

-- 4. POLÍTICA DE CREACIÓN (INSERT): Permite agregar nuevos productos a la tienda
CREATE POLICY "Products insert policy" ON public.products
  FOR INSERT
  WITH CHECK (true);

-- 5. POLÍTICA DE ACTUALIZACIÓN (UPDATE): Permite modificar precios, stock, imágenes y descripciones
CREATE POLICY "Products update policy" ON public.products
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. POLÍTICA DE ELIMINACIÓN (DELETE): Permite eliminar productos definitivamente de la base de datos
CREATE POLICY "Products delete policy" ON public.products
  FOR DELETE
  USING (true);

-- 7. PURGA DEL REGISTRO RESIDUAL "Airpods Max"
-- Este registro fue eliminado desde la tienda cuando no existía política de DELETE
DELETE FROM public.products WHERE title ILIKE '%Airpods Max%';
DELETE FROM public.products WHERE title ILIKE '%Auth Test Product%';
DELETE FROM public.products WHERE title ILIKE '%Test Temp Delete Product%';

-- 8. Verificación de productos vigentes tras la purga
SELECT id, title, category, price, created_at FROM public.products ORDER BY created_at DESC;
