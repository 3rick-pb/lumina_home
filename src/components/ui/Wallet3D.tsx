"use client";

import React, { useState, useRef, useEffect } from "react";

export interface WalletCardItem {
  id: string;
  name: string;
  number: string;
  balanceInt: string;
  balanceDec: string;
  brand?: string;
  /** Cualquier color CSS, hex (#ff0055), rgb() o linear-gradient(...) */
  background: string;
  /** Color opcional para el reflejo en el cuero. Si no se envía, usa el mismo `background` de la tarjeta */
  glowColor?: string;
  /** Si la tarjeta es muy clara (ej. plateada o blanca), pon true para texto oscuro */
  darkText?: boolean;
  /** Opcional: franja holográfica estilo Apple/VISA Holo */
  holographic?: boolean;
}

const DEFAULT_CARDS: WalletCardItem[] = [
  {
    id: "card-charcoal",
    name: "VISA Signature Black",
    number: "•••• 8842",
    balanceInt: "4,018",
    balanceDec: ".00",
    brand: "VISA",
    background:
      "radial-gradient(circle at 92% 35%, rgba(165, 42, 62, 0.45) 0%, transparent 60%), linear-gradient(180deg, #35363a 0%, #252629 100%)",
    glowColor:
      "radial-gradient(circle at 75% 78%, rgba(190, 24, 24, 0.92) 0%, rgba(125, 18, 18, 0.55) 45%, transparent 76%)",
    darkText: false,
  },
  {
    id: "card-holo",
    name: "VISA Holo Edition",
    number: "•••• 3109",
    balanceInt: "2,850",
    balanceDec: ".50",
    brand: "VISA",
    background:
      "linear-gradient(100deg, #e5e6e8 0%, #ededef 50%, #cfd6e3 100%)",
    glowColor:
      "linear-gradient(125deg, rgba(245, 158, 11, 0.85) 0%, rgba(236, 72, 153, 0.75) 35%, rgba(59, 130, 246, 0.9) 70%, rgba(56, 189, 248, 0.8) 100%)",
    darkText: true,
    holographic: true,
  },
  {
    id: "card-navy-gold",
    name: "VISA Infinite Gold",
    number: "•••• 5514",
    balanceInt: "6,420",
    balanceDec: ".75",
    brand: "VISA",
    background:
      "radial-gradient(circle at 78% 42%, rgba(226, 155, 75, 0.95) 0%, rgba(168, 95, 42, 0.65) 38%, transparent 70%), linear-gradient(108deg, #1b2848 0%, #24355c 46%, #7c4d34 100%)",
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
    selectedCardId || cards[0]?.id || ""
  );
  const [balanceLabel, setBalanceLabel] = useState("Total balance");

  // Double-buffer para transicionar suavemente entre CUALQUIER color o gradiente
  const [glowLayers, setGlowLayers] = useState<{
    layerA: string;
    layerB: string;
    activeLayer: "A" | "B";
  }>({
    layerA: cards[0]?.glowColor || cards[0]?.background || "#b91c1c",
    layerB: cards[0]?.glowColor || cards[0]?.background || "#b91c1c",
    activeLayer: "A",
  });

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeCard =
    cards.find((c) => c.id === activeId) || cards[0] || DEFAULT_CARDS[0];

  // Sincroniza si selectedCardId cambia desde afuera (ej. estado global de la tienda)
  useEffect(() => {
    if (selectedCardId && selectedCardId !== activeId) {
      const target = cards.find((c) => c.id === selectedCardId);
      if (target) triggerColorReflection(target);
      setActiveId(selectedCardId);
    }
  }, [selectedCardId, cards]);

  // Extrae el color real de la tarjeta (por prop o leyendo el DOM computado)
  const triggerColorReflection = (card: WalletCardItem) => {
    let realPigment = card.glowColor || card.background;

    // Si la tarjeta fue estilizada con clases externas (ej. Tailwind), lee su estilo real del DOM
    const domNode = cardRefs.current[card.id];
    if (!realPigment && domNode && typeof window !== "undefined") {
      const computed = window.getComputedStyle(domNode);
      realPigment =
        computed.backgroundImage !== "none"
          ? computed.backgroundImage
          : computed.backgroundColor;
    }

    setGlowLayers((prev) =>
      prev.activeLayer === "A"
        ? { ...prev, layerB: realPigment, activeLayer: "B" }
        : { ...prev, layerA: realPigment, activeLayer: "A" }
    );
  };

  const handleCardClick = (e: React.MouseEvent, card: WalletCardItem) => {
    e.stopPropagation();
    if (!isOpen) {
      setIsOpen(true);
      return;
    }

    setActiveId(card.id);
    setBalanceLabel(`${card.brand || "VISA"} ${card.number}`);
    triggerColorReflection(card);

    if (onSelectCard) onSelectCard(card);

    setTimeout(() => {
      setIsOpen(false);
    }, 240);
  };

  // Ordena las tarjetas para que la activa siempre esté al frente (índice 0)
  const orderedCards = [
    activeCard,
    ...cards.filter((c) => c.id !== activeCard.id),
  ];

  return (
    <div className="w3d-stage-wrapper">
      <div
        className={`w3d-gpu-wallet ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {/* MITAD SUPERIOR DEL CHASIS (Se desliza con translate3d sin recalcular height) */}
        <div className="w3d-cap-top">
          <div className="w3d-cap-top-inner">
            <div className="w3d-header">
              <span className="w3d-title">Wallet</span>
              <span className="w3d-hint">
                {isOpen ? "Toca una tarjeta para elegir" : "Toca para abrir"}
              </span>
            </div>
          </div>
        </div>

        {/* MITAD INFERIOR DEL CHASIS */}
        <div className="w3d-cap-bottom">
          <div className="w3d-cap-bottom-inner" />
        </div>

        {/* ESCENARIO DE TARJETAS (100% acelerado por GPU con translate3d) */}
        <div className="w3d-cards-container">
          {/* 4ta tarjeta blanca decorativa que asoma por la derecha */}
          <div className="w3d-peek-card" />

          {orderedCards.map((card, slotIndex) => {
            const isSelected = card.id === activeCard.id;

            // Posición cerrada (clon exacto de la imagen) vs abierta (abanico dinámico)
            let closedTransform = "translate3d(0px, 0px, 0px) rotate(0deg)";
            if (slotIndex === 1) {
              closedTransform = "translate3d(0px, -32px, 0px) rotate(-3.2deg)";
            } else if (slotIndex === 2) {
              closedTransform = "translate3d(4px, -56px, 0px) rotate(-9.2deg)";
            } else if (slotIndex > 2) {
              closedTransform = `translate3d(6px, -${64 + (slotIndex - 2) * 8}px, 0px) rotate(-11deg)`;
            }

            // Cuando se abre, se despliegan en abanico vertical limpio sin importar cuántas sean
            const openY = -72 + (orderedCards.length - 1 - slotIndex) * 64;
            const openScale = 1 - slotIndex * 0.022;
            const openTransform = `translate3d(0px, ${openY}px, 0px) rotate(0deg) scale(${openScale})`;

            return (
              <div
                key={card.id}
                ref={(el) => {
                  cardRefs.current[card.id] = el;
                }}
                className={`w3d-card ${card.darkText ? "w3d-dark-ink" : ""} ${
                  isSelected ? "is-selected" : ""
                }`}
                style={{
                  background: card.background,
                  zIndex: 20 - slotIndex,
                  transform: isOpen ? openTransform : closedTransform,
                }}
                onClick={(e) => handleCardClick(e, card)}
              >
                {card.holographic && <div className="w3d-holo-prism" />}

                <div className="w3d-card-top">
                  <span
                    className={`w3d-visa-logo ${
                      card.holographic ? "w3d-visa-chromatic" : ""
                    }`}
                  >
                    {card.brand || "VISA"}
                  </span>
                  <span className="w3d-card-badge">
                    {isSelected ? "✓ Activa" : "Elegir"}
                  </span>
                </div>

                <div className="w3d-card-bottom">
                  <div className="w3d-card-meta">
                    <span className="w3d-card-name">{card.name}</span>
                    <span className="w3d-card-num">{card.number}</span>
                  </div>
                  <span className="w3d-card-bal">
                    ${card.balanceInt}
                    <small>{card.balanceDec}</small>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOLSILLO DELANTERO DE CUERO COSIDO CON PROYECTOR ÓPTICO DINÁMICO */}
        <div className="w3d-leather-pocket">
          {/* Base de cuero negro profundo */}
          <div className="w3d-leather-base" />

          {/* Proyector Óptico Dinámico (Refleja el color/gradiente REAL de cualquier tarjeta) */}
          <div
            className="w3d-optical-projector"
            style={{
              background: glowLayers.layerA,
              opacity: glowLayers.activeLayer === "A" ? 0.88 : 0,
            }}
          />
          <div
            className="w3d-optical-projector"
            style={{
              background: glowLayers.layerB,
              opacity: glowLayers.activeLayer === "B" ? 0.88 : 0,
            }}
          />

          {/* Tubo de luz especular 3D izquierdo y bisel acolchado */}
          <div className="w3d-specular-left" />
          <div className="w3d-bevel-frame" />

          {/* Costura perimetral en relieve (Geometría SVG pura, 0% CPU) */}
          <svg
            className="w3d-stitching"
            viewBox="0 0 364 196"
            fill="none"
            preserveAspectRatio="none"
          >
            <rect
              x="10"
              y="11"
              width="344"
              height="175"
              rx="30"
              stroke="rgba(0, 0, 0, 0.88)"
              strokeWidth="2.6"
              strokeDasharray="6.5 5.5"
              strokeLinecap="round"
            />
            <rect
              x="10"
              y="10"
              width="344"
              height="175"
              rx="30"
              stroke="rgba(255, 255, 255, 0.28)"
              strokeWidth="1.6"
              strokeDasharray="6.5 5.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Saldo de la tarjeta activa */}
          <div className="w3d-balance-box">
            <span className="w3d-balance-label">{balanceLabel}</span>
            <div className="w3d-balance-amount">
              <span className="w3d-currency">$</span>
              <span className="w3d-int">{activeCard.balanceInt}</span>
              <span className="w3d-dec">{activeCard.balanceDec}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Contenedor con espacio reservado para evitar Layout Reflow en la tienda */
        .w3d-stage-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 520px;
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
          -webkit-font-smoothing: antialiased;
          user-select: none;
          contain: layout style;
          isolation: isolate;
        }

        .w3d-gpu-wallet {
          position: relative;
          width: 392px;
          height: 368px;
          cursor: pointer;
          transform: translate3d(0, 0, 0);
        }

        /* --- CHASIS DIVIDIDO EN 2 CAPAS (0% Reflow, solo translate3d) --- */
        .w3d-cap-top,
        .w3d-cap-bottom {
          position: absolute;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, #c5c7c9 0%, #b4b6b8 100%);
          padding: 13px;
          box-sizing: border-box;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
          backface-visibility: hidden;
        }

        .w3d-cap-top {
          top: 0;
          height: 270px;
          border-radius: 54px 54px 0 0;
          padding-bottom: 0;
          z-index: 1;
          box-shadow: 
            0 -6px 24px rgba(0, 0, 0, 0.08),
            inset 0 1.5px 1px rgba(255, 255, 255, 0.78);
        }

        .w3d-cap-bottom {
          bottom: 0;
          height: 270px;
          border-radius: 0 0 54px 54px;
          padding-top: 0;
          z-index: 2;
          box-shadow: 0 26px 48px -12px rgba(0, 0, 0, 0.34);
        }

        .w3d-cap-top-inner,
        .w3d-cap-bottom-inner {
          width: 100%;
          height: 100%;
          background: #2b2c2f;
        }

        .w3d-cap-top-inner {
          border-radius: 42px 42px 0 0;
          box-shadow: inset 0 6px 16px rgba(0, 0, 0, 0.65);
        }

        .w3d-cap-bottom-inner {
          border-radius: 0 0 42px 42px;
        }

        /* Apertura 100% en GPU: la tapa superior sube y la inferior baja */
        .w3d-gpu-wallet.is-open .w3d-cap-top {
          transform: translate3d(0, -76px, 0);
        }

        .w3d-gpu-wallet.is-open .w3d-cap-bottom {
          transform: translate3d(0, 76px, 0);
        }

        /* Header Wallet */
        .w3d-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 16px;
        }

        .w3d-title {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #8c8e93;
          line-height: 1;
        }

        .w3d-hint {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .w3d-gpu-wallet:hover .w3d-hint,
        .w3d-gpu-wallet.is-open .w3d-hint {
          opacity: 1;
        }

        /* --- CONTENEDOR DE TARJETAS --- */
        .w3d-cards-container {
          position: absolute;
          inset: 13px;
          z-index: 5;
          pointer-events: none;
        }

        /* 4ta tarjeta blanca que asoma a la derecha */
        .w3d-peek-card {
          position: absolute;
          width: 280px;
          height: 170px;
          left: 58px;
          top: 72px;
          border-radius: 26px;
          background: linear-gradient(135deg, #f0f1f3 0%, #dcdfe3 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.92);
          transform: translate3d(0, 0, 0) rotate(14.5deg);
          transform-origin: bottom right;
          transition: transform 0.48s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease;
          z-index: 1;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.25);
          will-change: transform, opacity;
        }

        .w3d-gpu-wallet.is-open .w3d-peek-card {
          opacity: 0;
          transform: translate3d(20px, 40px, 0) rotate(22deg);
        }

        /* Tarjeta individual */
        .w3d-card {
          position: absolute;
          left: 20px;
          top: 108px;
          width: 326px;
          height: 184px;
          border-radius: 26px;
          padding: 18px 22px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: auto;
          cursor: pointer;
          color: #ffffff;
          border: 1.8px solid rgba(255, 255, 255, 0.88);
          box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.38);
          transform-origin: bottom left;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
          backface-visibility: hidden;
          overflow: hidden;
        }

        .w3d-card.w3d-dark-ink {
          color: #1c1d1f;
          border-color: rgba(255, 255, 255, 0.98);
        }

        .w3d-gpu-wallet.is-open .w3d-card:hover {
          filter: brightness(1.06);
        }

        /* Efecto arcoíris para tarjetas holográficas */
        .w3d-holo-prism {
          position: absolute;
          top: -20%;
          right: 18px;
          width: 135px;
          height: 150%;
          background: linear-gradient(
            96deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(238, 172, 72, 0.82) 24%,
            rgba(218, 108, 66, 0.72) 40%,
            rgba(65, 118, 215, 0.85) 64%,
            rgba(135, 178, 232, 0.65) 84%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-10deg) translateZ(0);
          pointer-events: none;
        }

        .w3d-card-top {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .w3d-visa-logo {
          font-size: 31px;
          font-weight: 900;
          font-style: italic;
          letter-spacing: -0.04em;
          line-height: 0.88;
        }

        .w3d-visa-chromatic {
          color: #1d1e21;
          text-shadow: -1.5px -0.5px 0px rgba(228, 148, 54, 0.85),
            1.5px 0.5px 0px rgba(56, 165, 224, 0.75);
        }

        .w3d-card-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 99px;
          background: rgba(0, 0, 0, 0.28);
          color: #fff;
          opacity: 0;
          transition: opacity 0.22s ease;
        }

        .w3d-card.is-selected .w3d-card-badge {
          background: #ffffff;
          color: #111111;
        }

        .w3d-gpu-wallet.is-open .w3d-card-badge {
          opacity: 1;
        }

        .w3d-card-bottom {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          opacity: 0;
          transition: opacity 0.22s ease;
        }

        .w3d-gpu-wallet.is-open .w3d-card-bottom {
          opacity: 1;
        }

        .w3d-card-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .w3d-card-name {
          font-size: 12px;
          font-weight: 600;
          opacity: 0.8;
        }

        .w3d-card-num {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .w3d-card-bal {
          font-size: 18px;
          font-weight: 700;
        }

        .w3d-card-bal small {
          font-size: 13px;
          opacity: 0.68;
        }

        /* --- BOLSILLO DE CUERO DELANTERO + PROYECTOR ÓPTICO DINÁMICO --- */
        .w3d-leather-pocket {
          position: absolute;
          bottom: 13px;
          left: 13px;
          right: 13px;
          height: 196px;
          z-index: 30;
          border-radius: 36px 36px 40px 40px;
          overflow: hidden;
          box-shadow: 
            0 -10px 24px rgba(0, 0, 0, 0.55),
            inset 0 1.5px 1px rgba(255, 255, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
          transform: translate3d(0, 0, 0);
          will-change: transform;
          backface-visibility: hidden;
        }

        .w3d-gpu-wallet.is-open .w3d-leather-pocket {
          transform: translate3d(0, 76px, 0);
        }

        .w3d-leather-base {
          position: absolute;
          inset: 0;
          background: linear-gradient(165deg, #27272b 0%, #161619 62%, #121215 100%);
          z-index: 1;
        }

        /* El Proyector Óptico toma el color/gradiente REAL de la tarjeta y lo difumina en la esquina inferior derecha */
        .w3d-optical-projector {
          position: absolute;
          inset: -20px;
          z-index: 2;
          pointer-events: none;
          /* Máscara radial para concentrar la luz en la zona inferior derecha igual a la referencia */
          -webkit-mask-image: radial-gradient(
            circle at 76% 78%,
            rgba(0, 0, 0, 1) 0%,
            rgba(0, 0, 0, 0.75) 34%,
            rgba(0, 0, 0, 0.25) 58%,
            transparent 78%
          );
          mask-image: radial-gradient(
            circle at 76% 78%,
            rgba(0, 0, 0, 1) 0%,
            rgba(0, 0, 0, 0.75) 34%,
            rgba(0, 0, 0, 0.25) 58%,
            transparent 78%
          );
          filter: blur(18px) saturate(1.65) brightness(1.1);
          transform: translateZ(0);
          transition: opacity 0.42s ease;
          will-change: opacity;
        }

        /* Reflejo especular 3D izquierdo */
        .w3d-specular-left {
          position: absolute;
          left: 14px;
          top: 22px;
          bottom: 24px;
          width: 14px;
          border-radius: 99px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.55) 0%,
            rgba(255, 255, 255, 0.22) 45%,
            rgba(255, 255, 255, 0.45) 85%,
            rgba(255, 255, 255, 0.05) 100%
          );
          filter: blur(3.5px);
          transform: translateZ(0);
          pointer-events: none;
          z-index: 3;
        }

        /* Bisel acolchado 3D */
        .w3d-bevel-frame {
          position: absolute;
          inset: 0;
          border-radius: 36px 36px 40px 40px;
          box-shadow: 
            inset 0 14px 18px -10px rgba(255, 255, 255, 0.16),
            inset 0 -18px 20px -8px rgba(0, 0, 0, 0.85),
            inset -14px 0 18px -10px rgba(0, 0, 0, 0.7);
          pointer-events: none;
          z-index: 4;
        }

        .w3d-stitching {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 5;
        }

        .w3d-balance-box {
          position: relative;
          z-index: 6;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 6px;
        }

        .w3d-balance-label {
          font-size: 16.5px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: -0.01em;
          margin-bottom: 6px;
        }

        .w3d-balance-amount {
          display: flex;
          align-items: baseline;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
        }

        .w3d-currency {
          font-size: 35px;
          margin-right: 7px;
        }

        .w3d-int {
          font-size: 37px;
        }

        .w3d-dec {
          font-size: 25px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.52);
          margin-left: 1px;
        }
      `}</style>
    </div>
  );
}
