import { NextResponse } from "next/server";
import { buildPayPhoneBreakdown, isRealPayPhoneToken } from "@/lib/payphone";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const totalUsd = body.totalUsd ?? body.clientClaimedTotal ?? body.total;
    const reference = body.reference || (body.orderId ? `Pedido #${body.orderId} - Lumina Home` : "Orden Lumina Home");

    const token =
      process.env.PAYPHONE_TOKEN || process.env.NEXT_PUBLIC_PAYPHONE_TOKEN;
    const storeId =
      process.env.PAYPHONE_STORE_ID || process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID;

    if (!isRealPayPhoneToken(token) || !storeId || storeId.includes("XXXX")) {
      return NextResponse.json(
        { error: "Configura PAYPHONE_TOKEN y PAYPHONE_STORE_ID reales en .ENV", success: false },
        { status: 503 }
      );
    }

    const breakdown = buildPayPhoneBreakdown(Number(totalUsd), true);
    const origin = new URL(req.url).origin;

    const response = await fetch(
      "https://pay.payphonetodoesposible.com/api/button/Prepare",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...breakdown,
          storeId,
          reference: reference || "Orden Lumina Home",
          responseUrl: `${origin}/?payphone_return=1`,
          cancellationUrl: `${origin}/`,
        }),
        cache: "no-store",
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || "Error al preparar pago", details: data, success: false },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: data.paymentId,
      payWithPayPhone: data.payWithPayPhone,
      payWithCard: data.payWithCard,
      payUrl: data.payWithCard || data.payWithPayPhone,
      clientTransactionId: breakdown.clientTransactionId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error interno en Prepare", message: error?.message, success: false },
      { status: 500 }
    );
  }
}
