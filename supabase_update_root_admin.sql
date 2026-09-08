-- ==============================================================================
-- LUMINA HOME: CONFIGURACIÓN DE ADMINISTRADOR PRINCIPAL Y SECUNDARIOS
-- ==============================================================================
-- Regla de Negocio:
-- 1. ÚNICO Administrador Principal / Root: admin@lumina.com
--    - Gestiona cupos (hasta 3 administradores secundarios).
--    - Puede invitar o revocar administradores.
-- 2. Administradores Secundarios (máximo 3 en tabla admin_invitations):
--    - Acceso completo a Catálogo, Pedidos, Radar de Clientes y Configuración.
--    - NO pueden invitar ni revocar administradores.
--    - NO ven la cantidad de cupos disponibles ni la lista de otros administradores.
-- ==============================================================================

-- 1. Actualizar función is_root_admin() para que EXCLUSIVAMENTE admin@lumina.com sea Root
CREATE OR REPLACE FUNCTION public.is_root_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' = 'admin@lumina.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Actualizar función is_admin() para abarcar al Root y a los Secundarios autorizados
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' = 'admin@lumina.com'
    OR EXISTS (
      SELECT 1 FROM public.admin_invitations 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Asegurar que arteagae796@gmail.com esté registrado como Administrador Secundario activo
DO $$
DECLARE
  _root_id uuid;
BEGIN
  SELECT id INTO _root_id FROM auth.users WHERE email = 'admin@lumina.com' LIMIT 1;

  INSERT INTO public.admin_invitations (email, invited_by, is_active)
  VALUES ('arteagae796@gmail.com', _root_id, true)
  ON CONFLICT (email) DO UPDATE 
  SET is_active = true, updated_at = now();
END $$;

-- 4. Reafirmar políticas RLS para admin_invitations
DROP POLICY IF EXISTS "Admin invitations select" ON public.admin_invitations;
CREATE POLICY "Admin invitations select" ON public.admin_invitations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin invitations insert" ON public.admin_invitations;
CREATE POLICY "Admin invitations insert" ON public.admin_invitations
    FOR INSERT WITH CHECK (public.is_root_admin());

DROP POLICY IF EXISTS "Admin invitations delete" ON public.admin_invitations;
CREATE POLICY "Admin invitations delete" ON public.admin_invitations
    FOR DELETE USING (public.is_root_admin());

DROP POLICY IF EXISTS "Admin invitations update" ON public.admin_invitations;
CREATE POLICY "Admin invitations update" ON public.admin_invitations
    FOR UPDATE USING (public.is_root_admin());
