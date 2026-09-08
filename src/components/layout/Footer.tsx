"use client";

import React from "react";
import { ShieldCheck, Truck, RotateCcw, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const isDashboardPage = pathname?.startsWith("/profile") || pathname?.startsWith("/admin");
  const isAuthPage = pathname?.startsWith("/auth");

  // Do not render store footer on standalone dashboard pages (Profile / Admin)
  if (isDashboardPage) {
    return null;
  }

  return (
    <footer className={`${isAuthPage ? "mt-0 bg-transparent border-t border-gray-200/40 dark:border-white/5" : "mt-24 border-t border-black/[0.06] dark:border-white/[0.06] bg-[#fbfbfa] dark:bg-[#141416]"} pt-16 pb-12 transition-colors duration-300`}>
      <div className="container mx-auto px-4 md:px-6">
        
        {/* ========================================================================= */}
        {/* TRUST & GUARANTEES: LUMINA INTEGRATED PANORAMIC GLASS SHOWCASE BAR       */}
        {/* ========================================================================= */}
        {!isAuthPage && (
          <div className="mb-20 relative overflow-hidden rounded-[2.5rem] bg-white/70 dark:bg-[#18181b]/70 backdrop-blur-3xl border border-black/[0.07] dark:border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.02)] transition-all duration-500">
            {/* Ambient Warm Aurora Glow */}
            <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-[#8c9276]/10 dark:bg-[#ccff00]/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />

            {/* Header Micro-Pill */}
            <div className="pt-6 px-6 sm:px-10 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8c9276]/10 dark:bg-[#ccff00]/10 text-[#8c9276] dark:text-[#ccff00] text-[11px] font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compromiso Lumina Excellence</span>
              </div>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 hidden sm:inline-block">
                Servicio certificado a nivel nacional
              </span>
            </div>

            {/* 3 Pillars Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/[0.05] dark:divide-white/[0.05]">
              
              {/* Pillar 1: Envío Seguro */}
              <div className="p-7 sm:p-9 flex flex-col justify-between space-y-4 group hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-13 h-13 rounded-2xl bg-[#8c9276]/15 dark:bg-[#8c9276]/25 text-[#8c9276] dark:text-[#a8b092] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-xs">
                      <Truck className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400">
                      Express 24/48h
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-950 dark:text-white tracking-tight">
                      Envío Asegurado
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                      Embalaje blindado ecológico y trazabilidad satelital en tiempo real directo a tu puerta.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center gap-2 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Gratis en compras superiores a $99</span>
                </div>
              </div>

              {/* Pillar 2: Pago Protegido */}
              <div className="p-7 sm:p-9 flex flex-col justify-between space-y-4 group hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-13 h-13 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-xs">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      Cifrado 256-Bit
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-950 dark:text-white tracking-tight">
                      Pago Blindado PCI-DSS
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                      Transacciones 100% cifradas bajo pasarelas bancarias oficiales sin almacenar códigos CVV.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center gap-2 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Soporte Visa, Mastercard y Google Pay</span>
                </div>
              </div>

              {/* Pillar 3: Garantía */}
              <div className="p-7 sm:p-9 flex flex-col justify-between space-y-4 group hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-13 h-13 rounded-2xl bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-xs">
                      <RotateCcw className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300">
                      30 Días Libres
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-950 dark:text-white tracking-tight">
                      Garantía Incondicional
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                      Pruébalo en tu hogar; si no estás 100% enamorado de la pieza te devolvemos el importe completo.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center gap-2 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>2 Años de Garantía Oficial Lumina</span>
                </div>
              </div>

            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <span className="font-display text-2xl font-bold tracking-tight text-brand-900 dark:text-white">
              Lumina.
            </span>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
              Curamos los mejores artículos para transformar tu casa en el hogar que siempre soñaste. Calidad, diseño y confort.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Tienda</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Novedades</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Salón</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Dormitorio</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Accesorios</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Soporte</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Contacto</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Envíos y Entregas</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Devoluciones</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Legal</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Aviso Legal</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Términos de Servicio</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200/80 dark:border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Lumina Home. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
