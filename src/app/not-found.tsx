import React from "react";
import Link from "next/link";
import { Compass, Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/[0.08] via-[#8c9276]/[0.09] to-amber-300/[0.06] blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full backdrop-blur-2xl bg-white/80 dark:bg-[#1c1c1f]/80 border border-black/[0.05] dark:border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.04)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Floating Pedestal Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-white via-[#faf7f2] to-[#eee8dd] dark:from-[#2a2a2e] dark:via-[#222226] dark:to-[#1a1a1e] border-2 border-white dark:border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.06)] flex items-center justify-center text-gray-800 dark:text-gray-100">
          <Compass className="w-10 h-10 text-[#8c9276] dark:text-amber-400 stroke-[1.5]" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#8c9276] dark:text-amber-400 font-bold bg-[#8c9276]/10 dark:bg-amber-400/10 px-3 py-1 rounded-full">
            Error 404 • Fuera de Órbita
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-gray-950 dark:text-white pt-2">
            Espacio no encontrado
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
            La estancia, producto o página que buscas no existe, ha cambiado de dirección o fue removida de nuestra colección.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
          <Link
            href="/"
            className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gray-950 hover:bg-black dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>

          <Link
            href="/shop"
            className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/10 dark:hover:bg-white/15 text-gray-900 dark:text-gray-100 text-xs font-semibold border border-black/[0.06] dark:border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explorar Colección</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
