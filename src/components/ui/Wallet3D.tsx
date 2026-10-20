"use client";

import React, { useState } from "react";

export interface WalletCard {
  id: "crimson" | "holo" | "amber";
  name: string;
  number: string;
  balanceInt: string;
  balanceDec: string;
  expiry: string;
}

const DEFAULT_CARDS: WalletCard[] = [
  {
    id: "crimson",
    name: "VISA Signature Black",
    number: "•••• 8842",
    balanceInt: "4,018",
    balanceDec: ".00",
    expiry: "09/28",
  },
  {
    id: "holo",
    name: "VISA Holo Edition",
    number: "•••• 3109",
    balanceInt: "2,850",
    balanceDec: ".50",
    expiry: "12/27",
  },
  {
    id: "amber",
    name: "VISA Infinite Gold",
    number: "•••• 5514",
    balanceInt: "6,420",
    balanceDec: ".75",
    expiry: "04/29",
  },
];

interface Wallet3DProps {
  onSelectCard?: (card: WalletCard) => void;
}

export default function Wallet3D({ onSelectCard }: Wallet3DProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<"crimson" | "holo" | "amber">("crimson");
  const [balanceLabel, setBalanceLabel] = useState("Total balance");

  const activeCard = DEFAULT_CARDS.find((c) => c.id === activeId) || DEFAULT_CARDS[0];

  const handleCardClick = (e: React.MouseEvent, card: WalletCard) => {
    e.stopPropagation();
    if (!isOpen) {
      setIsOpen(true);
      return;
    }
    setActiveId(card.id);
    setBalanceLabel(`VISA ${card.number}`);
    if (onSelectCard) onSelectCard(card);
    setTimeout(() => {
      setIsOpen(false);
    }, 260);
  };

  const toggleWallet = () => {
    setIsOpen((prev) => !prev);
  };

  // Determina el orden visual (slot 0 = frente, slot 1 = medio, slot 2 = fondo)
  const getSlot = (cardId: "crimson" | "holo" | "amber") => {
    if (cardId === activeId) return 0;
    const remaining = DEFAULT_CARDS.filter((c) => c.id !== activeId);
    return remaining[0].id === cardId ? 1 : 2;
  };

  return (
    <div className="w3d-isolated-root">
      <div
        className={`w3d-shell ${isOpen ? "is-open" : ""}`}
        data-active-glow={activeId}
        onClick={toggleWallet}
      >
        <div className="w3d-inner">
          {/* Header */}
          <div className="w3d-header">
            <span className="w3d-title">Wallet</span>
            <span className="w3d-hint">
              {isOpen ? "Elige una tarjeta" : "Toca para abrir"}
            </span>
          </div>

          {/* Área de tarjetas */}
          <div className="w3d-cards-stage">
            {/* 4ta tarjeta decorativa que asoma a la derecha */}
            <div className="w3d-peek-card" />

            {/* Tarjeta 1: Navy / Amber */}
            <div
              className={`w3d-card w3d-card-amber slot-${getSlot("amber")} ${
                activeId === "amber" ? "is-selected" : ""
              }`}
              onClick={(e) => handleCardClick(e, DEFAULT_CARDS[2])}
            >
              <div className="w3d-card-top">
                <span className="w3d-visa-logo">VISA</span>
                <span className="w3d-card-badge">
                  {activeId === "amber" ? "✓ Activa" : "Seleccionar"}
                </span>
              </div>
              <div className="w3d-card-bottom">
                <div className="w3d-card-meta">
                  <span className="w3d-card-name">{DEFAULT_CARDS[2].name}</span>
                  <span className="w3d-card-num">{DEFAULT_CARDS[2].number}</span>
                </div>
                <span className="w3d-card-bal">
                  ${DEFAULT_CARDS[2].balanceInt}
                  <small>{DEFAULT_CARDS[2].balanceDec}</small>
                </span>
              </div>
            </div>

            {/* Tarjeta 2: Silver Holográfica */}
            <div
              className={`w3d-card w3d-card-holo slot-${getSlot("holo")} ${
                activeId === "holo" ? "is-selected" : ""
              }`}
              onClick={(e) => handleCardClick(e, DEFAULT_CARDS[1])}
            >
              <div className="w3d-holo-prism" />
              <div className="w3d-card-top">
                <span className="w3d-visa-logo w3d-visa-dark" data-text="VISA">
                  VISA
                </span>
                <span className="w3d-card-badge w3d-badge-dark">
                  {activeId === "holo" ? "✓ Activa" : "Seleccionar"}
                </span>
              </div>
              <div className="w3d-card-bottom w3d-text-dark">
                <div className="w3d-card-meta">
                  <span className="w3d-card-name">{DEFAULT_CARDS[1].name}</span>
                  <span className="w3d-card-num">{DEFAULT_CARDS[1].number}</span>
                </div>
                <span className="w3d-card-bal">
                  ${DEFAULT_CARDS[1].balanceInt}
                  <small>{DEFAULT_CARDS[1].balanceDec}</small>
                </span>
              </div>
            </div>

            {/* Tarjeta 3: Charcoal Dark */}
            <div
              className={`w3d-card w3d-card-crimson slot-${getSlot("crimson")} ${
                activeId === "crimson" ? "is-selected" : ""
              }`}
              onClick={(e) => handleCardClick(e, DEFAULT_CARDS[0])}
            >
              <div className="w3d-card-top">
                <span className="w3d-visa-logo">VISA</span>
                <span className="w3d-card-badge">
                  {activeId === "crimson" ? "✓ Activa" : "Seleccionar"}
                </span>
              </div>
              <div className="w3d-card-bottom">
                <div className="w3d-card-meta">
                  <span className="w3d-card-name">{DEFAULT_CARDS[0].name}</span>
                  <span className="w3d-card-num">{DEFAULT_CARDS[0].number}</span>
                </div>
                <span className="w3d-card-bal">
                  ${DEFAULT_CARDS[0].balanceInt}
                  <small>{DEFAULT_CARDS[0].balanceDec}</small>
                </span>
              </div>
            </div>
          </div>

          {/* Bolsillo delantero de cuero con costuras y reflejo 3D */}
          <div className="w3d-leather-pocket">
            {/* 3 Capas de color pre-renderizadas en GPU (Sin lag) */}
            <div className="w3d-glow-layer w3d-glow-crimson" />
            <div className="w3d-glow-layer w3d-glow-holo" />
            <div className="w3d-glow-layer w3d-glow-amber" />

            {/* Reflejo especular 3D izquierdo y bisel acolchado */}
            <div className="w3d-specular-left" />
            <div className="w3d-bevel-frame" />

            {/* Costura perimetral en relieve (SVG puro sin filtros pesados) */}
            <svg
              className="w3d-stitching"
              viewBox="0 0 364 196"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Surco oscuro hundido en el cuero */}
              <rect
                x="10"
                y="11"
                width="344"
                height="175"
                rx="30"
                stroke="rgba(0, 0, 0, 0.85)"
                strokeWidth="2.6"
                strokeDasharray="6.5 5.5"
                strokeLinecap="round"
              />
              {/* Hilo claro superior */}
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

            {/* Texto central de saldo */}
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
      </div>

      <style>{`
        .w3d-isolated-root {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
          -webkit-font-smoothing: antialiased;
          user-select: none;
          contain: layout style;
          isolation: isolate;
        }

        /* Carcasa exterior gris plata con transición GPU */
        .w3d-shell {
          position: relative;
          width: 392px;
          height: 368px;
          border-radius: 54px;
          background: linear-gradient(180deg, #c5c7c9 0%, #b4b6b8 100%);
          padding: 13px;
          box-sizing: border-box;
          box-shadow: 
            0 26px 50px -14px rgba(0, 0, 0, 0.32),
            0 4px 12px rgba(0, 0, 0, 0.12),
            inset 0 1.5px 1px rgba(255, 255, 255, 0.75);
          cursor: pointer;
          transition: height 0.52s cubic-bezier(0.22, 1, 0.36, 1), transform 0.3s ease;
          transform: translate3d(0, 0, 0);
          will-change: height;
        }

        .w3d-shell:hover {
          transform: translate3d(0, -2px, 0);
        }

        .w3d-shell.is-open {
          height: 530px;
        }

        /* Interior oscuro carbón */
        .w3d-inner {
          position: relative;
          width: 100%;
          height: 100%;
          background: #2b2c2f;
          border-radius: 42px;
          overflow: hidden;
          box-shadow: inset 0 6px 16px rgba(0, 0, 0, 0.65);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* Cabecera Wallet */
        .w3d-header {
          position: relative;
          z-index: 2;
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
          color: rgba(255, 255, 255, 0.36);
          margin-top: 4px;
          opacity: 0;
          transform: translateY(-4px);
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .w3d-shell:hover .w3d-hint,
        .w3d-shell.is-open .w3d-hint {
          opacity: 1;
          transform: translateY(0);
        }

        /* Escenario de las tarjetas */
        .w3d-cards-stage {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 3;
          pointer-events: none;
        }

        /* 4ta tarjeta blanca que asoma por la derecha */
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
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease;
          z-index: 1;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.25);
        }

        .w3d-shell.is-open .w3d-peek-card {
          opacity: 0;
          transform: translate3d(20px, 40px, 0) rotate(22deg);
        }

        /* Estructura base de cada tarjeta VISA */
        .w3d-card {
          position: absolute;
          left: 20px;
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
          border: 1.8px solid rgba(255, 255, 255, 0.88);
          box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.38);
          transition: transform 0.54s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease;
          will-change: transform;
          backface-visibility: hidden;
          overflow: hidden;
        }

        /* --- ESTILOS VISUALES DE LAS 3 TARJETAS --- */
        /* 1. Navy & Dorado (Fondo original) */
        .w3d-card-amber {
          background: 
            radial-gradient(circle at 78% 42%, rgba(226, 155, 75, 0.95) 0%, rgba(168, 95, 42, 0.65) 38%, transparent 70%),
            linear-gradient(108deg, #1b2848 0%, #24355c 46%, #7c4d34 100%);
          color: #ffffff;
        }

        /* 2. Plateada con arcoíris holográfico (Medio original) */
        .w3d-card-holo {
          background: linear-gradient(100deg, #e5e6e8 0%, #ededef 52%, #cfd6e3 100%);
          border-color: rgba(255, 255, 255, 0.98);
          color: #1c1d1f;
        }

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

        /* 3. Carbón Mate (Frente original) */
        .w3d-card-crimson {
          background: 
            radial-gradient(circle at 92% 35%, rgba(122, 58, 74, 0.38) 0%, transparent 58%),
            linear-gradient(180deg, #35363a 0%, #27282b 100%);
          color: #ffffff;
        }

        /* --- POSICIONES CERRADAS (CLON 1:1 DE LA IMAGEN) --- */
        /* Slot 2: Tarjeta del fondo */
        .w3d-card.slot-2 {
          z-index: 2;
          top: 52px;
          transform: translate3d(4px, 0, 0) rotate(-9.2deg);
          transform-origin: bottom left;
        }

        /* Slot 1: Tarjeta del medio */
        .w3d-card.slot-1 {
          z-index: 3;
          top: 76px;
          transform: translate3d(0, 0, 0) rotate(-3.2deg);
          transform-origin: bottom left;
        }

        /* Slot 0: Tarjeta activa al frente */
        .w3d-card.slot-0 {
          z-index: 4;
          top: 108px;
          transform: translate3d(0, 0, 0) rotate(0deg);
          transform-origin: center center;
        }

        /* --- POSICIONES ABIERTAS (ABANICO INTERACTIVO) --- */
        .w3d-shell.is-open .w3d-card.slot-2 {
          transform: translate3d(0, 2px, 0) rotate(0deg) scale(0.95);
        }

        .w3d-shell.is-open .w3d-card.slot-1 {
          transform: translate3d(0, 68px, 0) rotate(0deg) scale(0.975);
        }

        .w3d-shell.is-open .w3d-card.slot-0 {
          transform: translate3d(0, 126px, 0) rotate(0deg) scale(1);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55);
        }

        .w3d-shell.is-open .w3d-card:hover {
          filter: brightness(1.06);
        }

        .w3d-shell.is-open .w3d-card.slot-2:hover {
          transform: translate3d(0, -6px, 0) rotate(0deg) scale(0.97);
        }

        .w3d-shell.is-open .w3d-card.slot-1:hover {
          transform: translate3d(0, 60px, 0) rotate(0deg) scale(0.99);
        }

        .w3d-shell.is-open .w3d-card.slot-0:hover {
          transform: translate3d(0, 118px, 0) rotate(0deg) scale(1.015);
        }

        /* Tipografía VISA y detalles internos de cada tarjeta */
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
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        /* Efecto cromático en el logo VISA negro de la tarjeta plateada */
        .w3d-visa-dark {
          color: #1d1e21;
          text-shadow: -1.5px -0.5px 0px rgba(228, 148, 54, 0.85), 1.5px 0.5px 0px rgba(56, 165, 224, 0.75);
        }

        .w3d-card-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          opacity: 0;
          transform: translateY(-4px);
          transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s ease;
        }

        .w3d-badge-dark {
          background: rgba(0, 0, 0, 0.12);
          color: #18191b;
        }

        .w3d-card.is-selected .w3d-card-badge {
          background: rgba(255, 255, 255, 0.92);
          color: #111;
        }

        .w3d-shell.is-open .w3d-card-badge {
          opacity: 1;
          transform: translateY(0);
        }

        .w3d-card-bottom {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .w3d-shell.is-open .w3d-card-bottom {
          opacity: 1;
          transform: translateY(0);
        }

        .w3d-text-dark {
          color: #1d1e20;
        }

        .w3d-card-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .w3d-card-name {
          font-size: 12px;
          font-weight: 600;
          opacity: 0.78;
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
          opacity: 0.65;
        }

        /* --- BOLSILLO DE CUERO DELANTERO CON 3 CAPAS DE COLOR GPU --- */
        .w3d-leather-pocket {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 196px;
          z-index: 10;
          border-radius: 36px 36px 40px 40px;
          background: #18181b;
          overflow: hidden;
          box-shadow: 
            0 -10px 24px rgba(0, 0, 0, 0.55),
            inset 0 1.5px 1px rgba(255, 255, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate3d(0, 0, 0);
        }

        /* Capas de brillo pre-renderizadas: cambian solo con opacity (0% lag) */
        .w3d-glow-layer {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.45s ease;
          pointer-events: none;
          will-change: opacity;
        }

        /* Brillo Rojo Carmesí (Original de la imagen) */
        .w3d-glow-crimson {
          background: 
            radial-gradient(circle at 76% 78%, rgba(178, 28, 28, 0.88) 0%, rgba(122, 18, 18, 0.52) 42%, rgba(24, 24, 27, 0) 75%),
            linear-gradient(165deg, #27272b 0%, #18181b 52%, #4a1212 100%);
        }

        /* Brillo Cian / Prisma Holográfico (Al elegir la plateada) */
        .w3d-glow-holo {
          background: 
            radial-gradient(circle at 76% 78%, rgba(38, 132, 225, 0.85) 0%, rgba(124, 58, 237, 0.48) 44%, rgba(24, 24, 27, 0) 76%),
            linear-gradient(165deg, #272930 0%, #18191e 52%, #17365c 100%);
        }

        /* Brillo Ámbar / Oro Cálido (Al elegir la azul/dorada) */
        .w3d-glow-amber {
          background: 
            radial-gradient(circle at 76% 78%, rgba(217, 119, 36, 0.88) 0%, rgba(146, 64, 14, 0.52) 44%, rgba(24, 24, 27, 0) 76%),
            linear-gradient(165deg, #282624 0%, #191817 52%, #4d260b 100%);
        }

        /* Activación infalible por atributo data-active-glow */
        .w3d-shell[data-active-glow="crimson"] .w3d-glow-crimson {
          opacity: 1;
        }
        .w3d-shell[data-active-glow="holo"] .w3d-glow-holo {
          opacity: 1;
        }
        .w3d-shell[data-active-glow="amber"] .w3d-glow-amber {
          opacity: 1;
        }

        /* Tubo de luz especular 3D en el borde izquierdo (idéntico a la referencia) */
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
          pointer-events: none;
          z-index: 2;
        }

        /* Bisel acolchado 3D interior del cuero */
        .w3d-bevel-frame {
          position: absolute;
          inset: 0;
          border-radius: 36px 36px 40px 40px;
          box-shadow: 
            inset 0 14px 18px -10px rgba(255, 255, 255, 0.16),
            inset 0 -18px 20px -8px rgba(0, 0, 0, 0.85),
            inset -14px 0 18px -10px rgba(0, 0, 0, 0.7);
          pointer-events: none;
          z-index: 2;
        }

        /* Costura perimetral SVG */
        .w3d-stitching {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 3;
        }

        /* Texto central del saldo */
        .w3d-balance-box {
          position: relative;
          z-index: 4;
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
