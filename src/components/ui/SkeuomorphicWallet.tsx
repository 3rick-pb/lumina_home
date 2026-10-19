"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface WalletCardItem {
  id: string;
  number: string;
  holder: string;
  exp: string;
  type?: "visa" | "mastercard" | "amex" | "diners" | "discover" | string;
  design?: "obsidian" | "holographic" | "navy" | string;
}

export interface SkeuomorphicWalletProps {
  /** Formatted or numerical amount to display on the leather pocket */
  amount?: number;
  /** Currency symbol, default "$" */
  currencySymbol?: string;
  /** Label displayed above the amount, default "Total a Pagar" */
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

const DEFAULT_CARDS: WalletCardItem[] = [
  {
    id: "card-obsidian",
    number: "•••• •••• •••• 4242",
    holder: "CLIENTE LUMINA",
    exp: "12/28",
    type: "visa",
    design: "obsidian",
  },
  {
    id: "card-holo",
    number: "•••• •••• •••• 4916",
    holder: "CLIENTE LUMINA",
    exp: "08/29",
    type: "visa",
    design: "holographic",
  },
  {
    id: "card-navy",
    number: "•••• •••• •••• 8821",
    holder: "CLIENTE LUMINA",
    exp: "04/30",
    type: "visa",
    design: "navy",
  },
];

export const SkeuomorphicWallet: React.FC<SkeuomorphicWalletProps> = ({
  amount = 4018.00,
  currencySymbol = "$",
  label = "Total a Pagar",
  activeCardId,
  onSelectCard,
  isOpen: controlledIsOpen,
  onToggleOpen,
  cards = DEFAULT_CARDS,
  className = "",
}) => {
  // Internal open state with optional controlled override
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isWalletOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Active card management
  const [selectedId, setSelectedId] = useState<string>(activeCardId || cards[0]?.id || "card-obsidian");
  const effectiveActiveId = activeCardId || selectedId;

  // Guarantee 3 cards for the 3 visual slots
  const effectiveCards = cards.length >= 3 ? cards : [...cards, ...DEFAULT_CARDS.slice(cards.length)];

  // Active card is positioned at Slot 2 (the front card)
  const activeCard = effectiveCards.find((c) => c.id === effectiveActiveId) || effectiveCards[0];
  const otherCards = effectiveCards.filter((c) => c.id !== activeCard.id);

  // Slot 0 (Back, Navy), Slot 1 (Middle, Holo), Slot 2 (Front, Obsidian)
  const slotCards = [
    otherCards[0] || effectiveCards[2],
    otherCards[1] || effectiveCards[1],
    activeCard,
  ];

  const handleToggle = () => {
    const nextState = !isWalletOpen;
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(nextState);
    }
    onToggleOpen?.(nextState);
  };

