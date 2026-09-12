# 🇪🇨 Guía Oficial de Conexión: Pasarela PayPhone Ecuador en Lumina Home

Esta guía detalla los pasos exactos para conectar tu cuenta comercial de **PayPhone** una vez que el **SRI emita tu RUC en Ecuador**.

La arquitectura técnica en el código **ya está completamente lista y asegurada con defensas de ciberseguridad**. No necesitas reprogramar nada; solo seguir estos 4 pasos de configuración.

---

## Paso 1: Registrarse en el Portal de Desarrollador de PayPhone

1. Ingresa a [PayPhone Developer Ecuador](https://developer.payphonetodoesposible.com) o a la plataforma comercial [PayPhone Live](https://live.payphone.app).
2. Regístrate o inicia sesión con los datos de tu empresa o negocio personal.
3. Ingresa tu **RUC de Ecuador** (los 13 dígitos emitidos por el SRI) y valida los datos de tu cuenta bancaria ecuatoriana para la liquidación de fondos (Banco Pichincha, Guayaquil, Pacífico, Produbanco, etc.).

---

## Paso 2: Crear la Aplicación y Obtener las Credenciales

1. En el panel de **PayPhone Developer**, dirígete a la sección **"Aplicaciones"** (o *"Mis Apps"*).
2. Haz clic en **"Crear Aplicación"**:
   * **Nombre de la App:** `Lumina Home Store`
   * **URL de Respuesta (Callback):** `https://tudominio.com/checkout/payphone/callback`
   * **URL de Cancelación:** `https://tudominio.com/checkout/payphone/cancel`
3. Al crear la app, PayPhone te entregará dos datos fundamentales:
   * **`App ID`**: Un identificador público (ejemplo: `a1b2c3d4-e5f6-7890-...`).
   * **`Token de Comercio (Bearer Token)`**: Tu clave secreta para procesar cobros y verificar pagos con el banco.

---

## Paso 3: Configurar las Variables en Vercel (o en tu Hosting)

En tu panel de **Vercel** (en `Settings -> Environment Variables`), agrega las siguientes 3 variables:

| Variable | Valor | Descripción |
| :--- | :--- | :--- |
| `PAYPHONE_TOKEN` | `tu_token_secreto_aqui` | **¡Crítica!** Tu Bearer Token secreto de comercio. Nunca usar prefijo `NEXT_PUBLIC_`. |
| `PAYPHONE_APP_ID` | `tu_app_id_aqui` | El ID de tu aplicación en PayPhone. |
| `NEXT_PUBLIC_PAYPHONE_APP_ID` | `tu_app_id_aqui` | Permite identificar la tienda ante el botón PayPhone. |
| `PAYPHONE_ENV` | `production` | Establece `production` para cobros reales o `sandbox` para pruebas previas. |
| `NEXT_PUBLIC_APP_URL` | `https://tudominio.com` | Tu dominio oficial en producción para las redirecciones seguras. |

*(Para pruebas en tu computadora local, simplemente copia estas mismas líneas dentro de tu archivo `.env.local`).*

---

## Paso 4: ¡Listo! Activación Automática

1. Guarda las variables y haz un **Redeploy** en Vercel (o reinicia tu servidor local con `npm run dev`).
2. El sistema detectará automáticamente la presencia de `PAYPHONE_TOKEN`:
   * Desactivará el modo simulación.
   * Conectará en vivo con los servidores seguros de PayPhone (`https://pay.payphonetodoesposible.com/api`).
   * Todos los pagos realizados con Visa, Mastercard, Diners Club, Discover, American Express, Alia o desde la App de PayPhone se procesarán y acreditarán directamente a tu cuenta bancaria en Ecuador.
   * Supabase registrará cada pedido en estado `Procesando` y despachará la factura digital al cliente de manera automática.

---

## 🛡️ Medidas de Ciberseguridad Integradas en la Arquitectura

1. **Recálculo de Precios Zero-Trust:** El servidor jamás confía en los precios enviados por el navegador; recalcula subtotal, IVA y envío desde Supabase antes de generar la sesión en PayPhone.
2. **Amount Matching Anti-Fraude:** En la confirmación, el servidor valida que el dinero cobrado por PayPhone sea idéntico al valor de la orden.
3. **Anti-Replay & Idempotencia:** Se bloquea la reutilización de identificadores de transacción.
4. **Validación de Cédula y RUC:** Algoritmo oficial ecuatoriano Módulo 10 y Módulo 11 para comprobantes legítimos del SRI.
