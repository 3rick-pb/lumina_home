"use client";

import React, { useMemo } from "react";
import { GoogleWalletIcon } from "@/components/ui/GoogleWalletButton";
import { ArrowRight, ShoppingBag, Truck, CheckCircle2 } from "lucide-react";

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
  paymentMethodType?: "card" | "app";
  payphonePhone?: string;
  googleWalletPassUrl?: string;
  onAddToGoogleWallet?: () => void;
  onViewOrderInProfile?: () => void;
  onDownloadInvoice?: () => void;
  onContinueShopping?: () => void;
}

/**
 * Logos vectoriales oficiales de redes bancarias
 */
function CardNetworkBadge({ network }: { network: ReceiptCardNetwork }) {
  if (network === "mastercard") {
    return (
      <svg className="w-6 h-4 shrink-0 inline-block" viewBox="0 0 48 32" fill="none">
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
      <svg className="w-6 h-4 shrink-0 inline-block" viewBox="0 0 48 32" fill="none">
        <rect width="48" height="32" rx="4" fill="#2E77BC" />
        <text
          x="24"
          y="14"
          textAnchor="middle"
          fill="#FFF"
          fontSize="8"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
        >
          AMEX
        </text>
        <text
          x="24"
          y="24"
          textAnchor="middle"
          fill="#FFF"
          fontSize="7"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
        >
          EXPRESS
        </text>
      </svg>
    );
  }

  if (network === "diners-club") {
    return (
      <svg className="w-6 h-4 shrink-0 inline-block" viewBox="0 0 46 30" fill="none">
        <rect width="46" height="30" rx="6" fill="#004C97" />
        <circle cx="21" cy="15" r="9" stroke="#FFF" strokeWidth="2" />
        <path d="M18 8.5a6.5 6.5 0 0 0 0 13V8.5ZM23 8.5v13a6.5 6.5 0 0 0 0-13Z" fill="#FFF" />
      </svg>
    );
  }

  if (network === "discover") {
    return (
      <svg className="w-7 h-3.5 shrink-0 inline-block" viewBox="0 0 116 26" fill="none">
        <text x="0" y="20" fill="#1E1B4B" fontSize="18" fontWeight="900" fontFamily="system-ui, sans-serif">
          DISC
        </text>
        <circle cx="56" cy="14" r="7" fill="#F97316" />
        <text x="66" y="20" fill="#1E1B4B" fontSize="18" fontWeight="900" fontFamily="system-ui, sans-serif">
          VER
        </text>
      </svg>
    );
  }

  return (
    <span className="font-black italic text-xs tracking-tight text-[#1A1F71] inline-block font-sans">
      VISA
    </span>
  );
}

/**
 * PayPhone Icon
 */
function PayPhoneBadge() {
  return (
    <svg className="w-4 h-4 shrink-0 inline-block" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#FF5900" />
      <path
        d="M9 16C9 12.134 12.134 9 16 9C19.866 9 23 12.134 23 16C23 19.866 19.866 23 16 23H10C9.44772 23 9 22.5523 9 22V16Z"
        fill="#FFFFFF"
      />
      <circle cx="16" cy="16" r="3" fill="#FF5900" />
    </svg>
  );
}

/**
 * Generador de código de barras vectorial SVG ultra nítido estilo Code 128
 */
function BoardingPassBarcode({ code = "INV_133925" }: { code?: string }) {
  const bars = useMemo(() => {
    const clean = (code || "LUMINA").toUpperCase();
    const result: { isBar: boolean; width: number }[] = [];

    // Patrón de inicio
    result.push({ isBar: true, width: 2.5 });
    result.push({ isBar: false, width: 1.5 });
    result.push({ isBar: true, width: 1.5 });
    result.push({ isBar: false, width: 2.5 });
    result.push({ isBar: true, width: 1.5 });
    result.push({ isBar: false, width: 3 });

    for (let i = 0; i < clean.length; i++) {
      const charCode = clean.charCodeAt(i);
      const b1 = ((charCode * 3 + i * 5) % 3) + 1.2;
      const s1 = ((charCode * 7 + i * 2) % 3) + 1;
      const b2 = ((charCode * 5 + i * 11) % 3) + 1.2;
      const s2 = ((charCode * 11 + i * 7) % 3) + 1;
      const b3 = ((charCode * 2 + i * 3) % 2) + 1;
      const s3 = ((charCode * 4 + i) % 2) + 1;

      result.push({ isBar: true, width: b1 });
      result.push({ isBar: false, width: s1 });
      result.push({ isBar: true, width: b2 });
      result.push({ isBar: false, width: s2 });
      result.push({ isBar: true, width: b3 });
      result.push({ isBar: false, width: s3 });
    }

    // Patrón de parada
    result.push({ isBar: true, width: 2.5 });
    result.push({ isBar: false, width: 3 });
    result.push({ isBar: true, width: 3 });
    result.push({ isBar: false, width: 1.5 });
    result.push({ isBar: true, width: 1.5 });
    result.push({ isBar: false, width: 1.5 });
    result.push({ isBar: true, width: 2.5 });

    return result;
  }, [code]);

  let currentX = 0;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <svg
        className="w-full max-w-[240px] h-14"
        viewBox="0 0 260 55"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        {bars.map((item, idx) => {
          const x = currentX;
          currentX += item.width * 2.3;
          if (!item.isBar) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={item.width * 2.1}
              height={55}
              fill="#0F172A"
            />
          );
        })}
      </svg>
      <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-neutral-800 mt-1 uppercase">
        *{code}*
      </span>
    </div>
  );
}

