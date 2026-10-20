"use client";

import React, { useState, useEffect } from "react";

export interface WalletCardItem {
  id: string;
  brand?: string;
  tier?: string;
  name: string;
  last4: string;
  balanceInt: string;
  balanceDec: string;
  /** Cualquier gradiente o color CSS real de la tarjeta */
  background: string;
  /** Color opcional para la luz sobre el cuero y el punto indicador (si no se envía, usa el mismo background de la tarjeta) */
  pocketGlow?: string;
  dotColor?: string;
  darkText?: boolean;
  holographic?: boolean;
}

const DEFAULT_CARDS: WalletCardItem[] = [
  {
    id: "signature-black",
    brand: "VISA",
    tier: "SIGNATURE BLACK",
    name: "VISA Signature Black",
    last4: "4829",
    balanceInt: "4,018",
    balanceDec: ".00",
    background:
      "radial-gradient(circle at 88% 30%, rgba(155, 44, 62, 0.35) 0%, transparent 55%), linear-gradient(180deg, #36373b 0%, #242528 100%)",
    pocketGlow:
      "radial-gradient(circle at 76% 78%, rgba(190, 24, 24, 0.90) 0%, rgba(125, 18, 18, 0.52) 44%, transparent 76%), linear-gradient(165deg, rgba(39,39,43,0.86) 0%, rgba(22,22,25,0.92) 52%, rgba(78,16,16,0.94) 100%)",
    dotColor: "#ef4444",
    darkText: false,
  },
  {
    id: "holo-prism",
    brand: "VISA",
    tier: "HOLO PRISM",
    name: "VISA Holo Prism Platinum",
    last4: "3109",
    balanceInt: "2,640",
    balanceDec: ".50",
    background:
      "linear-gradient(100deg, #e6e7e9 0%, #ededef 50%, #cfd6e3 100%)",
    pocketGlow:
      "radial-gradient(circle at 74% 76%, rgba(56, 152, 236, 0.78) 0%, rgba(234, 152, 62, 0.62) 44%, transparent 78%), linear-gradient(165deg, rgba(42,45,52,0.85) 0%, rgba(24,26,32,0.90) 52%, rgba(30,58,95,0.94) 100%)",
    dotColor: "#38bdf8",
    darkText: true,
    holographic: true,
  },
  {
    id: "horizon-gold",
    brand: "VISA",
    tier: "HORIZON GOLD",
    name: "VISA Horizon Gold VIP",
    last4: "5514",
    balanceInt: "8,920",
    balanceDec: ".00",
    background:
      "radial-gradient(circle at 78% 42%, rgba(228, 156, 74, 0.95) 0%, rgba(168, 95, 42, 0.68) 38%, transparent 70%), linear-gradient(108deg, #1b2848 0%, #24355c 46%, #7c4d34 100%)",
    pocketGlow:
      "radial-gradient(circle at 76% 78%, rgba(224, 132, 44, 0.88) 0%, rgba(36, 68, 128, 0.62) 48%, transparent 78%), linear-gradient(165deg, rgba(34,38,48,0.86) 0%, rgba(22,24,30,0.92) 52%, rgba(78,44,16,0.94) 100%)",
    dotColor: "#f59e0b",
    darkText: false,
  },
];

interface Wallet3DProps {
  cards?: WalletCardItem[];
  selectedCardId?: string;
  onSelectCard?: (card: WalletCardItem) => void;
}

