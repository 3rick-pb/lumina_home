"use client";

import React from "react";
import { ShieldCheck, Truck, RotateCcw, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import { useBrand } from "@/core/hooks/useBrand";
import { useStoreConfig } from "@/core/hooks/useStoreConfig";

export function Footer() {
  const brand = useBrand();
  const store = useStoreConfig();
  const pathname = usePathname();
  const isDashboardPage =
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/loyalty") ||
    pathname?.startsWith("/wallet");
  const isAuthPage = pathname?.startsWith("/auth");

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Do not render store footer on standalone dashboard or before client hydration completes
  if (isDashboardPage || !mounted) {
    return null;
  }

  return (
    <footer id="store-footer" className={`${isAuthPage ? "mt-0 border-t border-gray-200/40 dark:border-white/5" : "mt-24 border-t border-black/[0.06] dark:border-white/[0.06]"} bg-transparent pt-16 pb-12 transition-colors duration-300 scroll-mt-10 relative z-30`}>
      <div className="container mx-auto px-4 md:px-6">
        
        {/* ========================================================================= */}
        {/* TRUST & GUARANTEES: LUMINA INTEGRATED PANORAMIC GLASS SHOWCASE BAR       */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* TRUST & GUARANTEES: LUMINA COMPACT PANORAMIC GLASS SHOWCASE RIBBON        */}
        {/* ========================================================================= */}
        {!isAuthPage && (
          <div className="mb-10 sm:mb-14 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-[#18181b]/70 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-colors duration-300">

            {/* Header Micro-Strip */}
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.05] bg-black/[0.015] dark:bg-white/[0.02]">
              <div className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-bold tracking-wider uppercase text-[#8c9276] dark:text-[#a8b092]">
                <Sparkles className="w-3.5 h-3.5 text-[#8c9276] dark:text-amber-400" />
                <span>Compromiso de Excelencia {brand.shortName}</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 dark:text-gray-500 hidden sm:inline-block">
                Servicio certificado a nivel nacional
              </span>
            </div>

            {/* 3 Compact Pillars Panoramic Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/[0.04] dark:divide-white/[0.05]">
              
              {/* Pillar 1: Envío Seguro */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-center gap-3.5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#8c9276]/12 dark:bg-[#8c9276]/20 text-[#6e745a] dark:text-[#b5bd9b] flex items-center justify-center shrink-0 shadow-xs">
                  <Truck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-[13px] font-bold text-gray-950 dark:text-white tracking-tight">
                      Envío Asegurado
                    </h4>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
                      24/48h
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-1 mt-0.5">
                    Embalaje ecológico y rastreo satelital a tu puerta.
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Gratis en compras &gt; {store.currency.symbol}{store.shipping.freeShippingThreshold}</span>
                  </span>
                </div>
              </div>

              {/* Pillar 2: Pago Protegido */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-center gap-3.5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/12 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-[13px] font-bold text-gray-950 dark:text-white tracking-tight">
                      Pago Blindado PCI-DSS
                    </h4>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      256-Bit
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-1 mt-0.5">
                    Pasarelas bancarias oficiales sin almacenar CVV.
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>Soporte Visa, Mastercard y Google Pay</span>
                  </span>
                </div>
              </div>

              {/* Pillar 3: Garantía */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-center gap-3.5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/12 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                  <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-[13px] font-bold text-gray-950 dark:text-white tracking-tight">
                      Garantía Incondicional
                    </h4>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300">
                      30 Días
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-1 mt-0.5">
                    Pruébalo en tu hogar o te reembolsamos el 100%.
                  </p>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>2 Años de respaldo oficial {brand.shortName}</span>
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <span className="font-display text-2xl font-bold tracking-tight text-brand-900 dark:text-white">
              {brand.logo.text}<span className="text-[#8c9276]">{brand.logo.accentDot}</span>
            </span>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
              Curamos los mejores artículos para transformar tu casa en el hogar que siempre soñaste. Calidad, diseño y confort.
            </p>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Tienda</h3>
            <ul className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
              <li><a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Novedades</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Salón</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Dormitorio</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Accesorios</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Soporte</h3>
            <ul className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
              <li><a href={`mailto:${brand.contact.supportEmail}`} className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Contacto</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Envíos y Entregas</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Devoluciones</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Legal</h3>
            <ul className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
              <li><a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Aviso Legal</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">Términos de Servicio</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 sm:mt-12 border-t border-gray-200/80 dark:border-white/10 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium text-center md:text-left select-none">
            &copy; {new Date().getFullYear()} {brand.name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
