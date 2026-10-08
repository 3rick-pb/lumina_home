"use client";

import React, { useState, useEffect } from "react";
import { 
  Folder, 
  FolderOpen, 
  RefreshCw, 
  Check, 
  Search, 
  LogOut, 
  X,
  ChevronLeft,
  Copy,
  Download,
  Eye,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { 
  useGoogleDriveStore, 
  GoogleDriveFolder, 
  GoogleDriveFile
} from "@/lib/googleDriveStore";

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
  onSelectPhotoForProduct?: (url: string, file: GoogleDriveFile) => void;
}

export function GoogleDriveSettingsCard({ onClose, onSelectPhotoForProduct }: GoogleDriveSettingsCardProps = {}) {
  const { 
    settings, 
    isSyncing, 
    error,
    clearError, 
    loadSettings,
    connectGoogleOAuth,
    disconnectAccount, 
    selectFolder, 
    syncFiles 
  } = useGoogleDriveStore();

  // Flujo en 2 pasos cuando está conectado:
  // 1. 'folders' -> Enlista los folders para que el usuario escoja
  // 2. 'photos'  -> Muestra las fotos del folder escogido con la opción de cambiar de folder
  const [currentStep, setCurrentStep] = useState<'folders' | 'photos'>('folders');
  const [searchFilter, setSearchFilter] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Lightbox / Visor HD
  const [previewPhoto, setPreviewPhoto] = useState<GoogleDriveFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cargar configuración al montar y al regresar de OAuth
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Si cambia el estado de conexión a falso, regresar al paso de carpetas
  useEffect(() => {
    if (!settings.isConnected) {
      setCurrentStep('folders');
    }
  }, [settings.isConnected]);

  // Filtrar archivos de la carpeta actualmente seleccionada
  const currentFolderFiles = (settings.files || []).filter((f) => 
    !settings.selectedFolderId || 
    settings.selectedFolderId === "root" || 
    f.folderId === settings.selectedFolderId
  );

  const filteredFiles = currentFolderFiles.filter((file) => 
    !searchFilter.trim() || 
    file.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCopyLink = async (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      showNotification("Enlace directo copiado al portapapeles");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showNotification("No se pudo copiar el enlace");
    }
  };

  const handleSync = async () => {
    await syncFiles();
    showNotification("Fotoproductos sincronizados con Google Drive");
  };

  const handlePickFolder = async (folder: GoogleDriveFolder) => {
    await selectFolder(folder.id, folder.name);
    setCurrentStep('photos');
    showNotification(`Carpeta seleccionada: ${folder.name}`);
  };

  return (
    <div className="p-4 sm:p-7 md:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-stone-900 text-stone-100 border border-stone-800 shadow-2xl space-y-5 sm:space-y-6 relative overflow-hidden max-h-[88vh] overflow-y-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-stone-800 pb-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
            <GoogleDriveIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-stone-100">
              Fotoproductos
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Gestión fotográfica y sincronización de imágenes para el catálogo.
            </p>
          </div>
        </div>

        {/* Estado y Cerrar */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {settings.isConnected ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Conectado</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
              <span>Sin conexión</span>
            </div>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => clearError()}
            className="text-stone-400 hover:text-stone-200 p-0.5 cursor-pointer shrink-0"
            title="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PASO 1: CONEXIÓN CON GOOGLE DRIVE (CUANDO NO ESTÁ CONECTADO) */}
      {!settings.isConnected ? (
        <div className="p-8 sm:p-14 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center">
            <GoogleDriveIcon className="w-7 h-7" />
          </div>

          <div className="max-w-md space-y-2">
            <h4 className="text-base sm:text-lg font-semibold text-stone-100">
              Conexión con Google Drive
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
              Vincula tu unidad para explorar carpetas y seleccionar imágenes para los productos del catálogo.
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2.5">
            <button
              type="button"
              onClick={() => connectGoogleOAuth()}
              disabled={isSyncing}
              className="w-full py-3 px-4 rounded-xl bg-stone-100 hover:bg-white text-stone-900 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <GoogleLogoIcon className="w-4 h-4" />
              <span>{isSyncing ? "Conectando..." : "Conectar Google Drive"}</span>
            </button>
            <p className="text-[11px] text-stone-500">
              Acceso seguro de solo lectura para selección de fotografías.
            </p>
          </div>
        </div>
      ) : (
        /* PROCESO PASO A PASO CUANDO ESTÁ CONECTADO */
        <div className="space-y-5">
          {/* Barra Superior de Cuenta Conectada */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-800/60 border border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                <GoogleLogoIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-200 truncate">
                    Google Drive Conectado
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 font-medium shrink-0 border border-emerald-800/60">
                    Activo
                  </span>
                </div>
                <p className="text-xs text-stone-400 truncate font-mono">
                  {settings.accountEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                title="Sincronizar carpetas y fotos con Google Drive"
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-stone-100" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => disconnectAccount()}
                title="Cambiar cuenta de Google"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-rose-950/40 text-stone-400 hover:text-rose-300 border border-stone-700 hover:border-rose-800/60 text-xs font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cambiar Cuenta</span>
              </button>
            </div>
          </div>

          {/* PASO 2: ENLISTA LOS FOLDERS PARA QUE EL USUARIO ESCOJA */}
          {currentStep === 'folders' && (
            <div className="space-y-4">
              <div className="border-b border-stone-800 pb-3">
                <h4 className="text-sm font-semibold text-stone-100 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-stone-400" />
                  <span>Selecciona una Carpeta</span>
                </h4>
                <p className="text-xs text-stone-400 mt-1">
                  Escoge el folder de Google Drive que deseas usar para seleccionar imágenes:
                </p>
              </div>

              {/* Grid de Carpetas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {settings.availableFolders.map((folder) => {
                  const isCurrentSelected = settings.selectedFolderId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      onClick={() => handlePickFolder(folder)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                        isCurrentSelected
                          ? "bg-stone-800/80 border-stone-500 shadow-md ring-1 ring-stone-400/30"
                          : "bg-stone-850/60 border-stone-800 hover:border-stone-600 hover:bg-stone-800/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 group-hover:text-stone-100 shrink-0">
                          <Folder className="w-5 h-5" />
                        </div>
                        {isCurrentSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-700 text-stone-200 font-medium text-[10px]">
                            <Check className="w-3 h-3" /> En uso
                          </span>
                        )}
                      </div>

                      <div>
                        <h5 className="font-semibold text-xs text-stone-100 line-clamp-1 group-hover:text-white">
                          {folder.name}
                        </h5>
                        <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                          {folder.itemCount > 0 ? `${folder.itemCount} archivos` : "Carpeta de Drive"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePickFolder(folder);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-stone-700"
                      >
                        <span>Elegir Carpeta</span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 3: IMÁGENES DEL FOLDER ESCOGIDO (CON OPCIÓN DE CAMBIAR DE FOLDER) */}
          {currentStep === 'photos' && (
            <div className="space-y-4">
              {/* Barra de Navegación de la Carpeta Activa */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-800/60 border border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-200 shrink-0">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                        Carpeta Activa
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-stone-100">
                      {settings.selectedFolderName} ({filteredFiles.length} fotografías)
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('folders')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-600 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Cambiar Carpeta</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={isSyncing}
                    title="Actualizar fotos de esta carpeta"
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Barra de Búsqueda */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar por nombre de fotografía..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-700 text-xs bg-stone-800 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-500"
                  />
                </div>
                <span className="text-[11px] text-stone-400 font-mono">
                  {filteredFiles.length} fotografías
                </span>
              </div>

              {/* Grid de Fotografías */}
              {filteredFiles.length === 0 ? (
                <div className="p-12 text-center text-xs text-stone-400 border border-dashed border-stone-800 rounded-2xl space-y-3">
                  <p>No se encontraron fotografías en esta carpeta.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('folders')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium cursor-pointer border border-stone-700"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Seleccionar otra carpeta</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative rounded-2xl bg-stone-800/80 border border-stone-700/80 overflow-hidden shadow-xs hover:border-stone-500 transition-all flex flex-col justify-between"
                    >
                      <div className="aspect-square w-full relative bg-stone-900 overflow-hidden">
                        <img
                          src={file.thumbnailUrl || file.cdnUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono text-stone-300">
                          {file.size || "HD"}
                        </div>

                        {/* Barra de Acciones al pasar el cursor */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className="p-1.5 rounded-lg bg-stone-800 text-stone-200 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer shadow-sm"
                            title="Ver en Alta Resolución"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)}
                            className="p-1.5 rounded-lg bg-stone-800 text-stone-200 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer shadow-sm"
                            title="Copiar enlace"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5">
                        <p className="text-[11px] font-medium text-stone-200 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[9px] text-stone-400 font-mono mt-0.5 truncate">
                          {file.dimensions || "Google Drive"}
                        </p>

                        {onSelectPhotoForProduct && (
                          <button
                            type="button"
                            onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                            className="w-full mt-2 py-1 px-2 rounded-lg bg-stone-100 hover:bg-white text-stone-900 text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Usar en Producto
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LIGHTBOX / VISOR HD EN PANTALLA COMPLETA */}
      {previewPhoto && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden border border-stone-700 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between text-stone-100 bg-stone-950/60">
              <div className="min-w-0 pr-3">
                <h5 className="font-semibold text-sm truncate">{previewPhoto.name}</h5>
                <p className="text-[11px] text-stone-400 font-mono">
                  {previewPhoto.dimensions} • {previewPhoto.size}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, previewPhoto.cdnUrl, previewPhoto.id)}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedId === previewPhoto.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>

                <a
                  href={previewPhoto.cdnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
                  title="Abrir imagen completa"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 flex items-center justify-center overflow-hidden bg-black min-h-[300px]">
              <img
                src={previewPhoto.cdnUrl}
                alt={previewPhoto.name}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
