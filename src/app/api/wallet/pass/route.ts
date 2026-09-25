import { NextResponse } from "next/server";
import crypto from "crypto";

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Generates a 100% FREE Google Wallet LoyaltyObject Save URL (https://pay.google.com/gp/v/save/<jwt>)
 * using a standard Google Cloud Service Account (RSA-SHA256) — $0 cost, no payment/banking plan required.
 */
function buildGoogleWalletLoyaltyJwtUrl(params: {
  issuerId: string;
  serviceAccountEmail: string;
  privateKey: string;
  programName: string;
  issuerName: string;
  memberCode: string;
  memberName: string;
  points: string;
  bgHex: string;
}): string | null {
  try {
    const cleanKey = params.privateKey.replace(/\\n/g, "\n");
    const classId = `${params.issuerId}.lumina_loyalty_class_v1`;
    const objectId = `${params.issuerId}.member_${params.memberCode.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: params.serviceAccountEmail,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      origins: [],
      payload: {
        loyaltyClasses: [
          {
            id: classId,
            issuerName: params.issuerName,
            programName: params.programName,
            reviewStatus: "UNDER_REVIEW",
            hexBackgroundColor: params.bgHex.startsWith("#") ? params.bgHex : "#171717",
            programLogo: {
              sourceUri: {
                uri: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=256&auto=format&fit=crop&q=80",
              },
            },
          },
        ],
        loyaltyObjects: [
          {
            id: objectId,
            classId,
            state: "ACTIVE",
            accountId: params.memberCode,
            accountName: params.memberName,
            loyaltyPoints: {
              label: "Puntos Lumina",
              balance: {
                int: parseInt(params.points, 10) || 200,
              },
            },
            barcode: {
              type: "QR_CODE",
              value: params.memberCode,
              alternateText: params.memberCode,
            },
          },
        ],
      },
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(signingInput);
    signer.end();
    const signature = signer.sign(cleanKey);
    const encodedSignature = base64UrlEncode(signature);

    return `https://pay.google.com/gp/v/save/${signingInput}.${encodedSignature}`;
  } catch (err) {
    console.warn("Google Wallet JWT signing fallback triggered:", err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const passType = searchParams.get("type") || "order";
  const platform = searchParams.get("platform") || "google";
  const origin = new URL(request.url).origin;

  // ============================================================================
  // MODE 1: LOYALTY CARD PASS (TARJETA DE LEALTAD — SIN PAGOS NI BANCOS)
  // ============================================================================
  if (passType === "loyalty") {
    const program = searchParams.get("program") || "Lumina Member Pass";
    const issuer = searchParams.get("issuer") || "Lumina Home";
    const code = searchParams.get("code") || "LUM-8842-PRV";
    const name = searchParams.get("name") || "Cliente Lumina";
    const pts = searchParams.get("pts") || "200";
    const ptsPerDollar = searchParams.get("ptsPerDollar") || "10";
    const bg = searchParams.get("bg") || "#171717";
    const accent = searchParams.get("accent") || "#8c9276";

    // If Google Wallet is requested and free Google Wallet Service Account env vars exist, redirect to native Google Wallet Save URL
    if (platform === "google") {
      const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
      const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;

      if (issuerId && clientEmail && privateKey) {
        const googleSaveUrl = buildGoogleWalletLoyaltyJwtUrl({
          issuerId,
          serviceAccountEmail: clientEmail,
          privateKey,
          programName: program,
          issuerName: issuer,
          memberCode: code,
          memberName: name,
          points: pts,
          bgHex: bg,
        });
        if (googleSaveUrl) {
          return NextResponse.redirect(googleSaveUrl);
        }
      }
    }

    // Direct Interactive Wallet Loyalty Pass View (Works immediately with $0 cost on iOS & Android)
    const loyaltyLiveUrl = `${origin}/loyalty/pass?program=${encodeURIComponent(
      program
    )}&issuer=${encodeURIComponent(issuer)}&code=${encodeURIComponent(
      code
    )}&name=${encodeURIComponent(name)}&pts=${encodeURIComponent(
      pts
    )}&ptsPerDollar=${encodeURIComponent(ptsPerDollar)}&bg=${encodeURIComponent(
      bg
    )}&accent=${encodeURIComponent(accent)}&installed=${encodeURIComponent(platform)}`;

    return NextResponse.redirect(loyaltyLiveUrl);
  }

  // ============================================================================
  // MODE 2: ORDER TRACKING WALLET PASS
  // ============================================================================
  const orderId = searchParams.get("orderId") || "LM-ORDEN";
  const total = searchParams.get("total") || "0.00";
  const status = searchParams.get("status") || "Procesando";
  const customer = searchParams.get("customer") || "Cliente Lumina";
  const tracking = searchParams.get("tracking") || "";
  const carrier = searchParams.get("carrier") || "";
  const trackingUrl = searchParams.get("trackingUrl") || "";

  const passLiveUrl = `${origin}/wallet/order/${encodeURIComponent(orderId)}?total=${encodeURIComponent(
    total
  )}&status=${encodeURIComponent(status)}&customer=${encodeURIComponent(
    customer
  )}&tracking=${encodeURIComponent(tracking)}&carrier=${encodeURIComponent(
    carrier
  )}&url=${encodeURIComponent(trackingUrl)}&wallet=${encodeURIComponent(platform)}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Pedido ${orderId}" />
  <meta name="theme-color" content="#111114" />
  <title>Lumina ${platform === "apple" ? "Apple Wallet" : "Google Wallet"} · ${orderId}</title>
  <script>
    window.location.replace(${JSON.stringify(passLiveUrl)});
  </script>
</head>
<body style="background:#0B0B0E;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <a href="${passLiveUrl}" style="color:#ccff00;text-decoration:none;font-weight:700;font-size:14px;">
    Abriendo Pase Oficial ${platform === "apple" ? "Apple Wallet" : "Google Wallet"} (${orderId})...
  </a>
</body>
</html>`;

  return new NextResponse(htmlContent, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