  const handleCardClick = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedId(cardId);
    onSelectCard?.(cardId);
  };

  // Price formatting: Split into integer and decimals for exact typography
  const [intPart, decPart] = Number(amount || 0).toFixed(2).split(".");
  const formattedInt = Number(intPart).toLocaleString("en-US");

  return (
    <div className={`relative flex justify-center items-center select-none ${className}`}>
      {/* ======================================================================= */}
      {/* 1. MARCO EXTERIOR METÁLICO (BEZEL)                                      */}
      {/* ======================================================================= */}
      <div
        onClick={handleToggle}
        className={`wallet-outer-bezel relative w-[368px] max-w-full rounded-[52px] p-[13px] transition-all cursor-pointer ${
          isWalletOpen ? "is-open h-[558px]" : "h-[364px]"
        }`}
        style={{
          background: "linear-gradient(180deg, #c2c2c2 0%, #b5b5b5 100%)",
          boxShadow:
            "inset 0 1.5px 1px rgba(255, 255, 255, 0.65), 0 24px 48px -12px rgba(0, 0, 0, 0.45), 0 12px 24px -6px rgba(0, 0, 0, 0.3)",
          transitionProperty: "height, box-shadow",
          transitionDuration: "560ms",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* ===================================================================== */}
        {/* CAVIDAD INTERNA                                                       */}
        {/* ===================================================================== */}
        <div
          className="wallet-inner-cavity relative w-full h-full rounded-[40px] overflow-hidden bg-[#2b2b2b]"
          style={{
            boxShadow: "inset 0 6px 16px rgba(0, 0, 0, 0.65)",
          }}
        >
          {/* TÍTULO SUPERIOR CENTRADO "Wallet" */}
          <div className="w-full text-center pt-[19px] pb-1 relative z-10 pointer-events-none select-none">
            <span
              style={{
                color: "#7c7c7c",
                fontSize: "17px",
                fontWeight: 600,
                letterSpacing: "-0.2px",
              }}
            >
              Wallet
            </span>
          </div>

          {/* =================================================================== */}
          {/* 2. ESQUINA DE 4TA TARJETA ESCONDIDA A LA DERECHA                    */}
          {/* =================================================================== */}
          <div
            className="wallet-ghost-card-right absolute pointer-events-none transition-all"
            style={{
              width: "260px",
              height: "165px",
              right: "11px",
              top: "78px",
              borderRadius: "23px",
              background: "linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 100%)",
              border: "1.8px solid #ffffff",
              transform: isWalletOpen ? "rotate(24deg) scale(0.92)" : "rotate(15deg)",
              transformOrigin: "bottom right",
              opacity: isWalletOpen ? 0 : 1,
              zIndex: 11,
              transitionDuration: "480ms",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />

          {/* =================================================================== */}
          {/* 3 TARJETAS PRINCIPALES (SLOT 0: ATRÁS, SLOT 1: MEDIO, SLOT 2: FRENTE) */}
          {/* =================================================================== */}
          {slotCards.map((card, slotIndex) => {
            const isFront = slotIndex === 2;
            const isMiddle = slotIndex === 1;
            const isBack = slotIndex === 0;

            const isCardHovered = isWalletOpen && hoveredCardId === card.id;

            // Geometry & Transforms
            // CLOSED POSITIONS:
            // Slot 0 (Atrás): top: 48px, left: 24px, rotate: -9.5deg
            // Slot 1 (Medio): top: 72px, left: 16px, rotate: -3.2deg
            // Slot 2 (Frente): top: 102px, left: 19px, rotate: 0deg
            const closedTop = isBack ? 48 : isMiddle ? 72 : 102;
            const closedLeft = isBack ? 24 : isMiddle ? 16 : 19;
            const closedRotate = isBack ? -9.5 : isMiddle ? -3.2 : 0;

            // OPEN POSITIONS (Fanned Out upwards in an abanico):
            // Slot 0 (Atrás / Top): top: 54px, left: 13px, rotate: -7.5deg
            // Slot 1 (Medio / Mid): top: 144px, left: 19px, rotate: -1.5deg
            // Slot 2 (Frente / Low): top: 236px, left: 24px, rotate: 4.5deg
            const openTop = isBack ? 54 : isMiddle ? 144 : 236;
            const openLeft = isBack ? 13 : isMiddle ? 19 : 24;
            const openRotate = isBack ? -7.5 : isMiddle ? -1.5 : 4.5;

            const currentTop = isWalletOpen ? openTop : closedTop;
            const currentLeft = isWalletOpen ? openLeft : closedLeft;
            const currentRotate = isWalletOpen ? openRotate : closedRotate;

            const zIndex = isCardHovered ? 28 : 12 + slotIndex * 2;

            return (
              <motion.div
                key={card.id}
                onClick={(e) => handleCardClick(card.id, e)}
                onMouseEnter={() => {
                  if (isWalletOpen) setHoveredCardId(card.id);
                }}
                onMouseLeave={() => {
                  if (hoveredCardId === card.id) setHoveredCardId(null);
                }}
                initial={false}
                animate={{
                  top: isCardHovered ? currentTop - 8 : currentTop,
                  left: currentLeft,
                  rotate: currentRotate,
                  scale: isCardHovered ? 1.025 : 1,
                  zIndex: zIndex,
                }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 28,
                  mass: 0.75,
                }}
                className="visa-card absolute cursor-pointer select-none overflow-hidden"
                style={{
                  width: "304px",
                  height: "186px",
                  borderRadius: "23px",
                  border: "1.8px solid rgba(255, 255, 255, 0.92)",
                  transformOrigin: "28% 85%",
                  boxShadow: isCardHovered
                    ? "0 18px 36px rgba(0,0,0,0.65), 0 0 20px rgba(255,255,255,0.2)"
                    : "0 10px 24px rgba(0,0,0,0.45)",
                }}
              >
                {/* ------------------------------------------------------------- */}
                {/* CARD BACKGROUND MATERIALS                                     */}
                {/* ------------------------------------------------------------- */}
                {isBack && (
                  /* SLOT 0: Gradiente Azul Marino (#1b2848) a Dorado Ámbar (#b87b42) */
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #1b2848 0%, #22345d 38%, #785231 72%, #b87b42 100%)",
                    }}
                  >
                    {/* Subtle micro noise & golden sheen */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/10 to-transparent pointer-events-none" />
                  </div>
                )}

                {isMiddle && (
                  /* SLOT 1: Plateado Mate con Franja Vertical Holográfica Arcoíris */
                  <div className="absolute inset-0 bg-[#e3e3e3]">
                    {/* Franja vertical holográfica arcoíris a la derecha */}
                    <div
                      className="absolute top-0 bottom-0 right-[28px] w-[58px] pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(180deg, #ebb665 0%, #c96f49 22%, #3b5998 44%, #4ea8de 66%, #66b2a0 85%, #e29568 100%)",
                        opacity: 0.88,
                        filter: "blur(7px)",
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 right-[38px] w-[34px] pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(180deg, #ffd166 0%, #ef476f 25%, #118ab2 55%, #06d6a0 85%, #f77f00 100%)",
                        opacity: 0.65,
                        filter: "blur(2px)",
                      }}
                    />
                  </div>
                )}

                {isFront && (
                  /* SLOT 2: Negro Carbón Mate (#323438 a #2b2d31) */
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(145deg, #323438 0%, #2b2d31 100%)",
                    }}
                  >
                    {/* Subtle carbon velvet sheen */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none" />
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* LOGO "VISA" ARRIBA A LA IZQUIERDA                             */}
                {/* ------------------------------------------------------------- */}
                <div
                  className="absolute"
                  style={{
                    top: "14px",
                    left: "16px",
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: "29px",
                      fontWeight: 800,
                      fontStyle: "italic",
                      transform: "skewX(-11deg)",
                      display: "inline-block",
                      letterSpacing: "0.5px",
                      lineHeight: 1,
                      color: isMiddle ? "#1c1c1e" : "#ffffff",
                      textShadow: isMiddle
                        ? "1px 1px 2px rgba(235, 182, 101, 0.6), -1px -1px 2px rgba(78, 168, 222, 0.6)"
                        : "0 1px 3px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    VISA
                  </span>
                </div>

                {/* Contactless Waves Icon */}
                <div
                  className="absolute"
                  style={{
                    top: "17px",
                    right: "18px",
                    zIndex: 2,
                    opacity: isMiddle ? 0.45 : 0.65,
                    color: isMiddle ? "#1c1c1e" : "#ffffff",
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 16.5a5 5 0 0 1 0-9" strokeLinecap="round" />
                    <path d="M12 19a8.5 8.5 0 0 0 0-14" strokeLinecap="round" />
                    <path d="M15.5 21.5a12 12 0 0 0 0-19" strokeLinecap="round" />
                  </svg>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* CARD DETAILS (Revealed when Wallet is Open)                   */}
                {/* ------------------------------------------------------------- */}
                <div
                  className={`absolute inset-x-4 bottom-3 transition-opacity duration-300 ${
                    isWalletOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                  style={{
                    color: isMiddle ? "#1c1c1e" : "#ffffff",
                  }}
                >
                  {/* EMV Chip & Number */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/80 shadow-xs relative overflow-hidden">
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/30" />
                      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-black/30" />
                    </div>
                    <span className="font-mono text-xs font-bold tracking-[0.24em] drop-shadow-sm">
                      {card.number}
                    </span>
                  </div>

                  {/* Holder & Expiration */}
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-wider uppercase opacity-85 pt-1 border-t border-current/15">
                    <span className="truncate max-w-[170px]">{card.holder}</span>
                    <span>{card.exp}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* =================================================================== */}
          {/* 3. BOLSILLO FRONTAL 3D CON BORDE COSIDO, BLUR Y BRILLO ESPECULAR   */}
          {/* =================================================================== */}
          <div
            onClick={handleToggle}
            className="wallet-front-pocket absolute flex flex-col justify-center items-center cursor-pointer select-none"
            style={{
              left: "3px",
              right: "3px",
              bottom: "3px",
              height: "204px",
              borderRadius: "36px",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              overflow: "hidden",
              zIndex: 30,
              /* Gradiente con resplandor carmesí en la esquina inferior derecha */
              background:
                "radial-gradient(125% 110% at 78% 84%, rgba(166,29,24,0.90) 0%, rgba(108,17,15,0.56) 38%, rgba(30,22,23,0.95) 68%, rgba(23,23,25,0.98) 100%)",
              /* Sombras inset multicapa para volumen acolchado 3D */
              boxShadow:
                "inset 0 2px 3px rgba(255, 255, 255, 0.4), inset 2.5px 0 3px rgba(255, 255, 255, 0.25), inset 0 -6px 12px rgba(0, 0, 0, 0.8), inset -2.5px 0 4px rgba(0, 0, 0, 0.6), 0 -8px 24px rgba(0, 0, 0, 0.45)",
            }}
          >
            {/* REFLEJO ESPECULAR BLANCO VERTICAL DIFUMINADO EN EL BORDE IZQUIERDO */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "12px",
                bottom: "12px",
                left: "5px",
                width: "14px",
                filter: "blur(3.5px)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.05) 100%)",
              }}
            />

            {/* Specular curved sheen on top rim */}
            <div
              className="absolute inset-x-8 top-0 h-[2px] pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
              }}
            />

            {/* BORDE COSIDO REALISTA EN SVG */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="stitch-thread-shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="1" stdDeviation="0.6" floodColor="rgba(0,0,0,0.75)" />
                </filter>
              </defs>
              <rect
                x="8"
                y="8"
                width="calc(100% - 16px)"
                height="calc(100% - 16px)"
                rx="28"
                fill="none"
                stroke="rgba(255, 255, 255, 0.38)"
                strokeWidth="1.3"
                strokeDasharray="5 5"
                strokeLinecap="round"
                filter="url(#stitch-thread-shadow)"
              />
            </svg>

            {/* LABEL: "Total a Pagar" */}
            <p
              className="text-center font-sans relative z-10 select-none"
              style={{
                color: "rgba(255, 255, 255, 0.55)",
                fontSize: "13.5px",
                fontWeight: 500,
                letterSpacing: "0.2px",
                marginBottom: "3px",
              }}
            >
              {label}
            </p>

            {/* MONTO PRINCIPAL: "$ 4,018.00" */}
            <div className="flex items-baseline justify-center relative z-10 select-none">
              <span
                style={{
                  fontSize: "34px",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                  marginRight: "4px",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                {currencySymbol}
              </span>
              <span
                style={{
                  fontSize: "38px",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                {formattedInt}
              </span>
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.6)",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                .{decPart}
              </span>
            </div>

            {/* Micro Helper Cue when Open */}
            <AnimatePresence>
              {isWalletOpen && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="text-[10px] text-white/50 tracking-wide mt-2 text-center relative z-10 select-none"
                >
                  Toca una tarjeta para elegir · Clic para cerrar
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeuomorphicWallet;
