"use client";

import React, { useState, useEffect } from "react";

export type CardNetwork =
  | "visa"
  | "mastercard"
  | "american-express"
  | "diners-club"
  | "discover";

export interface UserSavedCard {
  id: string;
  network: CardNetwork;
  /** Ej: "HOLO PRISM", "SIGNATURE BLACK", "CENTURION TITANIUM" */
  tier?: string;
  holderName: string;
  last4: string;
  fullNumber?: string;
  expiry: string;
  cvv?: string;
  balanceInt: string;
  balanceDec: string;
  isDefault?: boolean;
}

export interface NetworkThemeConfig {
  network: CardNetwork;
  defaultTier: string;
  displayName: string;
  theSvgSlug: string;
  theSvgCdnUrl: string;
  /** Determina si el logo lleva solo el símbolo (Mastercard, Diners, Amex) o si el logo es tipográfico (Visa, Discover) */
  logoType: "symbol-only" | "wordmark-logo";
  background: string;
  pocketGlow: string;
  dotColor: string;
  darkText: boolean;
  holographic?: boolean;
  patternOverlay?: string;
}

/**
 * FUENTE ÚNICA DE VERDAD PARA AMBAS BILLETERAS
 * Garantiza que la tarjeta en "Billetera & Métodos de Pago" y en la "Bolsa de Compras (Wallet 3D)"
 * tengan SIEMPRE el mismo diseño, color, textura y logo oficial de thesvg.org.
 */
export const CARD_DOTS_TEXTURE_STYLE: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.16) 1.2px, transparent 1.2px), radial-gradient(circle at 2px 2px, rgba(0, 0, 0, 0.65) 1.2px, transparent 1.2px)",
  backgroundSize: "6px 6px",
};

/**
 * FUENTE ÚNICA DE VERDAD PARA AMBAS BILLETERAS
 * Garantiza que la tarjeta en "Billetera & Métodos de Pago" y en la "Bolsa de Compras (Wallet 3D)"
 * tengan SIEMPRE el mismo diseño, color y textura de puntos 3D según el branding de su red bancaria.
 */
export const CARD_NETWORK_THEMES: Record<CardNetwork, NetworkThemeConfig> = {
  visa: {
    network: "visa",
    defaultTier: "VISA",
    displayName: "Visa",
    theSvgSlug: "visa",
    theSvgCdnUrl:
      "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/visa/default.svg",
    logoType: "wordmark-logo",
    // Branding oficial bancario de Visa: Azul marino profundo con resplandor zafiro/cobalto
    background:
      "radial-gradient(circle at 84% 24%, rgba(37, 99, 235, 0.55) 0%, rgba(29, 78, 216, 0.28) 42%, transparent 68%), linear-gradient(165deg, #132448 0%, #0a162e 54%, #050b18 100%)",
    pocketGlow:
      "radial-gradient(circle at 76% 78%, rgba(37, 99, 235, 0.88) 0%, rgba(30, 64, 175, 0.55) 45%, transparent 78%), linear-gradient(165deg, rgba(20,30,52,0.88) 0%, rgba(12,18,34,0.92) 52%, rgba(10,34,80,0.95) 100%)",
    dotColor: "#3b82f6",
    darkText: false,
  },
  mastercard: {
    network: "mastercard",
    defaultTier: "MASTERCARD",
    displayName: "Mastercard",
    theSvgSlug: "mastercard",
    theSvgCdnUrl:
      "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/mastercard/default.svg",
    logoType: "symbol-only",
    // Branding oficial bancario de Mastercard: Mayormente negro carbón/obsidian con suave aura bancaria
    background:
      "radial-gradient(circle at 86% 24%, rgba(235, 0, 27, 0.40) 0%, rgba(247, 158, 27, 0.16) 38%, transparent 64%), linear-gradient(170deg, #2b2c31 0%, #16171a 100%)",
    pocketGlow:
      "radial-gradient(circle at 76% 78%, rgba(220, 28, 28, 0.88) 0%, rgba(145, 22, 22, 0.50) 44%, transparent 76%), linear-gradient(165deg, rgba(39,39,43,0.86) 0%, rgba(22,22,25,0.92) 52%, rgba(78,16,16,0.94) 100%)",
    dotColor: "#ef4444",
    darkText: false,
  },
  "american-express": {
    network: "american-express",
    defaultTier: "AMERICAN EXPRESS",
    displayName: "American Express",
    theSvgSlug: "american-express",
    theSvgCdnUrl:
      "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/american-express/default.svg",
    logoType: "symbol-only",
    // Branding oficial bancario de American Express: Titanio Platinum / Grafito Slate oscuro
    background:
      "radial-gradient(circle at 82% 26%, rgba(56, 189, 248, 0.35) 0%, rgba(14, 165, 233, 0.15) 42%, transparent 65%), linear-gradient(165deg, #262c35 0%, #181d24 54%, #101318 100%)",
    pocketGlow:
      "radial-gradient(circle at 76% 78%, rgba(56, 189, 248, 0.75) 0%, rgba(14, 116, 144, 0.45) 46%, transparent 78%), linear-gradient(165deg, rgba(28,36,48,0.88) 0%, rgba(18,24,32,0.92) 52%, rgba(14,40,64,0.95) 100%)",
    dotColor: "#38bdf8",
    darkText: false,
  },
  "diners-club": {
    network: "diners-club",
    defaultTier: "DINERS CLUB",
    displayName: "Diners Club",
    theSvgSlug: "diners-club",
    theSvgCdnUrl:
      "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/diners-club/default.svg",
    logoType: "symbol-only",
    // Branding oficial bancario de Diners Club: Midnight Sapphire / Azul noche imperial
    background:
      "radial-gradient(circle at 82% 26%, rgba(14, 165, 233, 0.45) 0%, rgba(3, 105, 161, 0.20) 42%, transparent 66%), linear-gradient(165deg, #10243d 0%, #09172a 54%, #040c17 100%)",
    pocketGlow:
      "radial-gradient(circle at 76% 78%, rgba(2, 132, 199, 0.85) 0%, rgba(3, 105, 161, 0.50) 45%, transparent 78%), linear-gradient(165deg, rgba(16,36,60,0.88) 0%, rgba(10,22,38,0.92) 52%, rgba(6,45,86,0.95) 100%)",
    dotColor: "#0284c7",
    darkText: false,
  },
  discover: {
    network: "discover",
    defaultTier: "DISCOVER",
    displayName: "Discover",
    theSvgSlug: "discover",
    theSvgCdnUrl:
      "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/discover/default.svg",
    logoType: "wordmark-logo",
    // Branding oficial bancario de Discover: Warm Copper Bronze / Chocolate oscuro con aura ámbar tostada
    background:
      "radial-gradient(circle at 78% 30%, rgba(249, 115, 22, 0.48) 0%, rgba(194, 65, 12, 0.22) 42%, transparent 68%), linear-gradient(165deg, #2c201a 0%, #1a1310 54%, #100b08 100%)",
    pocketGlow:
      "radial-gradient(circle at 76% 78%, rgba(249, 115, 22, 0.88) 0%, rgba(180, 83, 9, 0.52) 46%, transparent 78%), linear-gradient(165deg, rgba(44,32,26,0.88) 0%, rgba(26,19,16,0.92) 52%, rgba(78,32,12,0.94) 100%)",
    dotColor: "#f97316",
    darkText: false,
  },
};

