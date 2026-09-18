-- =========================================================================
-- ESQUEMA DEDICADO: RADAR SATELITAL MULTI-PAÍS Y TELEMETRÍA GEOESPACIAL
-- =========================================================================
-- Este script crea tablas 100% aisladas e independientes para el sistema
-- de Radar Multi-País (Ecuador, Colombia, Argentina, Perú, México, Chile).
-- NO sobrecarga ni reutiliza tablas de usuarios, direcciones o pedidos.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DEDICADA: CONFIGURACIÓN DE PAÍSES DEL RADAR
CREATE TABLE IF NOT EXISTS public.radar_countries (
    code VARCHAR(2) PRIMARY KEY, -- 'EC', 'CO', 'AR', 'PE', 'MX', 'CL'
    name TEXT NOT NULL,
    flag_emoji TEXT NOT NULL,
    currency_code VARCHAR(5) NOT NULL,
    currency_symbol VARCHAR(5) NOT NULL,
    total_regions INTEGER NOT NULL,
    map_aspect_ratio TEXT NOT NULL,
    map_webp_url TEXT NOT NULL,
    map_png_url TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA DEDICADA: SESIONES Y TELEMETRÍA EN VIVO DE CLIENTES POR PAÍS
CREATE TABLE IF NOT EXISTS public.radar_telemetry_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL REFERENCES public.radar_countries(code) ON DELETE CASCADE,
    city TEXT NOT NULL,
    region_state TEXT,
    coordinate_x NUMERIC(6, 2) NOT NULL,
    coordinate_y NUMERIC(6, 2) NOT NULL,
    device_type TEXT DEFAULT 'desktop', -- 'mobile', 'desktop', 'tablet'
    current_section TEXT DEFAULT 'Explorando Tienda',
    cart_amount NUMERIC(10, 2) DEFAULT 0.00,
    purchases_count INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT true,
    is_guest BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_radar_session_country UNIQUE (session_id, country_code)
);

-- 3. TABLA DEDICADA: MÉTRICAS Y AGREGACIONES REGIONALES POR PAÍS
CREATE TABLE IF NOT EXISTS public.radar_country_metrics (
    country_code VARCHAR(2) PRIMARY KEY REFERENCES public.radar_countries(code) ON DELETE CASCADE,
    active_visitors INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_sales_volume NUMERIC(12, 2) DEFAULT 0.00,
    top_region TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SEMBRADO INICIAL (SEED) DE LOS 6 PAÍSES SOPORTADOS
INSERT INTO public.radar_countries (code, name, flag_emoji, currency_code, currency_symbol, total_regions, map_aspect_ratio, map_webp_url, map_png_url, is_enabled, display_order)
VALUES
    ('EC', 'Ecuador', '🇪🇨', 'USD', '$', 24, '1024/682', '/images/map_ecuador_cutout.webp', '/images/map_ecuador_cutout.png', true, 1),
    ('CO', 'Colombia', '🇨🇴', 'COP', '$', 32, '1024/682', '/images/map_colombia_cutout.webp', '/images/map_colombia_cutout.png', true, 2),
    ('AR', 'Argentina', '🇦🇷', 'ARS', '$', 24, '861/1024', '/images/map_argentina_cutout.webp', '/images/map_argentina_cutout.png', true, 3),
    ('PE', 'Perú', '🇵🇪', 'PEN', 'S/', 25, '1024/948', '/images/map_peru_cutout.webp', '/images/map_peru_cutout.png', true, 4),
    ('MX', 'México', '🇲🇽', 'MXN', '$', 32, '1024/596', '/images/map_mexico_cutout.webp', '/images/map_mexico_cutout.png', true, 5),
    ('CL', 'Chile', '🇨🇱', 'CLP', '$', 16, '1024/943', '/images/map_chile_cutout.webp', '/images/map_chile_cutout.png', true, 6)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    flag_emoji = EXCLUDED.flag_emoji,
    currency_code = EXCLUDED.currency_code,
    currency_symbol = EXCLUDED.currency_symbol,
    total_regions = EXCLUDED.total_regions,
    map_aspect_ratio = EXCLUDED.map_aspect_ratio,
    map_webp_url = EXCLUDED.map_webp_url,
    map_png_url = EXCLUDED.map_png_url,
    is_enabled = EXCLUDED.is_enabled,
    display_order = EXCLUDED.display_order,
    updated_at = timezone('utc'::text, now());

-- 5. SEMBRADO INICIAL DE MÉTRICAS BASE
INSERT INTO public.radar_country_metrics (country_code, active_visitors, total_orders, total_sales_volume, top_region)
VALUES
    ('EC', 12, 148, 12450.00, 'Pichincha / Guayas'),
    ('CO', 8, 92, 18500000.00, 'Bogotá D.C. / Antioquia'),
    ('AR', 6, 64, 4200000.00, 'Buenos Aires / Córdoba'),
    ('PE', 5, 53, 14200.00, 'Lima / Arequipa'),
    ('MX', 10, 115, 210000.00, 'CDMX / Jalisco / Nuevo León'),
    ('CL', 4, 38, 9800000.00, 'Metropolitana de Santiago')
ON CONFLICT (country_code) DO NOTHING;

-- 6. ÍNDICES DE ALTO RENDIMIENTO PARA CONSULTAS GEOESPACIALES
CREATE INDEX IF NOT EXISTS idx_radar_telemetry_country ON public.radar_telemetry_sessions (country_code);
CREATE INDEX IF NOT EXISTS idx_radar_telemetry_online ON public.radar_telemetry_sessions (is_online, last_seen);
CREATE INDEX IF NOT EXISTS idx_radar_telemetry_coords ON public.radar_telemetry_sessions (coordinate_x, coordinate_y);

-- 7. POLÍTICAS DE SEGURIDAD DE FILA (RLS)
ALTER TABLE public.radar_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_telemetry_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_country_metrics ENABLE ROW LEVEL SECURITY;

-- Lectura pública para visualización del mapa y telemetría activa
DROP POLICY IF EXISTS "Public can view radar countries" ON public.radar_countries;
CREATE POLICY "Public can view radar countries" ON public.radar_countries
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view radar telemetry" ON public.radar_telemetry_sessions;
CREATE POLICY "Public can view radar telemetry" ON public.radar_telemetry_sessions
    FOR SELECT USING (is_online = true);

DROP POLICY IF EXISTS "Public can view radar metrics" ON public.radar_country_metrics;
CREATE POLICY "Public can view radar metrics" ON public.radar_country_metrics
    FOR SELECT USING (true);

-- Inserción y actualización de telemetría de sesión (clientes y anónimos)
DROP POLICY IF EXISTS "Clients can upsert their radar telemetry" ON public.radar_telemetry_sessions;
CREATE POLICY "Clients can upsert their radar telemetry" ON public.radar_telemetry_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Control exclusivo de administradores para países y métricas
DROP POLICY IF EXISTS "Admins can manage radar countries" ON public.radar_countries;
CREATE POLICY "Admins can manage radar countries" ON public.radar_countries
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.admin_invitations WHERE is_active = true
            UNION
            SELECT email FROM public.user_profiles WHERE role = 'admin'
        )
    );

-- 8. HABILITAR SUPABASE REALTIME PARA TELEMETRÍA EN VIVO
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'radar_telemetry_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.radar_telemetry_sessions;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'radar_countries'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.radar_countries;
    END IF;
END $$;
