'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  ArrowUpRight, 
  ArrowDownRight, 
  Check, 
  X, 
  ExternalLink
} from 'lucide-react';
import { 
  CartAlertConfig, 
  CartItemAddedPayload, 
  getCityAirportCode,
  hexToRgb,
  getLuminance
} from '@/lib/adminAlertStore';

interface CartAlertCardProps {
  payload: CartItemAddedPayload;
  config: CartAlertConfig;
  onClose?: () => void;
  onAction?: () => void;
  isPreview?: boolean;
}

export function CartAlertCard({
  payload,
  config,
  onClose,
  onAction,
  isPreview = false,
}: CartAlertCardProps) {
  const [bgR, bgG, bgB] = hexToRgb(config.bgColor);
  const isLight = getLuminance(bgR, bgG, bgB) > 0.45;
  const borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
  const subtleBg = isLight ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.06)';
  const subtleBorder = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';

  const safePayload = payload || ({} as Partial<CartItemAddedPayload>);
  const safeUser = safePayload.userName || 'Cliente';
  const safeInitial = (safeUser.trim().charAt(0) || 'C').toUpperCase();
  const safeLocation = safePayload.location || 'Ecuador';
  const safeProduct = safePayload.product || {};
  const safeProductTitle = safeProduct.title || 'Artículo Lumina';
  const safeProductImg = safeProduct.imageUrl;
  const safeQuantity = safeProduct.quantity || 1;
  const rawPrice = typeof safeProduct.price === 'number' ? safeProduct.price : parseFloat(String(safeProduct.price || 0));
  const itemPrice = isNaN(rawPrice) ? '0.00' : rawPrice.toFixed(2);

  const originCode = getCityAirportCode(safeLocation);
  const orderRef = `ORD ${safeProduct.id ? String(safeProduct.id).slice(0, 5).toUpperCase() : '8492'}`;

  // -------------------------------------------------------------
  // STRUCTURE 1: Ruta de Despacho (Reference Flight Trajectory Image)
  // Perfectly contained with clean asymmetric bottom-right tab
  // -------------------------------------------------------------
  if (config.layout === 'flight_route') {
    return (
      <div className="relative w-full max-w-[340px] mx-auto select-none text-left">
        {/* Main Ticket Body */}
        <div 
          className="relative overflow-hidden rounded-[24px] p-4 sm:p-5 shadow-[0_16px_36px_rgba(0,0,0,0.14)] border transition-all"
          style={{ 
            backgroundColor: config.bgColor,
            borderColor,
          }}
        >
          {/* Top Row: Brand & Reference Monospace Code */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span 
                className="font-display font-extrabold text-xs tracking-widest uppercase"
                style={{ color: config.textColor }}
              >
                LUMINA
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span 
                className="text-[10px] font-mono tracking-wider"
                style={{ color: config.subtextColor }}
              >
                {orderRef}
              </span>

              {!isPreview && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  style={{ color: config.subtextColor }}
                  aria-label="Cerrar notificación"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Middle Row: Flight Trajectory Arc with Gliding Package Box */}
          <div className="py-1.5 px-0.5">
            <div className="flex items-center justify-between relative">
              {/* Origin Code */}
              <div className="flex items-center gap-1.5 shrink-0 z-10">
                <span 
                  className="font-display font-black text-lg sm:text-xl tracking-tight"
                  style={{ color: config.textColor }}
                >
                  {originCode}
                </span>
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                </div>
              </div>

              {/* Curved Dashed Trajectory Arc (SVG) */}
              <div className="relative flex-1 h-9 mx-2 overflow-hidden">
                <svg 
                  className="w-full h-full overflow-visible" 
                  viewBox="0 0 160 36" 
                  fill="none" 
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 5 28 Q 80 2 155 28"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                </svg>

                {/* Gliding Parcel Box Animation */}
                <motion.div
                  animate={{
                    left: ['5%', '50%', '92%'],
                    top: ['16px', '0px', '16px'],
                    rotate: [-8, 0, 8],
                    scale: [0.95, 1.1, 0.95],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center"
                  style={{ width: 20, height: 20 }}
                >
                  <div className="w-4.5 h-4.5 rounded bg-amber-500/25 border border-amber-500/50 flex items-center justify-center shadow-xs backdrop-blur-xs">
                    <Package className="w-3 h-3 text-amber-500 fill-amber-500/30" />
                  </div>
                </motion.div>
              </div>

              {/* Destination Code */}
              <div className="flex items-center gap-1.5 shrink-0 z-10">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span 
                  className="font-display font-black text-lg sm:text-xl tracking-tight"
                  style={{ color: config.textColor }}
                >
                  BOLSA
                </span>
              </div>
            </div>
          </div>

          {/* Stacked Information Section ('en pila', visually separated) */}
          <div className="space-y-2 mt-2.5 pt-2.5 border-t" style={{ borderColor: subtleBorder }}>
            {/* Row 1: Cliente & Ubicación */}
            <div 
              className="flex items-center justify-between p-2 rounded-xl border"
              style={{ backgroundColor: subtleBg, borderColor: subtleBorder }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ 
                    backgroundColor: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.15)',
                    color: config.textColor 
                  }}
                >
                  {safeInitial}
                </div>
                <div className="min-w-0">
                  <span 
                    className="text-xs font-bold block truncate leading-tight"
                    style={{ color: config.textColor }}
                  >
                    {safeUser}
                  </span>
                  <span 
                    className="text-[10px] flex items-center gap-1 truncate mt-0.5"
                    style={{ color: config.subtextColor }}
                  >
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span>{safeLocation}</span>
                  </span>
                </div>
              </div>

              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                Registrado
              </span>
            </div>

            {/* Row 2: Producto Sumado & Precio */}
            <div 
              className="flex items-center justify-between p-2 rounded-xl border"
              style={{ backgroundColor: subtleBg, borderColor: subtleBorder }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {safeProductImg ? (
                  <img
                    src={safeProductImg}
                    alt={safeProductTitle}
                    className="w-7 h-7 rounded-lg object-cover shrink-0 border"
                    style={{ borderColor: subtleBorder }}
                  />
                ) : (
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: subtleBg }}
                  >
                    <Package className="w-3.5 h-3.5" style={{ color: config.subtextColor }} />
                  </div>
                )}
                <div className="min-w-0">
                  <span 
                    className="text-xs font-bold block truncate leading-tight"
                    style={{ color: config.textColor }}
                  >
                    {safeProductTitle}
                  </span>
                  <span 
                    className="text-[10px] block mt-0.5 font-medium"
                    style={{ color: config.subtextColor }}
                  >
                    Cantidad: {safeQuantity}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <span 
                  className="text-xs font-bold font-mono block"
                  style={{ color: config.textColor }}
                >
                  ${itemPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Action Pill Button */}
          <div className="mt-3">
            <button
              type="button"
              onClick={onAction}
              className="w-full py-2 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
              style={{
                backgroundColor: config.accentColor,
                color: '#ffffff',
              }}
            >
              <span>Ver detalles en Radar</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Asymmetric Bottom-Right Tab ('✓ En Carrito' perfectly aligned and contained) */}
        <div className="flex justify-end pr-4 -mt-1 relative z-20">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-b-xl border border-t-0 shadow-sm transition-all"
            style={{
              backgroundColor: config.bgColor,
              borderColor,
              color: '#10b981',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Check className="w-2 h-2 text-emerald-500 stroke-[3]" />
            </div>
            <span className="text-[9px] font-extrabold tracking-wide uppercase">
              En Carrito
            </span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STRUCTURE 2: Ficha Escalonada (Stacked Ticket with Perforations)
  // -------------------------------------------------------------
  if (config.layout === 'stacked_ticket') {
    return (
      <div className="relative w-full max-w-[340px] mx-auto select-none text-left">
        <div 
          className="relative overflow-hidden rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.14)] border transition-all"
          style={{ 
            backgroundColor: config.bgColor,
            borderColor,
          }}
        >
          {/* Top Ticket Segment: Product Showcase */}
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                TICKET DE DESPACHO
              </span>
              {!isPreview && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  style={{ color: config.subtextColor }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {safeProductImg ? (
                <img
                  src={safeProductImg}
                  alt={safeProductTitle}
                  className="w-11 h-11 rounded-xl object-cover shrink-0 border"
                  style={{ borderColor: subtleBorder }}
                />
              ) : (
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: subtleBg }}
                >
                  <Package className="w-5 h-5" style={{ color: config.subtextColor }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 
                  className="text-xs font-bold truncate leading-snug"
                  style={{ color: config.textColor }}
                >
                  {safeProductTitle}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className="text-[11px] font-mono font-bold"
                    style={{ color: config.textColor }}
                  >
                    ${itemPrice}
                  </span>
                  <span 
                    className="text-[10px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10"
                    style={{ color: config.subtextColor }}
                  >
                    x{safeQuantity}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Perforated Divider with Side Notches */}
          <div className="relative flex items-center my-1 px-3">
            <div 
              className="absolute -left-2 w-3.5 h-3.5 rounded-full border"
              style={{ backgroundColor: isLight ? '#f3f4f6' : '#0a0a0a', borderColor }}
            />
            <div className="w-full border-t border-dashed" style={{ borderColor: subtleBorder }} />
            <div 
              className="absolute -right-2 w-3.5 h-3.5 rounded-full border"
              style={{ backgroundColor: isLight ? '#f3f4f6' : '#0a0a0a', borderColor }}
            />
          </div>

          {/* Bottom Ticket Segment: Customer Identity & Action */}
          <div className="p-4 pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ 
                    backgroundColor: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.15)',
                    color: config.textColor 
                  }}
                >
                  {safeInitial}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate" style={{ color: config.textColor }}>
                    {safeUser}
                  </span>
                  <span className="text-[10px] block truncate" style={{ color: config.subtextColor }}>
                    {safeLocation}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                En Carrito
              </span>
            </div>

            <button
              type="button"
              onClick={onAction}
              className="w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
              style={{
                backgroundColor: config.accentColor,
                color: '#ffffff',
              }}
            >
              <span>Revisar en Radar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STRUCTURE 3: Cápsula Dividida (Dual Compartment Split Capsule)
  // -------------------------------------------------------------
  if (config.layout === 'split_capsule') {
    return (
      <div className="relative w-full max-w-[340px] mx-auto select-none text-left">
        <div 
          className="relative overflow-hidden rounded-full p-2 pr-2.5 shadow-[0_16px_36px_rgba(0,0,0,0.14)] border flex items-center justify-between gap-2.5 transition-all"
          style={{ 
            backgroundColor: config.bgColor,
            borderColor,
          }}
        >
          {/* Left: Customer Side */}
          <div className="flex items-center gap-2 min-w-0 pl-1">
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ 
                backgroundColor: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.15)',
                color: config.textColor 
              }}
            >
              {safeInitial}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate" style={{ color: config.textColor }}>
                {safeUser}
              </span>
              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
                {originCode} • Carrito
              </span>
            </div>
          </div>

          {/* Center: Animated Package Transit */}
          <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Package className="w-3 h-3 text-amber-500 animate-bounce" />
          </div>

          {/* Right: Product & Quick Radar Action */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="text-right min-w-0 max-w-[95px]">
              <span className="text-[10px] font-bold block truncate" style={{ color: config.textColor }}>
                {safeProductTitle}
              </span>
              <span className="text-[10px] font-mono font-bold block" style={{ color: config.subtextColor }}>
                ${itemPrice}
              </span>
            </div>

            <button
              type="button"
              onClick={onAction}
              className="py-1.5 px-2.5 rounded-full text-[10px] font-bold transition-all shrink-0 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: config.accentColor,
                color: '#ffffff',
              }}
            >
              Radar
            </button>

            {!isPreview && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                style={{ color: config.subtextColor }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STRUCTURE 4: Bento Modular (2x2 Matrix Grid)
  // -------------------------------------------------------------
  return (
    <div className="relative w-full max-w-[340px] mx-auto select-none text-left">
      <div 
        className="relative overflow-hidden rounded-2xl p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.14)] border transition-all space-y-2"
        style={{ 
          backgroundColor: config.bgColor,
          borderColor,
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: config.subtextColor }}>
              Módulo Carrito Lumina
            </span>
          </div>

          {!isPreview && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: config.subtextColor }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2x2 Bento Matrix */}
        <div className="grid grid-cols-2 gap-2">
          {/* Module 1: Customer */}
          <div 
            className="p-2 rounded-xl border flex flex-col justify-between"
            style={{ backgroundColor: subtleBg, borderColor: subtleBorder }}
          >
            <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: config.subtextColor }}>
              Comprador
            </span>
            <div className="mt-1">
              <h5 className="text-xs font-bold truncate" style={{ color: config.textColor }}>
                {safeUser}
              </h5>
              <span className="text-[9px] block truncate" style={{ color: config.subtextColor }}>
                {originCode}
              </span>
            </div>
          </div>

          {/* Module 2: Price & State */}
          <div 
            className="p-2 rounded-xl border flex flex-col justify-between"
            style={{ backgroundColor: subtleBg, borderColor: subtleBorder }}
          >
            <span className="text-[8px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              ✓ Sumado
            </span>
            <div className="mt-1">
              <h5 className="text-xs font-mono font-black" style={{ color: config.textColor }}>
                ${itemPrice}
              </h5>
              <span className="text-[9px] block" style={{ color: config.subtextColor }}>
                {safeQuantity} ud.
              </span>
            </div>
          </div>

          {/* Module 3: Product Showcase */}
          <div 
            className="p-2 rounded-xl border flex items-center gap-1.5"
            style={{ backgroundColor: subtleBg, borderColor: subtleBorder }}
          >
            {safeProductImg ? (
              <img
                src={safeProductImg}
                alt={safeProductTitle}
                className="w-6 h-6 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-md bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                <Package className="w-3 h-3" />
              </div>
            )}
            <span className="text-[10px] font-bold line-clamp-2 leading-tight" style={{ color: config.textColor }}>
              {safeProductTitle}
            </span>
          </div>

          {/* Module 4: Direct Action Button */}
          <button
            type="button"
            onClick={onAction}
            className="p-2 rounded-xl flex flex-col justify-between items-start transition-all active:scale-[0.98] cursor-pointer shadow-xs"
            style={{
              backgroundColor: config.accentColor,
              color: '#ffffff',
            }}
          >
            <span className="text-[8px] font-bold uppercase tracking-wider opacity-85">
              Acceso Rápido
            </span>
            <div className="flex items-center justify-between w-full mt-1">
              <span className="text-xs font-bold">Ver Radar</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