/**
 * Helper para detectar la red automáticamente si tu base de datos guarda strings como "Mastercard", "AMEX", etc.
 */
export function resolveCardNetwork(input?: string, cardNumber?: string): CardNetwork {
  const raw = (input || "").toLowerCase().trim();
  if (raw.includes("master")) return "mastercard";
  if (raw.includes("amex") || raw.includes("american"))
    return "american-express";
  if (raw.includes("diner")) return "diners-club";
  if (raw.includes("disc")) return "discover";

  if (cardNumber) {
    const digits = cardNumber.replace(/\D/g, "");
    if (
      digits.startsWith("51") ||
      digits.startsWith("52") ||
      digits.startsWith("53") ||
      digits.startsWith("54") ||
      digits.startsWith("55") ||
      digits.startsWith("2")
    )
      return "mastercard";
    if (digits.startsWith("34") || digits.startsWith("37"))
      return "american-express";
    if (
      digits.startsWith("30") ||
      digits.startsWith("36") ||
      digits.startsWith("38")
    )
      return "diners-club";
    if (digits.startsWith("6011") || digits.startsWith("65"))
      return "discover";
    if (digits.startsWith("4")) return "visa";
  }

  return "visa";
}

/**
 * Helper para mapear una tarjeta del store de usuario a UserSavedCard
 */
export function mapPaymentCardToUserSavedCard(
  card: {
    id: string;
    number: string;
    holder: string;
    exp: string;
    type?: string;
    design?: string;
    isDefault?: boolean;
  },
  index = 0
): UserSavedCard {
  const network = resolveCardNetwork(card.type || card.design, card.number);
  const theme = CARD_NETWORK_THEMES[network] || CARD_NETWORK_THEMES.visa;
  const digits = card.number.replace(/\D/g, "");
  const last4 = digits.slice(-4) || "4242";

  const BALANCES: Record<CardNetwork, { int: string; dec: string }> = {
    visa: { int: "2,640", dec: ".50" },
    mastercard: { int: "4,018", dec: ".00" },
    "american-express": { int: "12,450", dec: ".00" },
    "diners-club": { int: "6,180", dec: ".75" },
    discover: { int: "8,920", dec: ".00" },
  };

  const balance = BALANCES[network] || { int: "4,018", dec: ".00" };

  return {
    id: card.id,
    network,
    tier: theme.defaultTier,
    holderName: card.holder || "Titular Lumina",
    last4,
    fullNumber: card.number,
    expiry: card.exp || "12/28",
    cvv: "•••",
    balanceInt: balance.int,
    balanceDec: balance.dec,
    isDefault: Boolean(card.isDefault),
  };
}

/**
 * Tarjetas de demostración con las 5 redes (Visa, Mastercard, American Express, Diners Club y Discover)
 */
