"use client";

import type { DiscountCoupon } from "./couponStore";

/**
 * High-definition 100% client-side Canvas generator that creates a PNG image of
 * either Coupon Style 1 (Niche Scallop Pastel) or Coupon Style 2 (Storewide Vintage Editorial).
 */
export async function generateCouponPng(coupon: DiscountCoupon): Promise<File> {
  const isStorewide = coupon.scope === "all";

  // Hi-DPI Canvas for razor-sharp rendering (scale 3x)
  const canvas = document.createElement("canvas");
  const scale = 3;

  if (isStorewide) {
    // Style 2 Proportions: 460 x 170 -> 1380 x 510
    const w = 460;
    const h = 170;
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");
    ctx.scale(scale, scale);

    drawStyle2(ctx, coupon, w, h);
  } else {
    // Style 1 Proportions: 380 x 210 -> 1140 x 630
    const w = 380;
    const h = 210;
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");
    ctx.scale(scale, scale);

    drawStyle1(ctx, coupon, w, h);
  }

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas toBlob failed"));
        return;
      }
      const file = new File([blob], `Lumina-Cupon-${coupon.code}.png`, {
        type: "image/png",
      });
      resolve(file);
    }, "image/png");
  });
}

function drawStyle1(
  ctx: CanvasRenderingContext2D,
  coupon: DiscountCoupon,
  w: number,
  h: number
) {
  // Palettes from Cupones Style.jpg
  const palettes = [
    { start: "#ff5d99", mid: "#ff8ea3", end: "#ffb68d" }, // Pink / Peach
    { start: "#8f85f3", mid: "#ba86f4", end: "#ff7fa8" }, // Purple / Orchid
    { start: "#4ec3f7", mid: "#7abcf8", end: "#b98ef5" }, // Sky / Lavender
    { start: "#ff8676", mid: "#ffa590", end: "#81cefb" }, // Coral / Sky
  ];
  const charSum = coupon.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pal = palettes[Math.abs(charSum) % palettes.length];

  // Draw Ticket Shape with Scallops & Notches
  ctx.save();
  ctx.beginPath();
  const r = 16;
  const notchR = 14;

  // Top edge
  ctx.moveTo(r, 0);
  ctx.lineTo(w * 0.48 - 7, 0);
  ctx.arc(w * 0.48, 0, 7, Math.PI, 0, true); // Top perforation notch
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);

  // Right edge with scallops & center notch
  const rightX = w;
  const centerY = h / 2;

  // Top half of right edge
  ctx.lineTo(rightX, centerY - notchR - 2);
  ctx.arc(rightX, centerY, notchR, -Math.PI / 2, Math.PI / 2, true); // Center right notch
  ctx.lineTo(rightX, h - r);
  ctx.arcTo(w, h, w - r, h, r);

  // Bottom edge
  ctx.lineTo(w * 0.48 + 7, h);
  ctx.arc(w * 0.48, h, 7, 0, Math.PI, true); // Bottom perforation notch
  ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r);

  // Left edge with center notch
  ctx.lineTo(0, centerY + notchR + 2);
  ctx.arc(0, centerY, notchR, Math.PI / 2, -Math.PI / 2, true); // Center left notch
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, pal.start);
  grad.addColorStop(0.5, pal.mid);
  grad.addColorStop(1, pal.end);
  ctx.fillStyle = grad;
  ctx.fill();

  // Fine stroke
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.stroke();

  // Vertical Perforation Line
  const perfX = w * 0.48;
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(perfX, 10);
  ctx.lineTo(perfX, h - 10);
  ctx.stroke();
  ctx.restore();

  // -------------------------------------------------------------
  // Left Column Content: Giant Discount + Horizontal 1D Barcode
  // -------------------------------------------------------------
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";

  // Discount percentage
  ctx.font = "900 52px system-ui, sans-serif";
  const discNum = coupon.discountType === "free_shipping" ? "100%" : `${coupon.discountPercent}%`;
  ctx.fillText(discNum, 26, 75);

  // "OFF" text
  ctx.font = "900 44px system-ui, sans-serif";
  const offText = coupon.discountType === "free_shipping" ? "GRATIS" : "OFF";
  ctx.fillText(offText, 26, 122);

  // Horizontal Barcode
  drawHorizontalBarcode(ctx, coupon.code, 26, 142, 126, 28, "#000000");

  // -------------------------------------------------------------
  // Right Column Content: [CODE] Badge + Code + Niche/Condition
  // -------------------------------------------------------------
  const rx = perfX + 22;

  // CODE Box Badge
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rx, 34, 44, 18);
  ctx.font = "900 10px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CODE", rx + 22, 47);

  // Coupon Code
  ctx.textAlign = "left";
  ctx.font = "900 22px system-ui, sans-serif";
  ctx.fillText(coupon.code, rx, 80);

  // Hairline separator
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rx, 92);
  ctx.lineTo(w - 24, 92);
  ctx.stroke();

  // Spend / Niche details
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.fillStyle = "#111111";
  ctx.fillText(`Colección: ${coupon.targetNiche || "Exclusiva"}`, rx, 112);

  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillStyle = "#333333";
  if (coupon.minOrderAmount > 0) {
    ctx.fillText(`Spend $${coupon.minOrderAmount}+ USD`, rx, 130);
  } else {
    ctx.fillText("Sin mínimo de compra", rx, 130);
  }

  // Validity
  ctx.font = "500 10px system-ui, sans-serif";
  ctx.fillStyle = "#555555";
  const expStr = coupon.expiresAt
    ? `Vence: ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`
    : "Vigencia permanente";
  ctx.fillText(expStr, rx, 148);

  ctx.restore();
}

