"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Space_Mono } from "next/font/google";
import { motion } from "motion/react";
import FolderComponent from "@/components/ui/Folder";
import { ArcPicker, ArcPickerOption } from "@/components/motion/arc-picker";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";
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
import { 
  useGoogleDriveStore, 
  GoogleDriveFolder, 
  GoogleDriveFile
} from "@/lib/googleDriveStore";
import { cn } from "@/lib/utils";

// Tipografía Space Mono solicitada por el usuario
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Iconos exportados para compatibilidad con otros módulos que los importan
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

// Componente Scroll Progress de rareUI simplificado al porcentaje de la media rueda
const ArcScrollProgress = React.memo(function ArcScrollProgress({
  percent,
  isDark
}: {
  percent: number;
  isDark: boolean;
}) {
  const norm = Math.min(1, Math.max(0, percent / 100));
  return (
    <div
      data-slot="scroll-progress-pill"
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-xs transition-colors font-mono text-xs select-none",
        isDark
          ? "bg-zinc-900 border-zinc-700 text-zinc-100"
          : "bg-white border-zinc-200 text-zinc-800"
      )}
      title="Progreso del recorrido de la media rueda"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 -rotate-90 shrink-0" aria-hidden>
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2.5"
          className={isDark ? "stroke-zinc-700" : "stroke-zinc-200"}
        />
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-blue-500"
          initial={false}
          animate={{ pathLength: norm }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
      </svg>
      <span className="font-bold text-xs whitespace-nowrap">
        {percent}%
      </span>
      {percent === 0 ? (
        <span className="text-[10px] text-zinc-500 uppercase">Inicio</span>
      ) : percent >= 98 ? (
        <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold uppercase">Límite</span>
      ) : null}
    </div>
  );
});

