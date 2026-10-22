"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CheckCircle2, X, Sparkles, Link2 } from "lucide-react";
import { useUserStore } from "@/lib/userStore";

export function AccountMergedNotifier() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserStore();

  const [isOpen, setIsOpen] = useState(false);
  const [mergedEmail, setMergedEmail] = useState<string>("");

  useEffect(() => {
    // 1. Check URL query parameter: ?merged=true
    const isMergedParam = searchParams.get("merged") === "true";
    
    // 2. Check sessionStorage flag
    let storedNotice: { email?: string; timestamp?: number } | null = null;
    try {
      const raw = sessionStorage.getItem("lumina_merged_account_notification");
      if (raw) {
        storedNotice = JSON.parse(raw);
      }
    } catch {}

    if (isMergedParam || storedNotice) {
      const email = (storedNotice?.email || user?.email || "").toLowerCase().trim();
      
      // Clean up sessionStorage
      try {
        sessionStorage.removeItem("lumina_merged_account_notification");
      } catch {}

      // Clean up URL parameter cleanly without page reload
      if (isMergedParam) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("merged");
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(newUrl, { scroll: false });
      }

      // Check if this account has already seen the unification notice once
      try {
        if (localStorage.getItem("lumina_merged_notified_all") === "true") {
          return;
        }
        if (email && localStorage.getItem(`lumina_merged_notified_${email}`) === "true") {
          return;
        }
        // Mark as notified in localStorage immediately
        localStorage.setItem("lumina_merged_notified_all", "true");
        if (email) {
          localStorage.setItem(`lumina_merged_notified_${email}`, "true");
        }
      } catch {}

      setMergedEmail(email);
      setIsOpen(true);
    }
  }, [searchParams, pathname, router, user?.email]);

  const handleDismiss = () => {
    try {
      localStorage.setItem("lumina_merged_notified_all", "true");
      if (mergedEmail) {
        localStorage.setItem(`lumina_merged_notified_${mergedEmail.toLowerCase().trim()}`, "true");
      }
    } catch {}
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="w-full max-w-lg bg-white/95 dark:bg-[#1a1a1c]/95 backdrop-blur-2xl rounded-[2.5rem] border border-amber-500/30 dark:border-amber-500/20 shadow-[0_24px_64px_rgba(0,0,0,0.25)] p-6 sm:p-8 text-left relative overflow-hidden"
          >
            {/* Ambient Gold Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/10 hover:bg-black/[0.08] dark:hover:bg-white/15 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with dual badge */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-xs">
                  <Link2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                  <Sparkles className="w-3 h-3" />
                  Cuenta Unificada con Éxito
                </div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-gray-950 dark:text-white mt-1">
                  Se ha detectado tu cuenta previa
                </h3>
              </div>
            </div>

            {/* Explanation Body */}
            <div className="space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>
                Hemos detectado que anteriormente te registraste en <strong className="text-gray-950 dark:text-white">Lumina Home</strong> con el correo:
              </p>
              
              <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/10 flex items-center justify-between gap-2 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                <span className="truncate">{mergedEmail || user?.email || "Tu correo registrado"}</span>
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-bold">
                  Vinculada
                </span>
              </div>

              <p>
                Tus credenciales manuales y tu cuenta de <strong className="text-gray-950 dark:text-white">Google</strong> han sido unificadas. A partir de ahora podrás:
              </p>

              <ul className="space-y-2 pl-1 pt-1 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Acceder con 1 solo clic mediante el botón <strong>&quot;Continuar con Google&quot;</strong> o usar tu contraseña habitual.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>Tus pedidos anteriores, direcciones de entrega, tarjetas guardadas y favoritos se conservan intactos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>Tu mayoría de edad <strong>(+18 años)</strong> ha sido validada automáticamente mediante Google People API.</span>
                </li>
              </ul>
            </div>

            {/* Action */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gray-950 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer text-center"
              >
                Entendido, continuar a Lumina
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
