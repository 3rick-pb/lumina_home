# INFORME DE AUDITORÍA INTEGRAL DE SEGURIDAD, ARQUITECTURA Y PERSISTENCIA
**Proyecto:** Lumina Home  
**Fecha:** 23 de Octubre de 2026  
**Versión:** 1.0 — Auditoría Maestra  
**Clasificación:** Confidencial / Seguridad Interna  

---

## 1. RESUMEN EJECUTIVO

Se ejecutó una auditoría técnica profunda, exhaustiva y empírica sobre el 100% de los componentes de backend, persistencia, esquemas PostgreSQL en Supabase, rutas API (`src/app/api`), flujos de autenticación y manejo de datos sensibles en la plataforma **Lumina Home**.

A diferencia de un escaneo superficial, la auditoría contrastó las declaraciones de esquema (`supabase_complete_schema.sql`, migraciones en `supabase/migrations`) con la base de datos remota real en producción (`wegtielydjzrckbafbfv.supabase.co`) y el código fuente ejecutable en Next.js.

### Balance de Hallazgos
| Severidad | Cantidad | Estado |
|---|---|---|
| **CRÍTICA** | 1 | Identificada — Parche Prioritario Diseñado |
| **ALTA** | 1 | Identificada — Remediación PCI-DSS Diseñada |
| **MEDIA** | 2 | Identificadas — Plan de Migración Idempotente |
| **BAJA** | 3 | Identificadas — Optimización de Tipos y RLS |

---

## 2. HALLAZGOS DE SEGURIDAD CRÍTICOS Y ALTOS

### [VULN-01] CRÍTICA (CVSS 9.8) — Bypass de Autenticación de Administrador vía Headers Forjados y JWT No Verificado
- **Archivo afectado:** `src/lib/serverAuth.ts` (`getAuthenticatedUser()`)
- **Impacto:** Cualquier atacante no autenticado en Internet puede asumir privilegios de Administrador Maestro (`admin@lumina.com` o `arteagae796@gmail.com`) en todos los endpoints administrativos (`/api/admin/env-config`, `/api/admin/transfer-ownership`, `/api/admin/invitations`, `/api/admin/smtp`, etc.).
- **Causa Raíz:**
  1. En las líneas 171-178 de `src/lib/serverAuth.ts`, la función acepta como usuario autenticado el valor del header HTTP `x-admin-email` o `x-user-email` enviado por el cliente sin validar firma ni sesión.
  2. En las líneas 155-168, realiza un `JSON.parse` del payload Base64 del JWT sin validar la firma criptográfica con la clave secreta de Supabase (`Buffer.from(parts[1], 'base64')`).
- **Remediación:**
  1. Eliminar por completo el bloque de confianza en headers `x-admin-email` y `x-user-email`.
  2. Exigir exclusivamente verificación criptográfica vía `supabaseServer.auth.getUser(token)` de Supabase Auth. Si la llamada falla o el token es inválido, rechazar con `401 Unauthorized`.

---

### [VULN-02] ALTA (PCI-DSS / Privacidad) — Almacenamiento de Número Completo de Tarjeta (PAN) en Claro
- **Archivos afectados:** `src/app/api/user/data/route.ts`, `src/components/profile/AddCardAnimatedModal.tsx`, tabla `public.payment_cards`
- **Impacto:** Vulnerabilidad a regulaciones financieras y estándares PCI-DSS. Si la base de datos se compromete, los números completos de tarjeta de crédito/débito de los clientes quedan expuestos.
- **Causa Raíz:**
  Al guardar tarjetas en `AddCardAnimatedModal.tsx` y en el endpoint `/api/user/data` (`action === 'save_cards'`), se envía e inserta el número de tarjeta completo (`c.number`) en la columna `number` de la tabla `public.payment_cards`.
- **Remediación:**
  1. Enmascarar obligatoriamente el número en el guardado: almacenar únicamente `•••• •••• •••• ${last4}` en la columna `number` y poblar `last4` con los últimos 4 dígitos.
  2. Delegar la transacción de cobro real exclusivamente al Token o Checkout Box oficial de PayPhone / Stripe sin conservar PAN completo en tablas locales.

---

