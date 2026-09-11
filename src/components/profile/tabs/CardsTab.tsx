"use client";

import React, { useState } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { useUserStore, syncCardsToCloud } from "@/lib/userStore";
import { CloudSyncStatus } from "../CloudSyncStatus";

interface CardsTabProps {
  setShowCardModal: (show: boolean) => void;
}

export function CardsTab({ setShowCardModal }: CardsTabProps) {
  const { cards, setDefaultCard, removeCard, user } = useUserStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncCards = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await syncCardsToCloud(user?.id, cards);
    } catch {
      setSyncError("Error al sincronizar tarjetas");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="mb-2">
              <CloudSyncStatus
                isSyncing={isSyncing}
                syncError={syncError}
                onSave={handleSyncCards}
                saveLabel="Guardar en nube"
                savedLabel="Guardado en nube"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#8c9276]" /> Gestión de Billetera & Métodos de Pago
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tus datos están protegidos con cifrado de grado militar.</p>
          </div>
          <button 
            onClick={() => setShowCardModal(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-xs font-semibold rounded-2xl transition-all shadow-md dark:shadow-none cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Añadir Tarjeta
          </button>
        </div>

        {/* Cards Grid or Empty State */}
        {cards.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/40 dark:bg-[#2a2a2c]/40">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/5">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No hay tarjetas de crédito o débito guardadas</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
              Agrega tu primera tarjeta para agilizar tus compras en Lumina Home. No almacenamos tu código CVV.
            </p>
            <button 
              onClick={() => setShowCardModal(true)}
              className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
            >
              + Registrar Tarjeta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((c, index) => {
              const isDark = index % 2 === 0;
              return (
                <div 
                  key={c.id} 
                  className={`p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between h-52 shadow-lg dark:shadow-none transition-transform hover:scale-[1.02] ${
                    isDark 
                      ? "bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 text-white dark:text-gray-900 shadow-black/15" 
                      : "bg-gradient-to-tr from-[#d97736] to-[#b8541c] text-white dark:text-gray-900 shadow-[#d97736]/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-6 bg-yellow-400/80 rounded-md shadow-inner border border-yellow-300" />
                      {c.isDefault && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 dark:bg-[#202022]/25">
                          Principal
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold tracking-widest">{c.type.toUpperCase()}</span>
                  </div>

                  <p className="font-mono text-lg tracking-[0.25em] font-semibold my-2">
                    {c.number}
                  </p>

                  <div className="flex items-center justify-between text-xs text-white/90 dark:text-gray-900/90">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-white/60 dark:text-gray-900/60">Titular</p>
                      <p className="font-semibold">{c.holder}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-wider text-white/60 dark:text-gray-900/60">Expira</p>
                      <p className="font-semibold">{c.exp}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px]">
                    {!c.isDefault ? (
                      <button 
                        onClick={() => setDefaultCard(c.id)} 
                        className="text-white/80 dark:text-gray-900/80 hover:text-white dark:hover:text-gray-900 underline underline-offset-2"
                      >
                        Hacer principal
                      </button>
                    ) : (
                      <span className="text-white/70 dark:text-gray-900/70">Tarjeta por defecto</span>
                    )}
                    <button 
                      onClick={() => removeCard(c.id)} 
                      className="text-red-200 hover:text-white dark:hover:text-gray-900 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
