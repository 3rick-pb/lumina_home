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
    <footer className={`${isAuthPage ? "mt-0 bg-transparent border-t border-gray-200/40" : "mt-20 border-t border-gray-100 bg-gray-50"} pt-12 pb-8`}>
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Do not show guarantee badges on login/register as requested */}
        {!isAuthPage && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-16">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Truck className="h-10 w-10 text-brand-500 mb-4" />
              <h4 className="text-lg font-medium text-gray-900">Envío Seguro</h4>
              <p className="mt-2 text-sm text-gray-500">Entregas garantizadas con seguimiento en tiempo real.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
              <ShieldCheck className="h-10 w-10 text-brand-500 mb-4" />
              <h4 className="text-lg font-medium text-gray-900">Pago Protegido</h4>
              <p className="mt-2 text-sm text-gray-500">Transacciones 100% cifradas y seguras.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
              <RotateCcw className="h-10 w-10 text-brand-500 mb-4" />
              <h4 className="text-lg font-medium text-gray-900">Garantía</h4>
              <p className="mt-2 text-sm text-gray-500">30 días de devolución si no estás satisfecho.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <span className="font-display text-2xl font-bold tracking-tight text-brand-900">
              Lumina.
            </span>
            <p className="mt-4 text-sm text-gray-500 max-w-xs">
              Curamos los mejores artículos para transformar tu casa en el hogar que siempre soñaste. Calidad, diseño y confort.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Tienda</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">Novedades</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">Salón</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">Dormitorio</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">Accesorios</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Soporte</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">Contacto</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">Envíos y Entregas</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">Devoluciones</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Legal</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">Aviso Legal</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">Política de Privacidad</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-accent-600">Términos de Servicio</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Lumina Home. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
