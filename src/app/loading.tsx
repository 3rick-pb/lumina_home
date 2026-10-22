// Root loading.tsx retorna null intencionalmente.
// Tener un BrandLoadingScreen aquí causa un bug documentado de Next.js App Router (Issue #86151)
// donde la soft-navigation se congela: la URL cambia pero la página no transiciona hasta el segundo click.
// Cada ruta maneja su propio estado de carga:
// - /shop: tiene su propio loading.tsx con skeleton
// - /product/[id]: tiene su propio loading.tsx
// - /profile: AuthGuard maneja la verificación de sesión
// - /: LuminaBootOrchestrator maneja el buffer y la decodificación del hero
export default function Loading() {
  return null;
}