export default function Wallet3D({
  cards = DEFAULT_CARDS,
  selectedCardId,
  onSelectCard,
}: Wallet3DProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(
    selectedCardId || cards[0]?.id || "signature-black"
  );

  useEffect(() => {
    if (selectedCardId) setActiveId(selectedCardId);
  }, [selectedCardId]);

  const activeCard =
    cards.find((c) => c.id === activeId) || cards[0] || DEFAULT_CARDS[0];

  // Ordena para que la tarjeta seleccionada siempre quede en slot-front (justo detrás del bolsillo)
  const orderedCards = [
    activeCard,
    ...cards.filter((c) => c.id !== activeCard.id),
  ];

  // Calcula dinámicamente la altura al abrirse según la cantidad de tarjetas (2, 3 o más)
  const openHeight = Math.max(450, 276 + orderedCards.length * 80);

  const handleCardClick = (e: React.MouseEvent, card: WalletCardItem) => {
    e.stopPropagation();
    if (!isOpen) {
      setIsOpen(true);
      return;
    }
    setActiveId(card.id);
    if (onSelectCard) onSelectCard(card);
    setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  return (
    <div className="w1-root">
      <div
        className={`w1-shell ${isOpen ? "is-open" : ""}`}
        style={{ height: isOpen ? `${openHeight}px` : "364px" }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="w1-cavity">
          {/* Título superior */}
          <div className="w1-header">
            <span className="w1-title">Wallet</span>
          </div>

          {/* 4ta tarjeta blanca que asoma a la derecha cuando está cerrada */}
          <div className="w1-peek-card" />

          {/* Lista de Tarjetas */}
          <div className="w1-cards-stage">
            {orderedCards.map((card, idx) => {
              const isSelected = card.id === activeCard.id;

              // Slot visual: 0 = Frente, 1 = Medio, 2 = Fondo
              const slotClass =
                idx === 0
                  ? "slot-front"
                  : idx === 1
                  ? "slot-mid"
                  : "slot-back";

              // Cuando está abierta, se ordenan de arriba hacia abajo sin tapar "Wallet"
              const reverseIndex = orderedCards.length - 1 - idx;
              const openTop = 46 + reverseIndex * 80;
              const openScale = 1 - idx * 0.018;

              const brandText = (card.brand || "VISA").toUpperCase();
              const isLongBrand = brandText.length > 5; // Ej. MASTERCARD

              return (
                <div
                  key={card.id}
                  className={`w1-card ${slotClass} ${
                    card.darkText ? "is-light-card" : ""
                  } ${isSelected ? "is-active" : ""}`}
                  style={{
                    background: card.background,
                    zIndex: 10 - idx,
                    ...(isOpen
                      ? {
                          top: `${openTop}px`,
                          transform: `translate3d(0, 0, 0) rotate(0deg) scale(${openScale})`,
                        }
                      : {}),
                  }}
                  onClick={(e) => handleCardClick(e, card)}
                >
                  {card.holographic && <div className="w1-holo-rainbow" />}

                  {/* Fila Superior: Logo + Etiqueta */}
                  <div className="w1-card-top">
                    <span
                      className={`w1-brand-logo ${
                        card.holographic ? "w1-chromatic-logo" : ""
                      } ${isLongBrand ? "w1-brand-compact" : ""}`}
                    >
                      {brandText}
                    </span>

                    <span className="w1-tier-pill">
                      {card.tier || card.name}
                    </span>
                  </div>

                  {/* Fila Media: Número enmascarado */}
                  <div className="w1-card-mid">
                    <span className="w1-masked-num">
                      •••• &nbsp;•••• &nbsp;•••• &nbsp;
                      <strong>{card.last4}</strong>
                    </span>
                  </div>

                  {/* Fila Inferior: Saldo disponible + Estado */}
                  <div className="w1-card-bottom">
                    <span className="w1-card-disp">
                      SALDO DISP.{" "}
                      <strong>
                        ${card.balanceInt}
                        {card.balanceDec}
                      </strong>
                    </span>
                    <span
                      className={`w1-status-tag ${
                        isSelected ? "is-active-tag" : ""
                      }`}
                    >
                      {isSelected ? "Activa" : "Elegir"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bolsillo delantero de cuero cosido */}
          <div className="w1-leather-pocket">
            {/* Reflejo dinámico: usa el pocketGlow o directamente el background real de la tarjeta */}
            <div
              className="w1-pocket-color-engine"
              style={{
                background: activeCard.pocketGlow || activeCard.background,
              }}
            />

            {/* Sombra base del cuero para mantener contraste de lectura */}
            <div className="w1-pocket-leather-vignette" />

            {/* Tubo de luz especular 3D izquierdo + Bisel acolchado */}
            <div className="w1-specular-highlight" />
            <div className="w1-padded-bevel" />

            {/* Costura perimetral en relieve (SVG puro sin lag) */}
            <svg
              className="w1-stitching-svg"
              viewBox="0 0 360 192"
              fill="none"
              preserveAspectRatio="none"
            >
              <rect
                x="10"
                y="11"
                width="340"
                height="171"
                rx="29"
                stroke="rgba(0, 0, 0, 0.85)"
                strokeWidth="2.4"
                strokeDasharray="6.5 5.5"
                strokeLinecap="round"
              />
              <rect
                x="10"
                y="10"
                width="340"
                height="171"
                rx="29"
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth="1.5"
                strokeDasharray="6.5 5.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Contenido del bolsillo: Balance + Píldora inferior */}
            <div className="w1-pocket-content">
              <span className="w1-balance-title">Total balance</span>
              <div className="w1-balance-value">
                <span className="w1-sym">$</span>
                <span className="w1-int">{activeCard.balanceInt}</span>
                <span className="w1-dec">{activeCard.balanceDec}</span>
              </div>

              {/* Píldora inferior idéntica al primer prototipo */}
              <div className="w1-active-card-pill">
                <span
                  className="w1-pill-dot"
                  style={{
                    background: activeCard.dotColor || "#ef4444",
                    boxShadow: `0 0 8px ${activeCard.dotColor || "#ef4444"}`,
                  }}
                />
                <span className="w1-pill-text">
                  {activeCard.name} •••• {activeCard.last4}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .w1-root {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 8px 0;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
          -webkit-font-smoothing: antialiased;
          user-select: none;
        }

        /* Carcasa gris plata (se expande hacia abajo sin invadir arriba) */
        .w1-shell {
          position: relative;
          width: 384px;
          height: 364px;
          border-radius: 52px;
          background: linear-gradient(180deg, #c6c8ca 0%, #b4b6b9 100%);
          padding: 12px;
          box-sizing: border-box;
          box-shadow: 
            0 24px 48px -12px rgba(0, 0, 0, 0.30),
            0 4px 12px rgba(0, 0, 0, 0.10),
            inset 0 1.5px 1px rgba(255, 255, 255, 0.78);
          cursor: pointer;
          transition: height 0.52s cubic-bezier(0.22, 1, 0.36, 1), transform 0.25s ease;
          transform: translateZ(0);
          will-change: height;
        }

        /* Cavidad interior carbón */
        .w1-cavity {
          position: relative;
          width: 100%;
          height: 100%;
          background: #2b2c2f;
          border-radius: 40px;
          overflow: hidden;
          box-shadow: inset 0 6px 16px rgba(0, 0, 0, 0.65);
        }

        .w1-header {
          position: relative;
          z-index: 2;
          text-align: center;
          padding-top: 15px;
        }

        .w1-title {
          font-size: 19px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #8c8e93;
        }

        /* 4ta tarjeta blanca que asoma a la derecha */
        .w1-peek-card {
          position: absolute;
          width: 274px;
          height: 168px;
          left: 56px;
          top: 70px;
          border-radius: 25px;
          background: linear-gradient(135deg, #f1f2f4 0%, #dcdfe4 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.92);
          transform: rotate(14.5deg);
          transform-origin: bottom right;
          transition: transform 0.48s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease;
          z-index: 1;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.25);
        }

        .w1-shell.is-open .w1-peek-card {
          opacity: 0;
          transform: translateY(35px) rotate(22deg);
        }

        .w1-cards-stage {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
        }

        /* Tarjeta individual */
        .w1-card {
          position: absolute;
          left: 19px;
          width: 322px;
          height: 182px;
          border-radius: 25px;
          padding: 16px 20px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: auto;
          cursor: pointer;
          color: #ffffff;
          border: 1.6px solid rgba(255, 255, 255, 0.88);
          box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.38);
          transition: 
            top 0.52s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.52s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.3s ease;
          will-change: top, transform;
          overflow: hidden;
        }

        .w1-card.is-light-card {
          color: #1c1d20;
          border-color: rgba(255, 255, 255, 0.98);
        }

        /* --- POSICIONES CERRADAS (CLON 1:1 DE PINTEREST) --- */
        .w1-card.slot-back {
          top: 48px;
          transform: translate3d(4px, 0, 0) rotate(-9.4deg);
          transform-origin: bottom left;
        }

        .w1-card.slot-mid {
          top: 74px;
          transform: translate3d(0, 0, 0) rotate(-3.2deg);
          transform-origin: bottom left;
        }

        .w1-card.slot-front {
          top: 104px;
          transform: translate3d(0, 0, 0) rotate(0deg);
          transform-origin: center center;
        }

        /* Micro-interacción al pasar el mouse cuando está cerrada (como en el seg 00:25 del video) */
        .w1-shell:not(.is-open):hover .w1-card.slot-back {
          transform: translate3d(2px, -6px, 0) rotate(-10.6deg);
        }
        .w1-shell:not(.is-open):hover .w1-card.slot-mid {
          transform: translate3d(0, -4px, 0) rotate(-4.1deg);
        }
        .w1-shell:not(.is-open):hover .w1-card.slot-front {
          transform: translate3d(0, -2px, 0) rotate(0deg);
        }

        /* Hover sobre cada tarjeta cuando está abierta */
        .w1-shell.is-open .w1-card:hover {
          transform: translate3d(0, -5px, 0) scale(1.01) !important;
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.48);
        }

        /* Destello arcoíris holográfico */
        .w1-holo-rainbow {
          position: absolute;
          top: -20%;
          right: 16px;
          width: 132px;
          height: 150%;
          background: linear-gradient(
            96deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(238, 172, 72, 0.85) 24%,
            rgba(218, 108, 66, 0.75) 40%,
            rgba(65, 118, 215, 0.88) 64%,
            rgba(135, 178, 232, 0.68) 84%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-10deg);
          pointer-events: none;
        }

        /* Contenido interno de las tarjetas */
        .w1-card-top {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .w1-brand-logo {
          font-size: 30px;
          font-weight: 900;
          font-style: italic;
          letter-spacing: -0.04em;
          line-height: 0.9;
        }

        /* Si la marca es larga (ej. MASTERCARD) ajusta el tamaño para que nunca se desborde */
        .w1-brand-compact {
          font-size: 19px;
          letter-spacing: -0.02em;
        }

        .w1-chromatic-logo {
          color: #1d1e21;
          text-shadow: -1.5px -0.5px 0px rgba(228, 148, 54, 0.85),
            1.5px 0.5px 0px rgba(56, 165, 224, 0.75);
        }

        .w1-tier-pill {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 9px;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          white-space: nowrap;
        }

        .w1-card.is-light-card .w1-tier-pill {
          background: rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 0, 0, 0.12);
          color: #1c1d20;
        }

        .w1-card-mid {
          position: relative;
          z-index: 2;
          margin-top: 6px;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .w1-masked-num {
          font-size: 13.5px;
          letter-spacing: 0.12em;
          opacity: 0.85;
          font-variant-numeric: tabular-nums;
        }

        .w1-card-bottom {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .w1-shell.is-open .w1-card-mid,
        .w1-shell.is-open .w1-card-bottom {
          opacity: 1;
          transform: translateY(0);
        }

        .w1-card-disp {
          font-size: 10.5px;
          letter-spacing: 0.04em;
          opacity: 0.85;
        }

        .w1-card-disp strong {
          font-size: 12px;
          margin-left: 3px;
        }

        .w1-status-tag {
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
        }

        .w1-card.is-light-card .w1-status-tag {
          background: rgba(0, 0, 0, 0.12);
          color: #1c1d20;
        }

        .w1-status-tag.is-active-tag {
          background: rgba(16, 185, 129, 0.24) !important;
          color: #34d399 !important;
          border: 1px solid rgba(52, 211, 153, 0.45);
        }

        /* --- BOLSILLO DE CUERO DELANTERO (CLON EXACTO DEL PRIMER PROTOTIPO) --- */
        .w1-leather-pocket {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 192px;
          z-index: 20;
          border-radius: 35px 35px 40px 40px;
          overflow: hidden;
          background: rgba(22, 22, 25, 0.76);
          backdrop-filter: blur(16px) saturate(1.4);
          -webkit-backdrop-filter: blur(16px) saturate(1.4);
          box-shadow: 
            0 -10px 24px rgba(0, 0, 0, 0.55),
            inset 0 1.5px 1px rgba(255, 255, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Motor de color que toma el background/glow de la tarjeta activa */
        .w1-pocket-color-engine {
          position: absolute;
          inset: -15px;
          z-index: 1;
          filter: blur(18px) saturate(1.55);
          opacity: 0.92;
          transition: background 0.45s ease;
          pointer-events: none;
        }

        /* Viñeta de cuero oscuro en la esquina superior izquierda para realismo 3D */
        .w1-pocket-leather-vignette {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: radial-gradient(
            circle at 26% 24%,
            rgba(20, 20, 23, 0.92) 0%,
            rgba(20, 20, 23, 0.65) 48%,
            rgba(20, 20, 23, 0.18) 100%
          );
          pointer-events: none;
        }

        /* Tubo de luz especular 3D izquierdo */
        .w1-specular-highlight {
          position: absolute;
          left: 13px;
          top: 22px;
          bottom: 24px;
          width: 13px;
          border-radius: 99px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.56) 0%,
            rgba(255, 255, 255, 0.22) 45%,
            rgba(255, 255, 255, 0.44) 85%,
            rgba(255, 255, 255, 0.05) 100%
          );
          filter: blur(3.2px);
          z-index: 3;
          pointer-events: none;
        }

        /* Bisel acolchado 3D */
        .w1-padded-bevel {
          position: absolute;
          inset: 0;
          border-radius: 35px 35px 40px 40px;
          box-shadow: 
            inset 0 14px 18px -10px rgba(255, 255, 255, 0.16),
            inset 0 -18px 20px -8px rgba(0, 0, 0, 0.86),
            inset -14px 0 18px -10px rgba(0, 0, 0, 0.68);
          z-index: 3;
          pointer-events: none;
        }

        .w1-stitching-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 4;
          pointer-events: none;
        }

        /* Contenido central del bolsillo */
        .w1-pocket-content {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 6px;
        }

        .w1-balance-title {
          font-size: 15.5px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.58);
          margin-bottom: 2px;
        }

        .w1-balance-value {
          display: flex;
          align-items: baseline;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
        }

        .w1-sym {
          font-size: 33px;
          margin-right: 6px;
        }

        .w1-int {
          font-size: 35px;
        }

        .w1-dec {
          font-size: 23px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.54);
          margin-left: 1px;
        }

        /* Píldora inferior dentro del bolsillo ([ ● VISA Signature Black •••• 4829 ]) */
        .w1-active-card-pill {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4.5px 12px;
          border-radius: 99px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
        }

        .w1-pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }

        .w1-pill-text {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          letter-spacing: -0.01em;
        }
      `}</style>
    </div>
  );
}
