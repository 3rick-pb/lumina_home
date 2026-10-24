# MODELO DE AMENAZAS Y GESTIÓN DE RIESGOS (STRIDE / OWASP)
**Proyecto:** Lumina Home  
**Metodología:** STRIDE + OWASP Top 10 API Security  
**Fecha:** 23 de Octubre de 2026  

---

## 1. VECTORES DE AMENAZA Y MITIGACIONES

| Vector de Amenaza (STRIDE) | Riesgo en Lumina Home | Control Implementado | Estado |
|---|---|---|---|
| **Spoofing (Suplantación)** | Falsificación de identidad de Administrador mediante headers HTTP o tokens arbitrarios en `serverAuth.ts`. | Verificación estricta de sesión mediante `supabaseServer.auth.getUser(token)`. Se eliminó la confianza en headers de cliente. | ✅ Mitigado |
| **Tampering (Manipulación)** | Alteración de cupones, descuentos o precios de catálogo directamente desde la API pública. | RLS en PostgreSQL con políticas `SELECT` públicas pero `INSERT`/`UPDATE`/`DELETE` restringidas a `service_role` o administradores. | ✅ Mitigado |
| **Repudiation (Repudio)** | Negación de órdenes, canjes de cupones o modificaciones de stock. | Tablas de auditoría dedicadas e inmutables: `coupon_redemptions`, `order_email_notifications`, `loyalty_point_ledger`. | ✅ Mitigado |
| **Information Disclosure (Exposición)** | Filtración de datos de contacto de clientes, direcciones de envío o números de tarjeta bancaria. | RLS obligatorio en `addresses`, `payment_cards`, `orders` (filtro por `auth.uid() = user_id`). Enmascaramiento de tarjeta a `last4`. | ✅ Mitigado |
| **Denial of Service (DoS)** | Saturación de pools de conexiones de base de datos o abuso de telemetría radar. | Connection pooling en `serverAuth.ts` con TTL de 2 minutos y expiración automática de clientes de corta duración. | ✅ Mitigado |
| **Elevation of Privilege** | Escalada de cliente a administrador mediante modificación de campo editable. | Separación entre `user_profiles` y tabla dedicada `admin_invitations` / `active_sessions`. Verificación en backend de rol maestro. | ✅ Mitigado |

---

## 2. MATRIZ DE AISLAMIENTO POR ROL Y RECURSO (RLS)

- **Público / Anon:** Puede leer `products`, `categories`, `store_badges`, `store_trust_badges`, `header_niche_slots`, `coupons` activos.
- **Usuario Autenticado (Cliente):** Puede leer y escribir únicamente sus propios registros en `user_profiles`, `addresses`, `payment_cards`, `user_carts`, `favorites`, `orders`, `loyalty_members`.
- **Administrador:** Acceso a métricas consolidadas, gestión de catálogo, estados de órdenes, invitaciones y parámetros operativos de pasarela.
