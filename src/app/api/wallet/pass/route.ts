import { NextResponse } from "next/server";
import crypto from "crypto";
import { generateAppleLoyaltyPassBuffer } from "@/lib/applePassGenerator";

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Generates an official Google Wallet LoyaltyObject Save URL (https://pay.google.com/gp/v/save/<jwt>)
 * using a standard Google Cloud Service Account (RSA-SHA256) — 100% Free, zero payment/banking requirements.
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
    console.warn("Google Wallet JWT signing error:", err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const passType = searchParams.get("type") || "loyalty";
  const platform = searchParams.get("platform") || "apple";
  const origin = new URL(request.url).origin;

  // ============================================================================
  // 1. APPLE WALLET (.pkpass) REAL BINARY FILE GENERATOR
  // ============================================================================
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

  // ============================================================================
  // 2. GOOGLE WALLET OFFICIAL JWT SAVE LINK
  // ============================================================================
  if (platform === "google") {
    const program = searchParams.get("program") || "Lumina Member Pass";
    const issuer = searchParams.get("issuer") || "Lumina Home";
    const code = searchParams.get("code") || "LUM-8842-PRV";
    const name = searchParams.get("name") || "Cliente Lumina";
    const pts = searchParams.get("pts") || "200";
    const bg = searchParams.get("bg") || "#171717";

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

    // Direct installable pass if Google Wallet credentials are not in .env yet
    const loyaltyLiveUrl = `${origin}/loyalty/pass?program=${encodeURIComponent(
      program
    )}&issuer=${encodeURIComponent(issuer)}&code=${encodeURIComponent(
      code
    )}&name=${encodeURIComponent(name)}&pts=${encodeURIComponent(pts)}&installed=google&needsSetup=true`;

    return NextResponse.redirect(loyaltyLiveUrl);
  }

  // Fallback redirect
  return NextResponse.redirect(`${origin}/loyalty/pass`);
}