export const DEMO_UNIFIED_CARDS: UserSavedCard[] = [
  {
    id: "card-mc-0000",
    network: "mastercard",
    holderName: "Erick Arteaga",
    last4: "0000",
    fullNumber: "5412 7580 9921 0000",
    expiry: "12/28",
    cvv: "842",
    balanceInt: "4,018",
    balanceDec: ".00",
    isDefault: false,
  },
  {
    id: "card-visa-1005",
    network: "visa",
    holderName: "Erick Arteaga",
    last4: "1005",
    fullNumber: "4532 8810 3492 1005",
    expiry: "12/28",
    cvv: "319",
    balanceInt: "2,640",
    balanceDec: ".50",
    isDefault: true,
  },
  {
    id: "card-discover-7785",
    network: "discover",
    holderName: "Erick Arteaga",
    last4: "7785",
    fullNumber: "6011 4902 8831 7785",
    expiry: "12/28",
    cvv: "604",
    balanceInt: "8,920",
    balanceDec: ".00",
    isDefault: false,
  },
  {
    id: "card-amex-9012",
    network: "american-express",
    holderName: "Erick Arteaga",
    last4: "9012",
    fullNumber: "3782 822463 19012",
    expiry: "09/29",
    cvv: "4912",
    balanceInt: "12,450",
    balanceDec: ".00",
    isDefault: false,
  },
  {
    id: "card-diners-4410",
    network: "diners-club",
    holderName: "Erick Arteaga",
    last4: "4410",
    fullNumber: "3654 1198 7623 4410",
    expiry: "05/29",
    cvv: "771",
    balanceInt: "6,180",
    balanceDec: ".75",
    isDefault: false,
  },
];

/**
 * COMPONENTE DE LOGOS OFICIALES BASADO EN THESVG.ORG
 * - Mastercard, Diners Club y American Express: Muestran ÚNICAMENTE el logo/símbolo sin repetir texto afuera.
 * - Visa y Discover: Su logo oficial ES la marca tipográfica (con la esfera naranja en Discover).
 * Todos calibrados para tener exactamente el mismo tamaño óptico (~25px de altura).
 */
