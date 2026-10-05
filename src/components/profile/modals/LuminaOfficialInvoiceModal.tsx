"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, FileText } from "lucide-react";
import { Order } from "@/lib/userStore";
import { LuminaBrandEmblem } from "@/components/ui/LuminaBrandEmblem";

interface LuminaOfficialInvoiceModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function LuminaOfficialInvoiceModal({
  order,
  open,
  onClose,
}: LuminaOfficialInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!open || !order) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Safe formatting helpers
  const subtotal = order.items.reduce(
    (acc, it) => acc + (it.product.price || 0) * (it.quantity || 1),
    0
  );
  const total = order.total || subtotal;
  const tax = Number((subtotal * 0.15).toFixed(2)); // Ecuador IVA 15%
  const discountAmount = Math.max(0, subtotal + tax - total);

  // Format order date
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  const formattedInvoiceNum = order.id
    ? order.id.toUpperCase().replace(/^ORD-?/, "INV-")
    : "INV-2026-0042";

  const rawAddr = order.shippingAddress as Record<string, unknown> | undefined;
  const customerName =
    order.customerName ||
    order.shippingAddress?.recipient ||
    (typeof rawAddr?.fullName === "string" ? rawAddr.fullName : "") ||
    "Cliente Exclusivo";
  const customerEmail =
    order.customerEmail ||
    order.shippingAddress?.email ||
    "cliente@luminahome.ec";
  const customerPhone =
    order.shippingAddress?.phone || "+593 99 876 5432";
  const customerAddress =
    order.shippingAddress?.street
      ? `${order.shippingAddress.street}, ${order.shippingAddress.city || "Quito"}, Ecuador`
      : "Quito, Pichincha, Ecuador";
  const customerDni =
    order.shippingAddress?.idNumber ||
    (typeof rawAddr?.dni === "string" ? rawAddr.dni : "") ||
    (typeof rawAddr?.identification === "string" ? rawAddr.identification : "") ||
    "9999999999";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto lumina-invoice-overlay">
        {/* Print Stylesheet */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            .lumina-invoice-sheet,
            .lumina-invoice-sheet * {
              visibility: visible !important;
            }
            .lumina-invoice-sheet {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 24px !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .lumina-no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md lumina-no-print"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-4xl max-h-[94vh] flex flex-col rounded-[2rem] sm:rounded-[2.5rem] bg-[#121214] border border-white/10 shadow-2xl overflow-hidden select-none my-auto"
        >
          {/* Top Bar for Screen Preview */}
          <div className="px-5 py-3 sm:py-3.5 bg-[#1a1a1e] border-b border-white/10 flex items-center justify-between gap-3 shrink-0 lumina-no-print">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-100 flex items-center gap-2">
                  Factura Oficial Lumina Home
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-medium">
                    APROBADA & PAGADA
                  </span>
                </span>
                <p className="text-[10px] text-gray-400 font-mono">
                  {formattedInvoiceNum} • SRI Ecuador
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-900 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Imprimir o Guardar en PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir / PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Cerrar factura"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Printable Document Area */}
          <div className="overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center bg-[#0a0a0c]">
            {/* The Actual Invoice Sheet (Exact Layout from Factura.jpg) */}
            <div
              ref={invoiceRef}
              className="lumina-invoice-sheet w-full max-w-[820px] bg-[#fbfbfa] text-[#1c1917] rounded-2xl shadow-xl overflow-hidden flex flex-row border border-stone-200"
              style={{
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              }}
            >
              {/* ========================================================================= */}
              {/* 1. LEFT SPINE: VERTICAL STACKED "I N V O I C E" + BOTTOM COLOR SWATCHES   */}
              {/* ========================================================================= */}
              <div className="w-12 sm:w-16 md:w-20 shrink-0 border-r border-stone-300/80 bg-[#f4f3ef] flex flex-col justify-between items-center py-6 sm:py-8 px-1">
                {/* Vertical Stacked Letters: I N V O I C E */}
                <div className="flex flex-col items-center justify-start space-y-3 sm:space-y-4 pt-2">
                  {"INVOICE".split("").map((letter, idx) => (
                    <span
                      key={idx}
                      className="text-stone-900 font-extrabold text-sm sm:text-base md:text-lg tracking-widest leading-none select-none"
                      style={{
                        fontFamily: "Arial, 'Helvetica Neue', sans-serif",
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>

                {/* Bottom Color Swatches / Chips (from Factura.jpg) */}
                <div className="flex flex-col items-center gap-1.5 pb-2">
                  <div className="w-4 h-6 sm:w-5 sm:h-7 bg-[#1c1917] rounded-[2px]" />
                  <div className="w-4 h-6 sm:w-5 sm:h-7 bg-[#b4b2ac] rounded-[2px]" />
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 2. MAIN INVOICE BODY                                                      */}
              {/* ========================================================================= */}
              <div className="flex-1 p-5 sm:p-8 md:p-10 flex flex-col justify-between space-y-6 sm:space-y-8 relative">
                {/* TOP RIGHT HANGING LOGO BADGE */}
                <div className="absolute top-0 right-6 sm:right-10 w-24 sm:w-28 md:w-32 bg-[#1c1917] text-white py-4 px-2 sm:px-3 text-center shadow-md flex flex-col items-center justify-center">
                  <LuminaBrandEmblem size={28} />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
                    LUMINA
                  </span>
                  <span className="text-[8px] tracking-[0.3em] uppercase text-stone-400">
                    HOME
                  </span>
                </div>

                {/* TOP BUSINESS NAME & INFO */}
                <div className="pr-28 sm:pr-36">
                  <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-stone-900 uppercase">
                    Lumina Home Ecuador S.A.S.
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-stone-600 font-medium leading-relaxed mt-1 max-w-sm">
                    R.U.C.: 1792348912001 • Matriz: Av. Shyris & Portugal, Edif. Metropolitan, Piso 12, Quito - Ecuador.
                    <br />
                    Telf: +593 99 876 5432 • Web: luminahome.ec
                    <br />
                    Contribuyente Régimen General • Facturación Electrónica SRI
                  </p>
                </div>

                {/* METADATA: 2 COLUMNS (BILLED TO & INVOICE DETAILS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2 border-t border-stone-200 text-xs">
                  {/* Left Column: BILLED TO */}
                  <div>
                    <h2 className="text-[11px] font-black uppercase tracking-wider text-stone-900 mb-1">
                      BILLED TO:
                    </h2>
                    <p className="font-bold text-stone-900 text-sm">{customerName}</p>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      C.I. / R.U.C.: <span className="font-mono text-stone-800">{customerDni}</span>
                    </p>
                    <p className="text-stone-600 text-[11px] mt-0.5">{customerAddress}</p>
                    <p className="text-stone-600 text-[11px] mt-0.5 font-mono">
                      {customerPhone} • {customerEmail}
                    </p>
                  </div>

                  {/* Right Column: INVOICE META */}
                  <div className="sm:text-right space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-stone-900">
                      INVOICE #{formattedInvoiceNum}
                    </p>
                    <p className="text-stone-600 text-[11px]">
                      <span className="font-semibold text-stone-800">DATE:</span> {orderDate}
                    </p>
                    <p className="text-stone-600 text-[11px]">
                      <span className="font-semibold text-stone-800">DUE DATE:</span> CONTADO / INMEDIATO
                    </p>
                    <p className="text-stone-600 text-[11px]">
                      <span className="font-semibold text-stone-800">ESTADO:</span>{" "}
                      <span className="font-bold text-emerald-800 uppercase bg-emerald-100/70 px-1.5 py-0.5 rounded text-[10px]">
                        PAGADO / EMITIDO
                      </span>
                    </p>
                  </div>
                </div>

                {/* ITEMS TABLE (EXACT ARCHITECTURE FROM FACTURA.JPG) */}
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-t border-b border-stone-900/80 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-stone-900">
                        <th className="py-2.5 px-2 w-8 text-center">NO</th>
                        <th className="py-2.5 px-3">DESCRIPTION</th>
                        <th className="py-2.5 px-2 text-center w-12">QTY</th>
                        <th className="py-2.5 px-3 text-right w-20">RATE</th>
                        <th className="py-2.5 px-3 text-right w-24">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-[11px] sm:text-xs">
                      {order.items.length === 0 ? (
                        <tr>
                          <td className="py-3 px-2 text-center text-stone-400 font-mono">01</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-stone-900">Pieza de Colección Lumina</span>
                            <span className="block text-[10px] text-stone-500 italic mt-0.5" style={{ fontFamily: "Georgia, serif" }}>
                              Diseño & Acabado Nórdico Minimalista
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-mono">1</td>
                          <td className="py-3 px-3 text-right font-mono">${total.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-bold font-mono">${total.toFixed(2)}</td>
                        </tr>
                      ) : (
                        order.items.map((it, idx) => {
                          const itemQty = it.quantity || 1;
                          const itemPrice = it.product.price || 0;
                          const itemTotal = itemPrice * itemQty;
                          const numStr = String(idx + 1).padStart(2, "0");

                          return (
                            <tr key={idx}>
                              <td className="py-3 px-2 text-center text-stone-500 font-mono">{numStr}</td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-stone-900">{it.product.title}</span>
                                <span
                                  className="block text-[10px] text-stone-500 italic mt-0.5"
                                  style={{ fontFamily: "Georgia, serif" }}
                                >
                                  {it.color ? `Color: ${it.color} • ` : ""}
                                  {it.product.titleHighlight || "Línea Exclusiva Lumina Home"}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center font-mono text-stone-800">{itemQty}</td>
                              <td className="py-3 px-3 text-right font-mono text-stone-700">${itemPrice.toFixed(2)}</td>
                              <td className="py-3 px-3 text-right font-bold font-mono text-stone-900">${itemTotal.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* SUBTOTALS SECTION (ALIGNED RIGHT) */}
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-64 space-y-1.5 text-xs text-stone-700">
                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-500 font-medium">Sub Total:</span>
                      <span className="font-mono text-stone-900">${subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between py-0.5 text-amber-700">
                        <span>Descuento Promocional:</span>
                        <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-500 font-medium">IVA (15% Ecuador):</span>
                      <span className="font-mono text-stone-900">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-500 font-medium">Envío Nacional Asegurado:</span>
                      <span className="font-mono text-emerald-700 font-semibold">GRATIS</span>
                    </div>
                    <div className="flex justify-between pt-2 pb-1 border-t-2 border-stone-900 text-stone-900 font-black text-sm sm:text-base">
                      <span>TOTAL:</span>
                      <span className="font-mono">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* FOOTER SECTION: BANK/PAYMENT DETAILS (LEFT) + CURSIVE THANK YOU (RIGHT) */}
                {/* EXPLICITLY: NO PEN, NO SIGNATURE, REPLACED BRANDING */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-stone-300 items-end">
                  {/* Bottom Left: BANK / PAYMENT DETAILS */}
                  <div className="space-y-1 text-[11px] text-stone-600">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-stone-900">
                      BANK / PAYMENT DETAILS
                    </h3>
                    <p className="font-semibold text-stone-800">
                      Método: PayPhone (Tarjetas Visa / MasterCard Ecuador)
                    </p>
                    <p>Referencia Transaccional: {formattedInvoiceNum}</p>
                    <p className="font-mono text-[9px] text-stone-500">
                      SRI Clave Acceso: 05102026011792348912001200100100000421234567819
                    </p>
                  </div>

                  {/* Bottom Right: HANDWRITTEN CURSIVE "Thank you!" + "WE APPRECIATE YOUR BUSINESS." */}
                  <div className="sm:text-right flex flex-col items-start sm:items-end justify-center select-none">
                    {/* Authentic Cursive Script "Thank you!" */}
                    <div
                      className="text-stone-900 text-2xl sm:text-3xl md:text-4xl font-normal leading-none mb-1 text-right"
                      style={{
                        fontFamily:
                          "'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive, sans-serif",
                        transform: "rotate(-2deg)",
                      }}
                    >
                      Thank you!
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-stone-800 mt-1">
                      WE APPRECIATE YOUR BUSINESS.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
