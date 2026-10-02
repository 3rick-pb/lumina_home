"use client";

import type { DiscountCoupon } from "./couponStore";

/**
 * High-definition 100% client-side Canvas generator that creates a PNG image of
 * either Coupon Style 1 (Niche Scallop Pastel) or Coupon Style 2 (Storewide Vintage Editorial),
 * rendered at high-resolution (3x) with unified dimensions (420 x 176).
 */
export async function generateCouponPng(coupon: DiscountCoupon): Promise<File> {
  const isStorewide = coupon.scope === "all";

  // Base ticket geometry (natural proportions)
  const w = isStorewide ? 460 : 340;
  const h = isStorewide ? 170 : 215;

  // Margin/Padding around ticket so it is NEVER cropped right on the border edge
  const padX = 28;
  const padY = 22;

  // Hi-DPI Canvas for razor-sharp rendering (scale 3x)
  const scale = 3;
  const totalW = w + padX * 2;
  const totalH = h + padY * 2;

  const canvas = document.createElement("canvas");
  canvas.width = totalW * scale;
  canvas.height = totalH * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  // Explicitly clear whole canvas to pure transparent pixels (100% genuine transparent PNG)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.scale(scale, scale);
  ctx.translate(padX, padY);

  if (isStorewide) {
    drawStyle2(ctx, coupon, w, h);
  } else {
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

  ctx.save();
  ctx.beginPath();
  const r = 16;
  const notchR = 14;
  const perfX = 162;
  const centerY = h / 2;

  // Top edge
  ctx.moveTo(r, 0);
  ctx.lineTo(perfX - 7, 0);
  ctx.arc(perfX, 0, 7, Math.PI, 0, true);
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);

  // Right edge with center notch
  ctx.lineTo(w, centerY - notchR);
  ctx.arc(w, centerY, notchR, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(w, h - r);
  ctx.arcTo(w, h, w - r, h, r);

  // Bottom edge
  ctx.lineTo(perfX + 7, h);
  ctx.arc(perfX, h, 7, 0, Math.PI, true);
  ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r);

  // Left edge with center notch
  ctx.lineTo(0, centerY + notchR);
  ctx.arc(0, centerY, notchR, Math.PI / 2, -Math.PI / 2, true);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();

  // Subtle soft drop-shadow for floating ticket depth on transparent canvas
  ctx.shadowColor = "rgba(0, 0, 0, 0.16)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, pal.start);
  grad.addColorStop(0.45, pal.mid);
  grad.addColorStop(1, pal.end);
  ctx.fillStyle = grad;
  ctx.fill();

  // Reset shadow for crisp text and lines
  ctx.shadowColor = "transparent";

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.stroke();

  // Vertical Perforation Line
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(perfX, 10);
  ctx.lineTo(perfX, h - 10);
  ctx.stroke();
  ctx.restore();

  // Left Column Content: Giant Discount + Horizontal 1D Barcode
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";

  ctx.font = "900 52px system-ui, sans-serif";
  const discNum = coupon.discountType === "free_shipping" ? "100%" : `${coupon.discountPercent}%`;
  ctx.fillText(discNum, 22, 78);

  ctx.font = "900 44px system-ui, sans-serif";
  const offText = coupon.discountType === "free_shipping" ? "GRATIS" : "OFF";
  ctx.fillText(offText, 22, 126);

  // Horizontal Barcode strictly contained inside ticket geometry
  drawHorizontalBarcode(ctx, coupon.code, 20, 138, 105, 44, "#000000");

  // Right Column Content: [CODE] Badge + Code + Niche/Condition
  const rx = perfX + 22;

  // CODE Box Badge
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(rx, 30, 44, 18);
  ctx.font = "800 10.5px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CODE", rx + 22, 43);

  // Coupon Code with dynamic font scaling to avoid clipping
  ctx.textAlign = "left";
  const codeLen = coupon.code.length;
  const fontSize = codeLen > 14 ? 14 : codeLen > 10 ? 17 : 20;
  ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
  ctx.fillText(coupon.code, rx, 72);

  // Hairline separator
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(rx, 82);
  ctx.lineTo(w - 22, 82);
  ctx.stroke();

  // Spend / Niche details (with overflow safety)
  ctx.font = "700 11.5px system-ui, sans-serif";
  ctx.fillStyle = "#111111";
  const nicheLabel = coupon.targetNiche
    ? coupon.targetNiche.length > 17
      ? coupon.targetNiche.slice(0, 15) + "…"
      : coupon.targetNiche
    : "Exclusiva";
  ctx.fillText(`Colección: ${nicheLabel}`, rx, 102);

  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillStyle = "#222222";
  if (coupon.minOrderAmount > 0) {
    ctx.fillText(`Spend $${coupon.minOrderAmount}+ USD`, rx, 122);
  } else {
    ctx.fillText("Sin mínimo de compra", rx, 122);
  }

  // Validity
  ctx.font = "500 10px system-ui, sans-serif";
  ctx.fillStyle = "#444444";
  const expStr = coupon.expiresAt
    ? `Vence: ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
    : "Vigencia permanente";
  ctx.fillText(expStr, rx, 142);

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
  const r = 16;
  const notchR = 9;
  const perfX = 110;
  const centerY = h / 2;

  // Top edge with notch at perfX
  ctx.moveTo(r, 0);
  ctx.lineTo(perfX - notchR, 0);
  ctx.arc(perfX, 0, notchR, Math.PI, 0, true);
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);

  // Right edge with center notch
  ctx.lineTo(w, centerY - notchR);
  ctx.arc(w, centerY, notchR, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(w, h - r);
  ctx.arcTo(w, h, w - r, h, r);

  // Bottom edge with notch at perfX
  ctx.lineTo(perfX + notchR, h);
  ctx.arc(perfX, h, notchR, 0, Math.PI, true);
  ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r);

  // Left edge with center notch
  ctx.lineTo(0, centerY + notchR);
  ctx.arc(0, centerY, notchR, Math.PI / 2, -Math.PI / 2, true);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();

  // Subtle soft drop-shadow for floating ticket depth on transparent canvas
  ctx.shadowColor = "rgba(0, 0, 0, 0.16)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;

  // Matte fill
  ctx.fillStyle = th.bg;
  ctx.fill();

  // Reset shadow for sharp text and lines
  ctx.shadowColor = "transparent";

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = th.border;
  ctx.stroke();

  // Vertical Perforation Dashed Line
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = th.text;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(perfX, 10);
  ctx.lineTo(perfX, h - 10);
  ctx.stroke();
  ctx.restore();

  // Left Stub: Vertical 1D Linear Barcode
  drawVerticalBarcode(ctx, coupon.code, 20, 20, 68, 130, th.text);

  // Right Main Body
  ctx.fillStyle = th.text;
  ctx.strokeStyle = th.text;

  // Cursive title ("Lumina Home", without accent)
  ctx.font = "italic 28px 'Pinyon Script', 'Alex Brush', 'Caveat', cursive, Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("Lumina Home", 126, 48);

  // Uppercase Display Serif: "CUPÓN DE TIENDA"
  ctx.font = "bold 12.5px 'Playfair Display', Georgia, 'Times New Roman', serif";
  ctx.fillText("CUPÓN DE TIENDA", 126, 70);

  // Horizontal Dashed Line across the ticket body
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(126, 94);
  ctx.lineTo(434, 94);
  ctx.stroke();
  ctx.restore();

  // Store URL: "WWW.LUMINAHOME.COM" (Left-aligned under dashed line)
  ctx.font = "bold 10.5px system-ui, -apple-system, monospace";
  ctx.globalAlpha = 0.92;
  ctx.textAlign = "left";
  ctx.fillText("WWW.LUMINAHOME.COM", 126, 124);
  ctx.globalAlpha = 1;

  // Right Sub-Area: Oval / Ellipse Discount Badge (Safe distance at cx=380, rx=54, ry=33, ample margin)
  const ovalX = 380;
  const ovalY = 56;
  const ovalRx = 54;
  const ovalRy = 33;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(ovalX, ovalY, ovalRx, ovalRy, 0, 0, Math.PI * 2);
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Text inside oval (Spanish copies: OBTÉN DESCUENTO)
  ctx.textAlign = "center";
  ctx.font = "700 8.5px 'Playfair Display', Georgia, serif";
  ctx.fillText("OBTÉN", ovalX, ovalY - 13);

  ctx.font = "800 9.5px 'Playfair Display', Georgia, serif";
  ctx.fillText("DESCUENTO", ovalX, ovalY + 1);

  ctx.font = "900 18px 'Playfair Display', Georgia, serif";
  const ovalDisc = coupon.discountType === "free_shipping" ? "100%" : `${coupon.discountPercent}%`;
  ctx.fillText(ovalDisc, ovalX, ovalY + 21);
  ctx.restore();

  // Date: Right-aligned at x=434 under dashed line, guaranteed buffer from WWW.LUMINAHOME.COM
  ctx.font = "bold 8.5px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "right";
  ctx.globalAlpha = 0.88;
  const dateStr = coupon.expiresAt
    ? `*VÁLIDO HASTA ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}`
    : "*SIN VENCIMIENTO";
  ctx.fillText(dateStr, 434, 124);

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
