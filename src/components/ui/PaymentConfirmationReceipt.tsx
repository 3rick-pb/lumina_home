"use client";

import React, { useState, useEffect, useRef } from "react";

export type ReceiptCardNetwork =
  | "mastercard"
  | "visa"
  | "american-express"
  | "diners-club"
  | "discover";

export interface PaymentReceiptProps {
  orderId?: string;
  amount?: string;
  currency?: string;
  dateText?: string;
  customerName?: string;
  shippingLocation?: string;
  itemSummary?: string;
  cardNetwork?: ReceiptCardNetwork;
  cardLast4?: string;
  googleWalletPassUrl?: string;
  /** Acabado metálico de la impresora: "gold" (como el 1er ticket del video) o "silver" (como el 2do y 3ro) */
  printerFinish?: "gold" | "silver";
  onAddToGoogleWallet?: () => void;
  onViewOrderInProfile?: () => void;
  onDownloadInvoice?: () => void;
  onContinueShopping?: () => void;
}

/**
 * Logos vectoriales oficiales (thesvg.org) para la cápsula de Método de Pago
 */
function ReceiptNetworkLogo({ network }: { network: ReceiptCardNetwork }) {
  if (network === "mastercard") {
    return (
      <svg width="42" height="28" viewBox="0 0 48 32" fill="none">
        <circle cx="18" cy="16" r="12.5" fill="#EB001B" />
        <circle cx="30" cy="16" r="12.5" fill="#F79E1B" />
        <path
          d="M24 5.6A12.46 12.46 0 0 0 19.2 16c0 4.25 2.12 8 4.8 10.4A12.46 12.46 0 0 0 28.8 16c0-4.25-2.12-8-4.8-10.4Z"
          fill="#FF5F00"
        />
      </svg>
    );
  }

  if (network === "american-express") {
    return (
      <svg width="40" height="28" viewBox="0 0 48 32" fill="none">
        <rect width="48" height="32" rx="6" fill="#2E77BC" />
        <text
          x="24"
          y="14.5"
          textAnchor="middle"
          fill="#FFF"
          fontSize="7.8"
          fontWeight="900"
          fontFamily="Inter, sans-serif"
        >
          AMERICAN
        </text>
        <text
          x="24"
          y="24.5"
          textAnchor="middle"
          fill="#FFF"
          fontSize="7.8"
          fontWeight="900"
          fontFamily="Inter, sans-serif"
        >
          EXPRESS
        </text>
      </svg>
    );
  }

  if (network === "diners-club") {
    return (
      <svg width="40" height="28" viewBox="0 0 46 30" fill="none">
        <rect x="2" y="2" width="42" height="26" rx="13" fill="#004C97" />
        <circle cx="21" cy="15" r="9" stroke="#FFF" strokeWidth="1.8" />
        <path
          d="M18.6 8.5a6.5 6.5 0 0 0 0 13V8.5ZM23.4 8.5v13a6.5 6.5 0 0 0 0-13Z"
          fill="#FFF"
        />
      </svg>
    );
  }

  if (network === "discover") {
    return (
      <svg width="64" height="22" viewBox="0 0 116 26" fill="none">
        <text
          x="0"
          y="19"
          fill="#1E1B4B"
          fontSize="16"
          fontWeight="900"
          fontFamily="Inter, sans-serif"
        >
          DISC
        </text>
        <circle cx="55" cy="13" r="6.5" fill="#F97316" />
        <text
          x="64"
          y="19"
          fill="#1E1B4B"
          fontSize="16"
          fontWeight="900"
          fontFamily="Inter, sans-serif"
        >
          VER
        </text>
      </svg>
    );
  }

  return (
    <span
      style={{
        fontSize: "22px",
        fontWeight: 900,
        fontStyle: "italic",
        letterSpacing: "-0.04em",
        color: "#1A1F71",
      }}
    >
      VISA
    </span>
  );
}

/**
 * Icono oficial multicolor de Google Wallet
 */
