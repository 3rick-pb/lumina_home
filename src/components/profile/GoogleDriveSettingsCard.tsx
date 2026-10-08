"use client";

import React, { useState, useEffect, useMemo } from "react";
import FolderComponent from "@/components/ui/Folder";
import { 
  Folder, 
  FolderOpen, 
  RefreshCw, 
  Check, 
  Search, 
  LogOut, 
  X,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Home,
  BarChart2,
  List,
  LayoutGrid,
  FileText
} from "lucide-react";
import { FileTree, FileTreeFolder } from "@/components/motion/file-tree";
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

// Visualizador de Carpeta 3D oficial de rareUI
function LayeredFolderCard({ 
  folder, 
  isSelected, 
  onClick 
}: { 
  folder: GoogleDriveFolder; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all duration-300 ease-out cursor-pointer flex flex-col items-center justify-between min-h-[240px] sm:min-h-[260px] overflow-hidden ${
        isSelected
          ? 'bg-[#1e2336] border-blue-400 shadow-2xl ring-2 ring-blue-500/50 shadow-blue-500/20'
          : 'bg-[#15151e] border-zinc-700/80 hover:border-blue-400/60 hover:bg-[#1a1c28] shadow-md hover:shadow-2xl'
      }`}
    >
      <div className="relative w-full h-40 sm:h-44 flex items-center justify-center my-auto pointer-events-none overflow-visible">
        <FolderComponent 
          color="blue" 
          size="sm" 
          isHovered={isHovered}
        />
      </div>

      <div className="text-center space-y-1 w-full mt-2 pt-2.5 border-t border-zinc-700/80">
        <h5 className="font-bold text-xs sm:text-sm text-white truncate px-1 group-hover:text-blue-300 transition-colors" title={folder.name}>
          {folder.name}
        </h5>
        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-300 font-medium">
          <span className="font-mono font-bold text-white">{folder.itemCount || 0}</span>
          <span>{folder.itemCount === 1 ? 'archivo' : 'archivos'}</span>
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

  const [activeRailTab, setActiveRailTab] = useState<'home' | 'stats'>('home');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchFilter, setSearchFilter] = useState("");

  // Lightbox / Visor HD
  const [previewPhoto, setPreviewPhoto] = useState<GoogleDriveFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleCopyLink = async (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  // 1. Botón HOME del rail izquierdo -> Volver a Mi Unidad (Todas las carpetas)
  const handleHomeClick = async () => {
    setActiveRailTab('home');
    setShowStatsModal(false);
    await selectFolder('root', 'Mi Unidad');
    setSearchFilter("");
  };

  // 3. Botón SYNC (Sincronizar)
  const handleSyncClick = async () => {
    await syncFiles();
  };

  // 4. Botón STATS (Estadísticas)
  const handleStatsClick = () => {
    setActiveRailTab('stats');
    setShowStatsModal(true);
  };

  const handleSelectFolder = async (folder: GoogleDriveFolder) => {
    await selectFolder(folder.id, folder.name);
  };

  // Carpetas disponibles desde el store
  const availableFolders = useMemo(() => {
    return settings.availableFolders || [];
  }, [settings.availableFolders]);

  // Estructura jerárquica de carpetas de Google Drive
  const { rootFolders, subfoldersMap } = useMemo(() => {
    const roots: GoogleDriveFolder[] = [];
    const subs: Record<string, GoogleDriveFolder[]> = {};
    const knownIds = new Set(availableFolders.map((f) => f.id));

    availableFolders.forEach((f) => {
      if (f.id === "root") return;
      const pId = f.parentId;
      if (!pId || pId === "root" || !knownIds.has(pId)) {
        roots.push(f);
      } else {
        if (!subs[pId]) subs[pId] = [];
        subs[pId].push(f);
      }
    });

    return { rootFolders: roots, subfoldersMap: subs };
  }, [availableFolders]);

  // Carpeta activa seleccionada (null si estamos en la raíz 'Mi Unidad')
  const mainFolder = useMemo(() => {
    const currentId = settings.selectedFolderId;
    if (!currentId || currentId === 'root') {
      return null;
    }
    return availableFolders.find((f) => f.id === currentId) || null;
  }, [settings.selectedFolderId, availableFolders]);

  // Subcarpetas para la carpeta activa
  const currentSubfolders = useMemo(() => {
    if (!mainFolder) return [];
    return subfoldersMap[mainFolder.id] || [];
  }, [mainFolder, subfoldersMap]);

  // Archivos de la carpeta seleccionada (en Mi Unidad estrictamente NINGUNA imagen)
  const currentFolderFiles = useMemo(() => {
    const currId = settings.selectedFolderId;
    if (!currId || currId === "root") {
      return []; // REQUISITO: En Mi Unidad no se muestra ninguna imagen.
    }
    const allFiles = settings.files || [];
    return allFiles.filter((f) => f.folderId === currId);
  }, [settings.files, settings.selectedFolderId]);

  // Filtrado por buscador
  const filteredFiles = useMemo(() => {
    if (!searchFilter.trim()) return currentFolderFiles;
    const query = searchFilter.toLowerCase().trim();
    return currentFolderFiles.filter((f) => f.name.toLowerCase().includes(query));
  }, [currentFolderFiles, searchFilter]);

  // Renderizado recursivo para beUI FileTree
  const renderFileTreeNode = (folder: GoogleDriveFolder): React.ReactNode => {
    const children = subfoldersMap[folder.id] || [];
    return (
      <FileTreeFolder
        key={folder.id}
        value={folder.id}
        name={folder.name}
        icon={<Folder className="w-4 h-4 text-blue-400 shrink-0" />}
      >
        {children.map((child) => renderFileTreeNode(child))}
      </FileTreeFolder>
    );
  };

  return (
    <div className="w-full flex flex-col md:flex-row h-[88vh] max-h-[820px] rounded-[2rem] bg-[#0c0c10] text-zinc-100 border border-zinc-700/80 shadow-2xl overflow-hidden select-none font-sans transition-colors duration-300">
      
      {/* 1. RAIL DE ICONOS VERTICAL (IZQUIERDA EXTREMA) */}
      <div className="hidden lg:flex w-14 shrink-0 flex-col items-center justify-between py-5 bg-[#121217] border-r border-zinc-800">
        <div className="flex flex-col items-center gap-6">
          {/* Logo Isométrico tipo Cube */}
          <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 flex items-center justify-center shadow-md font-bold">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>

          {/* Iconos de Navegación del Rail */}
          <div className="flex flex-col items-center gap-2">
            {/* 1. Home / Inicio -> Regresa a ver todas las carpetas de Mi Unidad */}
            <button
              type="button"
              onClick={handleHomeClick}
              className={`p-2.5 rounded-xl transition-all duration-300 ease-out cursor-pointer ${
                activeRailTab === 'home' && !showStatsModal
                  ? "bg-white/20 text-white shadow-xs ring-1 ring-white/30"
                  : "text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
              title="Inicio: Ver todas las carpetas de Mi Unidad"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* 2. Panel de Estadísticas */}
            <button
              type="button"
              onClick={handleStatsClick}
              className={`p-2.5 rounded-xl transition-all duration-300 ease-out cursor-pointer ${
                showStatsModal
                  ? "bg-white/20 text-white shadow-xs ring-1 ring-white/30"
                  : "text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
              title="Estadísticas de multimedia"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Google Drive Logo inferior */}
        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <GoogleDriveIcon className="w-4 h-4" />
        </div>
      </div>

      {/* 2. PANEL LATERAL: EXPLORADOR DE CARPETAS (beUI File Tree) */}
      <div className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col bg-[#121217] border-r border-zinc-800">
        {/* Cabecera del Sidebar */}
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-sm tracking-tight text-white">
            Explorador de Carpetas
          </h3>
        </div>

        {/* Buscador de la barra lateral */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-300" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar carpetas o fotos..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-700 bg-[#1c1c24] text-xs text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all duration-200"
            />
          </div>
        </div>

        {/* Árbol Jerárquico de Carpetas con beUI FileTree (Carpetas cerradas por defecto) */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
          {mainFolder ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <button
                  type="button"
                  onClick={() => handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length })}
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1.5 cursor-pointer transition-colors font-semibold"
                  title="Volver a todas las carpetas de Mi Unidad"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Volver a Mi Unidad</span>
                </button>
              </div>

              <FileTree
                value={settings.selectedFolderId}
                onValueChange={(folderId) => {
                  const target = availableFolders.find((f) => f.id === folderId);
                  if (target) {
                    handleSelectFolder(target);
                  }
                }}
                defaultExpandedIds={[]}
                className="w-full text-xs"
              >
                <FileTreeFolder
                  value={mainFolder.id}
                  name={mainFolder.name}
                  icon={<FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />}
                >
                  {(subfoldersMap[mainFolder.id] || []).map((sub) => renderFileTreeNode(sub))}
                </FileTreeFolder>
              </FileTree>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="px-2 pt-1 pb-1 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Carpetas en Mi Unidad
                </span>
                <span className="text-[11px] font-mono font-semibold text-white px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  {rootFolders.length}
                </span>
              </div>

              {rootFolders.length === 0 ? (
                <div className="p-4 text-center space-y-2 bg-zinc-800/40 rounded-2xl border border-zinc-700/80 mt-2">
                  <p className="text-xs text-zinc-200 font-semibold">Cargando carpetas de Drive...</p>
                  <p className="text-[11px] text-zinc-400">Si tarda, pulsa sincronizar en la barra superior</p>
                </div>
              ) : (
                <FileTree
                  value={settings.selectedFolderId}
                  onValueChange={(folderId) => {
                    const target = availableFolders.find((f) => f.id === folderId);
                    if (target) {
                      handleSelectFolder(target);
                    }
                  }}
                  defaultExpandedIds={[]}
                  className="w-full text-xs"
                >
                  {rootFolders.map((folder) => renderFileTreeNode(folder))}
                </FileTree>
              )}
            </div>
          )}
        </div>

        {/* Pie de la barra lateral: Información de cuenta */}
        <div className="p-3 border-t border-zinc-800 bg-[#0e0e12]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {settings.accountEmail ? settings.accountEmail.charAt(0).toUpperCase() : "G"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {settings.accountEmail || (settings.isConnected ? "Conectado" : "Google Drive")}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono font-medium">
                  {settings.isConnected ? "Conectado" : "Sin vincular"}
                </p>
              </div>
            </div>

            {settings.isConnected && (
              <button
                type="button"
                onClick={() => disconnectAccount()}
                className="p-1.5 text-zinc-300 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                title="Desconectar cuenta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. ÁREA DE CONTENIDO PRINCIPAL (CANVAS DERECHO) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c10] overflow-hidden relative">
        
        {/* Barra Superior del Canvas Principal */}
        <div className="px-5 sm:px-7 py-4 border-b border-zinc-800 flex items-center justify-between gap-4 shrink-0 bg-[#0c0c10]/95 backdrop-blur-md relative z-30">
          {/* Breadcrumb / Navegación */}
          <div className="flex items-center gap-2 min-w-0">
            {mainFolder ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length })}
                  className="text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Mi Unidad</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                </button>
                <span className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-[320px]">
                  {mainFolder.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length })}
                  className="ml-2 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-blue-300 hover:text-white font-semibold transition-colors cursor-pointer border border-white/15"
                  title="Cambiar carpeta"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">
                  Mi Unidad
                </span>
                <span className="text-xs text-zinc-300 font-medium">
                  — Selecciona una carpeta
                </span>
              </div>
            )}
          </div>

          {/* Acciones de la derecha: Sincronizar, Toggle vista, Cerrar */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="p-1.5 text-zinc-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer"
              title="Sincronizar"
            >
              <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isSyncing ? "animate-spin text-white" : ""}`} />
            </button>

            {/* Toggle Lista / Cuadrícula */}
            {mainFolder && (
              <div className="p-1 rounded-xl bg-[#181820] border border-zinc-700 flex items-center">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === 'list'
                      ? "bg-white/20 text-white shadow-xs font-bold"
                      : "text-zinc-300 hover:text-white"
                  }`}
                  title="Vista en Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === 'grid'
                      ? "bg-white/20 text-white shadow-xs font-bold"
                      : "text-zinc-300 hover:text-white"
                  }`}
                  title="Vista en Cuadrícula"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* CONTENIDO DEL CANVAS */}
        {!settings.isConnected ? (
          /* Pantalla única cuando Google Drive NO está conectado (1 solo botón) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-[#181820] border border-zinc-700 flex items-center justify-center shadow-lg">
              <GoogleDriveIcon className="w-8 h-8" />
            </div>

            <div className="max-w-sm space-y-1.5">
              <h4 className="text-base font-bold text-white">
                Conectar Google Drive
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                Vincula tu unidad para explorar tus carpetas y seleccionar fotografías de producto en alta resolución.
              </p>
            </div>

            <button
              type="button"
              onClick={() => connectGoogleOAuth()}
              disabled={isSyncing}
              className="py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-all duration-200 cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
            >
              <GoogleLogoIcon className="w-4 h-4" />
              <span>{isSyncing ? "Conectando..." : "Conectar Google Drive"}</span>
            </button>
          </div>
        ) : !mainFolder ? (
          /* PANTALLA EN 'MI UNIDAD': MUESTRA TODAS LAS CARPETAS, CERO IMÁGENES */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Carpetas en Mi Unidad
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">
                    Selecciona una carpeta para ver y gestionar sus fotografías de producto.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-white px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
                  {rootFolders.length} carpetas
                </span>
              </div>

              {rootFolders.length === 0 ? (
                <div className="p-12 rounded-3xl bg-[#14141c] border border-zinc-700/80 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 mx-auto flex items-center justify-center text-zinc-200">
                    <Folder className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-white font-bold">No se encontraron carpetas en Mi Unidad</p>
                  <p className="text-xs text-zinc-300 max-w-sm mx-auto">
                    Asegúrate de tener carpetas creadas en tu Google Drive o haz clic en Sincronizar en la esquina superior derecha.
                  </p>
                  <button
                    type="button"
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className="py-2 px-4 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    {isSyncing ? "Sincronizando..." : "Sincronizar Carpetas"}
                  </button>
                </div>
              ) : (
                /* Grid de Carpetas 3D de Mi Unidad */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  {rootFolders.map((folder) => (
                    <LayeredFolderCard
                      key={folder.id}
                      folder={folder}
                      isSelected={false}
                      onClick={() => handleSelectFolder(folder)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Aviso informativo: CERO imágenes mostradas */}
            <div className="p-4 rounded-2xl bg-[#161620] border border-zinc-700 flex items-center gap-3 text-xs sm:text-sm text-zinc-200 font-medium">
              <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Haz clic en cualquiera de las carpetas de arriba para explorar sus archivos y fotografías.</span>
            </div>
          </div>
        ) : (
          /* PANTALLA DE CARPETA SELECCIONADA: SUBCARPETAS + FOTOGRAFÍAS */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7">
            {/* Si tiene subcarpetas, mostrarlas arriba */}
            {currentSubfolders.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    Subcarpetas
                  </h4>
                  <span className="text-xs font-mono font-bold text-zinc-300 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                    {currentSubfolders.length} subcarpetas
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  {currentSubfolders.map((folder) => (
                    <LayeredFolderCard
                      key={folder.id}
                      folder={folder}
                      isSelected={settings.selectedFolderId === folder.id}
                      onClick={() => handleSelectFolder(folder)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN FOTOGRAFÍAS DE LA CARPETA SELECCIONADA */}
            <div className="space-y-3.5 pb-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Fotografías en {mainFolder.name}
                </h4>
                <span className="text-xs font-mono font-bold text-zinc-300 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  {filteredFiles.length} archivos
                </span>
              </div>

              {filteredFiles.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#14141c] border border-zinc-700 text-center text-zinc-300 text-xs font-medium">
                  No se encontraron fotografías en esta carpeta.
                </div>
              ) : viewMode === 'list' ? (
                /* TABLA LISTA DE ALTO CONTRASTE */
                <div className="rounded-2xl border border-zinc-700 bg-[#14141c] overflow-hidden">
                  <div className="grid grid-cols-12 px-4 py-3 text-xs font-bold text-zinc-200 border-b border-zinc-700 bg-[#1c1c26]">
                    <div className="col-span-7 sm:col-span-6">Nombre</div>
                    <div className="col-span-5 sm:col-span-4">Subido por</div>
                    <div className="hidden sm:block sm:col-span-2 text-right">Acciones</div>
                  </div>

                  <div className="divide-y divide-zinc-800">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="grid grid-cols-12 px-4 py-3 items-center hover:bg-white/[0.06] transition-colors duration-200 group text-xs"
                      >
                        <div className="col-span-7 sm:col-span-6 flex items-center gap-3 min-w-0 pr-3">
                          <div className="w-8 h-8 rounded-lg bg-black border border-zinc-700 shrink-0 overflow-hidden flex items-center justify-center">
                            {file.thumbnailUrl ? (
                              <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-4 h-4 text-zinc-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate group-hover:text-blue-300 transition-colors" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[11px] text-zinc-300 font-mono font-medium">
                              {file.size || "HD"}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-5 sm:col-span-4 flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-600 shrink-0 flex items-center justify-center text-[11px] font-bold text-white">
                            {file.ownerEmail ? file.ownerEmail.charAt(0).toUpperCase() : "A"}
                          </div>
                          <span className="truncate text-zinc-200 text-xs font-mono font-medium">
                            {file.ownerEmail || settings.accountEmail || "admin@lumina.com"}
                          </span>
                        </div>

                        <div className="hidden sm:flex sm:col-span-2 items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className="p-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-white/15 transition-colors duration-200 cursor-pointer"
                            title="Vista previa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)}
                            className="p-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-white/15 transition-colors duration-200 cursor-pointer"
                            title="Copiar enlace"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {onSelectPhotoForProduct && (
                            <button
                              type="button"
                              onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                              className="px-3 py-1 rounded-lg bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors duration-200 cursor-pointer"
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
                /* CUADRÍCULA DE ALTO CONTRASTE */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative rounded-2xl bg-[#14141c] border border-zinc-700/80 overflow-hidden shadow-md hover:border-zinc-400 transition-all duration-300 ease-out flex flex-col justify-between"
                    >
                      <div className="aspect-square w-full relative bg-black overflow-hidden">
                        <img
                          src={file.thumbnailUrl || file.cdnUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white border border-white/20">
                          {file.size || "HD"}
                        </div>

                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className="p-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors duration-200 cursor-pointer"
                            title="Vista previa HD"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)}
                            className="p-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors duration-200 cursor-pointer"
                            title="Copiar enlace"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="p-3 border-t border-zinc-800">
                        <p className="text-xs font-bold text-white truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[11px] text-zinc-300 font-mono mt-0.5 truncate font-medium">
                          {file.dimensions || "Resolución Drive"}
                        </p>

                        {onSelectPhotoForProduct && (
                          <button
                            type="button"
                            onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                            className="w-full mt-2.5 py-1.5 px-2 rounded-lg bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-colors duration-200 cursor-pointer shadow-sm"
                          >
                            Usar en producto
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

        {/* MODAL DE ESTADÍSTICAS */}
        {showStatsModal && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-[#181822] border border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Estadísticas de Multimedia</h4>
                    <p className="text-xs text-zinc-300">Banco de Fotos Lumina Home</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#22222d] border border-zinc-700">
                  <p className="text-xs text-zinc-300 font-semibold">Fotografías en Carpeta</p>
                  <p className="text-2xl font-bold text-white mt-1">{filteredFiles.length}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#22222d] border border-zinc-700">
                  <p className="text-xs text-zinc-300 font-semibold">Carpetas en Mi Unidad</p>
                  <p className="text-2xl font-bold text-white mt-1">{rootFolders.length}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#22222d] border border-zinc-700 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-200">
                  <span className="text-zinc-400">Cuenta activa:</span>
                  <span className="font-mono font-medium text-white">{settings.accountEmail || "Sin vincular"}</span>
                </div>
                <div className="flex justify-between text-zinc-200">
                  <span className="text-zinc-400">Estado:</span>
                  <span className="text-emerald-400 font-bold">{settings.isConnected ? "Conectado a Google Drive" : "Desconectado"}</span>
                </div>
                <div className="flex justify-between text-zinc-200">
                  <span className="text-zinc-400">Ubicación actual:</span>
                  <span className="truncate max-w-[180px] font-bold text-white">{mainFolder ? mainFolder.name : "Mi Unidad"}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className="flex-1 py-2 px-3 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Sincronizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className="py-2 px-4 rounded-xl bg-zinc-800 text-zinc-200 font-bold text-xs hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX / VISOR HD EN PANTALLA COMPLETA */}
      {previewPhoto && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-[#14141c] rounded-3xl overflow-hidden border border-zinc-700 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-zinc-700 flex items-center justify-between bg-zinc-950/90">
              <div className="min-w-0 pr-3">
                <h5 className="font-bold text-sm truncate text-white">{previewPhoto.name}</h5>
                <p className="text-xs text-zinc-300 font-mono font-medium">
                  {previewPhoto.dimensions} • {previewPhoto.size}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, previewPhoto.cdnUrl, previewPhoto.id)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-zinc-700"
                >
                  {copiedId === previewPhoto.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar enlace</span>
                    </>
                  )}
                </button>

                <a
                  href={previewPhoto.cdnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors cursor-pointer border border-zinc-700"
                  title="Descargar imagen"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors cursor-pointer border border-zinc-700"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 flex items-center justify-center overflow-hidden bg-black min-h-[320px]">
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
