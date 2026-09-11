'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log exception safely for diagnostics
    console.error('Lumina App Client Exception caught by ErrorBoundary:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 select-none">
      <div className="max-w-md w-full backdrop-blur-xl bg-white/80 dark:bg-[#1c1c1e]/80 border border-gray-200/80 dark:border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Icon Shield */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
          <AlertCircle className="w-8 h-8 stroke-[1.75]" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full">
            Recuperación de Vista
          </span>
          <h2 className="text-xl font-bold font-display text-gray-950 dark:text-white pt-1">
            Algo no cargó correctamente
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
            Ocurrió un detalle temporal al procesar la pantalla. Tus productos, bolsa de compras y sesión están completamente seguros.
          </p>
        </div>

        {/* Diagnostic Digest if present in development */}
        {error?.digest && (
          <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 truncate bg-black/5 dark:bg-white/5 py-1 px-2 rounded-lg">
            Ref: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#202022] hover:bg-black dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>

          <Link
            href="/"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all border border-gray-200 dark:border-white/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Ir al Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