export function NetworkBrandLogo({
  network,
  compact = false,
}: {
  network: CardNetwork;
  compact?: boolean;
  darkText?: boolean;
}) {
  const theme = CARD_NETWORK_THEMES[network] || CARD_NETWORK_THEMES.visa;
  const logoHeight = compact ? 22 : 25;

  if (network === "mastercard") {
    // Vectores exactos de https://thesvg.org/icon/mastercard (Solo los 2 círculos entrelazados, sin texto)
    return (
      <div
        className="u-brand-logo-wrap"
        title="Mastercard (thesvg.org/icon/mastercard)"
        data-svg-src={theme.theSvgCdnUrl}
      >
        <svg
          height={logoHeight}
          viewBox="4 2 40 26"
          fill="none"
          className="w-auto shrink-0 drop-shadow-sm"
        >
          <circle cx="18" cy="15" r="13" fill="#EB001B" />
          <circle cx="30" cy="15" r="13" fill="#F79E1B" />
          <path
            d="M24 4.2A12.96 12.96 0 0 0 19 15c0 4.41 2.2 8.31 5 10.8A12.96 12.96 0 0 0 29 15c0-4.41-2.2-8.31-5-10.8Z"
            fill="#FF5F00"
          />
        </svg>
      </div>
    );
  }

  if (network === "american-express") {
    // Emblema oficial en recuadro de https://thesvg.org/icon/american-express
    return (
      <div
        className="u-brand-logo-wrap"
        title="American Express (thesvg.org/icon/american-express)"
        data-svg-src={theme.theSvgCdnUrl}
      >
        <svg
          height={logoHeight}
          viewBox="0 0 48 32"
          fill="none"
          className="w-auto shrink-0 drop-shadow-sm"
        >
          <rect
            x="1"
            y="1"
            width="46"
            height="30"
            rx="5"
            fill="#2E77BC"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="1.2"
          />
          <text
            x="24"
            y="15"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8.2"
            fontWeight="900"
            fontFamily="Inter, system-ui, sans-serif"
            letterSpacing="0.04em"
          >
            AMERICAN
          </text>
          <text
            x="24"
            y="24.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8.2"
            fontWeight="900"
            fontFamily="Inter, system-ui, sans-serif"
            letterSpacing="0.06em"
          >
            EXPRESS
          </text>
        </svg>
      </div>
    );
  }

  if (network === "diners-club") {
    // Isotipo oficial de https://thesvg.org/icon/diners-club (Emblema circular dividido)
    return (
      <div
        className="u-brand-logo-wrap"
        title="Diners Club (thesvg.org/icon/diners-club)"
        data-svg-src={theme.theSvgCdnUrl}
      >
        <svg
          height={logoHeight}
          viewBox="2 1 42 28"
          fill="none"
          className="w-auto shrink-0 drop-shadow-sm"
        >
          <rect
            x="3"
            y="2"
            width="40"
            height="26"
            rx="13"
            fill="rgba(255,255,255,0.14)"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <circle
            cx="21"
            cy="15"
            r="9.5"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            fill="rgba(0, 76, 151, 0.45)"
          />
          <path
            d="M18.6 8.2a7 7 0 0 0 0 13.6V8.2ZM23.4 8.2v13.6a7 7 0 0 0 0-13.6Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    );
  }

  if (network === "discover") {
    // Logo oficial Discover de https://thesvg.org/icon/discover
    return (
      <div
        className="u-brand-logo-wrap"
        title="Discover (thesvg.org/icon/discover)"
        data-svg-src={theme.theSvgCdnUrl}
      >
        <svg
          height={logoHeight}
          viewBox="0 7.6 24 8.8"
          fill="#FFFFFF"
          className="w-auto shrink-0 drop-shadow-sm"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Discover</title>
          <path
            d="M14.58 12a2.023 2.023 0 1 1-2.025-2.023h.002c1.118 0 2.023.906 2.023 2.023z"
            fill="#FF6000"
          />
          <path
            d="M9.38 9.999c-1.124 0-2.025.884-2.025 1.99 0 1.118.878 1.984 2.007 1.984.319 0 .593-.063.93-.221v-.873c-.296.297-.559.416-.895.416-.747 0-1.277-.542-1.277-1.312 0-.73.547-1.306 1.243-1.306.354 0 .622.126.93.428v-.873a1.898 1.898 0 0 0-.913-.233zm-3.352 1.545c-.445-.165-.576-.273-.576-.479 0-.239.233-.422.553-.422.222 0 .405.091.598.308l.388-.508a1.665 1.665 0 0 0-1.117-.422c-.673 0-1.186.467-1.186 1.089 0 .524.239.792.936 1.043.291.103.438.171.513.217a.456.456 0 0 1 .222.394c0 .308-.245.536-.576.536-.354 0-.639-.177-.809-.507l-.479.461c.342.502.752.724 1.317.724.771 0 1.311-.513 1.311-1.249-.002-.603-.252-.876-1.095-1.185zM24 10.3a.29.29 0 0 1-.288.291.29.29 0 0 1-.291-.291v-.003A.29.29 0 1 1 24 10.3zm-.059.001a.235.235 0 0 0-.231-.239.234.234 0 0 0-.232.239c0 .132.104.239.232.239a.235.235 0 0 0 .231-.239zM3.472 13.887h.742v-3.803h-.742v3.803zm12.702-1.248l-1.014-2.554h-.81l1.614 3.9h.399l1.643-3.9h-.804l-1.028 2.554zm2.166 1.248h2.104v-.644h-1.362v-1.027h1.312v-.644h-1.312v-.844h1.362v-.644H18.34v3.803zm5.409-3.557l.11.138h-.097l-.094-.13v.13h-.08v-.334h.107c.081 0 .126.036.126.103.001.046-.025.08-.072.093zm-.006-.092c0-.029-.021-.043-.06-.043h-.014v.087h.014c.039 0 .06-.014.06-.044zm-1.228 2.047l1.197 1.602H22.8l-1.027-1.528h-.097v1.528h-.741v-3.803h1.1c.855 0 1.346.411 1.346 1.123 0 .583-.308.965-.866 1.078zm.103-1.038c0-.37-.251-.563-.713-.563h-.228v1.152h.217c.473-.001.724-.207.724-.589zm-19.487.742a1.91 1.91 0 0 1-.69 1.46c-.365.303-.781.439-1.357.439H.001v-3.803H1.09c1.202 0 2.041.781 2.041 1.904zm-.764-.006c0-.364-.154-.718-.411-.947-.245-.222-.536-.308-1.015-.308H.742v2.515h.199c.479 0 .782-.092 1.015-.302.256-.228.411-.593.411-.958z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    );
  }

  // Por defecto: VISA oficial de thesvg.org normalizada en tamaño óptico
  return (
    <div
      className="u-brand-logo-wrap"
      title="Visa (thesvg.org/icon/visa)"
      data-svg-src={theme.theSvgCdnUrl}
    >
      <svg
        height={logoHeight}
        viewBox="0 8.2 24 7.6"
        fill="#FFFFFF"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto shrink-0 drop-shadow-sm"
      >
        <title>Visa</title>
        <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z" />
      </svg>
    </div>
  );
}

/**
 * Chip EMV Metálico Plateado Oficial
 */
export function SilverEmvChip({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative rounded-[5px] bg-gradient-to-tr from-[#8a94a6] via-[#f1f5f9] to-[#cbd5e1] border border-white/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_1.5px_4px_rgba(0,0,0,0.45)] flex items-center justify-center overflow-hidden shrink-0 select-none ${
        small ? "w-7 h-5" : "w-8.5 h-6 sm:w-9 sm:h-6.5"
      }`}
    >
      <div className="w-full h-[1px] bg-slate-900/40 absolute top-1/2 -translate-y-1/2" />
      <div className="h-full w-[1px] bg-slate-900/40 absolute left-1/3" />
      <div className="h-full w-[1px] bg-slate-900/40 absolute right-1/3" />
      <div className="w-2.5 h-2 rounded-[2px] bg-slate-100/90 border border-slate-400/40 absolute z-[1]" />
    </div>
  );
}

// Alias para compatibilidad
export const MetallicEmvChip = SilverEmvChip;

/* ============================================================================
 * 1. COMPONENTE DE TARJETA PARA "BILLETERA & MÉTODOS DE PAGO" (PANEL DE CUENTA)
 * ============================================================================ */
export function AccountMethodCard({
  card,
  onSetDefault,
  onDelete,
}: {
  card: UserSavedCard;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const theme = CARD_NETWORK_THEMES[card.network] || CARD_NETWORK_THEMES.visa;
  const tierLabel = card.tier || theme.defaultTier;

  return (
    <div
      className={`u-MethodCard ${theme.darkText ? "is-light-skin" : ""}`}
      style={{ background: theme.background }}
    >
      <UnifiedWalletStyles />

      {/* Patrón o Prisma Holográfico según la red */}
      {theme.holographic && <div className="u-holo-beam" />}
      <div
        className="pointer-events-none absolute inset-0 z-[1] select-none"
        style={CARD_DOTS_TEXTURE_STYLE}
      />

      {/* Fila Superior: Chip Plata + Wifi a la izquierda | Logo a la derecha */}
      <div className="u-mc-top">
        <div className="flex items-center gap-2">
          <SilverEmvChip />
          <svg className="w-4 h-4 rotate-90 text-slate-200/90 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8.5 16.5a5 5 0 0 1 0-9" />
            <path d="M12 19a8.5 8.5 0 0 1 0-14" />
            <path d="M15.5 21.5a12 12 0 0 1 0-19" />
          </svg>
        </div>

        <div className="u-mc-top-right">
          <NetworkBrandLogo network={card.network} />
          <button
            type="button"
            className="u-eye-btn"
            title={revealed ? "Ocultar datos" : "Revelar datos"}
            onClick={(e) => {
              e.stopPropagation();
              setRevealed((r) => !r);
            }}
          >
            {revealed ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Cuerpo Medio: Número de tarjeta (Sin subtítulos ni tiers) */}
      <div className="u-mc-body">
        <div className="u-mc-number">
          {revealed
            ? card.fullNumber || `•••• •••• •••• ${card.last4}`
            : `••••  ••••  ••••  ${card.last4}`}
        </div>
      </div>

      {/* Faldón Blanco Inferior (Normal) */}
      <div className="u-mc-white-slip">
        <div className="u-slip-meta-row">
          <div className="u-slip-col">
            <span className="u-slip-lbl">EXPIRA</span>
            <span className="u-slip-val">{card.expiry}</span>
          </div>
          <div className="u-slip-col">
            <span className="u-slip-lbl">CVV</span>
            <span className="u-slip-val">{revealed ? card.cvv || "842" : "•••"}</span>
          </div>
        </div>
        <div className="u-slip-Divider" />
        <div className="u-slip-bottom-row">
          <span className="u-slip-holder">{card.holderName}</span>
          <span className="u-slip-mini-num">•••• {card.last4}</span>
        </div>
      </div>

      {/* Overlay de Acciones en Hover */}
      <div className="u-mc-hover-actions">
        <div className="u-hover-verified">
          <span className="u-verified-tag">TITULAR VERIFICADO</span>
          <span className="u-verified-name">{card.holderName}</span>
        </div>

        <div className="u-hover-btns">
          {card.isDefault ? (
            <span className="u-principal-pill">★ PRINCIPAL</span>
          ) : (
            <button
              type="button"
              className="u-make-default-btn"
              onClick={() => onSetDefault && onSetDefault(card.id)}
            >
              Hacer principal
            </button>
          )}
          <button
            type="button"
            className="u-delete-card-btn"
            onClick={() => onDelete && onDelete(card.id)}
          >
            🗑 Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. BILLETERA 3D PARA LA BOLSA DE COMPRAS (CONSUME LAS MISMAS TARJETAS Y SKINS)
 * ============================================================================ */
export function Wallet3D({
  cards,
  selectedCardId,
  onSelectCard,
}: {
  cards?: UserSavedCard[];
  selectedCardId?: string;
  onSelectCard?: (card: UserSavedCard) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const actualCards = cards !== undefined ? cards : DEMO_UNIFIED_CARDS;

  const defaultCard =
    actualCards.find((c) => c.id === selectedCardId) ||
    actualCards.find((c) => c.isDefault) ||
    actualCards[0];

  const [activeId, setActiveId] = useState<string>(defaultCard?.id || "");

  useEffect(() => {
    if (selectedCardId) {
      setActiveId(selectedCardId);
    } else if (actualCards.length > 0 && !actualCards.some((c) => c.id === activeId)) {
      setActiveId(actualCards[0].id);
    }
  }, [selectedCardId, actualCards, activeId]);

  const activeCard =
    actualCards.find((c) => c.id === activeId) || actualCards[0] || null;

  const activeTheme = activeCard
    ? CARD_NETWORK_THEMES[activeCard.network] || CARD_NETWORK_THEMES.visa
    : CARD_NETWORK_THEMES.visa;

  // La tarjeta seleccionada siempre va al frente (slot 0)
  const orderedCards = activeCard
    ? [activeCard, ...actualCards.filter((c) => c.id !== activeCard.id)]
    : [];

  const openHeight = Math.max(380, 260 + orderedCards.length * 76);

  const handleCardClick = (e: React.MouseEvent, card: UserSavedCard) => {
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
      <UnifiedWalletStyles />
      <div
        className={`w1-shell ${isOpen && orderedCards.length > 0 ? "is-open" : ""}`}
        style={{
          height: isOpen && orderedCards.length > 0 ? `${openHeight}px` : "364px",
        }}
        onClick={() => {
          if (orderedCards.length > 0) {
            setIsOpen((prev) => !prev);
          }
        }}
      >
        <div className="w1-cavity">
          <div className="w1-header">
            <span className="w1-title">Wallet</span>
          </div>

          {/* 4ta tarjeta blanca que asoma a la derecha SOLO en modo demo */}
          {cards === undefined && <div className="w1-peek-card" />}

          {/* Escenario de Tarjetas o Estado Vacío */}
          {orderedCards.length === 0 ? (
            <div className="w1-empty-deck">
              <div className="w1-empty-icon">💳</div>
              <span className="w1-empty-title">Sin tarjetas guardadas</span>
              <span className="w1-empty-desc">
                Agrega una tarjeta a tu cuenta o ingresa los datos abajo para pagar.
              </span>
            </div>
          ) : (
            <div className="w1-cards-stage">
              {orderedCards.map((card, idx) => {
                const theme =
                  CARD_NETWORK_THEMES[card.network] || CARD_NETWORK_THEMES.visa;
                const isSelected = activeCard && card.id === activeCard.id;
                const tierLabel = card.tier || theme.defaultTier;

                const slotClass =
                  idx === 0
                    ? "slot-front"
                    : idx === 1
                    ? "slot-mid"
                    : idx === 2
                    ? "slot-back"
                    : "slot-deep";

                const reverseIndex = orderedCards.length - 1 - idx;
                const openTop = 44 + reverseIndex * 74;
                const openScale = 1 - idx * 0.015;

                return (
                  <div
                    key={card.id}
                    className={`w1-card ${slotClass} ${
                      theme.darkText ? "is-light-card" : ""
                    } ${isSelected ? "is-active" : ""}`}
                    style={{
                      background: theme.background,
                      zIndex: 15 - idx,
                      ...(isOpen
                        ? {
                            top: `${openTop}px`,
                            transform: `translate3d(0, 0, 0) rotate(0deg) scale(${openScale})`,
                          }
                        : {}),
                    }}
                    onClick={(e) => handleCardClick(e, card)}
                  >
                    {/* Textura de puntos 3D sobresalientes con relieve físico */}
                    <div
                      className="pointer-events-none absolute inset-0 z-[1] select-none"
                      style={CARD_DOTS_TEXTURE_STYLE}
                    />

                    {/* Fila Superior: Chip Plata + Wifi a la izquierda | Logo a la derecha */}
                    <div className="w1-card-top">
                      <div className="flex items-center gap-2">
                        <SilverEmvChip small />
                        <svg className="w-3.5 h-3.5 rotate-90 text-slate-200/90 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                          <path d="M12 19a8.5 8.5 0 0 1 0-14" />
                          <path d="M15.5 21.5a12 12 0 0 1 0-19" />
                        </svg>
                      </div>

                      <div className="w1-brand-logo-wrap">
                        <NetworkBrandLogo network={card.network} compact />
                      </div>
                    </div>

                    {/* Fila Media: Número y Titular verificado */}
                    <div className="w1-card-mid">
                      <span className="w1-masked-num">
                        •••• &nbsp;•••• &nbsp;•••• &nbsp;
                        <strong>{card.last4}</strong>
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-300 font-semibold mt-1">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="truncate">{card.holderName}</span>
                      </div>
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
          )}

          {/* Bolsillo delantero de cuero cosido */}
          <div className="w1-leather-pocket">
            <div
              className="w1-pocket-color-engine"
              style={{
                background: activeCard
                  ? activeTheme.pocketGlow || activeTheme.background
                  : "rgba(35, 35, 40, 0.9)",
              }}
            />
            <div className="w1-pocket-leather-vignette" />
            <div className="w1-specular-highlight" />
            <div className="w1-padded-bevel" />

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

            <div className="w1-pocket-content">
              <span className="w1-balance-title">Total balance</span>
              <div className="w1-balance-value">
                <span className="w1-sym">$</span>
                <span className="w1-int">{activeCard ? activeCard.balanceInt : "0"}</span>
                <span className="w1-dec">{activeCard ? activeCard.balanceDec : ".00"}</span>
              </div>

              <div className="w1-active-card-pill">
                <span
                  className="w1-pill-dot"
                  style={{
                    background: activeCard ? activeTheme.dotColor : "#9ca3af",
                    boxShadow: activeCard
                      ? `0 0 8px ${activeTheme.dotColor}`
                      : "none",
                  }}
                />
                <span className="w1-pill-text">
                  {activeCard
                    ? `${activeTheme.displayName} •••• ${activeCard.last4}`
                    : "Sin tarjetas guardadas • Llena los datos abajo"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 3. DEMO INTERACTIVA COMPLETA
 * ============================================================================ */
export default function UnifiedWalletShowcase() {
  const [cards, setCards] = useState<UserSavedCard[]>(DEMO_UNIFIED_CARDS);
  const defaultCard = cards.find((c) => c.isDefault) || cards[0];
  const [selectedId, setSelectedId] = useState<string>(defaultCard?.id || "");

  const handleSetDefault = (id: string) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isDefault: c.id === id,
      }))
    );
    setSelectedId(id);
  };

  return (
    <div className="u-showcase-layout">
      {/* COLUMNA 1: Billetera & Métodos de Pago (Panel de Usuario) */}
      <section className="u-panel-section">
        <div className="u-panel-header">
          <div>
            <span className="u-badge-green">● Cifrado AES-256 Sincronizado</span>
            <h2 className="u-panel-title">Billetera & Métodos de Pago</h2>
            <p className="u-panel-sub">
              Las 5 redes (Visa, Mastercard, Amex, Diners Club y Discover) usan el
              mismo diseño aquí y en la Bolsa de Compras.
            </p>
          </div>
        </div>

        <div className="u-methods-grid">
          {cards.map((card) => (
            <AccountMethodCard
              key={card.id}
              card={card}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      </section>

      {/* COLUMNA 2: Billetera 3D de la Bolsa de Compras */}
      <section className="u-bag-section">
        <div className="u-bag-header">
          <span className="u-bag-step">SECCIÓN 2 · BOLSA DE COMPRAS</span>
          <h3 className="u-bag-title">Misma Billetera en tu Checkout</h3>
        </div>

        <Wallet3D
          cards={cards}
          selectedCardId={selectedId}
          onSelectCard={(card) => setSelectedId(card.id)}
        />
      </section>
    </div>
  );
}

export function UnifiedWalletStyles() {
  return (
    <style>{`
      .u-showcase-layout {
        display: grid;
        grid-template-columns: 1fr 420px;
        gap: 32px;
        max-width: 1320px;
        margin: 0 auto;
        padding: 28px;
        background: #f4f5f7;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
        box-sizing: border-box;
      }

      @media (max-width: 1100px) {
        .u-showcase-layout {
          grid-template-columns: 1fr;
        }
      }

      .u-panel-section,
      .u-bag-section {
        background: #ffffff;
        border-radius: 28px;
        padding: 28px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
        border: 1px solid rgba(15, 23, 42, 0.06);
      }

      .u-badge-green {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        color: #059669;
        background: #ecfdf5;
        padding: 4px 10px;
        border-radius: 99px;
        margin-bottom: 8px;
      }

      .u-panel-title {
        font-size: 22px;
        font-weight: 800;
        color: #111827;
        margin: 0 0 4px 0;
      }

      .u-panel-sub {
        font-size: 13px;
        color: #6b7280;
        margin: 0 0 22px 0;
      }

      .u-methods-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
        gap: 20px;
      }

      .u-bag-header {
        text-align: center;
        margin-bottom: 12px;
      }

      .u-bag-step {
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #ea580c;
      }

      .u-bag-title {
        font-size: 18px;
        font-weight: 800;
        color: #111827;
        margin: 4px 0 0 0;
      }

      /* --- ELEMENTOS COMPARTIDOS DE LAS 5 TARJETAS --- */
      .u-brand-logo-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .u-visa-wordmark {
        font-size: 26px;
        font-weight: 900;
        font-style: italic;
        letter-spacing: -0.04em;
        line-height: 1;
        color: #ffffff;
      }

      .u-visa-wordmark.is-compact {
        font-size: 24px;
      }

      .u-visa-wordmark.is-chromatic {
        color: #1d1e22;
        text-shadow: -1.5px -0.5px 0px rgba(228, 148, 54, 0.85),
          1.5px 0.5px 0px rgba(56, 165, 224, 0.78);
      }

      .u-emv-chip {
        position: relative;
        width: 34px;
        height: 25px;
        border-radius: 6px;
        background: linear-gradient(135deg, #f6d365 0%, #d4af37 50%, #b38728 100%);
        border: 1px solid rgba(255, 255, 255, 0.45);
        box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        flex-shrink: 0;
      }

      .u-emv-chip.is-small {
        width: 26px;
        height: 19px;
        border-radius: 4.5px;
      }

      .u-emv-line-h {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(120, 82, 18, 0.45);
      }

      .u-emv-line-v {
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 1px;
        background: rgba(120, 82, 18, 0.45);
      }

      .u-emv-core {
        position: absolute;
        inset: 5px 8px;
        border: 1px solid rgba(120, 82, 18, 0.45);
        border-radius: 3px;
      }

      .u-holo-beam {
        position: absolute;
        top: -25%;
        right: 18px;
        width: 125px;
        height: 160%;
        background: linear-gradient(
          96deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(238, 172, 72, 0.85) 24%,
          rgba(218, 108, 66, 0.75) 40%,
          rgba(65, 118, 215, 0.88) 64%,
          rgba(135, 178, 232, 0.68) 84%,
          rgba(255, 255, 255, 0) 100%
        );
        transform: skewX(-12deg);
        pointer-events: none;
        z-index: 1;
      }

      .u-pattern-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
      }

      /* --- TARJETA DEL PANEL "BILLETERA & MÉTODOS DE PAGO" --- */
      .u-MethodCard {
        position: relative;
        height: 204px;
        width: 100%;
        max-width: 340px;
        border-radius: 22px;
        padding: 18px 18px 0 18px;
        color: #ffffff;
        overflow: hidden;
        box-shadow: 0 14px 28px -8px rgba(15, 23, 42, 0.22);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
        transition: transform 0.28s ease, box-shadow 0.28s ease;
      }

      .u-MethodCard:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 34px -10px rgba(15, 23, 42, 0.30);
      }

      .u-MethodCard.is-light-skin {
        color: #18191c;
        border: 1px solid rgba(15, 23, 42, 0.08);
      }

      .u-mc-top {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .u-mc-top-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .u-eye-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: rgba(0, 0, 0, 0.24);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        backdrop-filter: blur(6px);
      }

      .u-MethodCard.is-light-skin .u-eye-btn {
        background: rgba(255, 255, 255, 0.65);
        color: #18191c;
        border-color: rgba(0, 0, 0, 0.1);
      }

      .u-mc-body {
        position: relative;
        z-index: 2;
        margin-top: 2px;
      }

      .u-tier-badge {
        display: inline-block;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.06em;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.16);
        border: 1px solid rgba(255, 255, 255, 0.2);
        margin-bottom: 6px;
      }

      .u-MethodCard.is-light-skin .u-tier-badge {
        background: rgba(255, 255, 255, 0.72);
        border-color: rgba(0, 0, 0, 0.1);
        color: #18191c;
      }

      .u-mc-number {
        font-size: 13.5px;
        font-weight: 700;
        letter-spacing: 0.12em;
        font-variant-numeric: tabular-nums;
      }

      /* Faldón blanco inferior */
      .u-mc-white-slip {
        position: relative;
        z-index: 3;
        margin: 0 -18px;
        background: #ffffff;
        color: #111827;
        padding: 9px 18px 11px 18px;
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.12);
        transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
      }

      .u-slip-meta-row {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        margin-bottom: 4px;
      }

      .u-slip-col {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .u-slip-lbl {
        font-size: 8px;
        font-weight: 700;
        color: #9ca3af;
        letter-spacing: 0.06em;
      }

      .u-slip-val {
        font-size: 10.5px;
        font-weight: 700;
        color: #1f2937;
      }

      .u-slip-Divider {
        border-top: 1px dashed #e5e7eb;
        margin: 4px 0 6px 0;
      }

      .u-slip-bottom-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .u-slip-holder {
        font-size: 12px;
        font-weight: 700;
        color: #111827;
      }

      .u-slip-mini-num {
        font-size: 10.5px;
        color: #6b7280;
        font-weight: 600;
      }

      /* Gaveta oscura en Hover */
      .u-mc-hover-actions {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 4;
        padding: 12px 18px 14px 18px;
        background: linear-gradient(180deg, rgba(17, 24, 39, 0.0) 0%, rgba(17, 24, 39, 0.92) 32%, rgba(17, 24, 39, 0.98) 100%);
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        opacity: 0;
        transform: translateY(16px);
        pointer-events: none;
        transition: opacity 0.25s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .u-MethodCard:hover .u-mc-white-slip {
        transform: translateY(100%);
        opacity: 0;
      }

      .u-MethodCard:hover .u-mc-hover-actions {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .u-hover-verified {
        display: flex;
        flex-direction: column;
      }

      .u-verified-tag {
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: rgba(255, 255, 255, 0.6);
      }

      .u-verified-name {
        font-size: 12px;
        font-weight: 700;
        color: #ffffff;
      }

      .u-hover-btns {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .u-make-default-btn {
        font-size: 10px;
        font-weight: 700;
        padding: 5px 10px;
        border-radius: 99px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.14);
        color: #ffffff;
        cursor: pointer;
        backdrop-filter: blur(6px);
      }

      .u-make-default-btn:hover {
        background: #ffffff;
        color: #111827;
      }

      .u-principal-pill {
        font-size: 9.5px;
        font-weight: 800;
        padding: 4px 9px;
        border-radius: 99px;
        background: rgba(245, 158, 11, 0.22);
        border: 1px solid rgba(245, 158, 11, 0.55);
        color: #fbbf24;
      }

      .u-delete-card-btn {
        font-size: 10px;
        font-weight: 700;
        padding: 5px 9px;
        border-radius: 99px;
        border: 1px solid rgba(239, 68, 68, 0.45);
        background: rgba(239, 68, 68, 0.22);
        color: #fca5a5;
        cursor: pointer;
      }

      /* --- ESTILOS DE LA BILLETERA 3D (BOLSA DE COMPRAS) --- */
      .w1-root {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 8px 0;
        user-select: none;
      }

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
        transition: height 0.52s cubic-bezier(0.22, 1, 0.36, 1);
        transform: translateZ(0);
        will-change: height;
      }

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

      /* Estado vacío cuando no hay tarjetas */
      .w1-empty-deck {
        position: absolute;
        top: 52px;
        left: 20px;
        right: 20px;
        height: 136px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 14px 20px;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.035);
        border: 1.2px dashed rgba(255, 255, 255, 0.16);
        box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.4);
        z-index: 4;
        box-sizing: border-box;
      }

      .w1-empty-icon {
        font-size: 24px;
        margin-bottom: 6px;
        opacity: 0.8;
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5));
      }

      .w1-empty-title {
        font-size: 13px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
        letter-spacing: -0.01em;
        margin-bottom: 4px;
      }

      .w1-empty-desc {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.35;
        max-width: 250px;
      }

      .w1-card {
        position: absolute;
        left: 19px;
        width: 322px;
        height: 182px;
        border-radius: 25px;
        padding: 15px 20px;
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

      .w1-card.slot-deep {
        top: 42px;
        transform: translate3d(6px, 0, 0) rotate(-11.5deg);
        transform-origin: bottom left;
        opacity: 0;
      }

      .w1-shell.is-open .w1-card.slot-deep {
        opacity: 1;
      }

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

      .w1-shell:not(.is-open):hover .w1-card.slot-back {
        transform: translate3d(2px, -6px, 0) rotate(-10.6deg);
      }
      .w1-shell:not(.is-open):hover .w1-card.slot-mid {
        transform: translate3d(0, -4px, 0) rotate(-4.1deg);
      }
      .w1-shell:not(.is-open):hover .w1-card.slot-front {
        transform: translate3d(0, -2px, 0) rotate(0deg);
      }

      .w1-shell.is-open .w1-card:hover {
        transform: translate3d(0, -5px, 0) scale(1.01) !important;
        box-shadow: 0 12px 26px rgba(0, 0, 0, 0.48);
      }

      .w1-card-top {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .w1-brand-and-chip {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .w1-tier-pill {
        font-size: 9px;
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
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4px;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.25s ease, transform 0.25s ease;
      }

      .w1-masked-num {
        font-size: 13px;
        letter-spacing: 0.1em;
        opacity: 0.9;
      }

      .w1-holder-mini {
        font-size: 10.5px;
        font-weight: 600;
        opacity: 0.75;
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

      .w1-pocket-color-engine {
        position: absolute;
        inset: -15px;
        z-index: 1;
        filter: blur(18px) saturate(1.55);
        opacity: 0.92;
        transition: background 0.45s ease;
        pointer-events: none;
      }

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
  );
}
