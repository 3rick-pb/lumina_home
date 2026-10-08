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
  Database,
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

// Visualizador de Carpeta 3D con micro-interacciones suaves
function LayeredFolderCard({ 
  folder, 
  isSelected, 
  onClick 
}: { 
  folder: GoogleDriveFolder; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 border transition-all duration-300 ease-out cursor-pointer flex flex-col items-center justify-between min-h-[220px] ${
        isSelected
          ? 'bg-[#222228] border-zinc-400 dark:border-white/30 shadow-lg ring-1 ring-zinc-400/40'
          : 'bg-[#18181c] border-white/5 hover:border-white/15 hover:bg-[#1f1f24] shadow-sm hover:shadow-md'
      }`}
    >
      <div className="relative w-full h-32 sm:h-36 flex items-center justify-center my-auto overflow-visible">
        <FolderComponent 
          color={isSelected ? 'blue' : 'black'} 
          size="xs" 
        />
      </div>

      <div className="text-center space-y-0.5 w-full mt-2 pt-2 border-t border-white/5">
        <h5 className="font-semibold text-xs sm:text-sm text-zinc-100 truncate group-hover:text-white transition-colors duration-200 px-1" title={folder.name}>
          {folder.name}
        </h5>
        <p className="text-[11px] text-zinc-400 font-medium">
          {folder.itemCount || 0} archivos
        </p>
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

  const [activeRailTab, setActiveRailTab] = useState<'database' | 'home' | 'stats'>('database');
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

  // 2. Botón DATABASE (Banco Multimedia)
  const handleDatabaseClick = () => {
    setActiveRailTab('database');
    setShowStatsModal(false);
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
        icon={<Folder className="w-4 h-4 text-zinc-400 shrink-0" />}
      >
        {children.map((child) => renderFileTreeNode(child))}
      </FileTreeFolder>
    );
  };

  return (
    <div className="w-full flex flex-col md:flex-row h-[88vh] max-h-[820px] rounded-[2rem] bg-[#0e0e11] text-zinc-100 border border-white/10 shadow-2xl overflow-hidden select-none font-sans transition-colors duration-300">
      
      {/* 1. RAIL DE ICONOS VERTICAL (IZQUIERDA EXTREMA) */}
      <div className="hidden lg:flex w-14 shrink-0 flex-col items-center justify-between py-5 bg-[#141417] border-r border-white/5">
        <div className="flex flex-col items-center gap-6">
          {/* Logo Isométrico tipo Cube */}
          <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 flex items-center justify-center shadow-md">
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
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              }`}
              title="Inicio: Ver todas las carpetas de Mi Unidad"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* 2. Activo: Base de Datos / Banco Multimedia */}
            <button
              type="button"
              onClick={handleDatabaseClick}
              className={`p-2.5 rounded-xl transition-all duration-300 ease-out cursor-pointer ${
                activeRailTab === 'database' && !showStatsModal
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              }`}
              title="Banco Multimedia"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* 3. Panel de Estadísticas */}
            <button
              type="button"
              onClick={handleStatsClick}
              className={`p-2.5 rounded-xl transition-all duration-300 ease-out cursor-pointer ${
                showStatsModal
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              }`}
              title="Estadísticas de multimedia"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Google Drive Logo inferior */}
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
          <GoogleDriveIcon className="w-4 h-4" />
        </div>
      </div>

      {/* 2. PANEL LATERAL: EXPLORADOR DE CARPETAS (beUI File Tree) */}
      <div className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col bg-[#121215] border-r border-white/5">
        {/* Cabecera del Sidebar */}
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
          <h3 className="font-semibold text-sm tracking-tight text-zinc-100">
            Explorador de Carpetas
          </h3>
        </div>

        {/* Buscador de la barra lateral */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar archivos o carpetas..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/5 text-xs bg-[#1a1a1f] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Árbol Jerárquico de Carpetas con beUI FileTree */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
          {mainFolder ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <button
                  type="button"
                  onClick={() => handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length })}
                  className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors font-medium"
                  title="Volver a todas las carpetas de Mi Unidad"
                >
                  <ChevronRight className="w-3 h-3 rotate-180" />
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
                defaultExpandedIds={[mainFolder.id, ...(subfoldersMap[mainFolder.id]?.map((f) => f.id) || [])]}
                className="w-full text-xs"
                pillClassName="rounded-xl bg-white/10"
                classNames={{
                  item: "text-zinc-300 hover:text-white hover:bg-white/5 py-1.5 px-2 rounded-xl text-xs",
                }}
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
              <div className="px-2 pt-1 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Carpetas de Mi Unidad ({rootFolders.length})
                </span>
              </div>

              {rootFolders.length === 0 ? (
                <div className="p-4 text-center space-y-2 bg-white/5 rounded-2xl border border-white/5 mt-2">
                  <p className="text-xs text-zinc-400 font-medium">Cargando carpetas de Drive...</p>
                  <p className="text-[10px] text-zinc-500">Si tarda, pulsa sincronizar en la barra superior</p>
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
                  defaultExpandedIds={["root", ...rootFolders.map((f) => f.id)]}
                  className="w-full text-xs"
                  pillClassName="rounded-xl bg-white/10"
                  classNames={{
                    item: "text-zinc-300 hover:text-white hover:bg-white/5 py-1.5 px-2 rounded-xl text-xs",
                  }}
                >
                  <FileTreeFolder
                    value="root"
                    name="Mi Unidad"
                    icon={<FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />}
                  >
                    {rootFolders.map((sub) => renderFileTreeNode(sub))}
                  </FileTreeFolder>
                </FileTree>
              )}
            </div>
          )}
        </div>

        {/* Pie de la barra lateral: Información de cuenta */}
        <div className="p-3 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-200 shrink-0">
                {settings.accountEmail ? settings.accountEmail.charAt(0).toUpperCase() : "G"}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-200 truncate">
                  {settings.accountEmail || (settings.isConnected ? "Conectado" : "Google Drive")}
                </p>
                <p className="text-[9px] text-emerald-400 font-mono">
                  {settings.isConnected ? "Conectado" : "Sin vincular"}
                </p>
              </div>
            </div>

            {settings.isConnected && (
              <button
                type="button"
                onClick={() => disconnectAccount()}
                className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors duration-200 cursor-pointer"
                title="Desconectar cuenta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. ÁREA DE CONTENIDO PRINCIPAL (CANVAS DERECHO) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0e0e11] overflow-hidden relative">
        
        {/* Barra Superior del Canvas Principal */}
        <div className="px-5 sm:px-7 py-4 border-b border-white/5 flex items-center justify-between gap-4 shrink-0 bg-[#0e0e11]/90 backdrop-blur-md relative z-30">
          {/* Breadcrumb / Navegación */}
          <div className="flex items-center gap-2 min-w-0">
            {mainFolder ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length })}
                  className="text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Mi Unidad</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                </button>
                <span className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-[320px]">
                  {mainFolder.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length })}
                  className="ml-2 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-blue-400 font-medium transition-colors cursor-pointer"
                  title="Cambiar carpeta"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-zinc-100">
                  Mi Unidad
                </span>
                <span className="text-xs text-zinc-400 font-normal">
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
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer"
              title="Sincronizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isSyncing ? "animate-spin text-white" : ""}`} />
            </button>

            {/* Toggle Lista / Cuadrícula */}
            {mainFolder && (
              <div className="p-1 rounded-xl bg-[#18181c] border border-white/10 flex items-center">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === 'list'
                      ? "bg-[#25252b] text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-200"
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
                      ? "bg-[#25252b] text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-200"
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
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer"
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
            <div className="w-16 h-16 rounded-3xl bg-[#18181c] border border-white/10 flex items-center justify-center shadow-md">
              <GoogleDriveIcon className="w-8 h-8" />
            </div>

            <div className="max-w-sm space-y-1.5">
              <h4 className="text-base font-semibold text-zinc-100">
                Conectar Google Drive
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Vincula tu unidad para explorar tus carpetas y seleccionar fotografías de producto en alta resolución.
              </p>
            </div>

            <button
              type="button"
              onClick={() => connectGoogleOAuth()}
              disabled={isSyncing}
              className="py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs shadow-md transition-all duration-200 cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
            >
              <GoogleLogoIcon className="w-4 h-4" />
              <span>{isSyncing ? "Conectando..." : "Conectar Google Drive"}</span>
            </button>
          </div>
        ) : !mainFolder ? (
          /* PANTALLA EN 'MI UNIDAD': MUESTRA TODAS LAS CARPETAS, CERO IMÁGENES */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-zinc-100">
                    Carpetas en Mi Unidad
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Selecciona una carpeta para ver y gestionar sus fotografías de producto.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 px-2 py-1 rounded-lg bg-[#18181c] border border-white/5">
                  {rootFolders.length} carpetas
                </span>
              </div>

              {rootFolders.length === 0 ? (
                <div className="p-12 rounded-3xl bg-[#141418] border border-white/5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-zinc-400">
                    <Folder className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-300 font-medium">No se encontraron carpetas en Mi Unidad</p>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    Asegúrate de tener carpetas creadas en tu Google Drive o haz clic en Sincronizar en la esquina superior derecha.
                  </p>
                  <button
                    type="button"
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className="py-2 px-4 rounded-xl bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
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
            <div className="p-4 rounded-2xl bg-[#141418] border border-white/5 flex items-center gap-3 text-xs text-zinc-400">
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
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-bold text-zinc-100">
                    Subcarpetas
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-500">
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
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-zinc-100">
                    Fotografías en {mainFolder.name}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  {filteredFiles.length} archivos
                </span>
              </div>

              {filteredFiles.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#141418] border border-white/5 text-center text-zinc-500 text-xs">
                  No se encontraron fotografías en esta carpeta.
                </div>
              ) : viewMode === 'list' ? (
                /* TABLA LISTA */
                <div className="rounded-2xl border border-white/5 bg-[#141418] overflow-hidden">
                  <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-medium text-zinc-400 border-b border-white/5 bg-[#18181c]">
                    <div className="col-span-7 sm:col-span-6">Nombre</div>
                    <div className="col-span-5 sm:col-span-4">Subido por</div>
                    <div className="hidden sm:block sm:col-span-2 text-right">Acciones</div>
                  </div>

                  <div className="divide-y divide-white/5">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="grid grid-cols-12 px-4 py-3 items-center hover:bg-white/[0.03] transition-colors duration-200 group text-xs"
                      >
                        <div className="col-span-7 sm:col-span-6 flex items-center gap-3 min-w-0 pr-3">
                          <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                            {file.thumbnailUrl ? (
                              <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-200 truncate group-hover:text-white transition-colors duration-200" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {file.size || "HD"}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-5 sm:col-span-4 flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-zinc-700 border border-white/10 shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-200">
                            {file.ownerEmail ? file.ownerEmail.charAt(0).toUpperCase() : "A"}
                          </div>
                          <span className="truncate text-zinc-400 text-xs font-mono">
                            {file.ownerEmail || settings.accountEmail || "admin@lumina.com"}
                          </span>
                        </div>

                        <div className="hidden sm:flex sm:col-span-2 items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                            title="Vista previa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                            title="Copiar enlace"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {onSelectPhotoForProduct && (
                            <button
                              type="button"
                              onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                              className="px-2.5 py-1 rounded-lg bg-white text-zinc-950 font-semibold text-[10px] hover:bg-zinc-200 transition-colors duration-200 cursor-pointer"
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
                /* CUADRÍCULA */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative rounded-2xl bg-[#141418] border border-white/5 overflow-hidden shadow-xs hover:border-white/20 transition-all duration-300 ease-out flex flex-col justify-between"
                    >
                      <div className="aspect-square w-full relative bg-black overflow-hidden">
                        <img
                          src={file.thumbnailUrl || file.cdnUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono text-white/90">
                          {file.size || "HD"}
                        </div>

                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex items-center justify-center gap-1.5 p-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors duration-200 cursor-pointer"
                            title="Vista previa HD"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors duration-200 cursor-pointer"
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
                        <p className="text-[11px] font-semibold text-zinc-200 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[9px] text-zinc-400 font-mono mt-0.5 truncate">
                          {file.dimensions || "Resolución Drive"}
                        </p>

                        {onSelectPhotoForProduct && (
                          <button
                            type="button"
                            onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                            className="w-full mt-2 py-1 px-2 rounded-lg bg-white text-zinc-950 text-[10px] font-semibold hover:bg-zinc-200 transition-colors duration-200 cursor-pointer"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-[#16161b] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-zinc-100">Estadísticas de Multimedia</h4>
                    <p className="text-[11px] text-zinc-400">Banco de Fotos Lumina Home</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#1c1c22] border border-white/5">
                  <p className="text-[11px] text-zinc-400 font-medium">Fotografías en Carpeta</p>
                  <p className="text-xl font-bold text-white mt-1">{filteredFiles.length}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#1c1c22] border border-white/5">
                  <p className="text-[11px] text-zinc-400 font-medium">Carpetas en Mi Unidad</p>
                  <p className="text-xl font-bold text-white mt-1">{rootFolders.length}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1c1c22] border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-500">Cuenta activa:</span>
                  <span className="font-mono">{settings.accountEmail || "Sin vincular"}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-500">Estado:</span>
                  <span className="text-emerald-400 font-medium">{settings.isConnected ? "Conectado a Google Drive" : "Desconectado"}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-500">Ubicación actual:</span>
                  <span className="truncate max-w-[180px] font-medium text-white">{mainFolder ? mainFolder.name : "Mi Unidad"}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className="flex-1 py-2 px-3 rounded-xl bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Sincronizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className="py-2 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-[#141418] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/80">
              <div className="min-w-0 pr-3">
                <h5 className="font-semibold text-sm truncate text-zinc-100">{previewPhoto.name}</h5>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {previewPhoto.dimensions} • {previewPhoto.size}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, previewPhoto.cdnUrl, previewPhoto.id)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
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
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                  title="Descargar imagen"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
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