/**
 * COMPONENTE PRINCIPAL: CONFIRMACIÓN ESTILO BOARDING PASS MINIMALISTA
 * Inspirado fielmente en la referencia visual (mockup de iPhone con ticket naranja y blanco)
 */
export function PaymentConfirmationReceipt({
  orderId = "INV_133925",
  amount = "$72.99",
  currency = "USD",
  dateText,
  customerName = "Erick Arteaga",
  shippingLocation = "Quito, Pichincha · Ecuador",
  itemSummary = "Jarrón Luna (x1)",
  cardNetwork = "mastercard",
  cardLast4 = "5555",
  paymentMethodType = "card",
  payphonePhone = "099 123 4567",
  onAddToGoogleWallet,
  onViewOrderInProfile,
  onContinueShopping,
}: PaymentReceiptProps) {
  // Extraer ciudad para el destino en grande
  const destinationCity = useMemo(() => {
    if (!shippingLocation) return "QUITO";
    const parts = shippingLocation.split(",");
    const city = parts[0]?.trim();
    return city ? city.toUpperCase() : "QUITO";
  }, [shippingLocation]);

  // Formato de fecha limpio DD.MM.YYYY tipo ticket
  const formattedDate = useMemo(() => {
    try {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = now.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    } catch {
      return "20.10.2026";
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 sm:py-6 animate-fade-in select-none">
      
      {/* ============================================================== */}
      {/* 1. MOCKUP DE DISPOSITIVO IPHONE ULTRA ELEGANTE (COMO EN LA FOTO) */}
      {/* ============================================================== */}
      <div className="relative w-full max-w-[340px] sm:max-w-[365px] rounded-[48px] sm:rounded-[54px] p-2 sm:p-2.5 bg-[#18181B] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] ring-1 ring-black/40">
        
        {/* Dynamic Island / Notch superior del teléfono */}
        <div className="relative w-full flex justify-center pt-1.5 pb-1 z-20">
          <div className="w-24 sm:w-26 h-4 sm:h-4.5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[#111113] border border-[#222]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#0a1128]" />
          </div>
        </div>

        {/* Pantalla interior con fondo de estudio */}
        <div className="relative rounded-[38px] sm:rounded-[44px] bg-gradient-to-b from-[#27272A] via-[#1C1C1E] to-[#121214] p-3 sm:p-3.5 flex flex-col items-center overflow-hidden">
          
          {/* ========================================================== */}
          {/* 2. EL TICKET TIPO BOARDING PASS (IDÉNTICO A LA REFERENCIA) */}
          {/* ========================================================== */}
          <div className="w-full bg-[#FAFAF9] rounded-[28px] overflow-hidden shadow-2xl flex flex-col text-neutral-900 border border-black/5">
            
            {/* -------------------------------------------------------- */}
            {/* TARJETA SUPERIOR NARANJA VIBRANTE                         */}
            {/* -------------------------------------------------------- */}
            <div className="m-2 rounded-[22px] bg-[#FF5500] text-black p-5 sm:p-6 shadow-md flex flex-col items-center text-center relative overflow-hidden">
              
              {/* Origen: LUMINA */}
              <h2 className="text-3xl sm:text-[34px] font-black tracking-tight uppercase text-black font-sans leading-none">
                LUMINA
              </h2>

              {/* Divisor central con línea vertical: #INV-XXXX | 2ND CLASS/EXPRESS */}
              <div className="flex items-center justify-center gap-3 my-2.5 text-[11px] font-bold uppercase tracking-wider text-black">
                <span className="font-mono font-extrabold">{orderId}</span>
                <div className="w-[3px] h-7 bg-black rounded-full" />
                <span className="font-sans font-extrabold">ENVÍO EXPRESS</span>
              </div>

              {/* Destino: Ciudad del cliente (estilo KYIV) */}
              <h2 className="text-3xl sm:text-[34px] font-black tracking-tight uppercase text-black font-sans leading-none">
                {destinationCity}
              </h2>

              {/* Banner destacado: TU PEDIDO SALE MAÑANA */}
              <div className="mt-4 px-3.5 py-1.5 rounded-full bg-black text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Truck className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>TU PEDIDO SALE MAÑANA</span>
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* CUERPO DEL TICKET BLANCO CON DATOS DE COMPRA             */}
            {/* -------------------------------------------------------- */}
            <div className="px-5 pt-3 pb-2 space-y-4">
              
              {/* Nombre del titular (estilo MYKOLA KORZH) */}
              <div>
                <h3 className="text-base sm:text-[17px] font-black uppercase tracking-tight text-neutral-950 font-sans">
                  {customerName}
                </h3>
              </div>

              {/* Cuadrícula 1: Método de Pago | Despacho | Entrega */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-black/5">
                <div>
                  <span className="block text-[9.5px] font-bold uppercase tracking-wider text-neutral-600 font-sans">
                    Pago
                  </span>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-black text-neutral-900 font-mono">
                    {paymentMethodType === "app" ? (
                      <>
                        <PayPhoneBadge />
                        <span className="text-[10px]">PayPhone</span>
                      </>
                    ) : (
                      <>
                        <CardNetworkBadge network={cardNetwork} />
                        <span>••••{cardLast4}</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="block text-[9.5px] font-bold uppercase tracking-wider text-neutral-600 font-sans">
                    Despacho
                  </span>
                  <span className="block mt-1 text-[11px] font-black uppercase text-[#FF5500] font-sans">
                    Mañana
                  </span>
                </div>

                <div>
                  <span className="block text-[9.5px] font-bold uppercase tracking-wider text-neutral-600 font-sans">
                    Entrega
                  </span>
                  <span className="block mt-1 text-[11px] font-black uppercase text-neutral-900 font-sans">
                    24 - 48h
                  </span>
                </div>
              </div>

              {/* Cuadrícula 2: Total Pagado | Fecha */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5">
                <div>
                  <span className="block text-[9.5px] font-bold uppercase tracking-wider text-neutral-600 font-sans">
                    Total Pagado
                  </span>
                  <span className="block mt-0.5 text-sm sm:text-base font-black text-neutral-950 font-sans">
                    {amount} <span className="text-[10px] font-mono text-neutral-500 font-bold">{currency}</span>
                  </span>
                </div>

                <div>
                  <span className="block text-[9.5px] font-bold uppercase tracking-wider text-neutral-600 font-sans">
                    Fecha
                  </span>
                  <span className="block mt-0.5 text-sm sm:text-base font-black text-neutral-950 font-mono">
                    {formattedDate}
                  </span>
                </div>
              </div>

            </div>

            {/* -------------------------------------------------------- */}
            {/* LÍNEA DE PERFORACIÓN CON MUESCAS CIRCULARES LATERALES     */}
            {/* -------------------------------------------------------- */}
            <div className="relative w-full my-2 flex items-center justify-center">
              {/* Muesca izquierda */}
              <div className="absolute -left-3.5 w-7 h-7 rounded-full bg-[#1C1C1E] shadow-inner" />
              {/* Línea punteada transversal */}
              <div className="w-[84%] border-b-[2.5px] border-dashed border-neutral-300" />
              {/* Muesca derecha */}
              <div className="absolute -right-3.5 w-7 h-7 rounded-full bg-[#1C1C1E] shadow-inner" />
            </div>

            {/* -------------------------------------------------------- */}
            {/* PARTE INFERIOR: CÓDIGO DE BARRAS NATIVO VECTORIAL         */}
            {/* -------------------------------------------------------- */}
            <div className="px-5 pt-1 pb-5 flex flex-col items-center">
              <BoardingPassBarcode code={orderId} />
              <p className="text-[9.5px] text-neutral-400 font-medium text-center mt-1.5">
                Pase de entrega y trazabilidad en tiempo real
              </p>
            </div>

          </div>

          {/* ========================================================== */}
          {/* 3. BOTÓN OFICIAL GOOGLE WALLET PASS INTEGRADO             */}
          {/* ========================================================== */}
          <div className="w-full mt-3.5 px-1">
            <button
              type="button"
              onClick={onAddToGoogleWallet}
              className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-neutral-900 border border-white/20 text-white font-sans font-bold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-lg cursor-pointer group"
            >
              <GoogleWalletIcon className="w-6 h-6 shrink-0" />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">
                  Guardar pase oficial
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-white group-hover:text-amber-300 transition-colors">
                  Añadir a Google Wallet
                </span>
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. ACCIONES SECUNDARIAS DE LA TIENDA                           */}
      {/* ============================================================== */}
      <div className="w-full max-w-[340px] sm:max-w-[365px] mt-4 space-y-2 px-1">
        <button
          type="button"
          onClick={onViewOrderInProfile}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-sans font-bold text-xs flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-sm cursor-pointer"
        >
          <span>Ver mi pedido en el perfil</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onContinueShopping}
          className="w-full py-2.5 px-4 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-sans font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Seguir explorando la tienda</span>
        </button>
      </div>

    </div>
  );
}

export default PaymentConfirmationReceipt;
