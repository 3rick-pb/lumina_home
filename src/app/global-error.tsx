'use client';

import React, { useEffect } from 'react';

export default function GlobalFatalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root Fatal Exception:', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0d0d0e] text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#18181b] border border-white/10 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Algo no cargó correctamente</h2>
            <p className="text-xs text-zinc-400">Ocurrió una interrupción temporal en la aplicación.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer"
            >
              Reintentar
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700 transition-all border border-white/10 cursor-pointer"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
