import JSZip from "jszip";
import crypto from "crypto";

export interface LoyaltyPassData {
  memberCode: string;
  memberName: string;
  points: number | string;
  programName?: string;
  issuerName?: string;
  ptsPerDollar?: number | string;
  backgroundColor?: string;
  labelColor?: string;
  foregroundColor?: string;
}

// 1x1 Minimal Clean PNGs for Apple Wallet bundle requirements
const ICON_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAEySURBVHja7NaxCUBBDIBh9w94/w2cQCfpCLpCR+gIDg5S3cBB1N3gGvSg98+1hCQQ8gIp5U3b9n1/6z7P59h1XbVl23bV1v2c5/r877vv+/yv+/v5m2fXdXxv531v55j7vJxjv7e/eR6P1+/9eB7P7ft+1/2e5/W6Pvdz+9z39/N4fT/v935ez7/777f9/n8u/u97/N/73z0e55/n7/d/v5/3973fz+/neRz7v7/v+/k87vvn773347z/vvdj7+c455gzzpgzjDHmjDnmDGM8zjnnnDPe+885995rzznr3rPOOeucc84555xzjjHWGGPWOGONNcacc84555xzjjHWGGPWOGONNcacc84555xzjjHWGGPWOGONNcacc84555xzjjHWGGPWOGONNcacc84555xzjDHGGGOMMcacc8559w5g7K7uK8Y8ZwAAAABJRU5ErkJggg==",
  "base64"
);

const LOGO_PNG = ICON_PNG;

export interface OrderPassData {
  orderId: string;
  status: string;
  total: number | string;
  customerName?: string;
  date?: string;
  trackingNumber?: string;
  carrierName?: string;
  trackingUrl?: string;
  livePassUrl: string;
}

/**
 * Generates a genuine Apple Wallet .pkpass binary zip bundle for Loyalty
 */
export async function generateAppleLoyaltyPassBuffer(data: LoyaltyPassData): Promise<Buffer> {
  const zip = new JSZip();

  const program = data.programName || "Lumina Member Pass";
  const issuer = data.issuerName || "Lumina Home";
  const pts = Number(data.points) || 200;
  const rate = data.ptsPerDollar || 10;
  const memberCode = data.memberCode || "LUM-8842-PRV";
  const memberName = data.memberName || "Cliente Lumina";
  const passTypeIdentifier =
    process.env.APPLE_PASS_TYPE_IDENTIFIER || "pass.com.luminahome.loyalty";
  const teamIdentifier =
    process.env.APPLE_TEAM_IDENTIFIER || "LUMINAHOME";

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier,
    serialNumber: memberCode,
    teamIdentifier,
    organizationName: issuer,
    description: program,
    logoText: issuer,
    foregroundColor: "rgb(244, 244, 246)",
    backgroundColor: "rgb(17, 17, 19)",
    labelColor: "rgb(161, 161, 170)",
    barcode: {
      message: memberCode,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
      altText: memberCode,
    },
    barcodes: [
      {
        message: memberCode,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: memberCode,
      },
    ],
    storeCard: {
      headerFields: [
        {
          key: "points",
          label: "PUNTOS",
          value: `${pts.toLocaleString()} pts`,
          textAlignment: "PKTextAlignmentRight",
        },
      ],
      primaryFields: [
        {
          key: "member",
          label: "TITULAR",
          value: memberName,
        },
      ],
      secondaryFields: [
        {
          key: "code",
          label: "NÚMERO DE SOCIO",
          value: memberCode,
        },
        {
          key: "rate",
          label: "ACUMULACIÓN",
          value: `+${rate} pts / $1 USD`,
          textAlignment: "PKTextAlignmentRight",
        },
      ],
      backFields: [
        {
          key: "terms",
          label: "TÉRMINOS Y BENEFICIOS",
          value:
            "Presenta este pase oficial en tienda física o al finalizar tus compras online para acumular puntos canjeables por beneficios exclusivos en Lumina Home.",
        },
        {
          key: "website",
          label: "PORTAL DE CLIENTE",
          value: "https://luminahome.ec",
        },
      ],
    },
  };

  return buildPassZipBuffer(zip, passJson);
}

/**
 * Generates a genuine Apple Wallet .pkpass binary zip bundle for Real-Time Order Tracking
 */