function drawStyle2(
  ctx: CanvasRenderingContext2D,
  coupon: DiscountCoupon,
  w: number,
  h: number
) {
  // Palettes from Cupones Style 2.jpg
  const themes = [
    { bg: "#d5df9a", text: "#283116", border: "#bfce82" }, // Matcha Olive
    { bg: "#c3b093", text: "#2f251c", border: "#b09d84" }, // Warm Kraft Sand
    { bg: "#363230", text: "#ede6d8", border: "#4a4542" }, // Espresso Noir
  ];
  const charSum = coupon.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const th = themes[Math.abs(charSum) % themes.length];

  ctx.save();
  ctx.beginPath();
  const r = 20;
  const notchR = 10;
  const perfX = 125;

  // Top edge with notch at perfX
  ctx.moveTo(r, 0);
  ctx.lineTo(perfX - notchR, 0);
  ctx.arc(perfX, 0, notchR, Math.PI, 0, true); // Top perforation notch
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);

  // Right edge with center notch
  const centerY = h / 2;
  ctx.lineTo(w, centerY - notchR);
  ctx.arc(w, centerY, notchR, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(w, h - r);
  ctx.arcTo(w, h, w - r, h, r);

  // Bottom edge with notch at perfX
  ctx.lineTo(perfX + notchR, h);
  ctx.arc(perfX, h, notchR, 0, Math.PI, true); // Bottom perforation notch
  ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r);

  // Left edge with center notch
  ctx.lineTo(0, centerY + notchR);
  ctx.arc(0, centerY, notchR, Math.PI / 2, -Math.PI / 2, true);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();

  // Matte fill
  ctx.fillStyle = th.bg;
  ctx.fill();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = th.border;
  ctx.stroke();

  // Vertical Perforation Dashed Line
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = th.text;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(perfX, notchR + 2);
  ctx.lineTo(perfX, h - notchR - 2);
  ctx.stroke();
  ctx.restore();

  // -------------------------------------------------------------
  // Left Stub: Vertical 1D Linear Barcode
  // -------------------------------------------------------------
  drawVerticalBarcode(ctx, coupon.code, 32, 28, 62, 114, th.text);

  // -------------------------------------------------------------
  // Right Main Body: Cursive Script + Display Serif + Oval Badge
  // -------------------------------------------------------------
  ctx.fillStyle = th.text;
  ctx.strokeStyle = th.text;

  // Cursive title ("Lúmina Home" in classic calligraphy)
  ctx.font = "italic 32px 'Pinyon Script', 'Alex Brush', 'Caveat', serif";
  ctx.textAlign = "left";
  ctx.fillText("Lúmina Home", perfX + 24, 52);

  // Uppercase Display Serif: "CUPÓN DE TIENDA"
  ctx.font = "bold 13px 'Playfair Display', Georgia, serif";
  ctx.fillText("CUPÓN DE TIENDA", perfX + 26, 72);

  // Horizontal Dashed Line
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(perfX + 26, 94);
  ctx.lineTo(w - 28, 94);
  ctx.stroke();
  ctx.restore();

  // Bottom text on left: "WWW.LUMINAHOME.EC"
  ctx.font = "bold 10px monospace";
  ctx.globalAlpha = 0.9;
  ctx.fillText("WWW.LUMINAHOME.EC", perfX + 26, 122);
  ctx.globalAlpha = 1;

  // -------------------------------------------------------------
  // Right Sub-Area: Oval / Ellipse Discount Badge
  // -------------------------------------------------------------
  const ovalX = w - 85;
  const ovalY = 60;
  const ovalRx = 46;
  const ovalRy = 32;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(ovalX, ovalY, ovalRx, ovalRy, 0, 0, Math.PI * 2);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Text inside oval
  ctx.textAlign = "center";
  ctx.font = "9px 'Playfair Display', Georgia, serif";
  ctx.fillText("GET", ovalX, ovalY - 14);

  ctx.font = "bold 11px 'Playfair Display', Georgia, serif";
  ctx.fillText("DISCOUNT", ovalX, ovalY);

  ctx.font = "bold 20px 'Playfair Display', Georgia, serif";
  const ovalDisc = coupon.discountType === "free_shipping" ? "100%" : `${coupon.discountPercent}%`;
  ctx.fillText(ovalDisc, ovalX, ovalY + 20);
  ctx.restore();

  // Date under horizontal line on the right
  ctx.font = "bold 9px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.globalAlpha = 0.85;
  const dateStr = coupon.expiresAt
    ? `*VÁLIDO HASTA ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}`
    : "*SIN VENCIMIENTO";
  ctx.fillText(dateStr, w - 30, 122);

  ctx.restore();
}

