# INVENTARIO MAESTRO DE DATOS Y PERSISTENCIA
**Proyecto:** Lumina Home  
**Fecha:** 23 de Octubre de 2026  
**Motor de Persistencia:** Supabase / PostgreSQL  
**Clasificación de Sensibilidad:** Público, Interno, Confidencial, Restringido  

---

## 1. DOMINIOS FUNCIONALES Y CLASIFICACIÓN DE DATOS

### Dominio 1: Catálogo y Escaparate (Público)
| Entidad | Tabla | Propósito | Sensibilidad | Persistencia | Fuente de Verdad |
|---|---|---|---|---|---|
| Categorías | `public.categories` | Agrupación editorial de productos | Público | Permanente | PostgreSQL |
| Distintivos | `public.store_badges` | Etiquetas promocionales ("Nuevo", "Autor") | Público | Permanente | PostgreSQL |
| Confianza | `public.store_trust_badges` | Sellos de garantía, envío y seguridad | Público | Permanente | PostgreSQL |
| Nichos Nav | `public.header_niche_slots` | Pestañas dinámicas del Header interactivo | Público | Permanente | PostgreSQL |
| Productos | `public.products` | Catálogo maestro de piezas de autor | Público | Permanente | PostgreSQL |

### Dominio 2: Identidad, Perfiles y Preferencias (Confidencial)
| Entidad | Tabla | Propósito | Sensibilidad | Persistencia | Fuente de Verdad |
|---|---|---|---|---|---|
| Autenticación | `auth.users` | Credenciales, hashes Argon2/Bcrypt, OAuth | Restringido | Permanente | Supabase Auth |
| Perfiles | `public.user_profiles` | Nombre visible, teléfono, rol | Confidencial | Permanente | PostgreSQL |
| Avatares | `public.user_avatar_settings` | Estilos Blobatar, colores de semilla | Confidencial | Permanente | PostgreSQL |
| Preferencias | `public.user_settings` | Tema visual (light, dark, auto) | Interno | Permanente | PostgreSQL |
| Favoritos | `public.favorites` | Lista de deseos de piezas exclusivas | Confidencial | Permanente | PostgreSQL |

### Dominio 3: Logística y Pagos B2C (Restringido / Confidencial)
| Entidad | Tabla | Propósito | Sensibilidad | Persistencia | Fuente de Verdad |
|---|---|---|---|---|---|
| Direcciones | `public.addresses` | Ubicaciones normalizadas con coordenadas GPS | Confidencial | Permanente | PostgreSQL |
| Tarjetas | `public.payment_cards` | Métodos de pago registrados (Últimos 4 dígitos) | Restringido | Permanente | PostgreSQL |
| Carritos | `public.user_carts` | Bolsa de compra sincronizada en la nube | Confidencial | Sesión/Nube | PostgreSQL |

### Dominio 4: Transacciones Comerciales y Cupones (Confidencial / Financiero)
| Entidad | Tabla | Propósito | Sensibilidad | Persistencia | Fuente de Verdad |
|---|---|---|---|---|---|
| Cupones | `public.coupons` | Códigos de descuento con reglas de uso | Interno | Permanente | PostgreSQL |
| Canjes | `public.coupon_redemptions` | Auditoría de cupones redimidos por orden | Confidencial | Permanente | PostgreSQL |
| Órdenes | `public.orders` | Transacciones comerciales y envíos | Confidencial | Permanente | PostgreSQL |
| Notificaciones | `public.order_email_notifications` | Trazabilidad de correos transaccionales | Confidencial | Permanente | PostgreSQL |

### Dominio 5: Fidelización y Pases Móviles (Confidencial)
| Entidad | Tabla | Propósito | Sensibilidad | Persistencia | Fuente de Verdad |
|---|---|---|---|---|---|
| Programa | `public.loyalty_program_settings` | Reglas de puntos y niveles (Silver/Gold/Black) | Interno | Permanente | PostgreSQL |
| Miembros | `public.loyalty_members` | Saldo de puntos y total acumulado | Confidencial | Permanente | PostgreSQL |
| Libro Mayor | `public.loyalty_point_ledger` | Registro contable inmutable de puntos | Confidencial | Permanente | PostgreSQL |
| Dispositivos | `public.pass_device_registrations` | Tokens APNs / Google Wallet para push | Restringido | Permanente | PostgreSQL |

### Dominio 6: Operaciones Administrativas y Telemetría (Restringido / Interno)
| Entidad | Tabla | Propósito | Sensibilidad | Persistencia | Fuente de Verdad |
|---|---|---|---|---|---|
| Invitaciones | `public.admin_invitations` | Tokens de invitación para administradores | Restringido | Temporal/Auditoría | PostgreSQL |
| Destinatarios | `public.admin_dispatch_recipients` | Correos de alerta para bodega y logística | Confidencial | Permanente | PostgreSQL |
| Alertas Stock | `public.admin_notification_settings` | Parámetros de banners de stock y urgencia | Interno | Permanente | PostgreSQL |
| SMTP | `public.admin_smtp_settings` | Credenciales de envío de correo saliente | Restringido | Permanente | PostgreSQL |
| Pasarelas | `public.admin_payment_settings` | Parámetros PayPhone, Stripe, transferencias | Restringido | Permanente | PostgreSQL |
| Telemetría | `public.radar_telemetry_sessions` | Coordenadas y sesiones anónimas en mapa | Interno | Efímero (TTL) | PostgreSQL |
| Alertas Bolsa | `public.cart_alert_events` | Eventos de artículos agregados al carrito | Interno | Efímero | PostgreSQL |
| Google Drive | `public.admin_google_drive_settings` | Vinculación y carpetas del banco fotográfico | Restringido | Permanente | PostgreSQL |
| Galería | `public.admin_media_assets` | Metadatos y CDN de piezas fotográficas | Interno | Permanente | PostgreSQL |
