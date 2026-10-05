"use client";

import React, { useState } from "react";
import { 
  Folder, 
  FolderOpen, 
  RefreshCw, 
  Check, 
  Sparkles, 
  Plus, 
  Search, 
  LogOut, 
  HardDrive,
  X,
  ChevronRight,
  FolderPlus,
  ArrowLeft
} from "lucide-react";
import { useGoogleDriveStore, GoogleDriveFolder } from "@/lib/googleDriveStore";

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

export function GoogleLogoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  );
}

export interface GoogleDriveSettingsCardProps {
  onClose?: () => void;
}

export function GoogleDriveSettingsCard({ onClose }: GoogleDriveSettingsCardProps = {}) {
  const { 
    settings, 
    isSyncing, 
    activeView, 
    setActiveView, 
    connectAccount, 
    disconnectAccount, 
    selectFolder, 
    createFolder, 
    syncFiles 
  } = useGoogleDriveStore();

  const [searchFilter, setSearchFilter] = useState("");
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredFiles = (settings.files || []).filter(file => 
    !searchFilter.trim() || 
    file.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const handleSync = async () => {
    await syncFiles();
    setFeedback("Colecciones sincronizadas con Google Drive");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSelectFolderClick = async (folder: GoogleDriveFolder) => {
    await selectFolder(folder.id, folder.name);
    setFeedback(`Colección activa: ${folder.name}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleGoogleLoginSubmit = async (email: string, name: string) => {
    await connectAccount(email, name);
    setShowGoogleLoginModal(false);
    setFeedback(`Google Drive conectado`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName("");
    setShowCreateFolderModal(false);
    setFeedback(`Nueva colección creada en Google Drive`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="p-4 sm:p-7 md:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white/95 dark:bg-[#18181b]/95 border border-stone-200/80 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-5 sm:space-y-6 relative overflow-hidden backdrop-blur-2xl max-h-[88vh] overflow-y-auto">
      {/* Subtle Brand Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-stone-500/5 dark:bg-white/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-stone-100 dark:bg-white/[0.06] border border-stone-200/80 dark:border-white/10 flex items-center justify-center shadow-sm shrink-0">
            <GoogleDriveIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                <Sparkles className="w-3 h-3 text-amber-500" /> LUMINA · ASSET STUDIO
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-display font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Banco Multimedia & Catálogo
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Colecciones fotográficas y recursos visuales en alta resolución.
            </p>
          </div>
        </div>

        {/* Status Pill & Close */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {settings.isConnected ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Conectado</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-stone-400" />
              <span>Sin Conectar</span>
            </div>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100/80 dark:bg-white/[0.08] hover:bg-stone-200/80 dark:hover:bg-white/15 rounded-full transition-colors cursor-pointer border border-stone-200/60 dark:border-white/10"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* DISCONNECTED STATE */}
      {!settings.isConnected ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-stone-50/60 dark:bg-[#1f1f23]/60 border border-dashed border-stone-300/80 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-white dark:bg-white/[0.06] border border-stone-200/80 dark:border-white/10 flex items-center justify-center shadow-md">
            <GoogleLogoIcon className="w-8 h-8" />
          </div>
          <div className="max-w-sm space-y-1">
            <h4 className="text-base font-display font-bold text-gray-900 dark:text-gray-100">
              Conectar Google Drive
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Acceso a carpetas y fotografía autorizada de producto.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowGoogleLoginModal(true)}
            disabled={isSyncing}
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <GoogleLogoIcon className="w-4 h-4" />
            <span>Vincular Cuenta de Google</span>
          </button>
        </div>
      ) : (
        /* CONNECTED STATE: ACCOUNT STRIP + FOLDERS OR ACTIVE FOLDER FILES */
        <div className="space-y-5 relative z-10">
          {/* Top Account Strip */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 dark:bg-[#202024]/80 border border-stone-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 border border-stone-200/60 dark:border-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <GoogleLogoIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                    {settings.accountName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold shrink-0 border border-amber-500/20">
                    Drive Activo
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                  {settings.accountEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                title="Sincronizar Google Drive"
                className="p-2 rounded-xl bg-white dark:bg-white/10 hover:bg-stone-100 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/10 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-amber-500" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => disconnectAccount()}
                title="Cerrar sesión de Google"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-500 hover:text-rose-600 dark:hover:text-rose-300 border border-stone-200/60 dark:border-white/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desconectar</span>
              </button>
            </div>
          </div>

          {/* VIEW SWITCHER / CONTENT */}
          {activeView === "folders" ? (
            /* ========================================================================= */
            /* VIEW 1: EXPLORADOR VISUAL DE CARPETAS DE GOOGLE DRIVE                     */
            /* ========================================================================= */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    Carpetas Disponibles ({settings.availableFolders.length})
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Selecciona la colección activa para el inventario de la tienda.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateFolderModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                    <span>Nueva Carpeta</span>
                  </button>

                  {settings.selectedFolderId && (
                    <button
                      type="button"
                      onClick={() => setActiveView("files")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <span>Ver Fotos</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Folders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {settings.availableFolders.map((folder) => {
                  const isSelected = settings.selectedFolderId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      onClick={() => handleSelectFolderClick(folder)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/80 shadow-md ring-2 ring-amber-500/20"
                          : "bg-white dark:bg-[#1f1f23] border-stone-200/80 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                          <Folder className="w-5 h-5 fill-amber-500/30" />
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-500/25">
                            <Check className="w-3 h-3" /> En Uso
                          </span>
                        )}
                      </div>

                      <div>
                        <h5 className="font-bold text-xs text-gray-900 dark:text-gray-100 line-clamp-1">
                          {folder.name}
                        </h5>
                        <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                          {folder.itemCount} archivos
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFolderClick(folder);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-stone-100 dark:bg-white/5 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>{isSelected ? "Colección Activa" : "Usar Colección"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: FOTOGRAFÍAS DE LA CARPETA ACTIVA                                  */
            /* ========================================================================= */
            <div className="space-y-4">
              {/* Active Folder Bar */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        COLECCIÓN ACTIVA
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                      {settings.selectedFolderName} ({filteredFiles.length} fotografías)
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView("folders")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#202024] hover:bg-stone-50 dark:hover:bg-white/10 text-gray-900 dark:text-gray-100 text-xs font-bold border border-stone-200/80 dark:border-white/10 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>Cambiar Colección</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar fotografías..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <span className="text-[11px] text-stone-400 font-mono">
                  {filteredFiles.length} disponibles
                </span>
              </div>

              {/* Photos Grid */}
              {filteredFiles.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-white/10 rounded-2xl">
                  No se encontraron fotografías en esta colección.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative rounded-2xl bg-white dark:bg-[#1d1d21] border border-stone-200/80 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                      <div className="aspect-square w-full relative bg-stone-100 dark:bg-black/30 overflow-hidden">
                        <img
                          src={file.thumbnailUrl || file.cdnUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono text-white/90">
                          {file.size || "HD"}
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[9px] text-stone-400 font-mono mt-0.5 truncate">
                          {file.dimensions || "2000x2000"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* POPUP MODAL: INICIAR SESIÓN CON GOOGLE */}
      {showGoogleLoginModal && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1c1c1f] border border-stone-200 dark:border-white/10 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GoogleLogoIcon className="w-6 h-6" />
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Vincular Cuenta de Google
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleLoginModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleGoogleLoginSubmit("multimedia.lumina@gmail.com", "Lumina Home Oficial")}
                className="w-full p-3 rounded-2xl border border-stone-200 dark:border-white/10 hover:border-amber-500 bg-stone-50 dark:bg-white/5 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 flex items-center gap-3 transition-all text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center font-bold text-xs shrink-0">
                  L
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                    Lumina Home Oficial
                  </p>
                  <p className="text-[11px] text-stone-400 font-mono truncate">
                    multimedia.lumina@gmail.com
                  </p>
                </div>
              </button>

              <div className="pt-2 border-t border-stone-200 dark:border-white/5">
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                  O escribe tu correo corporativo:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="usuario@gmail.com"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-white dark:bg-[#141416] text-gray-900 dark:text-gray-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <button
                    type="button"
                    disabled={!customGoogleEmail.includes("@")}
                    onClick={() => handleGoogleLoginSubmit(customGoogleEmail, customGoogleEmail.split("@")[0])}
                    className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 disabled:opacity-40 text-white dark:text-stone-900 text-xs font-bold cursor-pointer transition-all"
                  >
                    Conectar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: CREAR NUEVA CARPETA EN DRIVE */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateFolderSubmit}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1c1c1f] border border-stone-200 dark:border-white/10 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Nueva Carpeta en Drive
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nombre de la Colección
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ej. Colección Nórdica 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-white dark:bg-[#141416] text-gray-900 dark:text-gray-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Crear Carpeta
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
