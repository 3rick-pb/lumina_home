import JSZip from 'jszip';
import crypto from 'crypto';
import { generateOrderTrackingToken, generatePassKitAuthToken, anonymizeCustomerName } from './orderPassTokens';
import { signApplePassManifest } from './applePassSigner';

export interface OrderPassInput {
  orderId: string;
  status: 'Procesando' | 'Enviado' | 'Entregado';
  total: number;
  customerName?: string;
  date?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrierName?: string;
  origin?: string;
}

// 64x64 Solid minimalist luxury dark icon PNG for Apple Wallet
const PASS_ICON_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAEySURBVHja7NaxCUBBDIBh9w94/w2cQCfpCLpCR+gIDg5S3cBB1N3gGvSg98+1hCQQ8gIp5U3b9n1/6z7P59h1XbVl23bV1v2c5/r877vv+/yv+/v5m2fXdXxv531v55j7vJxjv7e/eR6P1+/9eB7P7ft+1/2e5/W6Pvdz+9z39/N4fT/v935ez7/777f9/n8u/u97/N/73z0e55/n7/d/v5/3973fz+/neRz7v7/v+/k87vvn773347z/vvdj7+c455gzzpgzjDHmjDnmDGM8zjnnnDPe+885995rzznr3rPOOeucc84555xzjjHWGGPWOGONNcacc84555xzjjHWGGPWOGONNcacc84555xzjjHWGGPWOGONNcacc84555xzjjHWGGPWOGONNcacc84555xzjDHGGGOMMcacc8559w5g7K7uK8Y8ZwAAAABJRU5ErkJggg==',
  'base64'
);

const PASS_LOGO_PNG = PASS_ICON_PNG;

/**
 * Builds the official pass.json structure for an order tracking pass matching Apple PassKit specification.
 */
