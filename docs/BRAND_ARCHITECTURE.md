# 🏛️ E-Commerce Core — Arquitectura de Marcas & Sistemas de Diseño

Este documento establece los principios de diseño y la separación de responsabilidades que permiten que este proyecto funcione como un **Motor Reutilizable para Múltiples Marcas**.

---

## 1. La Separación Fundamental: Engine vs Config vs Data

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          E-COMMERCE CORE ENGINE                         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    1. ENGINE (CÓMO FUNCIONA)                      │  │
│  │  Autenticación · Carrito · Checkout · Pasarelas · Notificaciones  │  │
│  │  Emails · SEO Dinámico · Dropi Export · Radar · Audio · Admin     │  │
│  │                   (Código común e inmutable)                      │  │
│  └───────────────────────────────────▲───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐  │
│  │                    2. CONFIG (CÓMO SE IDENTIFICA)                 │  │
│  │  • BrandConfig: ¿Quién es? (Nombre, logo, contacto, meta)         │  │
│  │  • ThemeConfig: ¿Cómo se ve? (Colores, fuentes, variantes UI)     │  │
│  │  • StoreConfig: ¿Cómo opera? (Moneda, envíos, impuestos, flags)   │  │
│  │                 (Definiciones por marca en TypeScript)            │  │
│  └───────────────────────────────────▲───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐  │
│  │                      3. DATA (QUÉ CONTIENE)                       │  │
│  │  Productos · Categorías · Variantes · Inventario · Pedidos · Docs │  │
│  │         (Persistido en Base de Datos Supabase / CSV / JSON)       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Reglas de Oro:
1. **Un producto NO es configuración**: Los productos pertenecen a la Base de Datos (`DATA`).
2. **Un color institucional NO es estilo hardcodeado**: Pertenece al `ThemeConfig` de la marca activa.
3. **El nombre de la tienda NO es un string en el layout**: Se consume dinámicamente mediante `useBrand()`.
4. **Las credenciales privadas NO son configuración**: Se configuran exclusivamente en variables de entorno (`.env.local`).

---

## 2. Arquitectura de Single Source of Truth

Antes de esta arquitectura, cambiar de marca requería editar manualmente tres archivos:
`brand.config.ts`, `theme.config.ts`, y `store.config.ts`.

Hoy, el sistema utiliza un **Punto Único Atómico**:

```
                 src/config/active-brand.ts
               [SINGLE SOURCE OF TRUTH (SSOT)]
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
brand.config.ts       theme.config.ts       store.config.ts
   (Fachada)             (Fachada)             (Fachada)
       │                     │                     │
       ▼                     ▼                     ▼
   useBrand()         useThemeConfig()      useStoreConfig()
  Layout / Meta      Design Tokens / CSS     Cart / Shipping
```

### Beneficios:
- **Cero desincronización**: Es imposible que `brand.config` apunte a una marca mientras `theme.config` apunta a otra.
- **100% de compatibilidad hacia atrás**: Todo el código existente que importa `@/config`, `@/config/brand.config`, etc., continúa funcionando sin una sola modificación.
- **Activación atómica**: La herramienta `brand.ps1 activate <slug>` reescribe únicamente `active-brand.ts` y valida TypeScript antes de confirmar.

---

## 3. Estados del Ciclo de Vida de una Marca

Cada marca tiene un manifiesto `manifest.json` que registra su ciclo de vida:

| Estado | Significado | Acciones Permitidas |
|:---|:---|:---|
| **`DRAFT`** | Marca recién creada; contiene placeholders o campos pendientes. | Modificar configuración, subir assets. |
| **`INCOMPLETE`** | Faltan archivos requeridos o presenta errores de sintaxis. | Corregir errores señalados por `validate`. |
| **`VALIDATED`** | Pasa las validaciones estructurales pero tiene advertencias menores. | Preparar para producción, previsualizar. |
| **`READY`** | Validación 100% limpia sin errores ni advertencias. | Lista para activación en producción. |
| **`ACTIVE`** | Es la marca que actualmente gobierna el motor. | En ejecución viva en la tienda. |
| **`ARCHIVED`** | Marca descontinuada o de prueba. | Almacenada sin interferir en el Core. |

---

## 4. Inyección Dinámica de Design Tokens

Para garantizar que Lumina Home mantenga **0 regresión visual** y al mismo tiempo permitir que nuevas marcas alteren la estética por completo:

1. `src/app/layout.tsx` inyecta variables CSS en el `<body>`:
   - `--brand-primary`: Color primario por defecto.
   - `--brand-accent`: Color de acento para CTAs y botones.
   - `--brand-signature`: Tono insignia para sparkles, insignias y detalles.
   - `--hero-gold`: Acento display para títulos destacados.
   - `--bg-light` / `--bg-dark`: Superficies de fondo.

2. `tailwind.config.ts` extiende la paleta semántica:
   ```typescript
   brandAccent: "var(--brand-signature, #8c9276)",
   heroGold: "var(--hero-gold, #d2b48c)",
   ```

Si la marca activa es **Lumina Home**, las variables CSS se resuelven con exactitud milimétrica a los valores originales. Si se activa **Aura Studio**, los colores de Aura se propagan automáticamente a toda la interfaz.
