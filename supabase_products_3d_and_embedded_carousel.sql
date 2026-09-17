-- ============================================================================
-- MIGRACIÓN DE ARQUITECTURA: COLUMNAS DEDICADAS PARA GALERÍA 3D Y CARRUSEL EMBEBIDO
-- ============================================================================
-- Como ingeniero y arquitecto de base de datos con visión de largo plazo:
-- Se incorporan columnas de primer nivel a public.products sin reutilizar ni sobrecargar
-- tablas secundarias, garantizando integridad referencial, tipado estricto y valores
-- por defecto seguros para los productos existentes.

-- 1. Galería Isométrica 3D
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS gallery_style TEXT DEFAULT 'traditional';

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS gallery_autoplay BOOLEAN DEFAULT true;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS gallery_autoplay_speed NUMERIC DEFAULT 4.0;

-- 2. Carrusel Cilíndrico 3D Embebido (Inspiración Video Enveding)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS embedded_carousel JSONB DEFAULT NULL;

-- 3. Documentación formal en el catálogo del sistema PostgreSQL
COMMENT ON COLUMN public.products.gallery_style IS 'Estilo de visualización de galería: traditional o isometric_3d';
COMMENT ON COLUMN public.products.gallery_autoplay IS 'Determina si la galería 3D tiene desplazamiento automático activado';
COMMENT ON COLUMN public.products.gallery_autoplay_speed IS 'Velocidad de transición en segundos para el desplazamiento de la galería 3D';
COMMENT ON COLUMN public.products.embedded_carousel IS 'Configuración del carrusel embebido cilíndrico 3D (enabled, title, subtitle, autoplaySpeed, slides)';

-- 4. Notificar a PostgREST para recarga inmediata de la caché del esquema
NOTIFY pgrst, 'reload schema';
