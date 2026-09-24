"use client";

import React, { useState } from "react";
import { CreditCard, Plus, Sparkles } from "lucide-react";
import { useUserStore, syncCardsToCloud } from "@/lib/userStore";
import { CloudSyncStatus } from "../CloudSyncStatus";
import { LuminaCardFolderItem } from "@/components/ui/CardFolder";

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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Tus tarjetas están resguardadas en sobres de billetera cifrados. Toca el sobre para extraer la tarjeta o el ícono de ojo para revelar datos.
            </p>
          </div>
          <button 
            onClick={() => setShowCardModal(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-xs font-semibold rounded-2xl transition-all shadow-md dark:shadow-none cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Añadir Tarjeta
          </button>
        </div>

        {/* Cards Folder Grid or Empty State */}
        {cards.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/40 dark:bg-[#2a2a2c]/40">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/5">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No hay tarjetas de crédito o débito en tu billetera</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
              Agrega tu primera tarjeta para guardarla en tu sobre digital interactivo y agilizar tus compras.
            </p>
            <button 
              onClick={() => setShowCardModal(true)}
              className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none cursor-pointer"
            >
              + Registrar Tarjeta
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8c9276]/10 dark:bg-white/5 border border-[#8c9276]/20 dark:border-white/10 text-[11px] text-gray-600 dark:text-gray-300">
              <Sparkles className="w-3.5 h-3.5 text-[#8c9276]" />
              <span>Presiona cualquier sobre para deslizar la tarjeta hacia afuera o usa el control de privacidad para revelar numeración y CVV.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-2 pb-4 place-items-center">
              {cards.map((c, index) => (
                <LuminaCardFolderItem
                  key={c.id}
                  id={c.id}
                  holder={c.holder}
                  number={c.number}
                  exp={c.exp}
                  type={c.type}
                  isDefault={c.isDefault}
                  index={index}
                  onSetDefault={setDefaultCard}
                  onRemove={removeCard}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
