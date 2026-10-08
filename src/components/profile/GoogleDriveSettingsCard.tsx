"use client";

import React, { useState, useEffect } from "react";
import {
  Folder,
  Image as ImageIcon,
  Check,
  LogOut,
  X,
  Search,
  List,
  LayoutGrid,
  Copy,
  Download,
  Eye,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import {
  useGoogleDriveStore,
  GoogleDriveFolder,
  GoogleDriveFile
} from "@/lib/googleDriveStore";

export function GoogleDriveIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l38.8-67.3h27.75L34.35 66.85z" fill="#FFC107" />
      <path d="M45.4 0l38.8 67.3H56.45L17.65 0z" fill="#1976D2" />
      <path d="M27.75 0H0l38.8 67.3h27.75z" fill="#4CAF50" />
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

function LayeredFolderGraphic({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-28 h-20 sm:w-32 sm:h-22 mx-auto select-none ${className}`}>
      <div className="absolute top-1 left-2 sm:left-3 w-18 sm:w-20 h-14 sm:h-16 rounded-lg bg-zinc-200 dark:bg-zinc-300 shadow-xs border border-zinc-300 dark:border-zinc-400 transform -rotate-8 transition-transform duration-300 group-hover:-rotate-12 group-hover:-translate-y-1">
        <div className="p-1 flex items-center justify-between">
          <div className="w-4 h-0.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
          <span className="text-[7px] font-bold font-mono px-1 py-0.2 rounded bg-zinc-300 dark:bg-zinc-400 text-zinc-700">IMG</span>
        </div>
      </div>
      <div className="absolute top-0.5 right-2 sm:right-3 w-18 sm:w-20 h-14 sm:h-16 rounded-lg bg-zinc-100 dark:bg-zinc-200 shadow-xs border border-zinc-300 dark:border-zinc-400 transform rotate-6 transition-transform duration-300 group-hover:rotate-10 group-hover:-translate-y-1.5">
        <div className="p-1 flex items-center justify-between">
          <div className="w-4 h-0.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
          <span className="text-[7px] font-bold font-mono px-1 py-0.2 rounded bg-zinc-300 dark:bg-zinc-400 text-zinc-800">RAW</span>
        </div>
      </div>
      <div className="absolute top-1 left-5 sm:left-6 w-18 sm:w-20 h-14 sm:h-16 rounded-lg bg-white dark:bg-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-300 transform rotate-0 transition-transform duration-300 group-hover:-translate-y-2">
        <div className="p-1.5 flex items-center justify-between">
          <div className="w-5 h-0.5 rounded-full bg-zinc-300 dark:bg-zinc-400" />
          <span className="text-[7px] font-bold font-mono px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-300 text-zinc-900">JPG</span>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-14 sm:h-16 rounded-2xl bg-zinc-300 dark:bg-[#252529] border border-zinc-400/40 dark:border-white/10 shadow-md flex items-end justify-between p-2 transition-colors duration-200 group-hover:bg-zinc-200 dark:group-hover:bg-[#2c2c31]">
        <div className="absolute -top-2 left-0 w-12 sm:w-14 h-4 rounded-t-lg bg-zinc-300 dark:bg-[#252529] border-t border-l border-r border-zinc-400/40 dark:border-white/10 transition-colors group-hover:bg-zinc-200 dark:group-hover:bg-[#2c2c31]" />
        <div className="flex items-center -space-x-1 z-10">
          <div className="w-4.5 h-4.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center p-0.5 shadow-xs">
            <GoogleDriveIcon className="w-3 h-3" />
          </div>
          <div className="w-4.5 h-4.5 rounded-full bg-blue-500 text-white border border-white dark:border-zinc-800 flex items-center justify-center shadow-xs">
            <ImageIcon className="w-2.5 h-2.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export interface GoogleDriveSettingsCardProps {
  onClose?: () => void;
  onSelectPhotoForProduct?: (url: string, file: GoogleDriveFile) => void;
}

export function GoogleDriveSettingsCard({ onClose, onSelectPhotoForProduct }: GoogleDriveSettingsCardProps = {}) {
  const { 
    settings, 
    isSyncing, 
    loadSettings, 
    connectGoogleOAuth, 
    disconnectAccount, 
    selectFolder, 
    syncFiles 
  } = useGoogleDriveStore();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchFilter, setSearchFilter] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Lightbox / Visor HD
  const [previewPhoto, setPreviewPhoto] = useState<GoogleDriveFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Background Realtime Sync sin interrumpir UI
  useEffect(() => {
    loadSettings();
    let interval: NodeJS.Timeout;
    if (settings.isConnected) {
      interval = setInterval(() => {
        // Sincronización silenciosa cada 6 segundos
        fetch("/api/admin/google-drive")
          .then(res => res.json())
          .then(data => {
            if (data?.success && data?.settings) {
              useGoogleDriveStore.setState({ settings: { ...settings, ...data.settings } });
            }
          })
          .catch(() => {});
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [settings.isConnected, loadSettings, settings]);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCopyLink = async (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      showNotification("Enlace directo copiado");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showNotification("No se pudo copiar");
    }
  };

  const handleSync = async () => {
    await syncFiles();
    showNotification("Banco de fotos sincronizado");
  };

  const handleSelectFolder = async (folder: GoogleDriveFolder) => {
    await selectFolder(folder.id, folder.name);
    setSearchFilter("");
    showNotification(`Carpeta activa: ${folder.name}`);
  };

  const clearFolder = async () => {
    await selectFolder("root", "Mi Unidad");
    setSearchFilter("");
  };

  // Determine current step
  const step = !settings.isConnected 
    ? 1 
    : (!settings.selectedFolderId || settings.selectedFolderId === 'root') 
      ? 2 
      : 3;

  const currentFolderFiles = (settings.files || []).filter((f) => 
    f.folderId === settings.selectedFolderId
  );

  const filteredFiles = currentFolderFiles.filter((file) => 
    !searchFilter.trim() || 
    file.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const availableFolders = (settings.availableFolders || []).filter(f => f.id !== 'root');
  const filteredFolders = availableFolders.filter((f) => 
    !searchFilter.trim() || 
    f.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div className="w-full flex flex-col h-[88vh] max-h-[820px] rounded-[2rem] bg-zinc-100 dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden select-none font-sans transition-colors duration-200">
      
      {/* HEADER PRINCIPAL */}
      <div className="px-5 sm:px-7 py-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between gap-4 shrink-0 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
            <GoogleDriveIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              {step === 1 ? "Conectar Google Drive" : step === 2 ? "Seleccionar Carpeta" : settings.selectedFolderName}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
              {step === 1 
                ? "Integración Segura OAuth 2.0" 
                : step === 2 
                  ? "Escoge la carpeta fuente" 
                  : `${filteredFiles.length} recursos disponibles`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {settings.isConnected && (
            <>
              {step === 3 && (
                <button
                  type="button"
                  onClick={clearFolder}
                  className="hidden sm:flex px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-zinc-800 dark:text-zinc-200 text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cambiar Carpeta
                </button>
              )}
              
              <button
                type="button"
                onClick={handleSync}
                className={`p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer ${isSyncing ? "animate-spin" : ""}`}
                title="Actualizar Datos"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
          
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL POR PASO */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0c0c0e] relative">
        
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <LayeredFolderGraphic className="scale-125 mb-4" />
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Almacenamiento Conectado
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Autoriza a Lumina Home para acceder exclusivamente en modo lectura a tus carpetas de Google Drive.
              </p>
            </div>
            <button
              type="button"
              onClick={() => connectGoogleOAuth()}
              disabled={isSyncing}
              className="py-3 px-6 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer flex items-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <GoogleLogoIcon className="w-5 h-5" />
              <span>{isSyncing ? "Conectando..." : "Conectar Google Drive"}</span>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col h-full">
            <div className="px-5 sm:px-7 py-4 border-b border-zinc-100 dark:border-white/5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar carpeta..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181b] border-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 outline-none text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:font-normal"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 sm:p-7">
              {filteredFolders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3">
                  <Folder className="w-10 h-10 opacity-50" />
                  <p className="text-sm">No se encontraron carpetas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredFolders.map(folder => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => handleSelectFolder(folder)}
                      className="group p-5 rounded-3xl bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all flex flex-col items-center text-center gap-3 cursor-pointer shadow-xs hover:shadow-md"
                    >
                      <LayeredFolderGraphic className="scale-75 group-hover:scale-90 transition-transform" />
                      <div className="w-full">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate px-1" title={folder.name}>
                          {folder.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1 font-mono">{folder.itemCount || 0} items</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col h-full relative">
            <div className="px-5 sm:px-7 py-4 border-b border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar fotos..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181b] border-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 outline-none text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:font-normal"
                />
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={clearFolder}
                  className="sm:hidden p-2 rounded-lg bg-zinc-100 dark:bg-[#18181b] text-zinc-600 dark:text-zinc-300 transition-colors"
                  title="Cambiar Carpeta"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="p-1 rounded-xl bg-zinc-100 dark:bg-[#18181b] flex items-center">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-xs" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-xs" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-7">
              {filteredFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3">
                  <ImageIcon className="w-10 h-10 opacity-50" />
                  <p className="text-sm">No hay fotografías disponibles.</p>
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-2">
                  {filteredFiles.map(file => (
                    <div key={file.id} className="group flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-black overflow-hidden shrink-0">
                          <img src={file.thumbnailUrl || file.cdnUrl} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{file.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{file.dimensions} • {file.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setPreviewPhoto(file)} className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10" title="Ver en Grande">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)} className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10" title="Copiar Enlace">
                          {copiedId === file.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {onSelectPhotoForProduct && (
                          <button type="button" onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)} className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-[10px] ml-2">
                            Usar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredFiles.map(file => (
                    <div key={file.id} className="group relative rounded-2xl bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/10 overflow-hidden shadow-xs hover:border-zinc-400 dark:hover:border-white/20 transition-all flex flex-col justify-between">
                      <div className="aspect-square w-full relative bg-zinc-100 dark:bg-black overflow-hidden">
                        <img src={file.thumbnailUrl || file.cdnUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono text-white/90">
                          {file.size || "HD"}
                        </div>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button type="button" onClick={() => setPreviewPhoto(file)} className="p-2 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700" title="Ver en Alta Resolución">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)} className="p-2 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700" title="Copiar enlace">
                            {copiedId === file.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate" title={file.name}>{file.name}</p>
                        <p className="text-[9px] text-zinc-400 font-mono mt-1 truncate">{file.dimensions || "Resolución Drive"}</p>
                        {onSelectPhotoForProduct && (
                          <button type="button" onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)} className="w-full mt-3 py-1.5 px-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-semibold">
                            Usar en Producto
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BARRA INFERIOR CON EMAIL Y CERRAR SESION */}
            <div className="px-5 sm:px-7 py-3 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-black/20 text-xs mt-auto">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-medium">
                <div className="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-900 dark:text-white">
                  {settings.accountEmail?.charAt(0).toUpperCase() || "G"}
                </div>
                <span>{settings.accountEmail || "Google Drive"}</span>
              </div>
              <button
                type="button"
                onClick={() => disconnectAccount()}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-rose-500 transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX / VISOR HD EN PANTALLA COMPLETA */}
      {previewPhoto && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/80">
              <div className="min-w-0 pr-3">
                <h5 className="font-semibold text-sm truncate text-zinc-900 dark:text-zinc-100">{previewPhoto.name}</h5>
                <p className="text-[11px] text-zinc-400 font-mono">{previewPhoto.dimensions} • {previewPhoto.size}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={(e) => handleCopyLink(e, previewPhoto.cdnUrl, previewPhoto.id)} className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer">
                  {copiedId === previewPhoto.id ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span>Copiado</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copiar Enlace</span></>}
                </button>
                <a href={previewPhoto.cdnUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  <Download className="w-4 h-4" />
                </a>
                <button type="button" onClick={() => setPreviewPhoto(null)} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 flex items-center justify-center overflow-hidden bg-zinc-100 dark:bg-black min-h-[320px]">
              <img src={previewPhoto.cdnUrl} alt={previewPhoto.name} className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-lg" />
            </div>
          </div>
        </div>
      )}
      
      {/* FEEDBACK TOAST */}
      {feedback && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full text-xs font-medium shadow-xl animate-fade-in z-[100]">
          {feedback}
        </div>
      )}
    </div>
  );
}