// Visualizador de Carpeta 3D oficial de rareUI (Sin contenedor, sin salto al pasar el cursor)
const LayeredFolderCard = React.memo(function LayeredFolderCard({ 
  folder, 
  isSelected, 
  isDark,
  onClick 
}: { 
  folder: GoogleDriveFolder; 
  isSelected: boolean; 
  isDark: boolean;
  onClick: () => void; 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    setTimeout(() => {
      onClick();
    }, 200);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsOpen(false);
      }}
      className="group flex flex-col items-center justify-center cursor-pointer select-none py-1 px-1 w-full max-w-[200px]"
    >
      {/* Solo la carpeta de rareUI libre: tamaño sm compacto para no colisionar con las demás */}
      <div className="relative flex items-center justify-center overflow-visible">
        <FolderComponent 
          color="blue" 
          size="sm" 
          isHovered={isHovered}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      </div>

      {/* Solo el nombre de la carpeta abajo con Space Mono */}
      <div className="text-center mt-2.5 max-w-[170px] w-full">
        <h5 
          className={cn(
            "font-bold text-xs sm:text-sm truncate px-1 transition-colors font-mono",
            isSelected || isOpen 
              ? "text-blue-500 dark:text-blue-400" 
              : isDark 
                ? "text-white group-hover:text-blue-300" 
                : "text-zinc-900 group-hover:text-blue-600"
          )} 
          title={folder.name}
        >
          {folder.name}
        </h5>
        {folder.itemCount !== undefined && folder.itemCount > 0 && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono block mt-0.5">
            {folder.itemCount} {folder.itemCount === 1 ? 'foto' : 'fotos'}
          </span>
        )}
      </div>
    </div>
  );
});

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

  const { mode } = useThemeStore();
  const isDark = getResolvedTheme(mode) === "dark";

  const [activeRailTab, setActiveRailTab] = useState<'home' | 'stats'>('home');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchFilter, setSearchFilter] = useState("");
  const [arcProgressPercent, setArcProgressPercent] = useState(0);

  // Estado local para el valor activo del ArcPicker (evita saltos/bloqueos al hacer scroll)
  const [activeArcFolderId, setActiveArcFolderId] = useState<string>(settings.selectedFolderId || "root");
  const debouncedSelectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincronizar activeArcFolderId cuando el store se actualice externamente
  useEffect(() => {
    if (settings.selectedFolderId) {
      setActiveArcFolderId(settings.selectedFolderId);
    }
  }, [settings.selectedFolderId]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debouncedSelectRef.current) {
        clearTimeout(debouncedSelectRef.current);
      }
    };
  }, []);

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

  // Selección inmediata (para clics directos en carpetas o botones)
  const handleSelectFolderImmediate = useCallback(async (folder: GoogleDriveFolder) => {
    if (debouncedSelectRef.current) {
      clearTimeout(debouncedSelectRef.current);
      debouncedSelectRef.current = null;
    }
    setActiveArcFolderId(folder.id);
    await selectFolder(folder.id, folder.name);
  }, [selectFolder]);

  // Manejo de cambio en ArcPicker con debounce para estabilidad perfecta durante scroll continuo
  const handleArcValueChange = useCallback((val: string) => {
    setActiveArcFolderId(val);
    if (debouncedSelectRef.current) {
      clearTimeout(debouncedSelectRef.current);
    }
    debouncedSelectRef.current = setTimeout(() => {
      if (val === "root") {
        selectFolder("root", "Mi Unidad");
      } else {
        const target = (settings.availableFolders || []).find((f) => f.id === val);
        if (target) {
          selectFolder(target.id, target.name);
        }
      }
    }, 280);
  }, [settings.availableFolders, selectFolder]);

  // Botón HOME del rail izquierdo -> Volver a Mi Unidad
  const handleHomeClick = async () => {
    setActiveRailTab('home');
    setShowStatsModal(false);
    if (debouncedSelectRef.current) {
      clearTimeout(debouncedSelectRef.current);
      debouncedSelectRef.current = null;
    }
    setActiveArcFolderId('root');
    await selectFolder('root', 'Mi Unidad');
    setSearchFilter("");
  };

  // Botón SYNC (Sincronizar)
  const handleSyncClick = async () => {
    await syncFiles();
  };

  // Botón STATS (Estadísticas)
  const handleStatsClick = () => {
    setActiveRailTab('stats');
    setShowStatsModal(true);
  };

  const handleSelectFolder = async (folder: GoogleDriveFolder) => {
    await handleSelectFolderImmediate(folder);
  };

  // Carpetas disponibles desde el store (excluyendo carpetas vacías si hay conteo de archivos disponible)
  const availableFolders = useMemo(() => {
    const list = settings.availableFolders || [];
    const hasAnyCount = list.some((f) => f.id !== "root" && f.itemCount !== undefined && f.itemCount > 0);
    if (!hasAnyCount) {
      return list;
    }
    return list.filter(
      (f) => f.id === "root" || (f.itemCount !== undefined && f.itemCount > 0)
    );
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

  // Opciones para beUI Arc Picker
  const arcOptions = useMemo<ArcPickerOption[]>(() => {
    const baseList = availableFolders.filter((f) => {
      if (f.id === "root") return false;
      if (!searchFilter.trim()) return true;
      return f.name.toLowerCase().includes(searchFilter.toLowerCase().trim());
    });

    const items: ArcPickerOption[] = [
      { value: "root", label: "Mi Unidad" },
      ...baseList.map((f) => ({
        value: f.id,
        label: f.name,
      })),
    ];
    return items;
  }, [availableFolders, searchFilter]);

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

  return (
    <div 
      data-lenis-prevent="true"
      className={cn(
        "w-full flex flex-col md:flex-row h-[88vh] max-h-[820px] rounded-[2rem] shadow-2xl overflow-hidden select-none transition-colors duration-300 border",
        isDark ? "bg-[#0c0c10] text-zinc-100 border-zinc-800" : "bg-white text-zinc-900 border-zinc-200",
        spaceMono.className
      )}
    >
      
      {/* 1. RAIL DE ICONOS VERTICAL (IZQUIERDA EXTREMA) - Sin logo superior ni ícono de Drive inferior */}
      <div className={cn(
        "hidden lg:flex w-14 shrink-0 flex-col items-center justify-between py-5 border-r transition-colors duration-200",
        isDark ? "bg-[#121217] border-zinc-800" : "bg-zinc-100 border-zinc-200"
      )}>
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Iconos de Navegación del Rail */}
          <div className="flex flex-col items-center gap-2">
            {/* 1. Home / Inicio -> Regresa a ver todas las carpetas de Mi Unidad */}
            <button
              type="button"
              onClick={handleHomeClick}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                activeRailTab === 'home' && !showStatsModal
                  ? isDark 
                    ? "bg-white/20 text-white shadow-xs ring-1 ring-white/30" 
                    : "bg-zinc-200 text-zinc-950 shadow-xs ring-1 ring-zinc-300"
                  : isDark 
                    ? "text-zinc-400 hover:text-white hover:bg-white/10" 
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60"
              )}
              title="Inicio: Ver todas las carpetas de Mi Unidad"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* 2. Panel de Estadísticas */}
            <button
              type="button"
              onClick={handleStatsClick}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                showStatsModal
                  ? isDark 
                    ? "bg-white/20 text-white shadow-xs ring-1 ring-white/30" 
                    : "bg-zinc-200 text-zinc-950 shadow-xs ring-1 ring-zinc-300"
                  : isDark 
                    ? "text-zinc-400 hover:text-white hover:bg-white/10" 
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60"
              )}
              title="Estadísticas de multimedia"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Estado inferior de cuenta (sin ícono de Google Drive) */}
        {settings.isConnected && (
          <div className={cn(
            "w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs uppercase",
            isDark ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-white border-zinc-300 text-zinc-700 shadow-xs"
          )} title={settings.accountEmail || "Conectado"}>
            {settings.accountEmail ? settings.accountEmail.charAt(0) : "C"}
          </div>
        )}
      </div>

      {/* 2. PANEL LATERAL: GESTOR DE CARPETAS (beUI Arc Picker en modo Right + RareUI Scroll Progress) */}
      <div 
        data-lenis-prevent="true"
        className={cn(
          "w-full md:w-72 lg:w-80 shrink-0 flex flex-col border-r transition-colors duration-200",
          isDark ? "bg-[#121217] border-zinc-800" : "bg-zinc-50 border-zinc-200"
        )}
      >
        {/* Cabecera del Sidebar con título y Scroll Progress */}
        <div className="p-4 sm:p-5 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={cn(
              "font-bold text-sm tracking-tight font-mono",
              isDark ? "text-white" : "text-zinc-900"
            )}>
              Gestor de Carpetas
            </h3>
            <ArcScrollProgress percent={arcProgressPercent} isDark={isDark} />
          </div>

          {/* Buscador de carpetas con alineación y simetría perfecta */}
          <div className="relative flex items-center w-full">
            <div className="absolute left-3.5 inset-y-0 flex items-center justify-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar carpetas..."
              className={cn(
                "w-full pl-10 pr-9 h-9 rounded-xl border text-xs font-mono transition-all duration-200 outline-none flex items-center leading-none",
                isDark 
                  ? "bg-[#181822] border-zinc-700/80 text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500" 
                  : "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              )}
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="absolute right-3 inset-y-0 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* beUI Arc Picker en modo Right */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 relative overflow-hidden">
          {arcOptions.length === 0 ? (
            <div className="text-center p-4 text-xs text-zinc-500 font-mono">
              No se encontraron carpetas
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-col items-center justify-center">
              <ArcPicker
                options={arcOptions}
                value={activeArcFolderId}
                onValueChange={handleArcValueChange}
                onProgressChange={(p) => setArcProgressPercent(p)}
                side="right"
                radius={240}
                itemHeight={44}
                visibleCount={7}
                className="w-full h-[380px]"
              />
            </div>
          )}
        </div>

        {/* Pie del Sidebar: Información de cuenta */}
        <div className={cn(
          "p-3.5 border-t text-xs flex items-center justify-between",
          isDark ? "border-zinc-800 bg-[#0e0e13] text-zinc-300" : "border-zinc-200 bg-zinc-100 text-zinc-700"
        )}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate font-semibold font-mono">
              {mainFolder ? mainFolder.name : "Mi Unidad"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 font-bold shrink-0">
              {mainFolder ? `${currentFolderFiles.length} fotos` : `${rootFolders.length} carpetas`}
            </span>

            {settings.isConnected && (
              <button
                type="button"
                onClick={() => disconnectAccount()}
                className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors duration-200 cursor-pointer"
                title="Desconectar cuenta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. ÁREA DE CONTENIDO PRINCIPAL (CANVAS DERECHO) */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden relative transition-colors duration-200",
        isDark ? "bg-[#0c0c10]" : "bg-white"
      )}>
        
        {/* Barra Superior del Canvas Principal */}
        <div className={cn(
          "px-5 sm:px-7 py-4 border-b flex items-center justify-between gap-4 shrink-0 backdrop-blur-md relative z-30 transition-colors duration-200",
          isDark ? "bg-[#0c0c10]/95 border-zinc-800 text-white" : "bg-white/95 border-zinc-200 text-zinc-900"
        )}>
          {/* Breadcrumb / Navegación */}
          <div className="flex items-center gap-2 min-w-0 font-mono">
            {mainFolder ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length })}
                  className={cn(
                    "text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1",
                    isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-950"
                  )}
                >
                  <span>Mi Unidad</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                </button>
                <span className={cn(
                  "text-sm sm:text-base font-bold truncate max-w-[200px] sm:max-w-[320px]",
                  isDark ? "text-white" : "text-zinc-900"
                )}>
                  {mainFolder.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length })}
                  className={cn(
                    "ml-2 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer border",
                    isDark 
                      ? "bg-white/10 hover:bg-white/20 text-blue-300 hover:text-white border-white/15" 
                      : "bg-zinc-100 hover:bg-zinc-200 text-blue-600 border-zinc-300"
                  )}
                  title="Cambiar carpeta"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm sm:text-base font-bold",
                  isDark ? "text-white" : "text-zinc-900"
                )}>
                  Mi Unidad
                </span>
                <span className={cn("text-xs font-medium", isDark ? "text-zinc-400" : "text-zinc-500")}>
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
              className={cn(
                "p-1.5 rounded-lg transition-colors duration-200 cursor-pointer",
                isDark ? "text-zinc-300 hover:text-white hover:bg-white/10" : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
              )}
              title="Sincronizar"
            >
              <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isSyncing ? "animate-spin text-blue-500" : ""}`} />
            </button>

            {/* Toggle Lista / Cuadrícula */}
            {mainFolder && (
              <div className={cn(
                "p-1 rounded-xl border flex items-center transition-colors",
                isDark ? "bg-[#181820] border-zinc-700" : "bg-zinc-100 border-zinc-200"
              )}>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
                    viewMode === 'list'
                      ? isDark ? "bg-white/20 text-white font-bold" : "bg-white text-zinc-950 font-bold shadow-xs"
                      : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-950"
                  )}
                  title="Vista en Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
                    viewMode === 'grid'
                      ? isDark ? "bg-white/20 text-white font-bold" : "bg-white text-zinc-950 font-bold shadow-xs"
                      : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-950"
                  )}
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
                className={cn(
                  "p-1.5 rounded-lg transition-colors duration-200 cursor-pointer",
                  isDark ? "text-zinc-300 hover:text-white hover:bg-white/10" : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                )}
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* CONTENIDO DEL CANVAS */}
        {!settings.isConnected ? (
          /* Pantalla única cuando Google Drive NO está conectado */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
            <div className={cn(
              "w-16 h-16 rounded-3xl border flex items-center justify-center shadow-lg transition-colors",
              isDark ? "bg-[#181820] border-zinc-700 text-blue-400" : "bg-zinc-100 border-zinc-200 text-blue-600"
            )}>
              <FolderOpen className="w-8 h-8" />
            </div>

            <div className="max-w-sm space-y-1.5">
              <h4 className={cn("text-base font-bold", isDark ? "text-white" : "text-zinc-950")}>
                Conectar Banco Multimedia
              </h4>
              <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-zinc-400" : "text-zinc-600")}>
                Vincula tu unidad para explorar tus carpetas y seleccionar fotografías de producto en alta resolución.
              </p>
            </div>

            <button
              type="button"
              onClick={() => connectGoogleOAuth()}
              disabled={isSyncing}
              className={cn(
                "py-2.5 px-6 rounded-xl font-bold text-xs shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50",
                isDark 
                  ? "bg-white hover:bg-zinc-200 text-zinc-950" 
                  : "bg-zinc-950 hover:bg-zinc-800 text-white"
              )}
            >
              <span>{isSyncing ? "Conectando..." : "Conectar Google Drive"}</span>
            </button>
          </div>
        ) : !mainFolder ? (
          /* PANTALLA EN 'MI UNIDAD': MUESTRA TODAS LAS CARPETAS, CERO IMÁGENES */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            <div className="space-y-4">
              <div className={cn("flex items-center justify-between border-b pb-3", isDark ? "border-zinc-800" : "border-zinc-200")}>
                <div>
                  <h4 className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-zinc-950")}>
                    Carpetas en Mi Unidad
                  </h4>
                  <p className={cn("text-xs sm:text-sm mt-0.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Selecciona una carpeta en la media rueda o haz clic abajo para entrar.
                  </p>
                </div>
                <span className={cn(
                  "text-xs font-mono font-bold px-2.5 py-1 rounded-lg border",
                  isDark ? "text-white bg-zinc-800 border-zinc-700" : "text-zinc-800 bg-zinc-100 border-zinc-300"
                )}>
                  {rootFolders.length} carpetas
                </span>
              </div>

              {rootFolders.length === 0 ? (
                <div className={cn(
                  "p-12 rounded-3xl border text-center space-y-3",
                  isDark ? "bg-[#14141c] border-zinc-700/80" : "bg-zinc-50 border-zinc-200"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl mx-auto flex items-center justify-center",
                    isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-700"
                  )}>
                    <Folder className="w-6 h-6" />
                  </div>
                  <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-zinc-900")}>
                    No se encontraron carpetas en Mi Unidad
                  </p>
                  <p className={cn("text-xs max-w-sm mx-auto", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Asegúrate de tener carpetas creadas en tu Google Drive o pulsa sincronizar arriba.
                  </p>
                  <button
                    type="button"
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className={cn(
                      "py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                      isDark ? "bg-white text-zinc-950 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
                    )}
                  >
                    {isSyncing ? "Sincronizando..." : "Sincronizar Carpetas"}
                  </button>
                </div>
              ) : (
                /* Grid de Carpetas 3D de Mi Unidad (Filas de 3, libres y sin desplazamiento en hover) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 sm:gap-x-10 lg:gap-x-12 gap-y-10 sm:gap-y-12 pt-6 sm:pt-8 pb-4 justify-items-center">
                  {rootFolders.map((folder) => (
                    <LayeredFolderCard
                      key={folder.id}
                      folder={folder}
                      isSelected={false}
                      isDark={isDark}
                      onClick={() => handleSelectFolder(folder)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Aviso informativo: CERO imágenes mostradas en Mi Unidad */}
            <div className={cn(
              "p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm font-medium",
              isDark ? "bg-[#161620] border-zinc-700 text-zinc-200" : "bg-zinc-50 border-zinc-200 text-zinc-700"
            )}>
              <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Gira la media rueda en la barra lateral o haz clic en cualquier carpeta para explorar sus archivos.</span>
            </div>
          </div>
        ) : (
          /* PANTALLA DE CARPETA SELECCIONADA: SUBCARPETAS + FOTOGRAFÍAS */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7">
            {/* Si tiene subcarpetas, mostrarlas arriba en filas de 3 */}
            {currentSubfolders.length > 0 && (
              <div className="space-y-3.5">
                <div className={cn("flex items-center justify-between border-b pb-2", isDark ? "border-zinc-800" : "border-zinc-200")}>
                  <h4 className={cn("text-sm sm:text-base font-bold", isDark ? "text-white" : "text-zinc-900")}>
                    Subcarpetas
                  </h4>
                  <span className={cn(
                    "text-xs font-mono font-bold px-2 py-0.5 rounded border",
                    isDark ? "text-zinc-300 bg-zinc-800 border-zinc-700" : "text-zinc-700 bg-zinc-100 border-zinc-300"
                  )}>
                    {currentSubfolders.length} subcarpetas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 sm:gap-x-10 lg:gap-x-12 gap-y-10 sm:gap-y-12 pt-4 sm:pt-6 pb-2 justify-items-center">
                  {currentSubfolders.map((folder) => (
                    <LayeredFolderCard
                      key={folder.id}
                      folder={folder}
                      isSelected={settings.selectedFolderId === folder.id}
                      isDark={isDark}
                      onClick={() => handleSelectFolder(folder)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN FOTOGRAFÍAS DE LA CARPETA SELECCIONADA */}
            <div className="space-y-3.5 pb-6">
              <div className={cn("flex items-center justify-between border-b pb-2", isDark ? "border-zinc-800" : "border-zinc-200")}>
                <h4 className={cn("text-sm sm:text-base font-bold", isDark ? "text-white" : "text-zinc-900")}>
                  Fotografías en {mainFolder.name}
                </h4>
                <span className={cn(
                  "text-xs font-mono font-bold px-2 py-0.5 rounded border",
                  isDark ? "text-zinc-300 bg-zinc-800 border-zinc-700" : "text-zinc-700 bg-zinc-100 border-zinc-300"
                )}>
                  {filteredFiles.length} archivos
                </span>
              </div>

              {filteredFiles.length === 0 ? (
                <div className={cn(
                  "p-10 rounded-2xl border text-center text-xs font-medium",
                  isDark ? "bg-[#14141c] border-zinc-700 text-zinc-400" : "bg-zinc-50 border-zinc-200 text-zinc-500"
                )}>
                  No se encontraron fotografías en esta carpeta.
                </div>
              ) : viewMode === 'list' ? (
                /* TABLA LISTA DE ALTO CONTRASTE */
                <div className={cn(
                  "rounded-2xl border overflow-hidden",
                  isDark ? "border-zinc-700 bg-[#14141c]" : "border-zinc-200 bg-white shadow-xs"
                )}>
                  <div className={cn(
                    "grid grid-cols-12 px-4 py-3 text-xs font-bold border-b",
                    isDark ? "text-zinc-300 border-zinc-700 bg-[#1c1c26]" : "text-zinc-700 border-zinc-200 bg-zinc-50"
                  )}>
                    <div className="col-span-7 sm:col-span-6">Nombre</div>
                    <div className="col-span-5 sm:col-span-4">Subido por</div>
                    <div className="hidden sm:block sm:col-span-2 text-right">Acciones</div>
                  </div>

                  <div className={cn("divide-y", isDark ? "divide-zinc-800" : "divide-zinc-200")}>
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={cn(
                          "grid grid-cols-12 px-4 py-3 items-center transition-colors duration-200 group text-xs",
                          isDark ? "hover:bg-white/[0.06]" : "hover:bg-zinc-50"
                        )}
                      >
                        <div className="col-span-7 sm:col-span-6 flex items-center gap-3 min-w-0 pr-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg border shrink-0 overflow-hidden flex items-center justify-center",
                            isDark ? "bg-black border-zinc-700" : "bg-zinc-100 border-zinc-300"
                          )}>
                            {file.thumbnailUrl ? (
                              <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className={cn("w-4 h-4", isDark ? "text-zinc-400" : "text-zinc-500")} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={cn(
                              "font-semibold truncate transition-colors",
                              isDark ? "text-white group-hover:text-blue-300" : "text-zinc-900 group-hover:text-blue-600"
                            )} title={file.name}>
                              {file.name}
                            </p>
                            <p className={cn("text-[11px] font-mono font-medium", isDark ? "text-zinc-400" : "text-zinc-500")}>
                              {file.size || "HD"}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-5 sm:col-span-4 flex items-center gap-2 min-w-0">
                          <div className={cn(
                            "w-6 h-6 rounded-full border shrink-0 flex items-center justify-center text-[11px] font-bold",
                            isDark ? "bg-zinc-700 border-zinc-600 text-white" : "bg-zinc-200 border-zinc-300 text-zinc-800"
                          )}>
                            {file.ownerEmail ? file.ownerEmail.charAt(0).toUpperCase() : "A"}
                          </div>
                          <span className={cn("truncate text-xs font-mono font-medium", isDark ? "text-zinc-300" : "text-zinc-600")}>
                            {file.ownerEmail || settings.accountEmail || "admin@lumina.com"}
                          </span>
                        </div>

                        <div className="hidden sm:flex sm:col-span-2 items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors duration-200 cursor-pointer",
                              isDark ? "text-zinc-300 hover:text-white hover:bg-white/15" : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                            )}
                            title="Vista previa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, file.cdnUrl, file.id)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors duration-200 cursor-pointer",
                              isDark ? "text-zinc-300 hover:text-white hover:bg-white/15" : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                            )}
                            title="Copiar enlace"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {onSelectPhotoForProduct && (
                            <button
                              type="button"
                              onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                              className={cn(
                                "px-3 py-1 rounded-lg font-bold text-xs transition-colors duration-200 cursor-pointer shadow-xs",
                                isDark ? "bg-white text-zinc-950 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
                              )}
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
                      className={cn(
                        "group relative rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 ease-out flex flex-col justify-between",
                        isDark 
                          ? "bg-[#14141c] border-zinc-700/80 hover:border-zinc-500" 
                          : "bg-white border-zinc-200 hover:border-blue-400 hover:shadow-md"
                      )}
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

                      <div className={cn("p-3 border-t", isDark ? "border-zinc-800" : "border-zinc-200")}>
                        <p className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-zinc-900")} title={file.name}>
                          {file.name}
                        </p>
                        <p className={cn("text-[11px] font-mono mt-0.5 truncate font-medium", isDark ? "text-zinc-400" : "text-zinc-500")}>
                          {file.dimensions || "Resolución Drive"}
                        </p>

                        {onSelectPhotoForProduct && (
                          <button
                            type="button"
                            onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                            className={cn(
                              "w-full mt-2.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors duration-200 cursor-pointer shadow-xs",
                              isDark ? "bg-white text-zinc-950 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
                            )}
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={cn(
              "w-full max-w-md border rounded-3xl p-6 shadow-2xl space-y-5 transition-colors",
              isDark ? "bg-[#181822] border-zinc-700 text-white" : "bg-white border-zinc-200 text-zinc-900"
            )}>
              <div className={cn("flex items-center justify-between pb-3 border-b", isDark ? "border-zinc-700" : "border-zinc-200")}>
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    isDark ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-900"
                  )}>
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Estadísticas de Multimedia</h4>
                    <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-500")}>Banco de Fotos Lumina Home</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    isDark ? "text-zinc-400 hover:text-white hover:bg-white/10" : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                  "p-3.5 rounded-2xl border",
                  isDark ? "bg-[#22222d] border-zinc-700" : "bg-zinc-50 border-zinc-200"
                )}>
                  <p className={cn("text-xs font-semibold", isDark ? "text-zinc-400" : "text-zinc-500")}>Fotos en Carpeta</p>
                  <p className="text-2xl font-bold mt-1">{filteredFiles.length}</p>
                </div>
                <div className={cn(
                  "p-3.5 rounded-2xl border",
                  isDark ? "bg-[#22222d] border-zinc-700" : "bg-zinc-50 border-zinc-200"
                )}>
                  <p className={cn("text-xs font-semibold", isDark ? "text-zinc-400" : "text-zinc-500")}>Carpetas en Unidad</p>
                  <p className="text-2xl font-bold mt-1">{rootFolders.length}</p>
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border space-y-2 text-xs",
                isDark ? "bg-[#22222d] border-zinc-700" : "bg-zinc-50 border-zinc-200"
              )}>
                <div className="flex justify-between">
                  <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>Cuenta activa:</span>
                  <span className="font-mono font-medium">{settings.accountEmail || "Sin vincular"}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>Estado:</span>
                  <span className="text-emerald-500 font-bold">{settings.isConnected ? "Conectado" : "Desconectado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>Ubicación actual:</span>
                  <span className="truncate max-w-[180px] font-bold">{mainFolder ? mainFolder.name : "Mi Unidad"}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50",
                    isDark ? "bg-white text-zinc-950 hover:bg-zinc-200" : "bg-zinc-950 text-white hover:bg-zinc-800"
                  )}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Sincronizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className={cn(
                    "py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer border",
                    isDark ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-zinc-700" : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border-zinc-300"
                  )}
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
          <div className={cn(
            "relative max-w-4xl w-full max-h-[90vh] rounded-3xl overflow-hidden border shadow-2xl flex flex-col",
            isDark ? "bg-[#14141c] border-zinc-700" : "bg-white border-zinc-200"
          )}>
            <div className={cn(
              "p-4 border-b flex items-center justify-between",
              isDark ? "border-zinc-700 bg-zinc-950/90 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-900"
            )}>
              <div className="min-w-0 pr-3">
                <h5 className="font-bold text-sm truncate">{previewPhoto.name}</h5>
                <p className={cn("text-xs font-mono font-medium", isDark ? "text-zinc-400" : "text-zinc-500")}>
                  {previewPhoto.dimensions} • {previewPhoto.size}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, previewPhoto.cdnUrl, previewPhoto.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border",
                    isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                  )}
                >
                  {copiedId === previewPhoto.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
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
                  className={cn(
                    "p-2 rounded-xl transition-colors cursor-pointer border",
                    isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                  )}
                  title="Descargar imagen"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className={cn(
                    "p-2 rounded-xl transition-colors cursor-pointer border",
                    isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                  )}
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