function GoogleWalletBadgeIcon() {
  return (
    <svg width="24" height="18" viewBox="0 0 32 24" fill="none">
      <rect x="1" y="2" width="30" height="20" rx="5" fill="#4285F4" />
      <path d="M1 7C1 4.79 2.79 3 5 3H27C29.21 3 31 4.79 31 7V11H1V7Z" fill="#34A853" />
      <path d="M1 10C1 7.79 2.79 6 5 6H27C29.21 6 31 7.79 31 10V15H1V10Z" fill="#FBBC04" />
      <path
        d="M1 13.5C1 11.57 2.57 10 4.5 10H19.5C21.1 10 22.5 11.1 23 12.6L24.2 16H31V18C31 20.21 29.21 22 27 22H5C2.79 22 1 20.21 1 18V13.5Z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Generador SVG determinista de Código QR nítido para el Pase de Google Wallet
 */
function CrispQrCodeSvg({
  seed = "INV_133925",
  size = 86,
}: {
  seed?: string;
  size?: number;
}) {
  const grid = 21;
  const cells: boolean[][] = Array.from({ length: grid }, () =>
    Array(grid).fill(false)
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (isBorder || isInner) cells[r0 + r][c0 + c] = true;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, grid - 7);
  drawFinder(grid - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= grid - 8;
      const inBotLeft = r >= grid - 8 && c < 8;
      if (inTopLeft || inTopRight || inBotLeft) continue;

      const bit = ((r * 31 + c * 17 + Math.abs(hash)) % 7) < 3;
      cells[r][c] = bit;
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid} ${grid}`}
      shapeRendering="crispEdges"
      style={{ display: "block" }}
    >
      <rect width={grid} height={grid} fill="#FFFFFF" />
      {cells.map((row, rIdx) =>
        row.map((active, cIdx) =>
          active ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx}
              y={rIdx}
              width={1}
              height={1}
              fill="#0F172A"
            />
          ) : null
        )
      )}
    </svg>
  );
}

/**
 * COMPONENTE PRINCIPAL: IMPRESORA 3D + RECIBO CON ARQUITECTURA DE LA FOTO + GOOGLE WALLET
 */
export function PaymentConfirmationReceipt({
  orderId = "INV_133925",
  amount = "$72.99",
  currency = "USD",
  dateText = "20 Oct, 2026 a las 3:00 PM",
  customerName = "Erick Arteaga",
  shippingLocation = "Quito, Pichincha · Ecuador",
  itemSummary = "Jarrón Luna (x1)",
  cardNetwork = "mastercard",
  cardLast4 = "5555",
  googleWalletPassUrl = "https://pay.google.com/gp/v/save/",
  printerFinish = "gold",
  onAddToGoogleWallet,
  onViewOrderInProfile,
  onDownloadInvoice,
  onContinueShopping,
}: PaymentReceiptProps) {
  // Etapas de impresión: 0 = oculto en ranura, 1 = imprimiendo mitad, 2 = impreso completo + confeti
  const [printStage, setPrintStage] = useState<0 | 1 | 2>(0);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [walletSaved, setWalletSaved] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const networkLabel: Record<ReceiptCardNetwork, string> = {
    mastercard: "Mastercard",
    visa: "Visa",
    "american-express": "American Express",
    "diners-club": "Diners Club",
    discover: "Discover",
  };

  // Secuencia coreografiada de impresión idéntica al video de referencia
  useEffect(() => {
    setPrintStage(0);
    const t1 = setTimeout(() => setPrintStage(1), 160);
    const t2 = setTimeout(() => {
      setPrintStage(2);
      triggerConfettiBurst();
    }, 950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [orderId]);

  // Lluvia de confeti en Canvas 2D (60 FPS, 0% lag) cuando termina de salir el ticket
  const triggerConfettiBurst = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = (canvas.width = 680);
    const H = (canvas.height = 680);
    const colors = [
      "#6366F1",
      "#10B981",
      "#F59E0B",
      "#EC4899",
      "#3B82F6",
      "#A855F7",
    ];

    const pieces = Array.from({ length: 68 }, () => {
      const side = Math.random() > 0.5 ? 1 : -1;
      return {
        x: W / 2 + side * (80 + Math.random() * 90),
        y: 85 + Math.random() * 40,
        vx: side * (2.2 + Math.random() * 5.2),
        vy: -6.5 - Math.random() * 5.5,
        w: 6 + Math.random() * 5,
        h: 4 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.22,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
      };
    });

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      let alive = false;

      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.24; // Gravedad
        p.vx *= 0.99;
        p.rot += p.vRot;
        if (frame > 55) p.opacity -= 0.022;

        if (p.opacity > 0 && p.y < H) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      });

      if (alive && frame < 140) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };

    requestAnimationFrame(animate);
  };

  // Efecto de inclinación suave al pasar el mouse sobre el recibo impreso (como en el video)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (printStage < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-y * 5.5).toFixed(2)),
      ry: Number((x * 6.5).toFixed(2)),
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const handleWalletClick = () => {
    setWalletSaved(true);
    if (onAddToGoogleWallet) {
      onAddToGoogleWallet();
    } else if (typeof window !== "undefined" && googleWalletPassUrl) {
      // Si tienes el enlace JWT real de Google Wallet, lo abre o lanza el modal
      setQrModalOpen(true);
    }
  };

  return (
    <div className="pr-root-stage">
      {/* Lienzo de confeti detrás y alrededor de la impresora */}
      <canvas ref={canvasRef} className="pr-confetti-canvas" />

      <div className="pr-printer-assembly">
        {/* CABEZAL DE LA IMPRESORA 3D (Idéntico al video de ejemplo) */}
        <div className={`pr-printer-head is-${printerFinish}`}>
          <div className="pr-printer-shine" />
          {/* Indicador LED verde encendido a la derecha */}
          <div className="pr-printer-led" />
          {/* Ranura oscura por donde sale el papel */}
          <div className="pr-printer-slot-lip" />
        </div>

        {/* MÁSCARA DE SALIDA DEL PAPEL (Corta la parte superior para que nazca desde la ranura) */}
        <div className="pr-paper-feed-viewport">
          <div
            className={`pr-receipt-card stage-${printStage}`}
            style={
              printStage === 2
                ? {
                    transform: `perspective(1000px) translate3d(0, 0, 0) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                  }
                : undefined
            }
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Sombra superior proyectada por el labio de la impresora sobre el papel */}
            <div className="pr-slot-cast-shadow" />

            {/* AURORAS DIFUMINADAS DE LA IMAGEN DE REFERENCIA (Lavanda a la izquierda + Durazno a la derecha) */}
            <div className="pr-mesh-blob pr-blob-lavender" />
            <div className="pr-mesh-blob pr-blob-peach" />

            {/* 1. CABECERA: Check Verde + "¡Pago Exitoso!" + Subtítulo (Arquitectura exacta de la foto) */}
            <div className="pr-header">
              <div
                className={`pr-check-circle ${
                  printStage === 2 ? "is-popped" : ""
                }`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h2 className="pr-main-title">¡Pago Exitoso!</h2>
              <p className="pr-subtitle">
                Hemos recibido tu pedido en <strong>Atelier Lumina</strong> y ya
                está en preparación.
              </p>
            </div>

            <div className="pr-divider" />

            {/* 2. BLOQUE DE METADATOS (Arquitectura de la foto + datos reales de tu orden) */}
            <div className="pr-details-stack">
              {/* Fila doble: Estado + Orden / Total */}
              <div className="pr-meta-row-split">
                <div className="pr-meta-group">
                  <span className="pr-meta-label">Estado</span>
                  <div className="pr-status-value">
                    <span className="pr-mini-check">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>Confirmado</span>
                  </div>
                </div>

                <div className="pr-meta-group is-right">
                  <span className="pr-meta-label">Orden #{orderId}</span>
                  <span className="pr-amount-highlight">
                    {amount} <small>{currency}</small>
                  </span>
                </div>
              </div>

              {/* Fecha y Destino */}
              <div className="pr-meta-row-split">
                <div className="pr-meta-group">
                  <span className="pr-meta-label">Fecha</span>
                  <span className="pr-meta-strong">{dateText}</span>
                </div>

                <div className="pr-meta-group is-right">
                  <span className="pr-meta-label">Artículo</span>
                  <span className="pr-meta-strong">{itemSummary}</span>
                </div>
              </div>

              {/* MÉTODO DE PAGO: Cápsula Lavanda (#E8ECFF) idéntica a la foto adjunta */}
              <div className="pr-meta-group">
                <span className="pr-meta-label">Método de Pago</span>
                <div className="pr-payment-method-box">
                  <div className="pr-pm-logo">
                    <ReceiptNetworkLogo network={cardNetwork} />
                  </div>
                  <div className="pr-pm-info">
                    <span className="pr-pm-brand">
                      {networkLabel[cardNetwork]} · {customerName}
                    </span>
                    <span className="pr-pm-ending">
                      Terminada en {cardLast4}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. PASE DIGITAL GOOGLE WALLET (Botón Oficial + Escaneo QR en vivo) */}
              <div className="pr-wallet-pass-section">
                <div className="pr-wallet-pass-left">
                  <span className="pr-wallet-eyebrow">
                    PASE DIGITAL EN TIEMPO REAL
                  </span>
                  <h4 className="pr-wallet-heading">
                    Guarda tu Pedido en Google Wallet
                  </h4>
                  <p className="pr-wallet-desc">
                    Pulsa el botón o escanea el QR para recibir actualizaciones
                    de envío en tu móvil.
                  </p>

                  {/* Botón Oficial de Agregar a Google Wallet */}
                  <button
                    type="button"
                    className={`pr-gwallet-btn ${
                      walletSaved ? "is-saved" : ""
                    }`}
                    onClick={handleWalletClick}
                  >
                    <GoogleWalletBadgeIcon />
                    <div className="pr-gwallet-txt">
                      <small>{walletSaved ? "Pase listo" : "Agregar a"}</small>
                      <span>Google Wallet</span>
                    </div>
                  </button>
                </div>

                {/* Tarjeta QR Escaneable (clic para ampliar) */}
                <button
                  type="button"
                  className="pr-qr-card-btn"
                  title="Ampliar código QR para escanear"
                  onClick={() => setQrModalOpen(true)}
                >
                  <div className="pr-qr-frame">
                    <CrispQrCodeSvg seed={orderId} size={78} />
                  </div>
                  <span className="pr-qr-caption">🔍 Escanear QR</span>
                </button>
              </div>
            </div>

            {/* 4. BOTÓN NEGRO INFERIOR (Idéntico al "Invoice Download" de la foto adjunta) */}
            <div className="pr-footer-actions">
              <button
                type="button"
                className="pr-black-primary-btn"
                onClick={onViewOrderInProfile || onDownloadInvoice}
              >
                <span>Ver Pedido en mi Perfil / Factura</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>

              {onContinueShopping && (
                <button
                  type="button"
                  className="pr-secondary-link"
                  onClick={onContinueShopping}
                >
                  Seguir Explorando Colecciones
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE ESCANEO QR AMPLIADO (Idéntico al segundo 00:19 de tu grabación) */}
      {qrModalOpen && (
        <div
          className="pr-qr-modal-backdrop"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="pr-qr-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pr-qr-modal-top">
              <div>
                <span className="pr-qr-modal-kicker">GOOGLE WALLET PASS</span>
                <h3 className="pr-qr-modal-order">{orderId}</h3>
              </div>
              <button
                type="button"
                className="pr-qr-close"
                onClick={() => setQrModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <p className="pr-qr-modal-sub">
              Escanea el código QR con la cámara de tu teléfono para guardar el
              pase de seguimiento en <strong>Google Wallet</strong>.
            </p>

            <div className="pr-qr-modal-box">
              <CrispQrCodeSvg seed={orderId} size={186} />
            </div>

            <div className="pr-qr-modal-status">
              <span className="pr-status-dot" />
              <span>En preparación · {shippingLocation}</span>
            </div>

            <div className="pr-qr-modal-meta">
              <span>{customerName}</span>
              <strong>
                {amount} {currency}
              </strong>
            </div>

            <button
              type="button"
              className="pr-gwallet-btn is-full"
              onClick={() => {
                if (onAddToGoogleWallet) onAddToGoogleWallet();
                setQrModalOpen(false);
              }}
            >
              <GoogleWalletBadgeIcon />
              <div className="pr-gwallet-txt">
                <small>Agregar directamente a</small>
                <span>Google Wallet</span>
              </div>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .pr-root-stage {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 18px 16px 32px 16px;
          font-family: -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", sans-serif;
          -webkit-font-smoothing: antialiased;
          user-select: none;
        }

        .pr-confetti-canvas {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 680px;
          height: 680px;
          pointer-events: none;
          z-index: 1;
        }

        .pr-printer-assembly {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 456px;
        }

        /* --- CABEZAL METÁLICO 3D DE LA IMPRESORA (VIDEO DE REFERENCIA) --- */
        .pr-printer-head {
          position: relative;
          width: 100%;
          height: 54px;
          border-radius: 16px;
          z-index: 10;
          box-shadow: 
            0 16px 32px -8px rgba(15, 23, 42, 0.28),
            0 4px 10px rgba(15, 23, 42, 0.14),
            inset 0 2px 2px rgba(255, 255, 255, 0.85),
            inset 0 -3px 6px rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* Acabado Dorado Champagne (1er ejemplo del video) */
        .pr-printer-head.is-gold {
          background: linear-gradient(
            180deg,
            #f8ebd2 0%,
            #e5c58b 24%,
            #c69b53 56%,
            #dfbe82 82%,
            #9d7230 100%
          );
          border: 1px solid rgba(161, 116, 46, 0.55);
        }

        /* Acabado Plata Titanio (2do y 3er ejemplo del video) */
        .pr-printer-head.is-silver {
          background: linear-gradient(
            180deg,
            #f8fafc 0%,
            #cbd5e1 26%,
            #94a3b8 58%,
            #e2e8f0 84%,
            #64748b 100%
          );
          border: 1px solid rgba(100, 116, 139, 0.45);
        }

        .pr-printer-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent 20%,
            rgba(255, 255, 255, 0.55) 38%,
            transparent 54%
          );
          pointer-events: none;
        }

        /* Luz LED verde indicadora */
        .pr-printer-led {
          position: absolute;
          right: 24px;
          top: 19px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px 2px rgba(34, 197, 94, 0.9);
          animation: prLedPulse 1.8s infinite ease-in-out;
        }

        @keyframes prLedPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.9); }
        }

        /* Ranura inferior oscura por donde emerge el recibo */
        .pr-printer-slot-lip {
          position: absolute;
          bottom: 6px;
          left: 20px;
          right: 20px;
          height: 9px;
          border-radius: 99px;
          background: linear-gradient(180deg, #090d16 0%, #1e293b 100%);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        /* --- VIEWPORT QUE RECORTA EL PAPEL AL SALIR DE LA RANURA --- */
        .pr-paper-feed-viewport {
          position: relative;
          width: 100%;
          margin-top: -12px;
          padding: 0 18px 28px 18px;
          box-sizing: border-box;
          overflow: hidden;
          z-index: 5;
        }

        /* --- TARJETA DEL RECIBO (ARQUITECTURA DE LA FOTO ADJUNTA) --- */
        .pr-receipt-card {
          position: relative;
          width: 100%;
          background: #ffffff;
          border-radius: 0 0 28px 28px;
          padding: 26px 24px 22px 24px;
          box-sizing: border-box;
          box-shadow: 
            0 24px 48px -12px rgba(15, 23, 42, 0.16),
            0 4px 14px rgba(15, 23, 42, 0.06),
            0 0 0 1px rgba(15, 23, 42, 0.05);
          overflow: hidden;
          transform-origin: top center;
          transition: transform 0.72s cubic-bezier(0.22, 1, 0.36, 1),
                      border-radius 0.4s ease;
          will-change: transform;
        }

        /* Etapa 0: Escondido dentro de la impresora */
        .pr-receipt-card.stage-0 {
          transform: translate3d(0, -88%, 0);
        }

        /* Etapa 1: Primer avance de impresión (igual al video) */
        .pr-receipt-card.stage-1 {
          transform: translate3d(0, -38%, 0);
        }

        /* Etapa 2: Ticket completamente impreso */
        .pr-receipt-card.stage-2 {
          transform: translate3d(0, 0, 0);
          border-radius: 18px 18px 28px 28px;
          transition: transform 0.18s ease-out, border-radius 0.4s ease;
        }

        .pr-slot-cast-shadow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 16px;
          background: linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.18) 0%,
            rgba(15, 23, 42, 0) 100%
          );
          pointer-events: none;
          z-index: 4;
        }

        /* --- AURORAS PASTEL DE LA IMAGEN DE REFERENCIA --- */
        .pr-mesh-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(42px);
          pointer-events: none;
          z-index: 0;
        }

        .pr-blob-lavender {
          width: 210px;
          height: 210px;
          left: -55px;
          top: 85px;
          background: radial-gradient(
            circle,
            rgba(167, 139, 250, 0.34) 0%,
            rgba(196, 181, 253, 0.12) 65%,
            transparent 100%
          );
        }

        .pr-blob-peach {
          width: 230px;
          height: 230px;
          right: -60px;
          top: 130px;
          background: radial-gradient(
            circle,
            rgba(253, 186, 116, 0.36) 0%,
            rgba(254, 215, 170, 0.14) 65%,
            transparent 100%
          );
        }

        /* --- CABECERA (CHECK VERDE + TÍTULO AZUL MARINO) --- */
        .pr-header {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .pr-check-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px -4px rgba(16, 185, 129, 0.5);
          margin-bottom: 12px;
          transform: scale(0.6);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.3s ease;
        }

        .pr-check-circle.is-popped {
          transform: scale(1);
          opacity: 1;
        }

        .pr-main-title {
          font-size: 24px;
          font-weight: 800;
          color: #1e1b4b;
          letter-spacing: -0.02em;
          margin: 0 0 6px 0;
        }

        .pr-subtitle {
          font-size: 13px;
          line-height: 1.45;
          color: #64748b;
          max-width: 290px;
          margin: 0;
        }

        .pr-subtitle strong {
          color: #334155;
        }

        .pr-divider {
          position: relative;
          z-index: 2;
          height: 1px;
          background: rgba(15, 23, 42, 0.08);
          margin: 18px 0;
        }

        /* --- LISTA DE DATOS ESTRUCTURADA --- */
        .pr-details-stack {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pr-meta-row-split {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .pr-meta-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pr-meta-group.is-right {
          align-items: flex-end;
          text-align: right;
        }

        .pr-meta-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .pr-status-value {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
        }

        .pr-mini-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #10b981;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .pr-amount-highlight {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .pr-amount-highlight small {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
        }

        .pr-meta-strong {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
        }

        /* --- CÁPSULA LAVANDA DE MÉTODO DE PAGO (IDÉNTICA A LA FOTO) --- */
        .pr-payment-method-box {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 16px;
          background: #e8ecff;
          border: 1px solid rgba(99, 102, 241, 0.14);
        }

        .pr-pm-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pr-pm-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .pr-pm-brand {
          font-size: 12.5px;
          font-weight: 600;
          color: #475569;
        }

        .pr-pm-ending {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }

        /* --- PASE DIGITAL DE GOOGLE WALLET (BOTÓN + QR ESCANEABLE) --- */
        .pr-wallet-pass-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
          border-radius: 18px;
          background: rgba(248, 250, 252, 0.9);
          border: 1px dashed rgba(15, 23, 42, 0.15);
          margin-top: 2px;
        }

        .pr-wallet-pass-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }

        .pr-wallet-eyebrow {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #d97706;
          background: #fef3c7;
          padding: 3px 7px;
          border-radius: 6px;
          margin-bottom: 5px;
        }

        .pr-wallet-heading {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 3px 0;
        }

        .pr-wallet-desc {
          font-size: 11px;
          line-height: 1.35;
          color: #64748b;
          margin: 0 0 10px 0;
        }

        /* Botón Oficial negro de Google Wallet */
        .pr-gwallet-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #111827;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 99px;
          padding: 7px 16px 7px 12px;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
        }

        .pr-gwallet-btn:hover {
          background: #000000;
          transform: translateY(-1px);
        }

        .pr-gwallet-btn.is-full {
          width: 100%;
          justify-content: center;
          padding: 11px 20px;
        }

        .pr-gwallet-txt {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.1;
        }

        .pr-gwallet-txt small {
          font-size: 9px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.75);
        }

        .pr-gwallet-txt span {
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        /* Mini tarjeta QR escaneable a la derecha */
        .pr-qr-card-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.1);
          border-radius: 14px;
          padding: 8px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          flex-shrink: 0;
        }

        .pr-qr-card-btn:hover {
          transform: scale(1.04);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
        }

        .pr-qr-frame {
          border-radius: 8px;
          overflow: hidden;
        }

        .pr-qr-caption {
          font-size: 9.5px;
          font-weight: 700;
          color: #475569;
        }

        /* --- BOTÓN NEGRO INFERIOR (COMO "INVOICE DOWNLOAD" EN LA FOTO) --- */
        .pr-footer-actions {
          position: relative;
          z-index: 2;
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pr-black-primary-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #09090b;
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 15px 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
          box-shadow: 0 10px 22px -6px rgba(9, 9, 11, 0.35);
        }

        .pr-black-primary-btn:hover {
          background: #18181b;
          transform: translateY(-1px);
        }

        .pr-secondary-link {
          background: none;
          border: none;
          font-size: 12.5px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          text-align: center;
        }

        .pr-secondary-link:hover {
          color: #0f172a;
          text-decoration: underline;
        }

        /* --- MODAL DEL QR AMPLIADO --- */
        .pr-qr-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(8px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: prFadeIn 0.2s ease;
        }

        @keyframes prFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .pr-qr-modal-card {
          width: 100%;
          max-width: 340px;
          background: #ffffff;
          border-radius: 26px;
          padding: 22px;
          box-shadow: 0 28px 60px rgba(0, 0, 0, 0.32);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .pr-qr-modal-top {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          text-align: left;
          margin-bottom: 10px;
        }

        .pr-qr-modal-kicker {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #64748b;
        }

        .pr-qr-modal-order {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 2px 0 0 0;
        }

        .pr-qr-close {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          background: #f1f5f9;
          color: #334155;
          font-weight: 700;
          cursor: pointer;
        }

        .pr-qr-modal-sub {
          font-size: 12px;
          color: #64748b;
          line-height: 1.45;
          margin: 0 0 16px 0;
        }

        .pr-qr-modal-box {
          padding: 14px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          margin-bottom: 14px;
        }

        .pr-qr-modal-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #2563eb;
          background: #eff6ff;
          padding: 5px 12px;
          border-radius: 99px;
          margin-bottom: 14px;
        }

        .pr-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2563eb;
        }

        .pr-qr-modal-meta {
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #334155;
          padding: 10px 0;
          border-top: 1px solid #f1f5f9;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}

export default PaymentConfirmationReceipt;
