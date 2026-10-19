"use client";

import React, { useState, useEffect } from "react";

export interface WalletCardItem {
  id: string;
  number: string;
  holder: string;
  exp: string;
  type?: "visa" | "mastercard" | "amex" | "diners" | "discover" | string;
  design?: "obsidian" | "holographic" | "navy" | string;
  balance?: number;
  tier?: string;
}

export interface SkeuomorphicWalletProps {
  /** Formatted or numerical amount to display on the leather pocket */
  amount?: number;
  /** Currency symbol, default "$" */
  currencySymbol?: string;
  /** Label displayed above the amount, default "Total balance" */
  label?: string;
  /** Active selected card ID */
  activeCardId?: string;
  /** Callback fired when a card is selected */
  onSelectCard?: (cardId: string) => void;
  /** External control for wallet open/close state */
  isOpen?: boolean;
  /** Callback fired when open state changes */
  onToggleOpen?: (nextOpen: boolean) => void;
  /** Optional custom card deck items */
  cards?: WalletCardItem[];
  /** Optional custom class for outer wrapper */
  className?: string;
}

const WALLET_CSS = "\n@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,700;0,800;1,800&family=JetBrains+Mono:wght@500;600&display=swap');\n\n:root {\n  --wallet-glow-1: rgba(166, 29, 24, 0.90);\n  --wallet-glow-2: rgba(108, 17, 15, 0.56);\n  --wallet-accent-dot: #a88d8c;\n}\n\n.wallet-outer-bezel {\n  --wallet-glow-1: rgba(166, 29, 24, 0.90);\n  --wallet-glow-2: rgba(108, 17, 15, 0.56);\n  --wallet-accent-dot: #a88d8c;\n  box-sizing: border-box;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.wallet-outer-bezel * {\n  box-sizing: border-box;\n}\n\n@media (max-width: 400px) {\n  .wallet-outer-bezel {\n    max-width: 100% !important;\n  }\n}\n@media (max-width: 375px) {\n  .wallet-outer-bezel {\n    transform: scale(0.92);\n    transform-origin: center top;\n  }\n}\n@media (max-width: 340px) {\n  .wallet-outer-bezel {\n    transform: scale(0.85);\n    transform-origin: center top;\n  }\n}\n\n:root {\n\n      --wallet-glow-1: rgba(166, 29, 24, 0.90);\n\n      --wallet-glow-2: rgba(108, 17, 15, 0.56);\n\n      --wallet-accent-dot: #a88d8c;\n\n    }\n\n\n\n    \n\n\n\n    \n\n\n\n    /* ==========================================================================\n\n       1. CLON EXACTO 1:1 DE LA BILLETERA (PINTEREST REFERENCE)\n\n       ========================================================================== */\n\n\n\n    /* Marco exterior met\u00e1lico gris claro (Squircle) */\n\n    .wallet-outer-bezel {\n\n      position: relative;\n\n      width: 368px;\n\n      height: 364px;\n\n      border-radius: 52px;\n\n      padding: 13px;\n\n      background: linear-gradient(180deg, #c2c2c2 0%, #b5b5b5 100%);\n\n      box-shadow:\n\n        0 26px 52px -12px rgba(0, 0, 0, 0.22),\n\n        0 8px 20px -4px rgba(0, 0, 0, 0.12),\n\n        inset 0 1.5px 1px rgba(255, 255, 255, 0.65),\n\n        inset 0 -1.5px 2px rgba(0, 0, 0, 0.18);\n\n      transition:\n\n        height 0.6s cubic-bezier(0.22, 1, 0.36, 1),\n\n        transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),\n\n        box-shadow 0.4s ease;\n\n      user-select: none;\n\n      margin: 0 auto;\n\n      perspective: 1200px;\n\n    }\n\n\n\n    /* Estado Abierto de la Billetera */\n\n    .wallet-outer-bezel.is-open {\n\n      height: 558px;\n\n      box-shadow:\n\n        0 34px 68px -12px rgba(0, 0, 0, 0.32),\n\n        0 12px 28px -6px rgba(0, 0, 0, 0.16),\n\n        inset 0 1.5px 1px rgba(255, 255, 255, 0.75);\n\n    }\n\n\n\n    /* Cavidad interna carb\u00f3n mate */\n\n    .wallet-inner-cavity {\n\n      position: relative;\n\n      width: 100%;\n\n      height: 100%;\n\n      background: #2b2b2b;\n\n      border-radius: 40px;\n\n      overflow: hidden;\n\n      box-shadow:\n\n        inset 0 6px 16px rgba(0, 0, 0, 0.65),\n\n        inset 0 0 0 1px rgba(0, 0, 0, 0.4);\n\n      display: flex;\n\n      flex-direction: column;\n\n      justify-content: space-between;\n\n    }\n\n\n\n    /* T\u00edtulo superior \"Wallet\" */\n\n    .wallet-header-bar {\n\n      position: relative;\n\n      z-index: 5;\n\n      padding-top: 19px;\n\n      text-align: center;\n\n      display: flex;\n\n      align-items: center;\n\n      justify-content: center;\n\n      transition: all 0.4s ease;\n\n    }\n\n\n\n    .wallet-title-text {\n\n      color: #7c7c7c;\n\n      font-size: 17px;\n\n      font-weight: 600;\n\n      letter-spacing: -0.02em;\n\n      line-height: 1;\n\n      transition: color 0.3s ease;\n\n    }\n\n\n\n    .wallet-outer-bezel.is-open .wallet-title-text {\n\n      color: #a3a3a3;\n\n    }\n\n\n\n    /* Contenedor de las tarjetas */\n\n    .wallet-cards-stage {\n\n      position: absolute;\n\n      top: 0;\n\n      left: 0;\n\n      right: 0;\n\n      bottom: 0;\n\n      z-index: 10;\n\n      pointer-events: auto;\n\n    }\n\n\n\n    /* La 4ta tarjeta gris/blanca que asoma en la esquina derecha en la imagen original */\n\n    .wallet-ghost-card-right {\n\n      position: absolute;\n\n      width: 260px;\n\n      height: 165px;\n\n      right: 11px;\n\n      top: 78px;\n\n      border-radius: 23px;\n\n      background: linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 100%);\n\n      border: 1.8px solid rgba(255, 255, 255, 0.92);\n\n      transform: rotate(15deg);\n\n      transform-origin: bottom right;\n\n      z-index: 6;\n\n      box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.35);\n\n      transition: all 0.55s cubic-bezier(0.22, 1, 0.36, 1);\n\n      pointer-events: none;\n\n    }\n\n\n\n    .wallet-outer-bezel.is-open .wallet-ghost-card-right {\n\n      opacity: 0;\n\n      transform: translateY(40px) rotate(6deg) scale(0.9);\n\n    }\n\n\n\n    /* Estilo base de cada tarjeta VISA */\n\n    .visa-card {\n\n      position: absolute;\n\n      left: 19px;\n\n      width: 304px;\n\n      height: 186px;\n\n      border-radius: 23px;\n\n      border: 1.8px solid rgba(255, 255, 255, 0.92);\n\n      padding: 16px 20px;\n\n      cursor: pointer;\n\n      transform-origin: 28% 85%;\n\n      transition:\n\n        transform 0.58s cubic-bezier(0.22, 1, 0.36, 1),\n\n        top 0.58s cubic-bezier(0.22, 1, 0.36, 1),\n\n        box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1),\n\n        filter 0.35s ease;\n\n      overflow: hidden;\n\n      will-change: transform, top;\n\n    }\n\n\n\n    /* Textura de ruido sutil realista sobre las tarjetas */\n\n    .visa-card::before {\n\n      content: \"\";\n\n      position: absolute;\n\n      inset: 0;\n\n      background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 0);\n\n      background-size: 3px 3px;\n\n      pointer-events: none;\n\n      z-index: 1;\n\n    }\n\n\n\n    /* ==========================================================================\n\n       TEMAS VISUALES DE LAS 3 TARJETAS (FIELES A LA IMAGEN)\n\n       ========================================================================== */\n\n\n\n    /* TARJETA A: Navy Blue -> Burnt Amber Gold (La de atr\u00e1s en la foto) */\n\n    .visa-card.theme-navy-gold {\n\n      background:\n\n        radial-gradient(circle at 68% 35%, rgba(214, 142, 68, 0.95) 0%, rgba(163, 92, 45, 0.85) 32%, transparent 68%),\n\n        linear-gradient(108deg, #1b2848 0%, #243558 34%, #6e4838 64%, #b87b42 100%);\n\n      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.45);\n\n      color: #ffffff;\n\n    }\n\n\n\n    /* TARJETA B: Brushed Silver + Holographic Rainbow Prism (La del medio en la foto) */\n\n    .visa-card.theme-holo-silver {\n\n      background:\n\n        linear-gradient(100deg,\n\n          #e3e3e3 0%,\n\n          #e6e6e6 46%,\n\n          #ebb665 54%,\n\n          #c96f49 58%,\n\n          #3b5998 63%,\n\n          #4ea8de 69%,\n\n          #66b2a0 73%,\n\n          #e29568 79%,\n\n          #8b9bb1 87%,\n\n          #cfd6df 95%,\n\n          #dfdfdf 100%\n\n        );\n\n      border-color: #ffffff;\n\n      box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.38);\n\n      color: #1d1d1f;\n\n    }\n\n\n\n    /* Efecto de brillo iridiscente adicional para la tarjeta Holo */\n\n    .visa-card.theme-holo-silver::after {\n\n      content: \"\";\n\n      position: absolute;\n\n      inset: 0;\n\n      background: linear-gradient(125deg, rgba(255,255,255,0.45) 0%, transparent 40%, rgba(255,255,255,0.2) 70%, transparent 100%);\n\n      pointer-events: none;\n\n    }\n\n\n\n    /* TARJETA C: Matte Carbon Black con sutil matiz c\u00e1lido (La del frente en la foto) */\n\n    .visa-card.theme-carbon-black {\n\n      background:\n\n        radial-gradient(circle at 92% 35%, rgba(96, 58, 62, 0.7) 0%, transparent 55%),\n\n        linear-gradient(105deg, #323438 0%, #2b2d31 58%, #3d2d31 100%);\n\n      border-color: rgba(255, 255, 255, 0.92);\n\n      box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.48);\n\n      color: #ffffff;\n\n    }\n\n\n\n    /* Tipograf\u00eda geom\u00e9trica exacta del logo VISA */\n\n    .visa-wordmark {\n\n      position: relative;\n\n      z-index: 2;\n\n      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;\n\n      font-weight: 800;\n\n      font-size: 29px;\n\n      letter-spacing: -0.03em;\n\n      line-height: 1;\n\n      display: inline-block;\n\n      transform: skewX(-11deg);\n\n    }\n\n\n\n    /* En la tarjeta plateada de la imagen, el logo VISA es negro carb\u00f3n con un borde prism\u00e1tico en la V/I */\n\n    .theme-holo-silver .visa-wordmark {\n\n      color: #1c1c1e;\n\n      text-shadow:\n\n        -1.5px -0.5px 0px rgba(217, 130, 54, 0.85),\n\n        1.5px 0.5px 0px rgba(59, 130, 246, 0.5);\n\n    }\n\n\n\n    .theme-navy-gold .visa-wordmark,\n\n    .theme-carbon-black .visa-wordmark {\n\n      color: #ffffff;\n\n      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);\n\n    }\n\n\n\n    /* ==========================================================================\n\n       POSICIONES DE LAS TARJETAS EN ESTADO CERRADO vs ESTADO ABIERTO\n\n       ========================================================================== */\n\n\n\n    /* Posici\u00f3n Slot 0 (Atr\u00e1s del todo - inclinada -9.5 deg como en la imagen) */\n\n    .wallet-outer-bezel:not(.is-open) .visa-card[data-slot=\"0\"] {\n\n      top: 48px;\n\n      left: 24px;\n\n      transform: rotate(-9.5deg);\n\n      z-index: 11;\n\n    }\n\n\n\n    /* Posici\u00f3n Slot 1 (Medio - inclinada -3.2 deg como en la imagen) */\n\n    .wallet-outer-bezel:not(.is-open) .visa-card[data-slot=\"1\"] {\n\n      top: 72px;\n\n      left: 16px;\n\n      transform: rotate(-3.2deg);\n\n      z-index: 12;\n\n    }\n\n\n\n    /* Posici\u00f3n Slot 2 (Frente / Activa - horizontal 0 deg justo detr\u00e1s del bolsillo) */\n\n    .wallet-outer-bezel:not(.is-open) .visa-card[data-slot=\"2\"] {\n\n      top: 102px;\n\n      left: 19px;\n\n      transform: rotate(0deg);\n\n      z-index: 13;\n\n    }\n\n\n\n    /* Micro-interacci\u00f3n Hover cuando la billetera est\u00e1 cerrada (se asoman con f\u00edsica suave) */\n\n    .wallet-outer-bezel:not(.is-open):hover .visa-card[data-slot=\"0\"] {\n\n      transform: translateY(-7px) rotate(-10.8deg);\n\n    }\n\n    .wallet-outer-bezel:not(.is-open):hover .visa-card[data-slot=\"1\"] {\n\n      transform: translateY(-4px) rotate(-3.8deg);\n\n    }\n\n    .wallet-outer-bezel:not(.is-open):hover .visa-card[data-slot=\"2\"] {\n\n      transform: translateY(-2px) rotate(0deg);\n\n    }\n\n\n\n    /* ESTADO ABIERTO: Despliegue en Abanico Vertical Interactivo */\n\n    .wallet-outer-bezel.is-open .visa-card[data-slot=\"0\"] {\n\n      top: 48px;\n\n      left: 19px;\n\n      transform: rotate(0deg) scale(0.95);\n\n      z-index: 11;\n\n    }\n\n\n\n    .wallet-outer-bezel.is-open .visa-card[data-slot=\"1\"] {\n\n      top: 136px;\n\n      left: 19px;\n\n      transform: rotate(0deg) scale(0.975);\n\n      z-index: 12;\n\n    }\n\n\n\n    .wallet-outer-bezel.is-open .visa-card[data-slot=\"2\"] {\n\n      top: 226px;\n\n      left: 19px;\n\n      transform: rotate(0deg) scale(1);\n\n      z-index: 13;\n\n      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55), 0 0 0 2px rgba(255, 255, 255, 0.95);\n\n    }\n\n\n\n    /* Hover individual sobre cada tarjeta cuando est\u00e1 abierta */\n\n    .wallet-outer-bezel.is-open .visa-card:hover {\n\n      transform: translateY(-8px) scale(1.015) !important;\n\n      box-shadow: 0 18px 34px rgba(0, 0, 0, 0.65), 0 0 0 2.5px #ffffff !important;\n\n    }\n\n\n\n    /* Detalles internos de la tarjeta (visibles cuando la billetera se abre) */\n\n    .card-expanded-details {\n\n      position: relative;\n\n      z-index: 2;\n\n      margin-top: 14px;\n\n      opacity: 0;\n\n      transform: translateY(6px);\n\n      transition: opacity 0.35s ease, transform 0.35s ease;\n\n      pointer-events: none;\n\n    }\n\n\n\n    .wallet-outer-bezel.is-open .card-expanded-details {\n\n      opacity: 1;\n\n      transform: translateY(0);\n\n    }\n\n\n\n    /* ==========================================================================\n\n       EL BOLSILLO FRONTAL 3D CON BORDE COSIDO, BLUR Y BRILLO ESPECULAR\n\n       ========================================================================== */\n\n\n\n    .wallet-front-pocket {\n\n      position: absolute;\n\n      left: 3px;\n\n      right: 3px;\n\n      bottom: 3px;\n\n      height: 204px;\n\n      border-radius: 36px;\n\n      z-index: 25;\n\n      overflow: hidden;\n\n      cursor: pointer;\n\n      /* Fondo cuero/acr\u00edlico oscuro con el resplandor carmes\u00ed difuminado en la esquina inferior derecha */\n\n      background:\n\n        radial-gradient(125% 110% at 78% 84%,\n\n          var(--wallet-glow-1) 0%,\n\n          var(--wallet-glow-2) 38%,\n\n          rgba(30, 22, 23, 0.95) 68%,\n\n          rgba(23, 23, 25, 0.98) 100%\n\n        );\n\n      backdrop-filter: blur(18px);\n\n      -webkit-backdrop-filter: blur(18px);\n\n      /* Sombras multicapa que crean el volumen acolchado 3D (pillow bevel) */\n\n      box-shadow:\n\n        /* Sombra proyectada hacia arriba sobre las tarjetas */\n\n        0 -8px 22px rgba(0, 0, 0, 0.62),\n\n        /* Borde exterior oscuro del bolsillo */\n\n        inset 0 0 0 1.5px rgba(255, 255, 255, 0.08),\n\n        /* Labio superior iluminado */\n\n        inset 0 3px 5px rgba(255, 255, 255, 0.22),\n\n        /* Brillo especular blanco vertical izquierdo (id\u00e9ntico a la imagen) */\n\n        inset 6px 0 10px -2px rgba(255, 255, 255, 0.36),\n\n        inset 16px 0 22px -6px rgba(255, 255, 255, 0.12),\n\n        /* Surco oscuro inferior y derecho para dar curvatura 3D */\n\n        inset -5px -10px 18px rgba(0, 0, 0, 0.85),\n\n        inset 0 -14px 20px rgba(0, 0, 0, 0.72);\n\n      transition:\n\n        height 0.58s cubic-bezier(0.22, 1, 0.36, 1),\n\n        background 0.5s ease,\n\n        box-shadow 0.4s ease;\n\n      display: flex;\n\n      flex-direction: column;\n\n      align-items: center;\n\n      justify-content: center;\n\n    }\n\n\n\n    /* En estado abierto el bolsillo sigue abajo pero ligeramente m\u00e1s compacto para dejar ver las 3 tarjetas */\n\n    .wallet-outer-bezel.is-open .wallet-front-pocket {\n\n      height: 196px;\n\n    }\n\n\n\n    /* Reflejo especular curvo en el borde izquierdo (el tubo brillante de luz de la foto) */\n\n    .pocket-left-specular {\n\n      position: absolute;\n\n      top: 14px;\n\n      bottom: 16px;\n\n      left: 5px;\n\n      width: 14px;\n\n      border-radius: 999px;\n\n      background: linear-gradient(\n\n        180deg,\n\n        rgba(255, 255, 255, 0.15) 0%,\n\n        rgba(255, 255, 255, 0.55) 25%,\n\n        rgba(255, 255, 255, 0.65) 55%,\n\n        rgba(255, 255, 255, 0.2) 85%,\n\n        rgba(255, 255, 255, 0.05) 100%\n\n      );\n\n      filter: blur(3.5px);\n\n      pointer-events: none;\n\n      z-index: 2;\n\n    }\n\n\n\n    /* Reflejo suave en la curva inferior derecha */\n\n    .pocket-right-glow-highlight {\n\n      position: absolute;\n\n      bottom: 14px;\n\n      right: 16px;\n\n      width: 185px;\n\n      height: 95px;\n\n      border-radius: 50%;\n\n      background: radial-gradient(circle, rgba(220, 48, 38, 0.42) 0%, transparent 72%);\n\n      filter: blur(12px);\n\n      pointer-events: none;\n\n      z-index: 1;\n\n      transition: opacity 0.4s ease;\n\n    }\n\n\n\n    /* Contenedor SVG del Borde Cosido (\"Stitched Leather Border\") */\n\n    .pocket-stitching-svg {\n\n      position: absolute;\n\n      inset: 0;\n\n      width: 100%;\n\n      height: 100%;\n\n      pointer-events: none;\n\n      z-index: 4;\n\n    }\n\n\n\n    /* Tipograf\u00eda central del bolsillo (\"Total balance $ 4,018.00\") */\n\n    .pocket-content-center {\n\n      position: relative;\n\n      z-index: 10;\n\n      text-align: center;\n\n      padding: 0 20px;\n\n      width: 100%;\n\n    }\n\n\n\n    .pocket-balance-label {\n\n      color: #9e9e9e;\n\n      font-size: 16px;\n\n      font-weight: 500;\n\n      letter-spacing: -0.015em;\n\n      margin-bottom: 5px;\n\n      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);\n\n    }\n\n\n\n    .pocket-balance-amount {\n\n      font-family: 'Inter', sans-serif;\n\n      color: #ffffff;\n\n      font-size: 36px;\n\n      font-weight: 700;\n\n      letter-spacing: -0.025em;\n\n      line-height: 1.05;\n\n      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);\n\n    }\n\n\n\n    .pocket-balance-decimals {\n\n      color: rgba(255, 255, 255, 0.48);\n\n      font-size: 25px;\n\n      font-weight: 600;\n\n      letter-spacing: -0.01em;\n\n    }";