function drawHorizontalBarcode(
  ctx: CanvasRenderingContext2D,
  code: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  const bars = generateBarPattern(code);
  const totalUnits = bars.reduce((s, b) => s + b.width, 0);
  const unitPx = w / totalUnits;

  ctx.fillStyle = color;
  let curX = x;
  for (const bar of bars) {
    const barPx = bar.width * unitPx;
    if (bar.isBar) {
      ctx.fillRect(curX, y, barPx, h);
    }
    curX += barPx;
  }
}

function drawVerticalBarcode(
  ctx: CanvasRenderingContext2D,
  code: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  const bars = generateBarPattern(code);
  const totalUnits = bars.reduce((s, b) => s + b.width, 0);
  const unitPx = h / totalUnits;

  ctx.fillStyle = color;
  let curY = y;
  for (const bar of bars) {
    const barPx = bar.width * unitPx;
    if (bar.isBar) {
      ctx.fillRect(x, curY, w, barPx);
    }
    curY += barPx;
  }
}

function generateBarPattern(code: string) {
  const clean = (code || "LUMINA").toUpperCase();
  const result: { isBar: boolean; width: number }[] = [];

  // Start guard
  result.push({ isBar: true, width: 2 });
  result.push({ isBar: false, width: 1 });
  result.push({ isBar: true, width: 1 });
  result.push({ isBar: false, width: 2 });

  for (let i = 0; i < clean.length; i++) {
    const c = clean.charCodeAt(i);
    const b1 = ((c * 3 + i * 5) % 3) + 1;
    const s1 = ((c * 7 + i * 2) % 3) + 1;
    const b2 = ((c * 5 + i * 11) % 3) + 1;
    const s2 = ((c * 11 + i * 7) % 3) + 1;
    result.push({ isBar: true, width: b1 });
    result.push({ isBar: false, width: s1 });
    result.push({ isBar: true, width: b2 });
    result.push({ isBar: false, width: s2 });
  }

  // Stop guard
  result.push({ isBar: true, width: 2 });
  result.push({ isBar: false, width: 1 });
  result.push({ isBar: true, width: 3 });

  return result;
}
