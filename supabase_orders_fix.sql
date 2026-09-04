-- =========================================================================
-- LUMINA HOME: CORRECCIÓN DE POLÍTICAS RLS Y CAMPOS DE PEDIDOS (orders)
-- =========================================================================

-- 1. Asegurar columnas de metadatos de cliente en la tabla orders
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Procesando',
  total NUMERIC DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,
  tracking_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  recipient TEXT,
  shipping_address JSONB,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Agregar columnas en caso de que la tabla ya existiera previamente
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Procesando';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas anteriores (especialmente la que consultaba auth.users y provocaba el error 42501)
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users and Admins view orders" ON public.orders;
DROP POLICY IF EXISTS "Users and Admins manage orders" ON public.orders;
DROP POLICY IF EXISTS "Orders select policy" ON public.orders;
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
DROP POLICY IF EXISTS "Orders update policy" ON public.orders;

-- 4. Nueva política de lectura: el cliente ve sus pedidos, el Administrador ve todos los de la tienda
CREATE POLICY "Orders select policy" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN' 
    OR (auth.jwt() ->> 'email') = 'admin@lumina.com'
  );

-- 5. Nueva política de inserción: usuarios autenticados o anónimos autorizados
CREATE POLICY "Orders insert policy" ON public.orders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR user_id IS NULL
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    OR (auth.jwt() ->> 'email') = 'admin@lumina.com'
  );

-- 6. Nueva política de actualización: administradores pueden actualizar estados
CREATE POLICY "Orders update policy" ON public.orders
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN' 
    OR (auth.jwt() ->> 'email') = 'admin@lumina.com'
  );