const DEFAULT_CARDS_DATA = {
  carbon: {
    id: "carbon",
    tier: "Signature Black",
    digits: "•••• •••• •••• 4829",
    balance: 4018.00,
  },
  holo: {
    id: "holo",
    tier: "Holo Prism",
    digits: "•••• •••• •••• 3109",
    balance: 2640.50,
  },
  navy: {
    id: "navy",
    tier: "Horizon Gold",
    digits: "•••• •••• •••• 5514",
    balance: 8920.00,
  },
};

function formatSplitCurrency(val: number, symbol = "$") {
  const fixed = Math.max(0, val).toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const formattedInt = Number(intPart).toLocaleString("en-US");
  return {
    main: `${symbol} ${formattedInt}`,
    decimals: `.${decPart}`,
  };
}

export const SkeuomorphicWallet: React.FC<SkeuomorphicWalletProps> = ({
  amount,
  currencySymbol = "$",
  label = "Total balance",
  activeCardId,
  onSelectCard,
  isOpen: controlledIsOpen,
  onToggleOpen,
  cards,
  className = "",
}) => {
  // Orden de las tarjetas en los slots: [Slot 0 (Atrás), Slot 1 (Medio), Slot 2 (Frente/Activa)]
  const [cardOrder, setCardOrder] = useState<string[]>(["navy", "holo", "carbon"]);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isWalletOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // Sincronizar activeCardId externo si se provee
  useEffect(() => {
    if (activeCardId) {
      const match = activeCardId.toLowerCase();
      let targetKey = "carbon";
      if (match.includes("navy")) targetKey = "navy";
      else if (match.includes("holo")) targetKey = "holo";
      else if (match.includes("carbon") || match.includes("obsidian")) targetKey = "carbon";

      setCardOrder((prev) => {
        if (prev[2] === targetKey) return prev;
        const remaining = prev.filter((id) => id !== targetKey);
        return [remaining[0] || "navy", remaining[1] || "holo", targetKey];
      });
    }
  }, [activeCardId]);

  // Merge custom cards if provided
  const cardsInfo = {
    navy: {
      ...DEFAULT_CARDS_DATA.navy,
      ...(cards && cards[2]
        ? {
            id: cards[2].id || "navy",
            digits: cards[2].number || DEFAULT_CARDS_DATA.navy.digits,
            tier: cards[2].tier || DEFAULT_CARDS_DATA.navy.tier,
            balance: cards[2].balance ?? DEFAULT_CARDS_DATA.navy.balance,
          }
        : {}),
    },
    holo: {
      ...DEFAULT_CARDS_DATA.holo,
      ...(cards && cards[1]
        ? {
            id: cards[1].id || "holo",
            digits: cards[1].number || DEFAULT_CARDS_DATA.holo.digits,
            tier: cards[1].tier || DEFAULT_CARDS_DATA.holo.tier,
            balance: cards[1].balance ?? DEFAULT_CARDS_DATA.holo.balance,
          }
        : {}),
    },
    carbon: {
      ...DEFAULT_CARDS_DATA.carbon,
      ...(cards && cards[0]
        ? {
            id: cards[0].id || "carbon",
            digits: cards[0].number || DEFAULT_CARDS_DATA.carbon.digits,
            tier: cards[0].tier || DEFAULT_CARDS_DATA.carbon.tier,
            balance: cards[0].balance ?? DEFAULT_CARDS_DATA.carbon.balance,
          }
        : {}),
    },
  };

  const activeSlot2Key = cardOrder[2] as "navy" | "holo" | "carbon";
  const activeCard = cardsInfo[activeSlot2Key] || cardsInfo.carbon;

  // Si se provee amount explícito Y label no es el default "Total balance", se respeta amount.
  // De lo contrario, muestra el balance de la tarjeta activa según el prototipo 1:1.
  const numericAmount = amount !== undefined && label !== "Total balance" ? amount : activeCard.balance;
  const formatted = formatSplitCurrency(numericAmount, currencySymbol);

  const toggleWalletOpen = () => {
    const next = !isWalletOpen;
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(next);
    }
    onToggleOpen?.(next);
  };

  const handleCardClick = (clickedCardId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    // Si está cerrada, al tocar cualquier tarjeta se abre el abanico
    if (!isWalletOpen) {
      if (controlledIsOpen === undefined) {
        setInternalIsOpen(true);
      }
      onToggleOpen?.(true);
      return;
    }

    // Si ya está abierta, la tarjeta tocada pasa al frente (Slot 2) y la billetera se cierra suavemente tras 300ms
    const remaining = cardOrder.filter((id) => id !== clickedCardId);
    const newOrder = [remaining[0], remaining[1], clickedCardId];
    setCardOrder(newOrder);

    const chosenData = cardsInfo[clickedCardId as "navy" | "holo" | "carbon"];
    onSelectCard?.(chosenData?.id || clickedCardId);

    setTimeout(() => {
      if (controlledIsOpen === undefined) {
        setInternalIsOpen(false);
      }
      onToggleOpen?.(false);
    }, 300);
  };

  const getSlot = (cardId: string): string => {
    const idx = cardOrder.indexOf(cardId);
    return idx !== -1 ? String(idx) : "0";
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WALLET_CSS }} />

      <div
        id="interactiveWalletWidget"
        className={`wallet-outer-bezel ${isWalletOpen ? "is-open" : ""} ${className}`}
      >
        <div className="wallet-inner-cavity">
          {/* Barra superior "Wallet" */}
          <div className="wallet-header-bar">
            <span className="wallet-title-text">Wallet</span>
          </div>

          {/* Esquina de la 4ta tarjeta blanca/gris que asoma a la derecha en la referencia de Pinterest */}
          <div className="wallet-ghost-card-right" aria-hidden="true" />

          {/* Escenario de las 3 Tarjetas VISA */}
          <div className="wallet-cards-stage" id="walletCardsStage">
            {/* TARJETA 1: Navy Blue & Burnt Gold (Slot 0 por defecto) */}
            <div
              className="visa-card theme-navy-gold"
              data-card-id="navy"
              data-slot={getSlot("navy")}
              onClick={(e) => handleCardClick("navy", e)}
            >
              <div className="flex items-start justify-between relative z-10">
                <span className="visa-wordmark">VISA</span>
                <span className="card-expanded-details text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/25 text-amber-200 border border-amber-200/30">
                  {cardsInfo.navy.tier}
                </span>
              </div>
              <div className="card-expanded-details flex items-center justify-between text-white/95 pt-1">
                <div>
                  <div className="font-mono text-sm tracking-widest font-semibold">
                    {cardsInfo.navy.digits}
                  </div>
                  <div className="text-[11px] text-white/75 mt-0.5">
                    BALANCE: <strong className="text-white">$ {cardsInfo.navy.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={
                      getSlot("navy") === "2"
                        ? "card-status-pill inline-block text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-semibold"
                        : "card-status-pill inline-block text-[10px] px-2.5 py-0.5 rounded-md bg-white/20 text-white font-semibold"
                    }
                  >
                    {getSlot("navy") === "2" ? "Activa" : "Elegir"}
                  </span>
                </div>
              </div>
            </div>

            {/* TARJETA 2: Silver Matte & Holographic Rainbow Prism (Slot 1 por defecto) */}
            <div
              className="visa-card theme-holo-silver"
              data-card-id="holo"
              data-slot={getSlot("holo")}
              onClick={(e) => handleCardClick("holo", e)}
            >
              <div className="flex items-start justify-between relative z-10">
                <span className="visa-wordmark">VISA</span>
                <span className="card-expanded-details text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neutral-900/15 text-neutral-900 border border-neutral-900/20">
                  {cardsInfo.holo.tier}
                </span>
              </div>
              <div className="card-expanded-details flex items-center justify-between text-neutral-900 pt-1">
                <div>
                  <div className="font-mono text-sm tracking-widest font-bold">
                    {cardsInfo.holo.digits}
                  </div>
                  <div className="text-[11px] text-neutral-700 mt-0.5">
                    BALANCE: <strong className="text-neutral-950">$ {cardsInfo.holo.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={
                      getSlot("holo") === "2"
                        ? "card-status-pill inline-block text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-semibold"
                        : "card-status-pill inline-block text-[10px] px-2.5 py-0.5 rounded-md bg-neutral-900 text-white font-semibold"
                    }
                  >
                    {getSlot("holo") === "2" ? "Activa" : "Elegir"}
                  </span>
                </div>
              </div>
            </div>

            {/* TARJETA 3: Matte Carbon Black (Slot 2 por defecto: Frente / Activa) */}
            <div
              className="visa-card theme-carbon-black"
              data-card-id="carbon"
              data-slot={getSlot("carbon")}
              onClick={(e) => handleCardClick("carbon", e)}
            >
              <div className="flex items-start justify-between relative z-10">
                <span className="visa-wordmark">VISA</span>
                <span className="card-expanded-details text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/25 text-red-200 border border-red-400/30">
                  {cardsInfo.carbon.tier}
                </span>
              </div>
              <div className="card-expanded-details flex items-center justify-between text-white/95 pt-1">
                <div>
                  <div className="font-mono text-sm tracking-widest font-semibold">
                    {cardsInfo.carbon.digits}
                  </div>
                  <div className="text-[11px] text-white/75 mt-0.5">
                    BALANCE: <strong className="text-white">$ {cardsInfo.carbon.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={
                      getSlot("carbon") === "2"
                        ? "card-status-pill inline-block text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-semibold"
                        : "card-status-pill inline-block text-[10px] px-2.5 py-0.5 rounded-md bg-white/20 text-white font-semibold"
                    }
                  >
                    {getSlot("carbon") === "2" ? "Activa" : "Elegir"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* EL BOLSILLO FRONTAL 3D CON BORDE COSIDO, BLUR Y BRILLO ESPECULAR */}
          <div
            className="wallet-front-pocket"
            id="walletFrontPocket"
            onClick={toggleWalletOpen}
          >
            {/* Reflejo especular 3D vertical en el borde izquierdo (idéntico al Pinterest) */}
            <div className="pocket-left-specular" />

            {/* Resplandor difuminado carmesí en la esquina inferior derecha */}
            <div className="pocket-right-glow-highlight" />

            {/* Costura perimetral realista en SVG con sombra interna de puntada */}
            <svg className="pocket-stitching-svg" viewBox="0 0 336 204" preserveAspectRatio="none">
              <defs>
                <filter id="walletStitchShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="1.2" stdDeviation="0.6" floodColor="#000000" floodOpacity="0.95" />
                </filter>
              </defs>
              {/* Surco oscuro debajo del hilo */}
              <rect
                x="10"
                y="10"
                width="316"
                height="184"
                rx="26"
                ry="26"
                fill="none"
                stroke="rgba(0,0,0,0.55)"
                strokeWidth="2.6"
              />
              {/* Puntadas de hilo blanco/gris translúcido */}
              <rect
                x="10"
                y="10"
                width="316"
                height="184"
                rx="26"
                ry="26"
                fill="none"
                stroke="rgba(255, 255, 255, 0.24)"
                strokeWidth="1.65"
                strokeDasharray="6.5 5.5"
                strokeLinecap="round"
                filter="url(#walletStitchShadow)"
              />
            </svg>

            {/* Contenido tipográfico central del bolsillo */}
            <div className="pocket-content-center">
              <div id="pocketLabel" className="pocket-balance-label">
                {label}
              </div>
              <div className="pocket-balance-amount">
                <span id="pocketMainNumber">{formatted.main}</span>
                <span id="pocketDecimals" className="pocket-balance-decimals">
                  {formatted.decimals}
                </span>
              </div>

              {/* Píldora discreta que aparece solo cuando la billetera está abierta */}
              <div
                id="pocketInteractiveHint"
                className={`mt-3 ${isWalletOpen ? "flex" : "hidden"} items-center justify-center`}
              >
                <span
                  id="activeCardBadgeText"
                  className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-medium text-white/90 backdrop-blur-md"
                >
                  Toca una tarjeta para seleccionarla
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SkeuomorphicWallet;