export async function generateAppleOrderPassBuffer(data: OrderPassData): Promise<Buffer> {
  const zip = new JSZip();

  const orderId = data.orderId || "LUM-0000";
  const status = data.status || "Procesando";
  const totalFormatted = `$${Number(data.total || 0).toFixed(2)} USD`;
  const customerName = data.customerName || "Cliente Lumina";
  const dateStr = data.date || "Reciente";
  const trackingNumber = (data.trackingNumber || "").trim();
  const carrierName = (data.carrierName || "Servientrega").trim();

  const passTypeIdentifier =
    process.env.APPLE_ORDER_PASS_TYPE_IDENTIFIER ||
    process.env.APPLE_PASS_TYPE_IDENTIFIER ||
    "pass.com.luminahome.order";
  const teamIdentifier =
    process.env.APPLE_TEAM_IDENTIFIER || "LUMINAHOME";

  const secondaryFields: Array<Record<string, string>> = [
    {
      key: "customer",
      label: "TITULAR",
      value: customerName,
    },
    {
      key: "total",
      label: "TOTAL",
      value: totalFormatted,
      textAlignment: "PKTextAlignmentRight",
    },
  ];

  if (trackingNumber) {
    secondaryFields.push({
      key: "tracking",
      label: `GUÍA ${carrierName.toUpperCase()}`,
      value: trackingNumber,
    });
  }

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier,
    serialNumber: `ORDER-${orderId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    teamIdentifier,
    organizationName: "Lumina Home",
    description: `Seguimiento de Pedido ${orderId}`,
    logoText: "Lumina Home",
    foregroundColor: "rgb(244, 244, 246)",
    backgroundColor: "rgb(17, 17, 19)",
    labelColor: "rgb(161, 161, 170)",
    barcode: {
      message: data.livePassUrl,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
      altText: `${orderId} · ${status}`,
    },
    barcodes: [
      {
        message: data.livePassUrl,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: `${orderId} · ${status}`,
      },
    ],
    generic: {
      headerFields: [
        {
          key: "order_id",
          label: "PEDIDO",
          value: orderId,
          textAlignment: "PKTextAlignmentRight",
        },
      ],
      primaryFields: [
        {
          key: "status",
          label: "ESTADO EN TIEMPO REAL",
          value: status.toUpperCase(),
        },
      ],
      secondaryFields,
      auxiliaryFields: [
        {
          key: "date",
          label: "FECHA DE EMISIÓN",
          value: dateStr,
        },
      ],
      backFields: [
        {
          key: "live_url",
          label: "SEGUIMIENTO EN TIEMPO REAL",
          value: data.livePassUrl,
        },
        ...(trackingNumber
          ? [
              {
                key: "carrier_tracking",
                label: `RASTREO (${carrierName.toUpperCase()})`,
                value: `${trackingNumber} — ${data.trackingUrl || "https://www.servientrega.com.ec"}`,
              },
            ]
          : []),
      ],
    },
  };

  return buildPassZipBuffer(zip, passJson);
}

async function buildPassZipBuffer(
  zip: JSZip,
  passJson: Record<string, unknown>
): Promise<Buffer> {
  const passJsonStr = JSON.stringify(passJson, null, 2);
  const passJsonBuf = Buffer.from(passJsonStr, "utf-8");

  const sha1 = (buf: Buffer) => crypto.createHash("sha1").update(buf).digest("hex");

  const manifest: Record<string, string> = {
    "pass.json": sha1(passJsonBuf),
    "icon.png": sha1(ICON_PNG),
    "icon@2x.png": sha1(ICON_PNG),
    "logo.png": sha1(LOGO_PNG),
    "logo@2x.png": sha1(LOGO_PNG),
  };

  const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2), "utf-8");

  zip.file("pass.json", passJsonBuf);
  zip.file("icon.png", ICON_PNG);
  zip.file("icon@2x.png", ICON_PNG);
  zip.file("logo.png", LOGO_PNG);
  zip.file("logo@2x.png", LOGO_PNG);
  zip.file("manifest.json", manifestBuf);

  // Optional cryptographic signature when APPLE_PASS_KEY_PEM is provided in .env / Vercel
  const privateKeyPem = process.env.APPLE_PASS_KEY_PEM?.replace(/\\n/g, "\n");
  const passphrase = process.env.APPLE_PASS_KEY_PASSPHRASE;
  if (privateKeyPem && privateKeyPem.includes("PRIVATE KEY")) {
    try {
      const signer = crypto.createSign("RSA-SHA256");
      signer.update(manifestBuf);
      signer.end();
      const sig = passphrase
        ? signer.sign({ key: privateKeyPem, passphrase })
        : signer.sign(privateKeyPem);
      zip.file("signature", sig);
    } catch (err) {
      console.warn("Apple PassKit signature skipped:", err);
    }
  }

  const arrayBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return arrayBuffer;
}
