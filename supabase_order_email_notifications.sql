-- ==============================================================================
-- LUMINA HOME - MIGRACIÓN DE TABLA DEDICADA DE NOTIFICACIONES POR CORREO
-- Tabla independiente y aislada: public.order_email_notifications
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.order_email_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id text NOT NULL,
    recipient_email text NOT NULL,
    recipient_name text,
    recipient_type text NOT NULL CHECK (recipient_type IN ('customer', 'admin')),
    email_type text NOT NULL CHECK (email_type IN ('customer_invoice', 'admin_dispatch_notice', 'order_status_update')),
    subject text NOT NULL,
    status text NOT NULL CHECK (status IN ('sent', 'failed', 'simulated_dev')),
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de alto rendimiento para búsquedas por orden y destinatario
CREATE INDEX IF NOT EXISTS idx_order_email_notif_order_id 
    ON public.order_email_notifications (order_id);

CREATE INDEX IF NOT EXISTS idx_order_email_notif_recipient 
    ON public.order_email_notifications (recipient_email);

CREATE INDEX IF NOT EXISTS idx_order_email_notif_sent_at 
    ON public.order_email_notifications (sent_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.order_email_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad:
-- 1. Los administradores pueden leer todos los registros de notificaciones
DROP POLICY IF EXISTS "Admins can view email notification logs" ON public.order_email_notifications;
CREATE POLICY "Admins can view email notification logs" 
    ON public.order_email_notifications
    FOR SELECT 
    USING (public.is_admin());

-- 2. El backend y usuarios pueden registrar envíos de notificaciones durante el checkout
DROP POLICY IF EXISTS "Anyone can insert email notification logs" ON public.order_email_notifications;
CREATE POLICY "Anyone can insert email notification logs" 
    ON public.order_email_notifications
    FOR INSERT 
    WITH CHECK (true);

-- 3. Los clientes autenticados pueden ver las notificaciones enviadas a su propio correo
DROP POLICY IF EXISTS "Users can view own order notifications" ON public.order_email_notifications;
CREATE POLICY "Users can view own order notifications" 
    ON public.order_email_notifications
    FOR SELECT 
    USING (
        auth.jwt() ->> 'email' = recipient_email
    );
