# Guía de Arquitectura y Configuración: Apple Wallet & Google Wallet para Lúmina Home

Esta guía describe detalladamente la arquitectura, configuración en producción y ciclo de vida del sistema de **Pases de Seguimiento de Pedidos (Order Tracking Pass)** para **Apple Wallet** y **Google Wallet** implementado en Lúmina Home.

---

## 1. Arquitectura del Sistema

```
                      +-----------------------------+
                      |   Lúmina Home Admin Panel   |
                      |   (Cambio de estado pedido) |
                      +--------------+--------------+
                                     |
                                     v
                       +-------------+-------------+
                       |    Supabase Database      |
                       | (Única fuente de verdad)  |
                       +-------------+-------------+
                                     |
                                     v
                       +-------------+-------------+
                       |     walletSyncService     |
                       |  (Orquestador resiliente) |
                       +------+---------------+----+
                              |               |
              +---------------+               +---------------+
              |                                               |
              v                                               v
   +----------------------+                       +----------------------+
   |    Google Wallet     |                       |     Apple Wallet     |
   | REST API (OAuth2)    |                       | PassKit Web Service  |
   | PATCH genericObject  |                       | + APNs Push Notif.   |
   +----------------------+                       +----------------------+
```

### Reglas de Negocio y Ciclo de Vida del Pedido

El pase representa un **pedido específico del cliente** (ej: `LH-84921`). Cuenta con 3 estados estrictos:

| Estado en BD | Mensaje en el Pase | Elementos Mostrados |
| :--- | :--- | :--- |
| **`Procesando`** | *"Tu pedido está siendo preparado. El enlace de seguimiento aparecerá aquí en cuanto el paquete sea entregado al operador logístico."* | Código de pedido, importe total, titular y fecha. **Nunca muestra botones de guía o URLs rotas/ficticias.** |
| **`Enviado`** | *"Tu pedido está en camino. Puedes rastrear los movimientos de tu paquete con la guía indicada."* | Nombre de la transportadora (ej: Servientrega), código de guía de rastreo y botón interactivo hacia el enlace oficial de la transportadora. |
| **`Entregado`** | *"Tu pedido ha sido entregado correctamente. Gracias por confiar en Lúmina Home."* | Confirmación de entrega satisfactoria y registro histórico de la guía. |

---

## 2. Seguridad Criptográfica y Código QR Anti-Enumeración

El código QR impreso en el pase físico o digital y los enlaces universales **NO exponen IDs de orden en texto plano ni datos de facturación**:
- **Token Opaque HMAC-SHA256**: Generado mediante `generateOrderTrackingToken(orderId)` utilizando una clave criptográfica de servidor (`WALLET_SECRET_KEY`).
- **Ruta segura**: `https://<dominio>/wallet/order/<SECURE_TOKEN>`
- **Protección contra ataques de enumeración**: Cualquier intento de consultar un pedido sin el token firmado es rechazado por el backend con código HTTP 401/403.
- **Privacidad del cliente**: Las vistas públicas muestran el nombre anonimizado (ej. `Erick A.`) sin direcciones de facturación ni teléfonos.

---

## 3. Configuración de Google Wallet