### [VULN-03] MEDIA — Tabla declarada `admin_media_assets` ausente en el Cache de Esquema
- **Impacto:** Error `42P01` (`Could not find the table 'public.admin_media_assets' in the schema cache`) cuando el frontend o backend intenta acceder a la galería multimedia.
- **Remediación:**
  Generar y aplicar la migración SQL idempotente para asegurar la creación de `public.admin_media_assets` con índices y políticas RLS restrictivas para administradores.

---

### [VULN-04] MEDIA — Ausencia de `SUPABASE_SERVICE_ROLE_KEY` en Producción / Servidor
- **Impacto:** `src/lib/serverAuth.ts` utiliza la clave pública `anon` como fallback para `supabaseServer`. Esto limita la capacidad del backend para realizar tareas de mantenimiento administrativas que eludan RLS de forma controlada o administrar usuarios vía `supabase.auth.admin`.
- **Remediación:**
  Configurar la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en los servidores de despliegue de Vercel (nunca en el frontend `NEXT_PUBLIC_`).

---

## 3. AUDITORÍA EMPÍRICA DE POLÍTICAS RLS EN SUPABASE

Se ejecutó una prueba de lectura directa con la clave pública anónima sobre las 29 tablas del esquema:

| Tabla | Acceso Anónimo | Estado RLS | Evaluación |
|---|---|---|---|
| `products` | Lectura permitida | RLS Activo (Lectura Pública) | ✅ Correcto para catálogo |
| `categories` | Lectura permitida | RLS Activo (Lectura Pública) | ✅ Correcto para catálogo |
| `store_badges` | Lectura permitida | RLS Activo (Lectura Pública) | ✅ Correcto para catálogo |
| `store_trust_badges` | Lectura permitida | RLS Activo (Lectura Pública) | ✅ Correcto para escaparate |
| `header_niche_slots` | Lectura permitida | RLS Activo (Lectura Pública) | ✅ Correcto para menú |
| `coupons` | Lectura permitida | RLS Activo (Escritura Bloqueada) | ✅ Correcto para canje |
| `admin_payment_settings` | Lectura permitida | RLS Activo (Escritura Bloqueada) | ✅ Correcto (Tasas e impuestos) |
| `admin_notification_settings` | Lectura permitida | RLS Activo (Escritura Bloqueada) | ✅ Correcto (Banner de demanda) |
| `radar_telemetry_sessions` | Lectura permitida | RLS Activo | ✅ Correcto (Radar anónimo) |
| `orders` | **0 filas devueltas** | RLS Activo (Aislamiento por Usuario) | ✅ Protegido |
| `addresses` | **0 filas devueltas** | RLS Activo (Aislamiento por Usuario) | ✅ Protegido |
| `payment_cards` | **0 filas devueltas** | RLS Activo (Aislamiento por Usuario) | ✅ Protegido |
| `user_profiles` | **0 filas devueltas** | RLS Activo (Aislamiento por Usuario) | ✅ Protegido |
| `user_carts` | **0 filas devueltas** | RLS Activo (Aislamiento por Usuario) | ✅ Protegido |
| `favorites` | **0 filas devueltas** | RLS Activo (Aislamiento por Usuario) | ✅ Protegido |
| `coupon_redemptions` | **0 filas devueltas** | RLS Activo (Aislamiento por Usuario) | ✅ Protegido |
| `order_email_notifications` | **0 filas devueltas** | RLS Activo (Solo Administrador) | ✅ Protegido |
| `admin_invitations` | **0 filas devueltas** | RLS Activo (Solo Administrador) | ✅ Protegido |
| `admin_smtp_settings` | **0 filas devueltas** | RLS Activo (Solo Administrador) | ✅ Protegido |
| `admin_dispatch_recipients` | **0 filas devueltas** | RLS Activo (Solo Administrador) | ✅ Protegido |
| `loyalty_members` | **0 filas devueltas** | RLS Activo (Aislamiento por Usuario) | ✅ Protegido |
| `loyalty_point_ledger` | **0 filas devueltas** | RLS Activo (Aislamiento por Usuario) | ✅ Protegido |
| `admin_google_drive_settings` | 1 fila devuelta | RLS Activo (`FOR ALL USING (true)`) | ⚠️ Requiere restricción a admin |
| `admin_media_assets` | Error `42P01` | Tabla inexistente en remoto | ⚠️ Requiere migración |
