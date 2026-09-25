import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") || "LM-ORDEN";
  const platform = searchParams.get("platform") || "google";
  const total = searchParams.get("total") || "0.00";
  const status = searchParams.get("status") || "Procesando";
  const customer = searchParams.get("customer") || "Cliente Lumina";
  const tracking = searchParams.get("tracking") || "";
  const carrier = searchParams.get("carrier") || "";
  const trackingUrl = searchParams.get("trackingUrl") || "";
  const origin = new URL(request.url).origin;

  const passLiveUrl = `${origin}/wallet/order/${encodeURIComponent(orderId)}?total=${encodeURIComponent(
    total
  )}&status=${encodeURIComponent(status)}&customer=${encodeURIComponent(
    customer
  )}&tracking=${encodeURIComponent(tracking)}&carrier=${encodeURIComponent(
    carrier
  )}&url=${encodeURIComponent(trackingUrl)}&wallet=${encodeURIComponent(platform)}`;

  // Generate an authentic installable mobile web-pass / wallet card HTML bundle with Web App Manifest & Auto-Refresh
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
