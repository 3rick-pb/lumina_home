"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Search, 
  FolderOpen, 
  Check, 
  Sparkles, 
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  Folder
} from "lucide-react";
import { useGoogleDriveStore, GoogleDriveFile } from "@/lib/googleDriveStore";
import { GoogleDriveIcon } from "./GoogleDriveSettingsCard";

interface GoogleDriveAssetPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, file: GoogleDriveFile) => void;
  title?: string;
}

export function GoogleDriveAssetPickerModal({
  open,
  onClose,
  onSelectImage,
  title = "Seleccionar Imagen desde Google Drive",
}: GoogleDriveAssetPickerModalProps) {
  const { settings, selectFolder, syncFiles, isSyncing, connectAccount } = useGoogleDriveStore();
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

  if (!open) return null;

  const filteredFiles = (settings.files || []).filter((f) =>
    !searchFilter.trim() || f.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const selectedFile = (settings.files || []).find((f) => f.id === selectedFileId);

  const handleConfirmSelection = () => {
    if (selectedFile) {
      onSelectImage(selectedFile.cdnUrl, selectedFile);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-4xl max-h-[88vh] flex flex-col rounded-[2.5rem] bg-[#f8f9fa] dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden select-none"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#202024]/95 backdrop-blur-xl flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <GoogleDriveIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    BANCO DE MEDIOS
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {settings.accountEmail || "Google Drive"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Folder & Search Subheader */}
          <div className="px-6 py-3 border-b border-gray-200/60 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            {/* Folder Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#28282c] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-xs hover:border-gray-300 dark:hover:border-white/20 transition-all cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-amber-500" />
                <span className="truncate max-w-[220px]">{settings.selectedFolderName}</span>
              </button>

              {showFolderDropdown && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#202024] border border-gray-200 dark:border-white/10 shadow-2xl p-2 z-50 space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 px-3 py-1">
                    Cambiar Carpeta de Drive
                  </p>
                  {settings.availableFolders.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        selectFolder(f.id, f.name);
                        setShowFolderDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        settings.selectedFolderId === f.id
                          ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold"
                          : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono ml-2 shrink-0">
                        {f.itemCount} fotos
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar imagen por nombre..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Files Grid View */}
          <div className="p-6 overflow-y-auto flex-1">
            {!settings.isConnected ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                <GoogleDriveIcon className="w-12 h-12" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Google Drive no está vinculado
                </h4>
                <p className="text-xs text-gray-500 max-w-sm">
                  Conecta la cuenta compartida de Google Drive para acceder a todo el catálogo multimedia oficial.
                </p>
                <button
                  type="button"
                  onClick={() => connectAccount()}
                  className="px-5 py-2.5 rounded-2xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-600 transition-all cursor-pointer shadow-md"
                >
                  Conectar Ahora
                </button>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                No se encontraron imágenes en esta carpeta que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      onDoubleClick={() => {
                        onSelectImage(file.cdnUrl, file);
                        onClose();
                      }}
                      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border text-left ${
                        isSelected
                          ? "ring-3 ring-blue-500 border-blue-500 shadow-lg scale-[1.02] bg-blue-50/20 dark:bg-blue-900/10"
                          : "border-gray-200/80 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md bg-white dark:bg-[#1f1f23]"
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="aspect-square w-full relative bg-gray-100 dark:bg-black/30 overflow-hidden">
                        <img
                          src={file.thumbnailUrl || file.cdnUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-white/90">
                          {file.size || "HD"}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                          {file.dimensions || "Listo para catálogo"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 border-t border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#202024]/95 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-gray-500 truncate max-w-sm">
              {selectedFile ? (
                <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block">
                  Seleccionado: {selectedFile.name}
                </span>
              ) : (
                <span>Haz clic en una fotografía para seleccionarla (o doble clic para insertar)</span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedFile}
                onClick={handleConfirmSelection}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Usar en Producto</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
