"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Check, RefreshCw } from "lucide-react";

export interface CloudSyncStatusProps {
  isSyncing?: boolean;
  syncError?: string | null;
  onSave?: () => Promise<void> | void;
  onRetry?: () => Promise<void> | void;
  saveLabel?: string;
  savedLabel?: string;
  showSaveButton?: boolean;
  compact?: boolean;
  className?: string;
}

export function CloudSyncStatus({
  isSyncing = false,
  syncError = null,
  onSave,
  onRetry,
  saveLabel = "Guardar",
  savedLabel = "Guardado en nube",
  showSaveButton = true,
  compact = false,
  className = "",
}: CloudSyncStatusProps) {
  const [internalJustSaved, setInternalJustSaved] = useState(false);
  const [internalSaving, setInternalSaving] = useState(false);

  const effectiveSyncing = isSyncing || internalSaving;

  const handleManualSave = async () => {
    if (effectiveSyncing || !onSave) return;
    try {
      setInternalSaving(true);
      await onSave();
      setInternalJustSaved(true);
      setTimeout(() => setInternalJustSaved(false), 2600);
    } catch (err) {
      console.warn("Manual save error:", err);
    } finally {
      setInternalSaving(false);
    }
  };

  return (
    <div className={`flex items-center flex-nowrap gap-2 sm:gap-2.5 overflow-x-auto hide-scrollbar max-w-full py-0.5 ${className}`}>
      {/* 1. Supabase Connection Status Badge */}
      {effectiveSyncing ? (
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-[10.5px] sm:text-[11px] font-semibold animate-pulse select-none whitespace-nowrap shrink-0">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Guardando en la Nube</span>
        </div>
      ) : syncError ? (
        <button
          type="button"
          onClick={onRetry || handleManualSave}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200/60 text-red-700 dark:text-red-400 text-[10.5px] sm:text-[11px] font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer select-none whitespace-nowrap shrink-0"
          title="Hacer clic para reintentar sincronización"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span>Error al sincronizar (reintentar)</span>
        </button>
      ) : internalJustSaved ? (
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-[10.5px] sm:text-[11px] font-bold select-none whitespace-nowrap shrink-0 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>✓ Guardado en base de datos</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-[10.5px] sm:text-[11px] font-semibold select-none whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Autoguardado activo</span>
        </div>
      )}

      {/* 2. Manual Save to Cloud Button (Optional Reassurance) */}
      {showSaveButton && onSave && (
        <button
          type="button"
          onClick={handleManualSave}
          disabled={effectiveSyncing}
          className={`font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-95 select-none whitespace-nowrap shrink-0 ${
            compact ? "px-2.5 sm:px-3 py-1.5 text-[10.5px] sm:text-[11px]" : "px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs"
          } ${
            internalJustSaved
              ? "bg-amber-600 hover:bg-amber-700 text-stone-950 font-extrabold shadow-md shadow-amber-600/30 border border-amber-500"
              : "bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold shadow-sm shadow-amber-500/25 border border-amber-400/50"
          }`}
          title="Tus cambios se sincronizan automáticamente en tiempo real en la base de datos."
        >
          {effectiveSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-950" />
              <span>Guardando...</span>
            </>
          ) : internalJustSaved ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3] text-stone-950" />
              <span>{savedLabel}</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-stone-950" />
              <span>{saveLabel}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