export function buildAppleOrderPassJson(data: OrderPassInput): Record<string, unknown> {
  const origin = data.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://luminahome.ec';
  const cleanId = data.orderId.trim();
  const secureToken = generateOrderTrackingToken(cleanId);
  const liveTrackingWebUrl = `${origin}/wallet/order/${secureToken}`;
  const authToken = generatePassKitAuthToken(cleanId);

  const passTypeIdentifier =
    process.env.APPLE_ORDER_PASS_TYPE_IDENTIFIER ||
    process.env.APPLE_PASS_TYPE_IDENTIFIER ||
    'pass.com.luminahome.orders';
  const teamIdentifier = process.env.APPLE_TEAM_IDENTIFIER || 'LUMINAHOME';

  const status = data.status || 'Procesando';
  const isShipped = status === 'Enviado';
  const isDelivered = status === 'Entregado';

  let statusHeader = 'EN PREPARACIÓN';
  let statusDetail =
    'Tu pedido está siendo preparado. El enlace de seguimiento aparecerá aquí en cuanto el paquete sea entregado al operador logístico.';

  if (isShipped) {
    statusHeader = 'EN CAMINO';
    statusDetail =
      'Tu pedido está en camino. Puedes rastrear los movimientos de tu paquete con la guía indicada.';
  } else if (isDelivered) {
    statusHeader = 'PEDIDO ENTREGADO';
    statusDetail =
      'Tu pedido ha sido entregado correctamente. Gracias por confiar en Lúmina Home.';
  }

  const customerDisplay = anonymizeCustomerName(data.customerName);
  const totalDisplay = `$${Number(data.total || 0).toFixed(2)} USD`;
  const dateDisplay = data.date || 'Reciente';

  // Auxiliary fields
  const auxiliaryFields: Array<Record<string, string>> = [
    {
      key: 'order_date',
      label: 'FECHA DE COMPRA',
      value: dateDisplay,
    },
  ];

  if ((isShipped || isDelivered) && data.trackingNumber) {
    auxiliaryFields.unshift({
      key: 'tracking_carrier',
      label: 'OPERADOR LOGÍSTICO',
      value: (data.carrierName || 'Servientrega').toUpperCase(),
    });
    auxiliaryFields.push({
      key: 'tracking_code',
      label: 'NÚMERO DE GUÍA',
      value: data.trackingNumber.trim().toUpperCase(),
    });
  }

  // Back fields
  const backFields: Array<Record<string, string>> = [
    {
      key: 'status_message',
      label: 'ESTADO DE LA ENTREGA',
      value: statusDetail,
    },
    {
      key: 'web_tracking',
      label: 'SEGUIMIENTO EN LÍNEA',
      value: liveTrackingWebUrl,
    },
  ];

  // Only display valid carrier URL when shipped/delivered and present
  if ((isShipped || isDelivered) && data.trackingUrl && /^https?:\/\//i.test(data.trackingUrl)) {
    backFields.push({
      key: 'carrier_url',
      label: `RASTREO EXTERNO (${(data.carrierName || 'OPERADOR').toUpperCase()})`,
      value: data.trackingUrl.trim(),
    });
  }

  backFields.push(
    {
      key: 'support_email',
      label: 'SOPORTE AL CLIENTE',
      value: 'soporte@luminahome.ec',
    },
    {
      key: 'brand_notice',
      label: 'LÚMINA HOME',
      value: 'Mobiliario de autor, iluminación artesanal y diseño escandinavo.',
    }
  );

  return {
    formatVersion: 1,
    passTypeIdentifier,
    serialNumber: `LH-${cleanId.replace(/[^a-zA-Z0-9_-]/g, '')}`,
    teamIdentifier,
    organizationName: 'Lúmina Home',
    description: `Seguimiento de Pedido ${cleanId}`,
    logoText: 'LÚMINA HOME',
    foregroundColor: 'rgb(244, 244, 246)',
    backgroundColor: 'rgb(17, 17, 19)',
    labelColor: 'rgb(161, 161, 170)',
    webServiceURL: `${origin}/api/v1`,
    authenticationToken: authToken,
    barcode: {
      message: liveTrackingWebUrl,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
      altText: `${cleanId} · ${statusHeader}`,
    },
    barcodes: [
      {
        message: liveTrackingWebUrl,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: `${cleanId} · ${statusHeader}`,
      },
    ],
    generic: {
      headerFields: [
        {
          key: 'order_code',
          label: 'PEDIDO',
          value: cleanId,
          textAlignment: 'PKTextAlignmentRight',
        },
      ],
      primaryFields: [
        {
          key: 'current_status',
          label: 'ESTADO',
          value: statusHeader,
        },
      ],
      secondaryFields: [
        {
          key: 'customer',
          label: 'TITULAR',
          value: customerDisplay,
        },
        {
          key: 'total',
          label: 'TOTAL FACTURADO',
          value: totalDisplay,
          textAlignment: 'PKTextAlignmentRight',
        },
      ],
      auxiliaryFields,
      backFields,
    },
  };
}

/**
 * Builds the complete .pkpass ZIP bundle with SHA-1 manifest and PKCS#7 detached digital signature.
 */
export async function generateAppleOrderPassZip(data: OrderPassInput): Promise<{
  buffer: Buffer;
  isSigned: boolean;
  warnings?: string[];
  error?: string;
}> {
  const zip = new JSZip();
  const passJson = buildAppleOrderPassJson(data);
  const passJsonBuf = Buffer.from(JSON.stringify(passJson, null, 2), 'utf-8');

  const sha1 = (buf: Buffer) => crypto.createHash('sha1').update(buf).digest('hex');

  const manifest: Record<string, string> = {
    'pass.json': sha1(passJsonBuf),
    'icon.png': sha1(PASS_ICON_PNG),
    'icon@2x.png': sha1(PASS_ICON_PNG),
    'logo.png': sha1(PASS_LOGO_PNG),
    'logo@2x.png': sha1(PASS_LOGO_PNG),
  };

  const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');

  zip.file('pass.json', passJsonBuf);
  zip.file('icon.png', PASS_ICON_PNG);
  zip.file('icon@2x.png', PASS_ICON_PNG);
  zip.file('logo.png', PASS_LOGO_PNG);
  zip.file('logo@2x.png', PASS_LOGO_PNG);
  zip.file('manifest.json', manifestBuf);

  // Digital PKCS#7 signing
  const signResult = signApplePassManifest(manifestBuf);
  if (signResult.signature) {
    zip.file('signature', signResult.signature);
  }

  const arrayBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return {
    buffer: arrayBuffer,
    isSigned: signResult.isSigned,
    warnings: signResult.warnings,
    error: signResult.error,
  };
}
