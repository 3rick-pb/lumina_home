"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Search, 
  FolderOpen, 
  Check, 
  Folder, 
  Sparkles, 
  ExternalLink,
  Layers,
  Image as ImageIcon,
  CheckCircle2
} from "lucide-react";
import { useGoogleDriveStore, GoogleDriveFile } from "@/lib/googleDriveStore";
import { GoogleDriveIcon } from "./GoogleDriveSettingsCard";
import { cn } from "@/lib/utils";

interface FloatingGalleryPhotoPickerProps {
  open: boolean;
  onClose: () => void;
  onSelectPhotos: (urls: string[], files: GoogleDriveFile[]) => void;
  onOpenFullGallery: () => void;
  title?: string;
  allowMultiple?: boolean;
}

export function FloatingGalleryPhotoPicker({
  open,
  onClose,
  onSelectPhotos,
  onOpenFullGallery,
  title = "Seleccionar de Galería de Fotos",
  allowMultiple = true,
}: FloatingGalleryPhotoPickerProps) {
  const [mounted, setMounted] = useState(false);
  const { 
    settings, 
    loadSettings,
    connectGoogleOAuth,
    isSyncing 
  } = useGoogleDriveStore();

  const [searchFilter, setSearchFilter] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      loadSettings();
      setSelectedFileIds([]);
      setSearchFilter("");
    }
  }, [open, loadSettings]);

  if (!mounted || typeof document === "undefined") return null;

  // Filtrar fotos pertenecientes a la carpeta seleccionada actualmente en Galería de Fotos
  const currentFolderFiles = (settings.files || []).filter((f) => {
    const selId = settings.selectedFolderId;
    if (!selId || selId === "root") {
      // Si la carpeta seleccionada es la raíz o no hay seleccionada, mostrar archivos generales de catálogo
      return true;
    }
    return f.folderId === selId;
  });

  const filteredFiles = currentFolderFiles.filter((f) =>
    !searchFilter.trim() || f.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const toggleSelect = (file: GoogleDriveFile) => {
    if (!allowMultiple) {
      setSelectedFileIds([file.id]);
      return;
    }

    if (selectedFileIds.includes(file.id)) {
      setSelectedFileIds(selectedFileIds.filter((id) => id !== file.id));
    } else {
      setSelectedFileIds([...selectedFileIds, file.id]);
    }
  };

  const handleConfirm = () => {
    const pickedFiles = settings.files.filter((f) => selectedFileIds.includes(f.id));
    if (pickedFiles.length === 0) return;
    const urls = pickedFiles.map((f) => f.cdnUrl || f.thumbnailUrl);
    onSelectPhotos(urls, pickedFiles);
    onClose();
  };

  const handleDoubleClick = (file: GoogleDriveFile) => {
    onSelectPhotos([file.cdnUrl || file.thumbnailUrl], [file]);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100050] flex items-center justify-center p-3 sm:p-5 overflow-hidden select-none">
        {/* Backdrop suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Ventana Flotante Compacta */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-[2rem] bg-white dark:bg-[#101015] border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl overflow-hidden font-mono"
        >
          {/* Header Superior con botón 'Ir a Galería de Fotos' */}
          <div className="px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-[#14141c]/80 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                  {title}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                    <Folder className="w-3 h-3" />
                    <span className="truncate max-w-[160px] sm:max-w-[220px]">
                      {settings.selectedFolderName || "Mi Unidad"}
                    </span>
                  </span>
                  <span>•</span>
                  <span>{filteredFiles.length} disponibles</span>
                </div>
              </div>
            </div>

            {/* Acciones del Header */}
            <div className="flex items-center gap-2">
              {/* Botón requerido por el usuario: Ir a Galería de Fotos */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullGallery();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                title="Abrir la Galería de Fotos completa para cambiar de carpeta o sincronizar"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Ir a Galería de Fotos</span>
                <span className="sm:hidden">Galería</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader: Buscador de imágenes */}
          <div className="px-5 py-2.5 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-[#101015] flex items-center justify-between gap-3 shrink-0">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar fotos de esta carpeta por nombre..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Cuerpo: Cuadrícula de fotos para seleccionar */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1">
            {!settings.isConnected ? (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Galería no vinculada
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Conecta tu unidad para cargar automáticamente las fotos organizadas en tus carpetas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => connectGoogleOAuth()}
                  disabled={isSyncing}
                  className="py-2 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold cursor-pointer transition-all active:scale-95"
                >
                  {isSyncing ? "Conectando..." : "Conectar Galería de Fotos"}
                </button>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <ImageIcon className="w-10 h-10 text-zinc-400 opacity-40" />
                <div className="max-w-xs space-y-1">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    No se encontraron fotos en esta carpeta
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Puedes pulsar &quot;Ir a Galería de Fotos&quot; para cambiar de carpeta o sincronizar nuevos archivos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullGallery();
                  }}
                  className="py-2 px-4 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold cursor-pointer active:scale-95"
                >
                  Abrir Galería de Fotos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFileIds.includes(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleSelect(file)}
                      onDoubleClick={() => handleDoubleClick(file)}
                      className={cn(
                        "group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border text-left flex flex-col justify-between",
                        isSelected
                          ? "ring-2 ring-blue-500 border-blue-500 shadow-md scale-[1.02] bg-blue-50/10 dark:bg-blue-950/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500/50 bg-white dark:bg-[#15151c]"
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square w-full relative bg-black/5 dark:bg-black/30 overflow-hidden">
                        <img
                          src={file.thumbnailUrl || file.cdnUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {/* Indicador de selección */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                          {file.size || "HD"}
                        </div>
                      </div>

                      {/* Info de la foto */}
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                          {file.dimensions || "Drive HD"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Bar: Confirmación de Selección */}
          <div className="px-5 py-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-[#14141c]/80 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-zinc-500">
              {selectedFileIds.length > 0 ? (
                <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedFileIds.length} foto(s) seleccionada(s)
                </span>
              ) : (
                <span className="text-[11px]">
                  Toca una o varias fotos para seleccionarlas (o doble clic para insertar al instante)
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={selectedFileIds.length === 0}
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {selectedFileIds.length > 1
                    ? `Insertar ${selectedFileIds.length} Fotos`
                    : "Insertar Foto"}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
