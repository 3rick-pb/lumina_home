"use client";

import React from "react";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";
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
    <footer className={`${isAuthPage ? "mt-0 bg-transparent border-t border-gray-200/40 dark:border-white/5" : "mt-20 border-t border-black/[0.06] dark:border-white/[0.06] bg-[#fbfbfa] dark:bg-[#141416]"} pt-14 pb-10 transition-colors duration-300`}>
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Trust & Guarantees Bento Ribbon */}
        {!isAuthPage && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-16">
            {/* Card 1: Envío Seguro */}
            <div className="bg-white/90 dark:bg-[#1e1e20]/90 backdrop-blur-2xl rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_12px_32px_-6px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] p-6 sm:p-7 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:border-black/10 dark:hover:border-white/15 hover:-translate-y-1 group">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#8c9276]/10 dark:bg-[#8c9276]/20 text-[#8c9276] dark:text-[#a8b092] flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#8c9276]/15 dark:group-hover:bg-[#8c9276]/25 shadow-2xs">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                Envío Seguro
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal leading-relaxed max-w-xs">
                Entregas garantizadas con seguimiento en tiempo real.
              </p>
            </div>

            {/* Card 2: Pago Protegido */}
            <div className="bg-white/90 dark:bg-[#1e1e20]/90 backdrop-blur-2xl rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_12px_32px_-6px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] p-6 sm:p-7 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:border-black/10 dark:hover:border-white/15 hover:-translate-y-1 group">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#8c9276]/10 dark:bg-[#8c9276]/20 text-[#8c9276] dark:text-[#a8b092] flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#8c9276]/15 dark:group-hover:bg-[#8c9276]/25 shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                Pago Protegido
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal leading-relaxed max-w-xs">
                Transacciones 100% cifradas y seguras.
              </p>
            </div>

            {/* Card 3: Garantía */}
            <div className="bg-white/90 dark:bg-[#1e1e20]/90 backdrop-blur-2xl rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_12px_32px_-6px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] p-6 sm:p-7 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:border-black/10 dark:hover:border-white/15 hover:-translate-y-1 group">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#8c9276]/10 dark:bg-[#8c9276]/20 text-[#8c9276] dark:text-[#a8b092] flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#8c9276]/15 dark:group-hover:bg-[#8c9276]/25 shadow-2xs">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                Garantía
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal leading-relaxed max-w-xs">
                30 días de devolución si no estás satisfecho.
              </p>
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
