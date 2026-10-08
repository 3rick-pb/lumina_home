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
  ChevronDown,
  Copy,
  Download,
  Eye,
  AlertTriangle,
  Home,
  Database,
  ArrowLeftRight,
  BarChart2,
  List,
  LayoutGrid,
  FileText,
  ImageIcon,
  Plus
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

// Visualizador de Carpeta 3D con hojas salientes y badges (exacto al diseño de referencia)
function LayeredFolderGraphic({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-28 h-20 sm:w-32 sm:h-22 mx-auto select-none ${className}`}>
      {/* Hoja posterior izquierda inclinada */}
      <div className="absolute top-1 left-2 sm:left-3 w-18 sm:w-20 h-14 sm:h-16 rounded-lg bg-zinc-200 dark:bg-zinc-300 shadow-xs border border-zinc-300 dark:border-zinc-400 transform -rotate-8 transition-transform duration-300 group-hover:-rotate-12 group-hover:-translate-y-1">
        <div className="p-1 flex items-center justify-between">
          <div className="w-4 h-0.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
          <span className="text-[7px] font-bold font-mono px-1 py-0.2 rounded bg-zinc-300 dark:bg-zinc-400 text-zinc-700">IMG</span>
        </div>
      </div>

      {/* Hoja posterior derecha inclinada */}
      <div className="absolute top-0.5 right-2 sm:right-3 w-18 sm:w-20 h-14 sm:h-16 rounded-lg bg-zinc-100 dark:bg-zinc-200 shadow-xs border border-zinc-300 dark:border-zinc-400 transform rotate-6 transition-transform duration-300 group-hover:rotate-10 group-hover:-translate-y-1.5">
        <div className="p-1 flex items-center justify-between">
          <div className="w-4 h-0.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
          <span className="text-[7px] font-bold font-mono px-1 py-0.2 rounded bg-zinc-300 dark:bg-zinc-400 text-zinc-800">RAW</span>
        </div>
      </div>

      {/* Hoja central frontal peeking */}
      <div className="absolute top-1 left-5 sm:left-6 w-18 sm:w-20 h-14 sm:h-16 rounded-lg bg-white dark:bg-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-300 transform rotate-0 transition-transform duration-300 group-hover:-translate-y-2">
        <div className="p-1.5 flex items-center justify-between">
          <div className="w-5 h-0.5 rounded-full bg-zinc-300 dark:bg-zinc-400" />
          <span className="text-[7px] font-bold font-mono px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-300 text-zinc-900">JPG</span>
        </div>
      </div>

      {/* Tapa frontal de la carpeta */}
      <div className="absolute bottom-0 inset-x-0 h-14 sm:h-16 rounded-2xl bg-zinc-300 dark:bg-[#252529] border border-zinc-400/40 dark:border-white/10 shadow-md flex items-end justify-between p-2 transition-colors duration-200 group-hover:bg-zinc-200 dark:group-hover:bg-[#2c2c31]">
        {/* Pestaña superior izquierda */}
        <div className="absolute -top-2 left-0 w-12 sm:w-14 h-4 rounded-t-lg bg-zinc-300 dark:bg-[#252529] border-t border-l border-r border-zinc-400/40 dark:border-white/10 transition-colors group-hover:bg-zinc-200 dark:group-hover:bg-[#2c2c31]" />

        {/* Badges de integración en la esquina inferior izquierda */}
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
    error, 
    clearError, 
    loadSettings, 
    connectGoogleOAuth, 
    disconnectAccount, 
    selectFolder, 
    syncFiles 
  } = useGoogleDriveStore();

  const [activeTab, setActiveTab] = useState<'folders' | 'tags'>('folders');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchFilter, setSearchFilter] = useState("");
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Lightbox / Visor HD
  const [previewPhoto, setPreviewPhoto] = useState<GoogleDriveFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Archivos de la carpeta actualmente seleccionada
  const currentFolderFiles = (settings.files || []).filter((f) => 
    !settings.selectedFolderId || 
    settings.selectedFolderId === "root" || 
    f.folderId === settings.selectedFolderId
  );

  const filteredFiles = currentFolderFiles.filter((file) => 
    !searchFilter.trim() || 
    file.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  // Carpetas disponibles (excluyendo la seleccionada actual para la lista de "Folders" si se desea o mostrando todas)
  const availableFolders = settings.availableFolders || [];

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
    setShowFolderDropdown(false);
    showNotification(`Carpeta activa: ${folder.name}`);
  };

  return (
    <div className="w-full flex flex-col md:flex-row h-[88vh] max-h-[820px] rounded-[2rem] bg-zinc-100 dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden select-none font-sans transition-colors duration-200">
      
      {/* 1. RAIL DE ICONOS VERTICAL (IZQUIERDA EXTREMA) */}
      <div className="hidden lg:flex w-14 shrink-0 flex-col items-center justify-between py-5 bg-white dark:bg-[#141417] border-r border-zinc-200 dark:border-white/5 transition-colors">
        <div className="flex flex-col items-center gap-6">
          {/* Logo Isométrico tipo Cube de la referencia */}
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>

          {/* Iconos de Navegación del Rail */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="p-2.5 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              title="Inicio"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* Activo: Almacenamiento / Base de datos */}
            <button
              type="button"
              className="p-2.5 rounded-xl bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs transition-colors cursor-pointer"
              title="Banco Multimedia"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleSync}
              className="p-2.5 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              title="Sincronizar"
            >
              <ArrowLeftRight className={`w-4 h-4 ${isSyncing ? "animate-spin text-zinc-900 dark:text-white" : ""}`} />
            </button>

            <button
              type="button"
              className="p-2.5 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              title="Estadísticas"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Google Drive Logo inferior */}
        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 flex items-center justify-center">
          <GoogleDriveIcon className="w-4 h-4" />
        </div>
      </div>

      {/* 2. PANEL LATERAL: TREE VIEW & EXPLORADOR */}
      <div className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col bg-white dark:bg-[#111114] border-r border-zinc-200 dark:border-white/5 transition-colors">
        {/* Cabecera del Sidebar */}
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
          <h3 className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            Banco de Fotos
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Actualizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Buscador de la barra lateral */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs bg-zinc-100 dark:bg-[#18181b] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 transition-all"
            />
          </div>
        </div>

        {/* Pill Toggle Switcher (Folders / Tags como en la referencia) */}
        <div className="px-4 pb-3">
          <div className="p-1 rounded-xl bg-zinc-200/70 dark:bg-[#18181b] border border-zinc-300/50 dark:border-white/5 flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('folders')}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'folders'
                  ? "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Carpetas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tags')}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tags'
                  ? "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Archivos
            </button>
          </div>
        </div>

        {/* Vista en Árbol Jerárquico de Carpetas */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {availableFolders.map((folder) => {
            const isSelected = settings.selectedFolderId === folder.id;
            const isRoot = folder.id === 'root';

            return (
              <div key={folder.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleSelectFolder(folder)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? "bg-zinc-200/90 dark:bg-white/10 text-zinc-900 dark:text-white font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isSelected ? (
                      <FolderOpen className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200 shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                    )}
                    <span className="truncate">{folder.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-[#202024] text-zinc-600 dark:text-zinc-400 shrink-0">
                    {folder.itemCount || 0}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Pie de la barra lateral: Correo de Google conectado */}
        <div className="p-3 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                {settings.accountEmail ? settings.accountEmail.charAt(0).toUpperCase() : "G"}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {settings.accountEmail || "Google Drive"}
                </p>
                <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                  {settings.isConnected ? "Conectado" : "Desconectado"}
                </p>
              </div>
            </div>

            {settings.isConnected && (
              <button
                type="button"
                onClick={() => disconnectAccount()}
                className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                title="Cambiar cuenta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. ÁREA DE CONTENIDO PRINCIPAL (DERECHA) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0c0c0e] overflow-hidden transition-colors">
        
        {/* Barra Superior del Canvas Principal */}
        <div className="px-5 sm:px-7 py-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between gap-4 shrink-0 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-md">
          {/* Breadcrumb / Dropdown de Carpeta (General Knowledge ∨ en la referencia) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFolderDropdown(!showFolderDropdown)}
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <span>{settings.selectedFolderName || "Mi Unidad"}</span>
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            </button>

            {showFolderDropdown && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 shadow-2xl p-1.5 z-50 animate-fade-in space-y-0.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2.5 py-1">
                  Cambiar Carpeta
                </p>
                {availableFolders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFolder(f)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      settings.selectedFolderId === f.id
                        ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-semibold"
                        : "hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {f.itemCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Acciones de la derecha: Conexión, Toggle de vista, Cerrar */}
          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle: Lista / Cuadrícula */}
            <div className="p-1 rounded-xl bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
                title="Vista en Lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
                title="Vista en Cuadrícula"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hidden md:flex p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notificaciones / Feedback flotante */}
        {feedback && (
          <div className="mx-6 my-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Pantalla cuando Google Drive NO está conectado */}
        {!settings.isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 flex items-center justify-center shadow-xs">
              <GoogleDriveIcon className="w-7 h-7" />
            </div>

            <div className="max-w-sm space-y-1.5">
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Conectar Google Drive
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Vincula tu unidad para explorar tus carpetas y seleccionar fotografías de producto en alta resolución.
              </p>
            </div>

            <button
              type="button"
              onClick={() => connectGoogleOAuth()}
              disabled={isSyncing}
              className="py-2.5 px-5 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
            >
              <GoogleLogoIcon className="w-4 h-4" />
              <span>{isSyncing ? "Conectando..." : "Conectar Google Drive"}</span>
            </button>
          </div>
        ) : (
          /* CANVAS CON CONTENIDO: SECCIÓN 1 FOLDERS + SECCIÓN 2 FILES */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7">
            
            {/* SECCIÓN 1: FOLDERS (CARPETAS CON EL DISEÑO 3D DE LA IMAGEN DE REFERENCIA) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Folders
                </h4>
                <span className="text-[11px] font-mono text-zinc-400">
                  {availableFolders.length} carpetas
                </span>
              </div>

              {/* Grid / Carrusel de Tarjetas de Carpeta 3D */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {availableFolders.map((folder) => {
                  const isCurrent = settings.selectedFolderId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      onClick={() => handleSelectFolder(folder)}
                      className={`group p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col items-center text-center space-y-3 ${
                        isCurrent
                          ? "bg-zinc-200/60 dark:bg-[#18181b] border-zinc-400 dark:border-white/20 shadow-md ring-1 ring-zinc-400/30"
                          : "bg-zinc-50 dark:bg-[#141417] border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 hover:bg-zinc-100/70 dark:hover:bg-[#18181b] shadow-xs hover:shadow-md"
                      }`}
                    >
                      {/* Ilustración de Carpeta Layered 3D */}
                      <LayeredFolderGraphic />

                      {/* Información de la Carpeta */}
                      <div className="space-y-0.5 w-full">
                        <h5 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-zinc-950 dark:group-hover:text-white">
                          {folder.name}
                        </h5>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {folder.itemCount || 0} Files
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 2: FILES (ARCHIVOS / FOTOGRAFÍAS) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Files
                </h4>
                <span className="text-[11px] font-mono text-zinc-400">
                  {filteredFiles.length} fotografías en {settings.selectedFolderName}
                </span>
              </div>

              {/* ESTADO VACÍO */}
              {filteredFiles.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 text-xs text-zinc-400 space-y-2">
                  <p>No se encontraron fotografías en esta carpeta.</p>
                  <p className="text-[11px] text-zinc-500">Selecciona otra carpeta en la sección superior.</p>
                </div>
              ) : viewMode === 'list' ? (
                /* TABLA LIST VIEW EXACTA AL DISEÑO DE REFERENCIA */
                <div className="rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#111114]">
                  {/* Encabezado de la tabla */}
                  <div className="grid grid-cols-12 px-4 py-2.5 bg-zinc-50 dark:bg-[#161619] border-b border-zinc-200 dark:border-white/5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 font-mono">
                    <div className="col-span-7 sm:col-span-6">Name</div>
                    <div className="col-span-5 sm:col-span-4">Added By</div>
                    <div className="hidden sm:block sm:col-span-2 text-right">Acciones</div>
                  </div>

                  {/* Filas de Archivos */}
                  <div className="divide-y divide-zinc-200 dark:divide-white/5">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="grid grid-cols-12 items-center px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors group text-xs"
                      >
                        {/* Columna Nombre con thumbnail/icono */}
                        <div className="col-span-7 sm:col-span-6 flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 shrink-0">
                            <img
                              src={file.thumbnailUrl || file.cdnUrl}
                              alt={file.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <span className="truncate font-medium text-zinc-800 dark:text-zinc-200" title={file.name}>
                            {file.name}
                          </span>
                        </div>

                        {/* Columna Added By con Avatar y Email */}
                        <div className="col-span-5 sm:col-span-4 flex items-center gap-2 min-w-0 pr-2">
                          <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {settings.accountEmail ? settings.accountEmail.charAt(0).toUpperCase() : "A"}
                          </div>
                          <span className="truncate text-zinc-500 dark:text-zinc-400 text-[11px] font-mono">
                            {settings.accountEmail || "Google Drive"}
                          </span>
                        </div>

                        {/* Columna Acciones */}
                        <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-1.5 mt-2 sm:mt-0 pt-1 sm:pt-0 border-t sm:border-0 border-zinc-100 dark:border-white/5">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            title="Ver en Grande"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            title="Copiar Enlace"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {onSelectPhotoForProduct && (
                            <button
                              type="button"
                              onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-[10px] transition-colors cursor-pointer"
                            >
                              Usar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* VISTA EN CUADRÍCULA DE FOTOGRAFÍAS (GALLERY GRID) */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative rounded-2xl bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/10 overflow-hidden shadow-xs hover:border-zinc-400 dark:hover:border-white/20 transition-all flex flex-col justify-between"
                    >
                      <div className="aspect-square w-full relative bg-zinc-100 dark:bg-black overflow-hidden">
                        <img
                          src={file.thumbnailUrl || file.cdnUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono text-white/90">
                          {file.size || "HD"}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer"
                            title="Ver en Alta Resolución"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer"
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
                        <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[9px] text-zinc-400 font-mono mt-0.5 truncate">
                          {file.dimensions || "Resolución Drive"}
                        </p>

                        {onSelectPhotoForProduct && (
                          <button
                            type="button"
                            onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                            className="w-full mt-2 py-1 px-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-semibold transition-colors cursor-pointer"
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
                <p className="text-[11px] text-zinc-400 font-mono">
                  {previewPhoto.dimensions} • {previewPhoto.size}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, previewPhoto.cdnUrl, previewPhoto.id)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedId === previewPhoto.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
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
                  className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                  title="Abrir imagen"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 flex items-center justify-center overflow-hidden bg-zinc-100 dark:bg-black min-h-[320px]">
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
