-- ==============================================================================
-- LUMINA HOME — REINICIO TOTAL A CERO (CLEAN SLATE)
-- Pega y ejecuta este script en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================
-- Este script vacía todas las órdenes de prueba, sesiones del radar, tarjetas,
-- direcciones y carritos, dejando clientes y administradores en CERO absoluto
-- sin órdenes, sin total gastado y sin actividad residual.
-- Los productos y categorías del catálogo se mantienen 100% intactos.
-- ==============================================================================

-- 1. Vaciar todas las órdenes y pedidos acumulados durante pruebas
TRUNCATE TABLE public.orders CASCADE;

-- 2. Vaciar todas las sesiones de radar y actividad en vivo
TRUNCATE TABLE public.active_sessions CASCADE;

-- 3. Vaciar todos los carritos en la nube
TRUNCATE TABLE public.user_carts CASCADE;

-- 4. Vaciar todas las tarjetas de pago registradas de prueba
TRUNCATE TABLE public.payment_cards CASCADE;

-- 5. Vaciar todas las direcciones de envío registradas de prueba
TRUNCATE TABLE public.addresses CASCADE;

-- 6. Vaciar la lista de favoritos de prueba
TRUNCATE TABLE public.favorites CASCADE;

-- 7. Purgar metadatos residuales en auth.users (elimina pedidos, tarjetas o carritos zombies)
UPDATE auth.users
SET raw_user_meta_data = (
  raw_user_meta_data 
  - 'orders' 
  - 'cards' 
  - 'addresses' 
  - 'address' 
  - 'cart'
);

-- 8. Asegurar que las cuentas de administrador conserven su acceso
INSERT INTO public.admin_invitations (email, is_active)
VALUES 
  ('admin@lumina.com', true),
  ('arteagae796@gmail.com', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- 9. Eliminar tablas temporales de respaldo si ya no se necesitan
DROP TABLE IF EXISTS public._backup_orders;
DROP TABLE IF EXISTS public._backup_addresses;
DROP TABLE IF EXISTS public._backup_payment_cards;
DROP TABLE IF EXISTS public._backup_favorites;
DROP TABLE IF EXISTS public._backup_user_carts;

-- 10. Recargar la caché de PostgREST en Supabase
NOTIFY pgrst, 'reload schema';
