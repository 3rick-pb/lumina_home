"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Folder, 
  FolderOpen, 
  RefreshCw, 
  Check, 
  Plus, 
  Search, 
  LogOut, 
  X,
  ChevronRight,
  FolderPlus,
  Upload,
  Link2,
  Copy,
  Download,
  Trash2,
  Eye,
  Database,
  ShieldCheck,
  FileDown,
  FileUp,
  AlertTriangle,
  ImageIcon
} from "lucide-react";
import { 
  useGoogleDriveStore, 
  GoogleDriveFolder, 
  GoogleDriveFile
} from "@/lib/googleDriveStore";
import { formatGoogleDriveUrl, isGoogleDriveUrl } from "@/lib/imageUtils";


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
    activeView, 
    setActiveView, 
    connectGoogleOAuth,
    handleOAuthReturn,
    loadGoogleDriveFiles,
    disconnectAccount, 
    selectFolder, 
    createFolder, 
    deleteFolder,
    addPhoto,
    addPhotos,
    deletePhoto,
    backupToDatabase,
    restoreFromDatabase,
    exportBackupJson,
    importBackupJson,
    syncFiles 
  } = useGoogleDriveStore();

  const [searchFilter, setSearchFilter] = useState("");
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Procesar retorno de OAuth si se realizó por redirección directa
  useEffect(() => {
    handleOAuthReturn();
  }, [handleOAuthReturn]);

  // Subir por URL
  const [urlInput, setUrlInput] = useState("");
  const [urlNameInput, setUrlNameInput] = useState("");
  const [urlFolderTarget, setUrlFolderTarget] = useState(settings.selectedFolderId || "folder_lumina_catalog_2026");
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  // Subir archivos locales
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Lightbox / Visor HD
  const [previewPhoto, setPreviewPhoto] = useState<GoogleDriveFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<GoogleDriveFile | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<GoogleDriveFolder | null>(null);

  // Filtrado de archivos
  const currentFolderFiles = (settings.files || []).filter(f => 
    !settings.selectedFolderId || 
    settings.selectedFolderId === "folder_lumina_catalog_2026" || 
    f.folderId === settings.selectedFolderId
  );

  const filteredFiles = currentFolderFiles.filter(file => 
    !searchFilter.trim() || 
    file.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCopyLink = async (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      showNotification("¡Enlace directo copiado al portapapeles!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showNotification("No se pudo copiar automáticamente");
    }
  };

  const handleSync = async () => {
    if (settings.providerToken) {
      await loadGoogleDriveFiles(settings.providerToken);
      showNotification("Fotoproductos sincronizados con Google Drive");
    } else {
      await syncFiles();
      showNotification("Fotoproductos sincronizados con el servidor");
    }
  };

  const handleSelectFolderClick = async (folder: GoogleDriveFolder) => {
    await selectFolder(folder.id, folder.name);
    showNotification(`Colección activa: ${folder.name}`);
  };



  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName("");
    setShowCreateFolderModal(false);
    showNotification("Nueva colección creada en el banco multimedia");
  };

  const handleDeleteFolderConfirm = async () => {
    if (!folderToDelete) return;
    await deleteFolder(folderToDelete.id);
    showNotification(`Colección "${folderToDelete.name}" eliminada`);
    setFolderToDelete(null);
  };

  const handleDeletePhotoConfirm = async () => {
    if (!photoToDelete) return;
    await deletePhoto(photoToDelete.id);
    if (previewPhoto?.id === photoToDelete.id) {
      setPreviewPhoto(null);
    }
    showNotification(`Fotografía "${photoToDelete.name}" eliminada`);
    setPhotoToDelete(null);
  };

  // Procesar subida por enlace / Google Drive (soporta enlace único o múltiples enlaces por coma / salto de línea)
  const handleAddPhotoByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsAddingUrl(true);

    try {
      const rawUrls = urlInput.split(/[\n,]+/).map((u) => u.trim()).filter(Boolean);
      const itemsToAdd: Array<Omit<GoogleDriveFile, "id">> = [];

      for (let i = 0; i < rawUrls.length; i++) {
        const singleUrl = rawUrls[i];
        const normalizedUrl = formatGoogleDriveUrl(singleUrl);
        const baseName = urlNameInput.trim() 
          ? (rawUrls.length > 1 ? `${urlNameInput.trim()}-${i + 1}` : urlNameInput.trim())
          : `DRIVE-IMG-${Date.now().toString().slice(-4)}-${i + 1}.jpg`;

        itemsToAdd.push({
          name: baseName,
          cdnUrl: normalizedUrl,
          thumbnailUrl: normalizedUrl,
          folderId: urlFolderTarget,
          size: "HD Stream",
          dimensions: "Resolución Google Drive",
          mimeType: "image/jpeg",
          source: isGoogleDriveUrl(singleUrl) ? "google_drive" : "url",
        });
      }

      if (itemsToAdd.length === 1) {
        await addPhoto(itemsToAdd[0]);
      } else if (itemsToAdd.length > 1) {
        await addPhotos(itemsToAdd);
      }

      setUrlInput("");
      setUrlNameInput("");
      showNotification(`¡${itemsToAdd.length} fotografía(s) de Google Drive añadidas con éxito!`);
      setActiveView("files");
    } catch {
      showNotification("Error al procesar el enlace de Google Drive");
    } finally {
      setIsAddingUrl(false);
    }
  };

  // Procesar archivos locales (Drag & Drop / Input File)
  const processLocalFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList).filter(f => f.type.startsWith("image/"));
    if (filesArray.length === 0) {
      showNotification("Por favor selecciona solo archivos de imagen (JPG, PNG, WEBP, SVG)");
      return;
    }

    setUploadProgress(`Procesando ${filesArray.length} fotografía(s)...`);

    const newItems: Array<Omit<GoogleDriveFile, "id">> = [];

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = file.size >= 1024 * 1024 ? `${sizeMB} MB` : `${Math.round(file.size / 1024)} KB`;

      // Read as Data URL
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || "");
        reader.readAsDataURL(file);
      });

      // Detect dimensions
      const dimensions = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(`${img.width} x ${img.height}`);
        img.onerror = () => resolve("Resolución Estándar");
        img.src = dataUrl;
      });

      newItems.push({
        name: file.name.toUpperCase().replace(/\s+/g, "-"),
        cdnUrl: dataUrl,
        thumbnailUrl: dataUrl,
        size: sizeStr,
        dimensions,
        mimeType: file.type || "image/jpeg",
        folderId: settings.selectedFolderId || "folder_lumina_catalog_2026",
        source: "upload",
      });
    }

    await addPhotos(newItems);
    setUploadProgress(null);
    showNotification(`¡${newItems.length} fotografía(s) subidas con éxito!`);
    setActiveView("files");
  };

  // Respaldo en Base de Datos Supabase
  const handleBackupNow = async () => {
    const res = await backupToDatabase();
    if (res.success) {
      showNotification(`✓ ${res.message}`);
    } else {
      showNotification(`⚠ ${res.message}`);
    }
  };

  const handleRestoreNow = async () => {
    const success = await restoreFromDatabase();
    if (success) {
      showNotification("✓ Fotoproductos restaurados desde la Base de Datos");
    } else {
      showNotification("⚠ No se pudo restaurar el respaldo de la Base de Datos");
    }
  };

  // Importar JSON
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importBackupJson(content);
      if (success) {
        showNotification("✓ Respaldo JSON importado y sincronizado con Supabase");
      } else {
        showNotification("⚠ El archivo JSON de respaldo no tiene el formato correcto");
      }
      if (jsonInputRef.current) jsonInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 sm:p-7 md:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white/95 dark:bg-[#18181b]/95 border border-stone-200/80 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-5 sm:space-y-6 relative overflow-hidden backdrop-blur-2xl max-h-[88vh] overflow-y-auto">
      {/* Subtle Brand Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-stone-500/5 dark:bg-white/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center shrink-0 shadow-xs">
            <GoogleDriveIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Fotoproductos
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Gestión fotográfica y sincronización de imágenes para el catálogo.
            </p>
          </div>
        </div>

        {/* Status Pill & Close */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {settings.isConnected ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span>Conectado</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              <span>Sin conexión</span>
            </div>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-stone-600 dark:text-stone-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => clearError()}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-0.5 cursor-pointer shrink-0"
            title="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* GOOGLE DRIVE CONNECTION GATE */}
      {!settings.isConnected ? (
        <div className="p-8 sm:p-14 rounded-2xl bg-stone-50/60 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center shadow-xs">
            <GoogleDriveIcon className="w-7 h-7" />
          </div>

          <div className="max-w-md space-y-2">
            <h4 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100">
              Conexión con Google Drive
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
              Vincula tu unidad para explorar carpetas, importar fotografías y asignarlas a los productos del catálogo.
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2.5">
            <button
              type="button"
              onClick={() => connectGoogleOAuth()}
              disabled={isSyncing}
              className="w-full py-3 px-4 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-medium text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <GoogleLogoIcon className="w-4 h-4" />
              <span>{isSyncing ? "Conectando..." : "Conectar Google Drive"}</span>
            </button>
            <p className="text-[11px] text-stone-400 dark:text-stone-500">
              Acceso seguro de solo lectura para selección de imágenes.
            </p>
          </div>
        </div>
      ) : (
        /* CONNECTED STATE: NAVIGATION TABS + ACTIONS */
        <div className="space-y-5 relative z-10">
          {/* Top Connected Account Strip */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/80 dark:bg-[#202024]/80 border border-stone-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-white/10 border border-stone-200/60 dark:border-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <GoogleLogoIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                    {settings.accountName || "Google Drive"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold shrink-0 border border-emerald-500/20">
                    Drive Activo
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate font-mono">
                  {settings.accountEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                title="Sincronizar Fotoproductos con Google Drive"
                className="p-2 rounded-xl bg-white dark:bg-white/10 hover:bg-stone-100 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/10 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-amber-500" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => disconnectAccount()}
                title="Cambiar cuenta de Google"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-500 hover:text-rose-600 dark:hover:text-rose-300 border border-stone-200/60 dark:border-white/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cambiar Cuenta</span>
              </button>
            </div>
          </div>

          {/* Liquid Glass Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-stone-100/80 dark:bg-white/[0.05] border border-stone-200/80 dark:border-white/10 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveView("files")}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeView === "files"
                  ? "bg-white dark:bg-[#202024] text-stone-900 dark:text-white shadow-sm border border-stone-200/80 dark:border-white/10"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Fotoproductos ({currentFolderFiles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("folders")}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeView === "folders"
                  ? "bg-white dark:bg-[#202024] text-stone-900 dark:text-white shadow-sm border border-stone-200/80 dark:border-white/10"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>Carpetas ({settings.availableFolders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("upload")}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeView === "upload"
                  ? "bg-white dark:bg-[#202024] text-stone-900 dark:text-white shadow-sm border border-stone-200/80 dark:border-white/10"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>Subir & Añadir</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("backup")}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeView === "backup"
                  ? "bg-white dark:bg-[#202024] text-stone-900 dark:text-white shadow-sm border border-stone-200/80 dark:border-white/10"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>Respaldo BD</span>
              {settings.backupAt && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>

          {/* TAB 1: FOTOS DE LA COLECCIÓN ACTIVA */}
          {activeView === "files" && (
            <div className="space-y-4">
              {/* Top subheader */}
              <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
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
                    onClick={() => setActiveView("upload")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Fotos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView("folders")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#202024] hover:bg-stone-50 dark:hover:bg-white/10 text-gray-900 dark:text-gray-100 text-xs font-bold border border-stone-200/80 dark:border-white/10 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>Cambiar Carpeta</span>
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
                    placeholder="Filtrar por nombre de fotografía..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <span className="text-[11px] text-stone-400 font-mono">
                  {filteredFiles.length} de {settings.files.length} totales
                </span>
              </div>

              {/* Photos Grid */}
              {filteredFiles.length === 0 ? (
                <div className="p-12 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-white/10 rounded-2xl space-y-3">
                  <p>No se encontraron fotografías en esta colección.</p>
                  <button
                    type="button"
                    onClick={() => setActiveView("upload")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir la primera foto a esta carpeta</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative rounded-2xl bg-white dark:bg-[#1d1d21] border border-stone-200/80 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-lg transition-all hover:-translate-y-0.5 flex flex-col justify-between"
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

                        {/* Hover Overlay Action Bar */}
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className="p-1.5 rounded-lg bg-white/90 text-stone-900 hover:bg-white hover:scale-110 transition-all cursor-pointer shadow-sm"
                            title="Ver en Alta Resolución"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)}
                            className="p-1.5 rounded-lg bg-white/90 text-stone-900 hover:bg-white hover:scale-110 transition-all cursor-pointer shadow-sm"
                            title="Copiar enlace directo"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setPhotoToDelete(file)}
                            className="p-1.5 rounded-lg bg-rose-500/90 text-white hover:bg-rose-600 hover:scale-110 transition-all cursor-pointer shadow-sm"
                            title="Eliminar fotografía"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2">
                        <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[9px] text-stone-400 font-mono mt-0.5 truncate">
                          {file.dimensions || "2000x2000"}
                        </p>

                        {onSelectPhotoForProduct && (
                          <button
                            type="button"
                            onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                            className="w-full mt-2 py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold transition-all shadow-xs cursor-pointer"
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

          {/* TAB 2: GESTOR DE CARPETAS Y COLECCIONES */}
          {activeView === "folders" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    Carpetas de Google Drive & Catálogo ({settings.availableFolders.length})
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Organiza las fotografías por ambientes, colecciones o temporadas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateFolderModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                    <span>Nueva Colección</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView("files")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>Ver Fotos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Folders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {settings.availableFolders.map((folder) => {
                  const isSelected = settings.selectedFolderId === folder.id;
                  const isRootFolder = folder.id === "folder_lumina_catalog_2026";

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
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-500/25">
                              <Check className="w-3 h-3" /> En Uso
                            </span>
                          )}
                          {!isRootFolder && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFolderToDelete(folder);
                              }}
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Eliminar carpeta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
          )}

          {/* TAB 3: SUBIR Y AÑADIR FOTOGRAFÍAS (DRAG & DROP + ENLACE) */}
          {activeView === "upload" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Panel A: Arrastrar o seleccionar archivos locales */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1e1e22] border border-stone-200/80 dark:border-white/10 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        Subir desde tu Dispositivo
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Arrastra imágenes JPG, PNG o WEBP de alta resolución.
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => processLocalFiles(e.target.files)}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFiles(true);
                    }}
                    onDragLeave={() => setIsDraggingFiles(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFiles(false);
                      processLocalFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDraggingFiles
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]"
                        : "border-stone-300 dark:border-white/15 hover:border-blue-400 bg-stone-50/50 dark:bg-white/[0.02]"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/10 shadow-xs flex items-center justify-center text-blue-500 mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      Haz clic para buscar o arrastra aquí las fotos
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Soporta selección múltiple de fotografías a la vez
                    </p>
                  </div>

                  {uploadProgress && (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center gap-2 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{uploadProgress}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Carpeta destino:</span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-stone-200 font-mono text-[10px]">
                      {settings.selectedFolderName}
                    </span>
                  </div>
                </div>

                {/* Panel B: Pegar Enlace de Google Drive o URL Web */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1e1e22] border border-stone-200/80 dark:border-white/10 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        Añadir Enlace de Google Drive / Web
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Convierte automáticamente links compartidos a streaming directo.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAddPhotoByUrl} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Enlace(s) de Google Drive o URL Web
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Pega enlace de Google Drive (o varios separados por coma o salto de línea):&#10;https://drive.google.com/file/d/1A2B3C.../view"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-stone-50 dark:bg-[#141416] text-gray-900 dark:text-gray-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-mono"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">
                        Soporta enlaces compartidos de Google Drive (view, sharing, uc) transformándolos a streaming directo en alta velocidad.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Nombre del Archivo (Opcional)
                      </label>
                      <input
                        type="text"
                        value={urlNameInput}
                        onChange={(e) => setUrlNameInput(e.target.value)}
                        placeholder="Ej. SILLA-LOUNGE-NORDIC-01.jpg"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-stone-50 dark:bg-[#141416] text-gray-900 dark:text-gray-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Colección de Destino
                      </label>
                      <select
                        value={urlFolderTarget}
                        onChange={(e) => setUrlFolderTarget(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-stone-50 dark:bg-[#141416] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      >
                        {settings.availableFolders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isAddingUrl || !urlInput.trim()}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isAddingUrl ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Procesando imagen...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar Fotografía al Banco</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESPALDO EN BASE DE DATOS SUPABASE (CLOUD BACKUP) */}
          {activeView === "backup" && (
            <div className="space-y-5">
              <div className="p-6 rounded-3xl bg-stone-50/90 dark:bg-[#1f1f23]/90 border border-stone-200/80 dark:border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          ESPACIO DEDICADO EN BASE DE DATOS
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1">
                        Copia de Seguridad & Respaldo en Supabase
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Tablas relacionales: <code className="font-mono text-[11px] text-amber-600 dark:text-amber-400">admin_google_drive_settings</code> y <code className="font-mono text-[11px] text-amber-600 dark:text-amber-400">admin_media_assets</code>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackupNow}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Crear Respaldo en BD Ahora</span>
                  </button>
                </div>

                {/* Backup Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-stone-200/60 dark:border-white/10">
                    <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                      Fotografías Registradas
                    </p>
                    <p className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100 mt-0.5">
                      {settings.files.length} archivos
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-stone-200/60 dark:border-white/10">
                    <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                      Colecciones Organizadas
                    </p>
                    <p className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100 mt-0.5">
                      {settings.availableFolders.length} carpetas
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-stone-200/60 dark:border-white/10">
                    <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                      Última Copia en Nube
                    </p>
                    <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                      {settings.backupAt ? new Date(settings.backupAt).toLocaleString() : "Pendiente"}
                    </p>
                  </div>
                </div>

                {/* Secondary Actions */}
                <div className="pt-3 border-t border-stone-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRestoreNow}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-stone-100 dark:hover:bg-white/15 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200/80 dark:border-white/10 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                      <span>Restaurar desde Supabase</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={jsonInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportJsonFile}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => jsonInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-stone-100 dark:hover:bg-white/15 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200/80 dark:border-white/10 transition-colors cursor-pointer"
                    >
                      <FileUp className="w-3.5 h-3.5 text-blue-500" />
                      <span>Importar JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={exportBackupJson}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-stone-100 dark:hover:bg-white/15 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200/80 dark:border-white/10 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-amber-500" />
                      <span>Exportar JSON</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIGHTBOX / VISOR HD EN PANTALLA COMPLETA */}
      {previewPhoto && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between text-white bg-black/40">
              <div className="min-w-0 pr-3">
                <h5 className="font-bold text-sm truncate">{previewPhoto.name}</h5>
                <p className="text-[11px] text-stone-400 font-mono">
                  {previewPhoto.dimensions} • {previewPhoto.size}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, previewPhoto.cdnUrl, previewPhoto.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedId === previewPhoto.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar URL</span>
                    </>
                  )}
                </button>

                <a
                  href={previewPhoto.cdnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewPhoto.name}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Descargar o Abrir en pestaña nueva"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 flex items-center justify-center overflow-hidden bg-black/60 min-h-[300px]">
              <img
                src={previewPhoto.cdnUrl}
                alt={previewPhoto.name}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINAR FOTO */}
      {photoToDelete && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1c1c1f] border border-stone-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  ¿Eliminar fotografía?
                </h4>
                <p className="text-xs text-stone-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300">
              Se eliminará <span className="font-bold text-gray-900 dark:text-white">&ldquo;{photoToDelete.name}&rdquo;</span> de esta colección y de la base de datos de respaldo.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeletePhotoConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINAR CARPETA */}
      {folderToDelete && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1c1c1f] border border-stone-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  ¿Eliminar colección?
                </h4>
                <p className="text-xs text-stone-500">Las fotos pasarán al catálogo raíz.</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300">
              ¿Deseas eliminar la carpeta <span className="font-bold text-gray-900 dark:text-white">&ldquo;{folderToDelete.name}&rdquo;</span>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteFolderConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Eliminar Carpeta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: INICIAR SESIÓN CON GOOGLE */}
      {showGoogleLoginModal && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
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

            <div className="space-y-4">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Conecta tu cuenta de Google para sincronizar tus fotografías y carpetas multimedia en Google Drive.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowGoogleLoginModal(false);
                  connectGoogleOAuth();
                }}
                className="w-full p-3.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-medium text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2.5"
              >
                <GoogleLogoIcon className="w-4 h-4" />
                <span>Conectar Google Drive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: CREAR NUEVA CARPETA EN DRIVE */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateFolderSubmit}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1c1c1f] border border-stone-200 dark:border-white/10 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Nueva Carpeta en el Banco
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
