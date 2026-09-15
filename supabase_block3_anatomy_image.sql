-- ============================================================================
-- MIGRACIÓN DEDICADA: IMAGEN EXCLUSIVA PARA BLOQUE 3 (ANATOMÍA TÉCNICA)
-- ============================================================================
-- Agrega el campo dedicado landing_anatomy_image a la tabla public.products
-- para albergar la fotografía en despiece (/explodedview) empleada en la
-- sección de anatomía técnica con pines interactivos, sin mezclar datos
-- con la imagen principal ni con el carrusel de fotografías.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS landing_anatomy_image text;

-- Comentario descriptivo en el catálogo del sistema
COMMENT ON COLUMN public.products.landing_anatomy_image IS 'URL directa de la fotografía en despiece (/explodedview) empleada exclusivamente en el Bloque 3 de Anatomía Técnica y posicionamiento de pines interactivos.';