### Paso 1: Crear cuenta de emisor
1. Ingresa a [Google Pay & Wallet Business Console](https://pay.google.com/business/console).
2. Crea tu cuenta comercial y copia tu **Issuer ID** (Número de emisor, ej: `338800000002239481`).
3. Asígnalo en la variable `GOOGLE_WALLET_ISSUER_ID`.

### Paso 2: Crear Cuenta de Servicio en Google Cloud
1. Entra a [Google Cloud Console](https://console.cloud.google.com).
2. Ve a **IAM y administración** > **Cuentas de servicio** > **Crear cuenta de servicio** (ej: `lumina-wallet@tu-proyecto.iam.gserviceaccount.com`).
3. Ve a la pestaña **Claves** de la cuenta de servicio > **Agregar clave** > **Crear clave nueva (JSON)**.
4. Descarga el archivo JSON.
5. Vuelve a Google Pay & Wallet Console > **Acceso de usuarios**, invita al email de la cuenta de servicio con rol de **Administrador**.

### Paso 3: Variables de entorno en `.env` / Vercel
```env
GOOGLE_WALLET_ISSUER_ID="338800000002239481"
GOOGLE_WALLET_CLIENT_EMAIL="lumina-wallet@tu-proyecto.iam.gserviceaccount.com"
GOOGLE_WALLET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

---

## 4. Configuración de Apple Wallet (.pkpass)

Apple Wallet requiere un paquete ZIP firmado digitalmente mediante firma desasociada **PKCS#7 / CMS** con la cadena de certificación de Apple Developer.

### Paso 1: Registrar Identificador de Pase en Apple Developer
1. Entra a [Apple Developer Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list/passTypeId).
2. Crea un nuevo **Pass Type ID**: `pass.com.luminahome.order`.
3. Anota tu **Team ID** (ej: `AB12CD34EF`).

### Paso 2: Generar Certificado de Firma del Pase
1. En tu Mac, abre **Acceso a Llaveros (Keychain Access)** > **Asistente de Certificados** > **Solicitar un certificado de una entidad de certificación**.
2. Guarda el archivo `.certSigningRequest`.
3. En Apple Developer, bajo tu Pass Type ID, pulsa **Create Certificate** y sube el archivo `.certSigningRequest`.
4. Descarga el certificado generado (`pass.cer`).
5. Descarga también el certificado intermedio [Apple Worldwide Developer Relations G4 / G6](https://www.apple.com/certificateauthority/).

### Paso 3: Exportar Certificados a Formato PEM
Ejecuta en tu terminal:
```bash
# 1. Convertir certificado de pase a PEM
openssl x509 -inform der -in pass.cer -out apple_pass_cert.pem

# 2. Exportar clave privada desde el llavero (archivo .p12)
openssl pkcs12 -in pass_key.p12 -nocerts -out apple_pass_key.pem -nodes

# 3. Convertir certificado intermedio WWDR a PEM
openssl x509 -inform der -in AppleWWDRCAG4.cer -out apple_wwdr_cert.pem
```

### Paso 4: Variables de entorno en `.env` / Vercel
```env
APPLE_TEAM_IDENTIFIER="AB12CD34EF"
APPLE_ORDER_PASS_TYPE_IDENTIFIER="pass.com.luminahome.order"
APPLE_PASS_CERT_PEM="-----BEGIN CERTIFICATE-----\nMIIFwTCCBKmgAwIBAgII...\n-----END CERTIFICATE-----\n"
APPLE_PASS_KEY_PEM="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
APPLE_PASS_KEY_PASSPHRASE=""
APPLE_WWDR_CERT_PEM="-----BEGIN CERTIFICATE-----\nMIIEuzCCA6OgAwIBAgIBAzANBgkqhkiG9w0BAQsFADBiMQswCQYDVQQGEwJVUzET...\n-----END CERTIFICATE-----\n"
```

---

## 5. Endpoints de Apple PassKit Web Service

Lúmina Home implementa la especificación completa del Web Service de Apple PassKit:

1. **`POST /api/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}`**
   - Registra el `pushToken` de un dispositivo Apple para recibir actualizaciones push en tiempo real.
2. **`GET /api/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}?passesUpdatedSince={tag}`**
   - Retorna la lista de números de serie que cambiaron de estado desde la última consulta.
3. **`GET /api/v1/passes/{passTypeIdentifier}/{serialNumber}`**
   - Entrega el archivo binario `.pkpass` actualizado, verificando el encabezado `If-Modified-Since` (304 Not Modified si no hay cambios).
4. **`DELETE /api/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}`**
   - Da de baja un dispositivo cuando el cliente elimina el pase de su Apple Wallet.
5. **`POST /api/v1/log`**
   - Recibe y almacena reportes de diagnóstico emitidos por los dispositivos iOS.

---

## 6. Base de Datos Supabase (Migración Opcional)

Ejecuta la migración ubicada en `supabase/migrations/20260926_order_wallet_tracking.sql` si deseas persistir el registro de auditoría y tokens push de dispositivos:

```sql
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS wallet_sync_status TEXT DEFAULT 'SKIPPED',
  ADD COLUMN IF NOT EXISTS wallet_last_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wallet_sync_error TEXT;

CREATE TABLE IF NOT EXISTS pass_device_registrations (
  device_library_identifier TEXT NOT NULL,
  push_token TEXT NOT NULL,
  pass_type_identifier TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (device_library_identifier, pass_type_identifier, serial_number)
);
```

*Nota: La aplicación cuenta con almacenamiento seguro en memoria (cache fallback), por lo que funciona al 100% incluso si no se ha ejecutado la migración SQL inmediatamente.*
