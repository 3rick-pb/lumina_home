"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Folder, 
  FolderOpen, 
  RefreshCw, 
  Check, 
  Search, 
  LogOut, 
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Home,
  Database,
  ArrowLeftRight,
  BarChart2,
  List,
  LayoutGrid,
  Plus,
  Square,
  FileText,
  ImageIcon
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

// Visualizador de Carpeta 3D con micro-interacciones suaves y orgánicas
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
      className={`group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between ${
        isSelected
          ? "bg-[#222228] border-zinc-400 dark:border-white/30 shadow-lg ring-1 ring-zinc-400/40"
          : "bg-[#18181c] border-white/5 hover:border-white/15 hover:bg-[#1f1f24] shadow-sm hover:shadow-md"
      }`}
    >
      {/* Gráfico 3D de la Carpeta */}
      <div className="relative w-full h-24 sm:h-28 flex items-center justify-center select-none mb-3">
        {/* Documentos asomándose detrás con rotación suave y sutil */}
        <div className="absolute top-2 left-1/2 -translate-x-[56%] w-24 sm:w-28 h-16 sm:h-18 rounded-lg bg-zinc-200 dark:bg-zinc-300 border border-zinc-400/20 transform -rotate-3 transition-transform duration-500 ease-out group-hover:-rotate-5 group-hover:-translate-y-1 shadow-xs">
          <div className="p-1.5 flex items-center justify-between">
            <div className="w-5 h-0.5 rounded-full bg-zinc-400" />
            <span className="text-[7px] font-bold font-mono px-1 py-0.5 rounded bg-zinc-400 text-zinc-900">PDF</span>
          </div>
        </div>

        <div className="absolute top-2 left-1/2 -translate-x-[44%] w-24 sm:w-28 h-16 sm:h-18 rounded-lg bg-white dark:bg-zinc-100 border border-zinc-300 transform rotate-2 transition-transform duration-500 ease-out group-hover:rotate-4 group-hover:-translate-y-1 shadow-xs">
          <div className="p-1.5 flex items-center justify-between">
            <div className="w-6 h-0.5 rounded-full bg-zinc-400" />
            <span className="text-[7px] font-bold font-mono px-1 py-0.5 rounded bg-zinc-300 text-zinc-800">DOC</span>
          </div>
        </div>

        {/* Tapa frontal de la carpeta en gris oscuro / carbón */}
        <div className="absolute bottom-1 inset-x-2 sm:inset-x-3 h-16 sm:h-18 rounded-xl sm:rounded-2xl bg-[#26262c] border border-white/10 shadow-md flex items-end justify-between p-2.5 transition-colors duration-300 ease-out group-hover:bg-[#2e2e36]">
          {/* Pestaña superior de la carpeta */}
          <div className="absolute -top-2 left-0 w-12 sm:w-14 h-4 rounded-t-lg bg-[#26262c] border-t border-l border-r border-white/10 transition-colors duration-300 ease-out group-hover:bg-[#2e2e36]" />

          {/* Badges de Integración (Drive, Notion, Docs) */}
          <div className="flex items-center -space-x-1.5 z-10">
            <div className="w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border border-white/10 flex items-center justify-center p-0.5 shadow-xs">
              <GoogleDriveIcon className="w-3 h-3" />
            </div>
            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[8px] font-bold text-white shadow-xs">
              N
            </div>
            <div className="w-5 h-5 rounded-full bg-blue-600 border border-white/10 flex items-center justify-center p-0.5 shadow-xs">
              <ImageIcon className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Título y Conteo de Archivos */}
      <div className="text-center space-y-0.5 w-full">
        <h5 className="font-semibold text-xs sm:text-sm text-zinc-100 truncate group-hover:text-white transition-colors duration-200" title={folder.name}>
          {folder.name}
        </h5>
        <p className="text-[11px] text-zinc-400 font-medium">
          {folder.itemCount || 0} Files
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

  const [activeTab, setActiveTab] = useState<'folders' | 'tags'>('folders');
  const [activeRailTab, setActiveRailTab] = useState<'database' | 'home' | 'stats'>('database');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchFilter, setSearchFilter] = useState("");
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ root: true });
  const [feedback, setFeedback] = useState<string | null>(null);

  // Lightbox / Visor HD
  const [previewPhoto, setPreviewPhoto] = useState<GoogleDriveFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFolderDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sincronización silenciosa periódica con preservación de estado
  useEffect(() => {
    if (!settings.isConnected) return;

    const interval = setInterval(async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/admin/google-drive", {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.settings?.isConnected) {
            useGoogleDriveStore.setState((prev) => ({
              settings: {
                ...prev.settings,
                ...data.settings,
                isConnected: true,
                files: data.settings.files && data.settings.files.length > 0 ? data.settings.files : prev.settings.files,
                availableFolders: data.settings.availableFolders && data.settings.availableFolders.length > 0 ? data.settings.availableFolders : prev.settings.availableFolders,
              },
            }));
          }
        }
      } catch {
        // Fallos de red silenciosos: nunca alterar el estado conectado
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [settings.isConnected]);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCopyLink = async (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      showNotification("Enlace copiado al portapapeles");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showNotification("Error al copiar");
    }
  };

  // 1. Funcionalidad Botón HOME del rail izquierdo
  const handleHomeClick = async () => {
    setActiveRailTab('home');
    setShowStatsModal(false);
    await selectFolder('root', 'General Knowledge');
    setSearchFilter("");
    showNotification("Inicio: Todas las fotos");
  };

  // 2. Funcionalidad Botón DATABASE (Banco Multimedia)
  const handleDatabaseClick = () => {
    setActiveRailTab('database');
    setShowStatsModal(false);
    showNotification("Banco Multimedia activo");
  };

  // 3. Funcionalidad Botón SYNC (Sincronizar)
  const handleSyncClick = async () => {
    showNotification("Sincronizando con Google Drive...");
    await syncFiles();
    showNotification("Sincronización completada con éxito");
  };

  // 4. Funcionalidad Botón STATS (Estadísticas)
  const handleStatsClick = () => {
    setActiveRailTab('stats');
    setShowStatsModal(true);
  };

  const handleSelectFolder = async (folder: GoogleDriveFolder) => {
    await selectFolder(folder.id, folder.name);
    setShowFolderDropdown(false);
    setExpandedFolders((prev) => ({ ...prev, [folder.id]: true }));
    showNotification(`Carpeta activa: ${folder.name}`);
  };

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Carpetas disponibles
  const availableFolders = useMemo(() => {
    return settings.availableFolders || [];
  }, [settings.availableFolders]);

  // Estructura jerárquica
  const { rootFolders, subfoldersMap } = useMemo(() => {
    const roots: GoogleDriveFolder[] = [];
    const subs: Record<string, GoogleDriveFolder[]> = {};

    availableFolders.forEach((f) => {
      if (f.id === "root") return;
      const pId = f.parentId || "root";
      if (pId === "root") {
        roots.push(f);
      } else {
        if (!subs[pId]) subs[pId] = [];
        subs[pId].push(f);
      }
    });

    return { rootFolders: roots, subfoldersMap: subs };
  }, [availableFolders]);

  // Subcarpetas para la sección "Folders" en el canvas principal
  const currentSubfolders = useMemo(() => {
    const currId = settings.selectedFolderId || "root";
    if (currId === "root") {
      return rootFolders.length > 0 ? rootFolders : availableFolders.filter((f) => f.id !== "root");
    }
    const children = subfoldersMap[currId] || [];
    if (children.length > 0) return children;
    return availableFolders.filter((f) => f.id !== currId && f.id !== "root").slice(0, 4);
  }, [settings.selectedFolderId, rootFolders, subfoldersMap, availableFolders]);

  // Archivos de la carpeta actualmente seleccionada
  const currentFolderFiles = useMemo(() => {
    const currId = settings.selectedFolderId || "root";
    const allFiles = settings.files || [];
    if (currId === "root") {
      return allFiles;
    }
    const matching = allFiles.filter((f) => f.folderId === currId);
    return matching.length > 0 ? matching : allFiles;
  }, [settings.files, settings.selectedFolderId]);

  // Filtrado por buscador
  const filteredFiles = useMemo(() => {
    if (!searchFilter.trim()) return currentFolderFiles;
    const query = searchFilter.toLowerCase().trim();
    return currentFolderFiles.filter((f) => f.name.toLowerCase().includes(query));
  }, [currentFolderFiles, searchFilter]);

  // Componente recursivo para renderizar el árbol de carpetas con guías visuales
  const renderTreeFolder = (folder: GoogleDriveFolder, depth = 0) => {
    const isSelected = settings.selectedFolderId === folder.id;
    const children = subfoldersMap[folder.id] || [];
    const hasChildren = children.length > 0;
    const isExpanded = Boolean(expandedFolders[folder.id]);

    return (
      <div key={folder.id} className="relative select-none">
        <div
          onClick={() => handleSelectFolder(folder)}
          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
            isSelected
              ? "bg-[#25252b] text-white font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
          style={{ paddingLeft: `${Math.max(10, depth * 16 + 10)}px` }}
        >
          <div className="flex items-center gap-2 truncate">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleFolderExpand(folder.id, e)}
                className="p-0.5 hover:text-white text-zinc-500 rounded transition-transform duration-200"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <div className="w-3" />
            )}

            {isSelected ? (
              <FolderOpen className="w-3.5 h-3.5 text-zinc-100 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 shrink-0" />
            )}

            <span className="truncate">{folder.name}</span>
          </div>

          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#222228] text-zinc-400 shrink-0 ml-1">
            {folder.itemCount || 0}
          </span>
        </div>

        {/* Subcarpetas con línea guía vertical */}
        {hasChildren && isExpanded && (
          <div className="relative pl-3 ml-3 border-l border-zinc-800/80 space-y-0.5 my-0.5 transition-all duration-300">
            {children.map((child) => renderTreeFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col md:flex-row h-[88vh] max-h-[820px] rounded-[2rem] bg-[#0e0e11] text-zinc-100 border border-white/10 shadow-2xl overflow-hidden select-none font-sans transition-colors duration-300">
      
      {/* 1. RAIL DE ICONOS VERTICAL (IZQUIERDA EXTREMA - 100% FUNCIONAL) */}
      <div className="hidden lg:flex w-14 shrink-0 flex-col items-center justify-between py-5 bg-[#141417] border-r border-white/5">
        <div className="flex flex-col items-center gap-6">
          {/* Logo Isométrico tipo Cube de la referencia */}
          <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>

          {/* Iconos de Navegación del Rail con acciones y estados reales */}
          <div className="flex flex-col items-center gap-2">
            {/* 1. Home / Inicio */}
            <button
              type="button"
              onClick={handleHomeClick}
              className={`p-2.5 rounded-xl transition-all duration-300 ease-out cursor-pointer ${
                activeRailTab === 'home' && !showStatsModal
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              }`}
              title="Inicio: Ver todas las fotos"
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

            {/* 3. Sincronizar en tiempo real con Google Drive */}
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all duration-300 ease-out cursor-pointer"
              title="Sincronizar ahora con Google Drive"
            >
              <ArrowLeftRight className={`w-4 h-4 transition-transform duration-500 ${isSyncing ? "animate-spin text-white" : ""}`} />
            </button>

            {/* 4. Panel de Estadísticas */}
            <button
              type="button"
              onClick={handleStatsClick}
              className={`p-2.5 rounded-xl transition-all duration-300 ease-out cursor-pointer ${
                showStatsModal
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              }`}
              title="Estadísticas de Almacenamiento"
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

      {/* 2. PANEL LATERAL: KNOWLEDGE BASE / EXPLORADOR DE CARPETAS */}
      <div className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col bg-[#121215] border-r border-white/5">
        {/* Cabecera del Sidebar */}
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
          <h3 className="font-semibold text-sm tracking-tight text-zinc-100">
            Knowledge Base
          </h3>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <button 
              type="button" 
              onClick={() => showNotification("Para organizar, crea carpetas en Google Drive y sincroniza")}
              className="p-1 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Crear carpeta"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button" 
              onClick={handleSyncClick}
              className="p-1 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Actualizar"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Buscador de la barra lateral */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/5 text-xs bg-[#1a1a1f] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Pill Toggle Switcher (Folders / Tags) */}
        <div className="px-4 pb-3">
          <div className="p-1 rounded-xl bg-[#18181c] border border-white/5 flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('folders')}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'folders'
                  ? "bg-[#25252b] text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Folders
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tags')}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'tags'
                  ? "bg-[#25252b] text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Tags
            </button>
          </div>
        </div>

        {/* Vista en Árbol Jerárquico de Carpetas */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {/* Carpeta Raíz: General Knowledge */}
          <div
            onClick={() => handleSelectFolder({ id: 'root', name: 'General Knowledge', itemCount: settings.files?.length || 0 })}
            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
              settings.selectedFolderId === 'root'
                ? "bg-[#25252b] text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {settings.selectedFolderId === 'root' ? (
                <FolderOpen className="w-3.5 h-3.5 text-zinc-100 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              )}
              <span className="truncate">General Knowledge</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#222228] text-zinc-400 shrink-0">
              {settings.files?.length || 0}
            </span>
          </div>

          {/* Subcarpetas raíz con guías jerárquicas */}
          <div className="relative pl-2.5 ml-2 border-l border-zinc-800/80 space-y-0.5 mt-0.5">
            {rootFolders.map((folder) => renderTreeFolder(folder, 1))}
          </div>
        </div>

        {/* Pie de la barra lateral: Correo de Google conectado */}
        <div className="p-3 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-200 shrink-0">
                {settings.accountEmail ? settings.accountEmail.charAt(0).toUpperCase() : "G"}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-200 truncate">
                  {settings.accountEmail || (settings.isConnected ? "Conectado" : "Desconectado")}
                </p>
                <p className="text-[9px] text-emerald-400 font-mono">
                  {settings.isConnected ? "Conectado" : "Sin vincular"}
                </p>
              </div>
            </div>

            {settings.isConnected ? (
              <button
                type="button"
                onClick={() => disconnectAccount()}
                className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors duration-200 cursor-pointer"
                title="Desconectar cuenta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => connectGoogleOAuth()}
                className="px-2 py-1 bg-white text-zinc-950 rounded-lg text-[10px] font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Conectar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. ÁREA DE CONTENIDO PRINCIPAL (CANVAS DERECHO) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0e0e11] overflow-hidden relative">
        
        {/* Barra Superior del Canvas Principal */}
        <div className="px-5 sm:px-7 py-4 border-b border-white/5 flex items-center justify-between gap-4 shrink-0 bg-[#0e0e11]/90 backdrop-blur-md relative z-30">
          {/* Breadcrumb / Dropdown de Carpeta (General Knowledge ⌄) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowFolderDropdown(!showFolderDropdown)}
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-zinc-100 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <span>{settings.selectedFolderName && settings.selectedFolderName !== "Mi Unidad" ? settings.selectedFolderName : "General Knowledge"}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ease-out ${showFolderDropdown ? "rotate-180" : ""}`} />
            </button>

            {/* Menú Desplegable flotante */}
            {showFolderDropdown && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#18181c] border border-white/10 shadow-2xl p-1.5 z-50 animate-fade-in space-y-0.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2.5 py-1">
                  Cambiar Carpeta
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectFolder({ id: 'root', name: 'General Knowledge', itemCount: settings.files?.length || 0 })}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors duration-150 cursor-pointer text-left ${
                    settings.selectedFolderId === 'root'
                      ? "bg-white/10 text-white font-semibold"
                      : "hover:bg-white/5 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>General Knowledge</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {settings.files?.length || 0}
                  </span>
                </button>

                {availableFolders.filter((f) => f.id !== 'root').map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFolder(f)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors duration-150 cursor-pointer text-left ${
                      settings.selectedFolderId === f.id
                        ? "bg-white/10 text-white font-semibold"
                        : "hover:bg-white/5 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {f.itemCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Acciones de la derecha: Conexión, Toggle vista, Sincronizar, Cerrar */}
          <div className="flex items-center gap-2.5">
            {!settings.isConnected && (
              <button
                type="button"
                onClick={() => connectGoogleOAuth()}
                className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <GoogleLogoIcon className="w-3.5 h-3.5" />
                <span>Conectar Drive</span>
              </button>
            )}

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

        {/* Notificaciones / Toast flotante */}
        {feedback && (
          <div className="absolute top-16 right-8 px-4 py-2 bg-white text-zinc-900 rounded-full text-xs font-semibold shadow-2xl z-50 animate-fade-in">
            {feedback}
          </div>
        )}

        {/* CONTENIDO DEL CANVAS */}
        {!settings.isConnected ? (
          /* Pantalla cuando Google Drive NO está conectado */
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
        ) : (
          /* CANVAS CON CONTENIDO: SECCIÓN 1 FOLDERS + SECCIÓN 2 FILES */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7">
            
            {/* SECCIÓN 1: FOLDERS (TARJETAS 3D CON MICRO-INTERACCIONES SUAVES) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-zinc-100">
                  Folders
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">
                  {currentSubfolders.length} carpetas
                </span>
              </div>

              {/* Grid de Carpetas 3D */}
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

            {/* SECCIÓN 2: FILES (LISTADO O TABLA EXACTA A LA IMAGEN) */}
            <div className="space-y-3.5 pb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-zinc-100">
                  Files
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">
                  {filteredFiles.length} archivos
                </span>
              </div>

              {filteredFiles.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#141418] border border-white/5 text-center text-zinc-500 text-xs">
                  No se encontraron archivos en esta carpeta.
                </div>
              ) : viewMode === 'list' ? (
                /* TABLA LISTA EXACTA A LA IMAGEN (Name + Added By) */
                <div className="rounded-2xl border border-white/5 bg-[#141418] overflow-hidden">
                  {/* Encabezado de la tabla */}
                  <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-medium text-zinc-400 border-b border-white/5 bg-[#18181c]">
                    <div className="col-span-7 sm:col-span-6">Name</div>
                    <div className="col-span-5 sm:col-span-4">Added By</div>
                    <div className="hidden sm:block sm:col-span-2 text-right">Actions</div>
                  </div>

                  {/* Filas de archivos */}
                  <div className="divide-y divide-white/5">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="grid grid-cols-12 px-4 py-3 items-center hover:bg-white/[0.03] transition-colors duration-200 group text-xs"
                      >
                        {/* Columna Nombre + Icono */}
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

                        {/* Columna Added By (Avatar + Email como en la foto) */}
                        <div className="col-span-5 sm:col-span-4 flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-zinc-700 border border-white/10 shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-200">
                            {file.ownerEmail ? file.ownerEmail.charAt(0).toUpperCase() : "A"}
                          </div>
                          <span className="truncate text-zinc-400 text-xs font-mono">
                            {file.ownerEmail || settings.accountEmail || "admin@lumina.com"}
                          </span>
                        </div>

                        {/* Columna Acciones */}
                        <div className="hidden sm:flex sm:col-span-2 items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                            title="Ver en Grande"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                            title="Copiar Enlace"
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
                /* VISTA EN CUADRÍCULA DE FOTOGRAFÍAS (GALLERY GRID) */
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

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex items-center justify-center gap-1.5 p-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors duration-200 cursor-pointer"
                            title="Ver en Alta Resolución"
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

        {/* MODAL / PANEL DE ESTADÍSTICAS DEL RAIL IZQUIERDO */}
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
                  <p className="text-[11px] text-zinc-400 font-medium">Fotos Totales</p>
                  <p className="text-xl font-bold text-white mt-1">{settings.files?.length || 0}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#1c1c22] border border-white/5">
                  <p className="text-[11px] text-zinc-400 font-medium">Carpetas en Drive</p>
                  <p className="text-xl font-bold text-white mt-1">{settings.availableFolders?.length || 0}</p>
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
                  <span className="text-zinc-500">Carpeta actual:</span>
                  <span className="truncate max-w-[180px]">{settings.selectedFolderName || "General Knowledge"}</span>
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
                  <span>Sincronizar Todo</span>
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
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>

                <a
                  href={previewPhoto.cdnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                  title="Abrir imagen"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
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
