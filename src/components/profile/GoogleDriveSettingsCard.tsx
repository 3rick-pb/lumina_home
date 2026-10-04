"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Folder, 
  FolderOpen, 
  RefreshCw, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Plus, 
  Search, 
  Image as ImageIcon, 
  LogOut, 
  ShieldCheck, 
  AlertCircle,
  HardDrive
} from "lucide-react";
import { useGoogleDriveStore, GoogleDriveFile } from "@/lib/googleDriveStore";

export function GoogleDriveIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A8.97 8.97 0 0 0 0 53h27.5z" fill="#00ac47" />
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.1z" fill="#ea4335" />
      <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#00832d" />
      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684fc" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
    </svg>
  );
}

export function GoogleDriveSettingsCard() {
  const { 
    settings, 
    isSyncing, 
    connectAccount, 
    disconnectAccount, 
    selectFolder, 
    syncFiles, 
    addCustomFile 
  } = useGoogleDriveStore();

  const [searchFilter, setSearchFilter] = useState("");
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredFiles = (settings.files || []).filter(file => 
    !searchFilter.trim() || 
    file.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const handleSync = async () => {
    await syncFiles();
    setFeedback("Archivos de Google Drive actualizados");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileUrl.trim()) return;
    const ok = addCustomFile(newFileUrl.trim(), newFileName.trim() || undefined);
    if (ok) {
      setNewFileUrl("");
      setNewFileName("");
      setShowAddUrlModal(false);
      setFeedback("Fotografía indexada con éxito en Google Drive");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-50/40 via-white/80 to-amber-50/20 dark:from-[#131b26]/60 dark:via-[#18181b]/80 dark:to-[#1a1917]/50 border border-blue-500/20 dark:border-blue-400/20 shadow-xl dark:shadow-none space-y-6 relative overflow-hidden backdrop-blur-2xl">
      {/* Background Decorative Ambient Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#202024] border border-blue-200/80 dark:border-blue-500/30 flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
            <GoogleDriveIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                <Sparkles className="w-3 h-3" /> NUBE CORPORATIVA DE MEDIOS
              </span>
              <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                1 CUENTA PARA TODOS LOS ADMINS
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Conexión con Google Drive
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xl">
              Banco fotográfico centralizado para la tienda. Selecciona una carpeta oficial de Google Drive para escoger imágenes directamente al agregar o editar productos.
            </p>
          </div>
        </div>

        {/* Status Pill & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {settings.isConnected ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Conectado</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-200/70 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Desconectado</span>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Content Area */}
      {!settings.isConnected ? (
        /* Disconnected State: Connect Button */
        <div className="p-6 rounded-3xl bg-white/70 dark:bg-[#1f1f23]/60 border border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <HardDrive className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Vincular Google Drive Corporativo
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Inicia sesión con la cuenta de Google autorizada de Lumina Home para habilitar la galería automática de medios en todos los perfiles administrativos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => connectAccount()}
            disabled={isSyncing}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gray-950/20 dark:shadow-white/15 cursor-pointer"
          >
            <GoogleDriveIcon className="w-4 h-4" />
            <span>{isSyncing ? "Conectando..." : "Conectar Google Drive con Google"}</span>
          </button>
        </div>
      ) : (
        /* Connected State: Account Info + Folder Picker + File Grid */
        <div className="space-y-6 relative z-10">
          {/* Active Account & Folder Strip */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#1d1d21]/90 border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Account Details */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                G
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {settings.accountName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-medium">
                    Cuenta Compartida
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {settings.accountEmail}
                </p>
              </div>
            </div>

            {/* Folder Selector Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#28282c] hover:bg-gray-200/80 dark:hover:bg-[#323236] text-gray-900 dark:text-gray-100 text-xs font-semibold border border-gray-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  <span className="max-w-[200px] truncate">{settings.selectedFolderName}</span>
                </button>

                {showFolderDropdown && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#202024] border border-gray-200 dark:border-white/10 shadow-2xl p-2 z-50 space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 px-3 py-1">
                      Carpetas disponibles en Drive
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

              {/* Sync Button */}
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                title="Sincronizar archivos de Google Drive"
                className="p-2 rounded-xl bg-gray-100 dark:bg-[#28282c] hover:bg-gray-200/80 dark:hover:bg-[#323236] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-amber-500" : ""}`} />
              </button>

              {/* Disconnect Button */}
              <button
                type="button"
                onClick={() => disconnectAccount()}
                title="Desconectar cuenta de Google Drive"
                className="p-2 rounded-xl bg-gray-100 dark:bg-[#28282c] hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Files Bar + Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Archivos en Carpeta ({filteredFiles.length})
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                Listos para insertar en Ficha de Producto
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar fotografía..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddUrlModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Indexar Foto</span>
              </button>
            </div>
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group relative rounded-2xl bg-white dark:bg-[#1d1d21] border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="aspect-square w-full relative bg-gray-100 dark:bg-black/30 overflow-hidden">
                  <img
                    src={file.thumbnailUrl || file.cdnUrl}
                    alt={file.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                      {file.size || "HD"}
                    </span>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-medium text-gray-900 dark:text-gray-100 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[9px] text-gray-400 truncate mt-0.5 font-mono">
                    {file.dimensions || "Original"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredFiles.length === 0 && (
            <div className="p-8 text-center bg-white/40 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-gray-400 text-xs">
              No se encontraron fotografías con el nombre ingresado.
            </div>
          )}
        </div>
      )}

      {/* Index Custom File Modal */}
      {showAddUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#1f1f23] border border-gray-200 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Indexar Archivo en Carpeta Drive
              </h4>
              <button
                type="button"
                onClick={() => setShowAddUrlModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddFileSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                  Enlace de Google Drive o URL Directa
                </label>
                <input
                  type="text"
                  required
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                  Nombre descriptivo del archivo (opcional)
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Ej: LAMPARA-NORDICA-BLANCA.jpg"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUrlModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                >
                  Guardar en Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
