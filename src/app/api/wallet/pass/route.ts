import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  generateAppleLoyaltyPassBuffer,
  generateAppleOrderPassBuffer,
} from "@/lib/applePassGenerator";

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Generates an official Google Wallet LoyaltyObject Save URL (https://pay.google.com/gp/v/save/<jwt>)
 * using a standard Google Cloud Service Account (RSA-SHA256)
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
            hexBackgroundColor: params.bgHex.startsWith("#") ? params.bgHex : "#111113",
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
    console.warn("Google Wallet Loyalty JWT signing error:", err);
    return null;
  }
}

/**
 * Generates an official Google Wallet GenericObject Save URL (https://pay.google.com/gp/v/save/<jwt>)
 * for Real-Time Order Tracking
 */
function buildGoogleWalletOrderJwtUrl(params: {
  issuerId: string;
  serviceAccountEmail: string;
  privateKey: string;
  orderId: string;
  status: string;
  total: string;
  customerName: string;
  date: string;
  trackingNumber: string;
  carrierName: string;
  livePassUrl: string;
}): string | null {
  try {
    const cleanKey = params.privateKey.replace(/\\n/g, "\n");
    const classId = `${params.issuerId}.lumina_order_tracking_v1`;
    const safeOrderId = params.orderId.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectId = `${params.issuerId}.order_${safeOrderId}`;

    const textModulesData: Array<{ id: string; header: string; body: string }> = [
      {
        id: "status",
        header: "ESTADO DEL PEDIDO",
        body: params.status.toUpperCase(),
      },
      {
        id: "customer",
        header: "TITULAR",
        body: params.customerName,
      },
      {
        id: "total",
        header: "IMPORTE",
        body: `$${Number(params.total || 0).toFixed(2)} USD`,
      },
    ];

    if (params.trackingNumber) {
      textModulesData.push({
        id: "tracking",
        header: `GUÍA DE ENVÍO (${(params.carrierName || "TRANSPORTE").toUpperCase()})`,
        body: params.trackingNumber,
      });
    }

    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: params.serviceAccountEmail,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      origins: [],
      payload: {
        genericClasses: [
          {
            id: classId,
            issuerName: "Lumina Home",
            reviewStatus: "UNDER_REVIEW",
          },
        ],
        genericObjects: [
          {
            id: objectId,
            classId,
            state: "ACTIVE",
            hexBackgroundColor: "#111113",
            cardTitle: {
              defaultValue: {
                language: "es",
                value: "Lumina Home · Orden",
              },
            },
            subheader: {
              defaultValue: {
                language: "es",
                value: `Estado: ${params.status}`,
              },
            },
            header: {
              defaultValue: {
                language: "es",
                value: params.orderId,
              },
            },
            barcode: {
              type: "QR_CODE",
              value: params.livePassUrl,
              alternateText: `${params.orderId} · ${params.status}`,
            },
            textModulesData,
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
    console.warn("Google Wallet Order JWT signing error:", err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const passType = searchParams.get("type") || "loyalty";
  const rawPlatform = searchParams.get("platform") || "auto";
  const origin = new URL(request.url).origin;
  const userAgent = request.headers.get("user-agent") || "";
  const isIOS = /iPhone|iPad|iPod|Macintosh/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);

  // ============================================================================
  // A. ORDER TRACKING PASS (type=order) — Apple Wallet (.pkpass) & Google Wallet
  // ============================================================================
  if (passType === "order") {
    const orderId = searchParams.get("orderId") || "LUM-0000";
    const status = searchParams.get("status") || "Procesando";
    const total = searchParams.get("total") || "0";
    const customer = searchParams.get("customer") || "Cliente Lumina";
    const date = searchParams.get("date") || "Reciente";
    const tracking = searchParams.get("tracking") || "";
    const carrier = searchParams.get("carrier") || "";
    const trackingUrl = searchParams.get("url") || "";

    const liveOrderPassUrl = `${origin}/wallet/order/${encodeURIComponent(
      orderId
    )}?total=${encodeURIComponent(total)}&status=${encodeURIComponent(
      status
    )}&date=${encodeURIComponent(date)}&customer=${encodeURIComponent(
      customer
    )}&tracking=${encodeURIComponent(tracking)}&carrier=${encodeURIComponent(
      carrier
    )}&url=${encodeURIComponent(trackingUrl)}`;

    const effectivePlatform =
      rawPlatform === "apple" || rawPlatform === "google"
        ? rawPlatform
        : isIOS && process.env.APPLE_PASS_KEY_PEM
        ? "apple"
        : isAndroid &&
          process.env.GOOGLE_WALLET_ISSUER_ID &&
          process.env.GOOGLE_WALLET_CLIENT_EMAIL &&
          process.env.GOOGLE_WALLET_PRIVATE_KEY
        ? "google"
        : "universal";

    if (effectivePlatform === "apple") {
      try {
        const passBuffer = await generateAppleOrderPassBuffer({
          orderId,
          status,
          total,
          customerName: customer,
          date,
          trackingNumber: tracking,
          carrierName: carrier,
          trackingUrl,
          livePassUrl: liveOrderPassUrl,
        });

        const safeFileId = orderId.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase() || "orden";
        return new NextResponse(new Uint8Array(passBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.pkpass",
            "Content-Disposition": `attachment; filename="lumina-pedido-${safeFileId}.pkpass"`,
            "Cache-Control": "no-store, max-age=0",
          },
        });
      } catch (err) {
        console.error("Failed to generate Order .pkpass buffer:", err);
        return NextResponse.redirect(`${liveOrderPassUrl}&wallet=apple`);
      }
    }

    if (effectivePlatform === "google") {
      const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
      const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;

      if (issuerId && clientEmail && privateKey) {
        const googleSaveUrl = buildGoogleWalletOrderJwtUrl({
          issuerId,
          serviceAccountEmail: clientEmail,
          privateKey,
          orderId,
          status,
          total,
          customerName: customer,
          date,
          trackingNumber: tracking,
          carrierName: carrier,
          livePassUrl: liveOrderPassUrl,
        });
        if (googleSaveUrl) {
          return NextResponse.redirect(googleSaveUrl);
        }
      }
      return NextResponse.redirect(`${liveOrderPassUrl}&wallet=google`);
    }

    // Universal QR scan route: opens the live interactive Order Pass with both Apple & Google Wallet native actions
    return NextResponse.redirect(
      `${liveOrderPassUrl}&wallet=${isIOS ? "apple" : "google"}`
    );
  }

  // ============================================================================
  // B. LOYALTY PASS (type=loyalty) — Apple Wallet (.pkpass) & Google Wallet
  // ============================================================================
  const platform = rawPlatform === "auto" ? (isIOS ? "apple" : "google") : rawPlatform;

  if (platform === "apple") {
    const program = searchParams.get("program") || "Lumina Member Pass";
    const issuer = searchParams.get("issuer") || "Lumina Home";
    const code = searchParams.get("code") || "LUM-8842-PRV";
    const name = searchParams.get("name") || "Cliente Lumina";
    const pts = searchParams.get("pts") || "200";
    const ptsPerDollar = searchParams.get("ptsPerDollar") || "10";

    try {
      const passBuffer = await generateAppleLoyaltyPassBuffer({
        programName: program,
        issuerName: issuer,
        memberCode: code,
        memberName: name,
        points: pts,
        ptsPerDollar,
      });

      return new NextResponse(new Uint8Array(passBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.pkpass",
          "Content-Disposition": `attachment; filename="lumina-${code.toLowerCase()}.pkpass"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    } catch (err) {
      console.error("Failed to generate .pkpass buffer:", err);
      return NextResponse.json({ error: "No se pudo generar el archivo .pkpass" }, { status: 500 });
    }
  }

  if (platform === "google") {
    const program = searchParams.get("program") || "Lumina Member Pass";
    const issuer = searchParams.get("issuer") || "Lumina Home";
    const code = searchParams.get("code") || "LUM-8842-PRV";
    const name = searchParams.get("name") || "Cliente Lumina";
    const pts = searchParams.get("pts") || "200";
    const bg = searchParams.get("bg") || "#111113";

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

    const loyaltyLiveUrl = `${origin}/loyalty/pass?program=${encodeURIComponent(
      program
    )}&issuer=${encodeURIComponent(issuer)}&code=${encodeURIComponent(
      code
    )}&name=${encodeURIComponent(name)}&pts=${encodeURIComponent(pts)}&installed=google&needsSetup=true`;

    return NextResponse.redirect(loyaltyLiveUrl);
  }

  return NextResponse.redirect(`${origin}/loyalty/pass`);
}
