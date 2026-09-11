-- =========================================================================
-- LUMINA HOME: ACTUALIZACION DE IDENTIFICACION, CONTACTO Y PEDIDOS
-- Soporte completo para: Cedula / DNI, Telefono con WhatsApp y Correo
-- =========================================================================

-- 1. Campos de identificacion y contacto en la tabla de Direcciones (public.addresses)
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Campos de identificacion y contacto directo en la tabla de Pedidos (public.orders)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 3. Indices optimizados para busquedas rapidas operativas de despacho
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_number ON public.orders(customer_id_number);
CREATE INDEX IF NOT EXISTS idx_addresses_id_number ON public.addresses(id_number);
CREATE INDEX IF NOT EXISTS idx_addresses_phone ON public.addresses(phone);

-- 4. Notificar a PostgREST para recargar el esquema de cache inmediatamente
NOTIFY pgrst, 'reload schema';
