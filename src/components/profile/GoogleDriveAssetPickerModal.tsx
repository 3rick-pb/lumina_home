"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Search, 
  FolderOpen, 
  Check, 
  Folder, 
  Plus, 
  Upload 
} from "lucide-react";
import { useGoogleDriveStore, GoogleDriveFile } from "@/lib/googleDriveStore";
import { GoogleDriveIcon } from "./GoogleDriveSettingsCard";
import { formatGoogleDriveUrl, isGoogleDriveUrl } from "@/lib/imageUtils";

interface GoogleDriveAssetPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, file: GoogleDriveFile) => void;
  onSelectMultipleImages?: (imageUrls: string[], files: GoogleDriveFile[]) => void;
  title?: string;
  allowMultiple?: boolean;
}

export function GoogleDriveAssetPickerModal({
  open,
  onClose,
  onSelectImage,
  onSelectMultipleImages,
  title = "Seleccionar de Fotoproductos",
  allowMultiple = false,
}: GoogleDriveAssetPickerModalProps) {
  const { 
    settings, 
    selectFolder, 
    addPhoto, 
    addPhotos 
  } = useGoogleDriveStore();

  const [searchFilter, setSearchFilter] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // Subir al vuelo
  const [quickUrl, setQuickUrl] = useState("");
  const [quickName, setQuickName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const currentFolderFiles = (settings.files || []).filter((f) =>
    !settings.selectedFolderId ||
    settings.selectedFolderId === "folder_lumina_catalog_2026" ||
    f.folderId === settings.selectedFolderId
  );

  const filteredFiles = currentFolderFiles.filter((f) =>
    !searchFilter.trim() || f.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const isMultiMode = allowMultiple || Boolean(title.toLowerCase().includes("galer"));

  const toggleSelect = (file: GoogleDriveFile) => {
    if (isMultiMode) {
      if (selectedFileIds.includes(file.id)) {
        setSelectedFileIds(selectedFileIds.filter((id) => id !== file.id));
      } else {
        setSelectedFileIds([...selectedFileIds, file.id]);
      }
    } else {
      setSelectedFileIds([file.id]);
    }
  };

  const handleConfirmSelection = () => {
    const selectedFiles = settings.files.filter((f) => selectedFileIds.includes(f.id));
    if (selectedFiles.length === 0) return;

    if (isMultiMode && onSelectMultipleImages) {
      onSelectMultipleImages(selectedFiles.map((f) => f.cdnUrl), selectedFiles);
    } else {
      onSelectImage(selectedFiles[0].cdnUrl, selectedFiles[0]);
    }
    onClose();
  };

  const handleQuickAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    const normalized = formatGoogleDriveUrl(quickUrl.trim());
    const name = quickName.trim() || `LUMINA-FOTO-${Date.now().toString().slice(-4)}.jpg`;

    await addPhoto({
      name,
      cdnUrl: normalized,
      thumbnailUrl: normalized,
      size: "HD",
      dimensions: "Resolución Óptima",
      folderId: settings.selectedFolderId || "folder_lumina_catalog_2026",
      mimeType: "image/jpeg",
      source: isGoogleDriveUrl(quickUrl) ? "google_drive" : "url",
    });

    setQuickUrl("");
    setQuickName("");
    setShowQuickAddModal(false);
  };

  const handleQuickUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: Array<Omit<GoogleDriveFile, "id">> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string) || "");
        reader.readAsDataURL(file);
      });

      newItems.push({
        name: file.name.toUpperCase().replace(/\s+/g, "-"),
        cdnUrl: dataUrl,
        thumbnailUrl: dataUrl,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        dimensions: "Resolución Nativa",
        folderId: settings.selectedFolderId || "folder_lumina_catalog_2026",
        source: "upload",
      });
    }

    await addPhotos(newItems);
    setShowQuickAddModal(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
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
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#202024]/95 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <GoogleDriveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    FOTOPRODUCTOS
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-mono truncate hidden xs:inline">
                    {isMultiMode ? "Selección Múltiple" : "Selección Simple"}
                  </span>
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {title}
                </h3>
              </div>
            </div>

            {/* Drive / Cloud Indicator Pill */}
            <div className="flex items-center gap-2">
              {settings.isConnected ? (
                <div className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[120px]">{settings.accountEmail || "Drive Vinculado"}</span>
                </div>
              ) : (
                <div className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-500 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  <span>Catálogo Local / BD</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowQuickAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subir Foto al Vuelo</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Folder & Search Subheader */}
          <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-b border-gray-200/60 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            {/* Folder Switcher */}
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#28282c] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-xs hover:border-gray-300 dark:hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="inline-flex items-center gap-2 truncate">
                  <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-[220px]">{settings.selectedFolderName}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono sm:hidden">Cambiar</span>
              </button>

              {showFolderDropdown && (
                <div className="absolute left-0 mt-2 w-full sm:w-72 rounded-2xl bg-white dark:bg-[#202024] border border-gray-200 dark:border-white/10 shadow-2xl p-2 z-50 space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 px-3 py-1">
                    Cambiar Colección de Fotos
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
            <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar imagen..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Files Grid View */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {filteredFiles.length === 0 ? (
              <div className="p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center text-amber-500">
                  <FolderOpen className="w-7 h-7" />
                </div>
                <div className="max-w-xs space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    No hay fotografías en esta colección
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sube fotos reales desde tu equipo o añade enlaces directos para usarlas en tus productos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>+ Subir Fotografías Ahora</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFileIds.includes(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleSelect(file)}
                      onDoubleClick={() => {
                        onSelectImage(file.cdnUrl, file);
                        onClose();
                      }}
                      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border text-left ${
                        isSelected
                          ? "ring-3 ring-amber-500 border-amber-500 shadow-lg scale-[1.02] bg-amber-50/20 dark:bg-amber-900/10"
                          : "border-gray-200/80 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md bg-white dark:bg-[#1f1f23]"
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
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
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
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#202024]/95 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-gray-500 truncate max-w-sm">
              {selectedFileIds.length > 0 ? (
                <span className="font-semibold text-amber-600 dark:text-amber-400 truncate block">
                  {selectedFileIds.length} fotografía(s) seleccionada(s)
                </span>
              ) : (
                <span>Haz clic en una o varias fotos para seleccionarlas (o doble clic para insertar)</span>
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
                disabled={selectedFileIds.length === 0}
                onClick={handleConfirmSelection}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {selectedFileIds.length > 1
                    ? `Insertar ${selectedFileIds.length} Fotos`
                    : "Usar en Producto"}
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* MODAL: SUBIR FOTO AL VUELO */}
        {showQuickAddModal && (
          <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1c1c1f] border border-stone-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    Añadir Foto al Banco
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Subir archivo */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleQuickUploadFile}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-stone-300 dark:border-white/15 hover:border-amber-500 rounded-2xl text-center cursor-pointer bg-stone-50 dark:bg-white/5 transition-all"
              >
                <Upload className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Seleccionar archivo desde tu equipo
                </p>
                <p className="text-[10px] text-stone-400">JPG, PNG o WEBP</p>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200 dark:border-white/10"></div>
                <span className="flex-shrink mx-2 text-[10px] uppercase font-mono text-stone-400">O pegar enlace</span>
                <div className="flex-grow border-t border-stone-200 dark:border-white/10"></div>
              </div>

              <form onSubmit={handleQuickAddUrl} className="space-y-3">
                <div>
                  <input
                    type="url"
                    required
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    placeholder="URL de imagen o Google Drive..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-stone-50 dark:bg-[#141416] text-gray-900 dark:text-gray-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="Nombre de la fotografía (opcional)..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-stone-50 dark:bg-[#141416] text-gray-900 dark:text-gray-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!quickUrl.trim()}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-all"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
