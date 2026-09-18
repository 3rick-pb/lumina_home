# 🛠️ E-Commerce Brand Generator — Manual de la CLI

El **Brand Generator** es la herramienta oficial de automatización para crear, validar, previsualizar, activar y diagnosticar marcas dentro del E-Commerce Core Engine.

---

## 🚀 Resumen de Comandos

```powershell
# 1. Crear nueva marca (Modo manual o con IA)
.\brand.ps1 create "Aura Studio"
.\brand.ps1 create "Aura Studio" -DryRun
.\brand.ps1 create "Aura Studio" -Analysis ".\data\examples\aura-studio-analysis.json"

# 2. Validar estructura, contratos TypeScript y assets
.\brand.ps1 validate "aura-studio"

# 3. Previsualizar la ficha técnica y readiness
.\brand.ps1 preview "aura-studio"

# 4. Activar la marca en el Core (con auto-rollback de seguridad)
.\brand.ps1 activate "aura-studio"

# 5. Listar todas las marcas registradas
.\brand.ps1 list

# 6. Ver información detallada
.\brand.ps1 info "aura-studio"

# 7. Clonar inteligentemente una marca existente
.\brand.ps1 clone "lumina" "Volta Tech"

# 8. Restaurar la marca activa anterior
.\brand.ps1 rollback

# 9. Diagnosticar acoplamiento y cobertura de tokens
.\brand.ps1 doctor
```

---

## 📖 Explicación Detallada de Comandos

### 1. `create` — Generar una nueva marca
Crea el **Brand Package** completo en `src/config/brands/<slug>/`:
- `brand.ts`: Identidad, logo tipográfico, contacto y metadatos SEO.
- `theme.ts`: Paleta generada algorítmicamente (tonos 50 a 900), tipografía y variantes de UI.
- `store.ts`: Reglas de moneda, impuestos, políticas de envío y feature flags.
- `manifest.json`: Estado del ciclo de vida (`DRAFT`), checklist de assets y origen.
- `README.md`: Guía de personalización propia de la marca.
- `assets/`: Carpeta para alojar logos, favicons e imágenes OpenGraph.

**Opciones:**
- `-Slug <slug>`: Fuerza un identificador específico (ej. `aura-moda`).
- `-Analysis <archivo.json>`: Ingiere un análisis generado por IA con paleta y variantes.
- `-DryRun`: Muestra la simulación de creación sin escribir ningún archivo en disco.
- `-Rebuild`: Permite sobrescribir conscientemente una marca existente en borrador.

> 🔒 **Seguridad**: El comando valida el slug contra *Path Traversal* y bloquea cualquier intento de sobrescribir la marca protegida `lumina`.

---

### 2. `validate` — Verificación exhaustiva de contratos
Inspecciona:
- Existencia de los 3 archivos de configuración (`brand.ts`, `theme.ts`, `store.ts`).
- Validez sintáctica y exportación de contratos `BrandConfig`, `ThemeConfig`, `StoreConfig`.
- Detección de emails placeholder o datos incompletos.
- Presencia de la carpeta de assets y estado de logotipos.
- Actualiza el estado en `manifest.json` a `READY` si todo está completo, o `VALIDATED` si hay advertencias menores.

---

### 3. `preview` — Resumen ejecutivo y visual
Muestra una ficha técnica en consola con:
- Estado del ciclo de vida (`DRAFT`, `VALIDATED`, `READY`, `ACTIVE`).
- Existencia de cada archivo de configuración.
- Colores principales y variantes recomendadas.
- Lista de pendientes o advertencias de validación.

---

### 4. `activate` — Activación atómica con Auto-Rollback
Activa la marca seleccionada como la **única fuente de verdad** del proyecto:
1. Valida que la marca no tenga errores críticos.
2. Guarda un respaldo del estado actual en `.brand-state/previous-brand.json`.
3. Actualiza atómicamente `src/config/active-brand.ts`.
4. Ejecuta `npx tsc --noEmit` para verificar que la compilación de tipos sea 100% exitosa.
5. **Si TypeScript detecta algún error**: Cancela la operación y **restaura automáticamente** la marca anterior en milisegundos.
6. Si la compilación es exitosa, actualiza los manifiestos (`status: "ACTIVE"`).

---

### 5. `rollback` — Restauración manual de contingencia
Si activaste una marca y deseas regresar de inmediato a la marca previa:
```powershell
.\brand.ps1 rollback
```
Restaura `active-brand.ts` al estado previo registrado y valida la compilación.

---

### 6. `clone` — Clonación inteligente
Clona la estructura de una marca existente hacia una nueva marca, realizando un reemplazo inteligente:
- Actualiza identificadores, nombres de clases y constantes exportadas.
- Reemplaza correos, teléfonos y datos de contacto con placeholders limpios.
- Deja `manifest.json` con origen `clone` y estado `DRAFT`.
- No copia secretos ni credenciales privadas.

---

### 7. `doctor` — Escáner de salud del Core
Audita todo el directorio `src/` en busca de:
- Nombres de marca hardcodeados ("Lumina", "Lumina Home").
- Colores hexadecimales fijos (`#8c9276`, `#526437`, etc.).
- Clasifica cada hallazgo en:
  - **`SAFE`**: Declaraciones legítimas en la marca de referencia o tipos.
  - **`CONFIGURABLE`**: Colores que pueden usar variables semánticas.
  - **`POTENTIALLY_HARDCODED`**: Cadenas en vistas que deben usar `brand.*`.
  - **`INTENTIONAL`**: Emblemas vectoriales o fallbacks de infraestructura.
- Reporta el porcentaje de cobertura de tokens (ej. **96%**).

---

## 🔒 Regla Inviolable: Protección de Lumina Home

La marca `lumina` (`src/config/brands/lumina/`) es el **modelo de referencia canónico**:
- El comando `create` no permite llamarse `lumina`.
- Las pruebas de regresión verifican constantemente que Lumina conserve 0 errores y 0 variaciones visuales.
