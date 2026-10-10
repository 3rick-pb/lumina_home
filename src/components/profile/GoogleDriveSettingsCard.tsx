"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Space_Mono } from "next/font/google";
import { motion, AnimatePresence } from "motion/react";
import { ReactLenis, useLenis } from "lenis/react";
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
  ChevronLeft,
  Download,
  Eye,
  Home,
  BarChart2,
  List,
  LayoutGrid,
  FileText,
  Sparkles,
  Maximize2,
  ExternalLink,
  Layers,
  HardDrive,
  Info,
  Image as ImageIcon,
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  AlertTriangle,
  KeyRound,
  Clock
} from "lucide-react";
import { useUserStore } from "@/lib/userStore";
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
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xs transition-colors font-mono text-[11px] select-none",
        isDark
          ? "bg-zinc-900/90 border-zinc-800 text-zinc-200"
          : "bg-white border-zinc-200/90 text-zinc-800"
      )}
      title="Progreso del recorrido de la media rueda"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 -rotate-90 shrink-0" aria-hidden>
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2.5"
          className={isDark ? "stroke-zinc-800" : "stroke-zinc-200"}
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
      <span className="font-bold whitespace-nowrap">
        {percent}%
      </span>
      {percent === 0 ? (
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Inicio</span>
      ) : percent >= 98 ? (
        <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-wider">Fin</span>
      ) : null}
    </div>
  );
});

// Observador reactivo de progreso de scroll contenido para beUI Lenis
const CanvasScrollWatcher = React.memo(function CanvasScrollWatcher({
  onProgress,
}: {
  onProgress: (pct: number) => void;
}) {
  useLenis((lenis) => {
    const rawPct = (lenis.progress ?? 0) * 100;
    const pct = Math.min(100, Math.max(0, Math.round(rawPct)));
    onProgress(pct);
  });
  return null;
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

  const handleClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsOpen(true);
    setTimeout(() => {
      onClick();
    }, 180);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsOpen(false);
      }}
      className={cn(
        "group flex flex-col items-center justify-center cursor-pointer select-none py-1.5 px-1 w-full max-w-[200px] transition-all",
        isHovered || isOpen ? "relative z-40" : "relative z-10"
      )}
    >
      {/* Solo la carpeta de rareUI libre: tamaño sm compacto para no colisionar con las demás */}
      <div className="relative flex items-center justify-center overflow-visible">
        <FolderComponent 
          color="blue" 
          size="sm" 
          isHovered={isHovered}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          onClick={handleClick}
        />
      </div>

      {/* Solo el nombre de la carpeta abajo con Space Mono */}
      <div className="text-center mt-3 max-w-[170px] w-full">
        <h5 
          className={cn(
            "font-bold text-xs sm:text-sm truncate px-1 transition-colors font-mono tracking-tight",
            isSelected || isOpen 
              ? "text-blue-500 dark:text-blue-400" 
              : isDark 
                ? "text-zinc-200 group-hover:text-blue-400" 
                : "text-zinc-900 group-hover:text-blue-600"
          )} 
          title={folder.name}
        >
          {folder.name}
        </h5>
        {folder.itemCount !== undefined && folder.itemCount > 0 && (
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono block mt-0.5">
            {folder.itemCount} {folder.itemCount === 1 ? 'foto' : 'fotos'}
          </span>
        )}
      </div>
    </div>
  );
});

// Función criptográfica SHA-256 para PIN de seguridad de 6 dígitos
async function hashSecurityPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`lumina_gallery_pin_salt_2026_${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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

  const { mode } = useThemeStore();
  const isDark = getResolvedTheme(mode) === "dark";

  const [activeRailTab, setActiveRailTab] = useState<'home' | 'stats'>('home');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchFilter, setSearchFilter] = useState("");
  const [arcProgressPercent, setArcProgressPercent] = useState(0);
  const [contentScrollPercent, setContentScrollPercent] = useState(0);

  // --- SEGURIDAD: PIN DE 6 DÍGITOS EXCLUSIVO DE ADMINISTRADOR ---
  const { user } = useUserStore();
  const isAdmin = Boolean(user && (user.role === 'ADMIN' || user.isRootAdmin === true));

  const [savedPinHash, setSavedPinHash] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState(0);

  // Estados UI Candado y Barras
  const [showAdminPinMenu, setShowAdminPinMenu] = useState(false);
  const [showUnlockBar, setShowUnlockBar] = useState(false);
  const [isLockWiggling, setIsLockWiggling] = useState(false);
  const [unlockPinDigits, setUnlockPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [isPasscodeShaking, setIsPasscodeShaking] = useState(false);
  const unlockInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Estados Formulario Admin
  const [adminPinMode, setAdminPinMode] = useState<'view' | 'create' | 'change' | 'remove'>('view');
  const [adminNewPin, setAdminNewPin] = useState("");
  const [adminConfirmPin, setAdminConfirmPin] = useState("");
  const [adminCurrentPin, setAdminCurrentPin] = useState("");
  const [adminFormError, setAdminFormError] = useState<string | null>(null);
  const [adminFormSuccess, setAdminFormSuccess] = useState<string | null>(null);

  // Inicialización de PIN y Bloqueo desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lumina_gallery_pin_hash");
      if (stored) {
        setSavedPinHash(stored);
        setIsLocked(true); // Bloqueado por defecto si existe PIN configurado
      }
      const storedLockout = localStorage.getItem("lumina_gallery_lockout_until");
      if (storedLockout) {
        const until = parseInt(storedLockout, 10);
        if (!isNaN(until) && until > Date.now()) {
          setLockoutUntil(until);
        } else {
          localStorage.removeItem("lumina_gallery_lockout_until");
        }
      }
    } catch {
      // Ignorar errores en navegadores restrictivos
    }
  }, []);

  // Temporizador para el bloqueo de 10 minutos
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemainingSec(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemainingSec(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        try {
          localStorage.removeItem("lumina_gallery_lockout_until");
        } catch {}
      }
    }, 1000);

    const initial = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
    setLockoutRemainingSec(initial);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Animación del candado y apertura de barra horizontal de PIN
  const triggerLockAnimation = useCallback(() => {
    setIsLockWiggling(true);
    setShowUnlockBar(true);
    setTimeout(() => {
      setIsLockWiggling(false);
    }, 800);
    setTimeout(() => {
      unlockInputRefs.current[0]?.focus();
    }, 150);
  }, []);

  // Clic en el botón del Candado Rojo
  const handlePadlockClick = () => {
    if (!savedPinHash) {
      if (isAdmin) {
        setAdminPinMode('create');
        setAdminNewPin("");
        setAdminConfirmPin("");
        setAdminFormError(null);
        setAdminFormSuccess(null);
        setShowAdminPinMenu((prev) => !prev);
      } else {
        setShowUnlockBar(false);
        setUnlockError("Solo el Administrador puede configurar el PIN de seguridad.");
        setTimeout(() => setUnlockError(null), 3000);
      }
      return;
    }

    if (isLocked) {
      triggerLockAnimation();
      setShowAdminPinMenu(false);
    } else {
      if (isAdmin) {
        setAdminPinMode('view');
        setAdminFormError(null);
        setAdminFormSuccess(null);
        setShowAdminPinMenu((prev) => !prev);
      }
    }
  };

  // Manejo de dígitos en la Barra Horizontal de Desbloqueo
  const handleUnlockDigitChange = async (index: number, val: string) => {
    if (lockoutRemainingSec > 0) return;
    const clean = val.replace(/\D/g, "").slice(-1);
    const nextDigits = [...unlockPinDigits];
    nextDigits[index] = clean;
    setUnlockPinDigits(nextDigits);
    setUnlockError(null);

    if (clean && index < 5) {
      unlockInputRefs.current[index + 1]?.focus();
    }

    if (clean && index === 5 && nextDigits.every((d) => d !== "")) {
      const fullPin = nextDigits.join("");
      await handleVerifyUnlockPin(fullPin);
    }
  };

  const handleUnlockKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !unlockPinDigits[index] && index > 0) {
      unlockInputRefs.current[index - 1]?.focus();
    }
  };

  const handleUnlockPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (lockoutRemainingSec > 0) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      setUnlockPinDigits(digits);
      await handleVerifyUnlockPin(pasted);
    }
  };

  const handleVerifyUnlockPin = async (fullPin: string) => {
    if (!savedPinHash) return;
    if (lockoutUntil && Date.now() < lockoutUntil) return;

    const hashed = await hashSecurityPin(fullPin);
    if (hashed === savedPinHash) {
      // APROBADO: Se desbloquea
      setUnlockSuccess(true);
      setUnlockError(null);
      setFailedAttempts(0);
      setTimeout(() => {
        setIsLocked(false);
        setShowUnlockBar(false);
        setUnlockSuccess(false);
        setUnlockPinDigits(["", "", "", "", "", ""]);
      }, 400);
    } else {
      // INCORRECTO: Efecto de rebote elástico tipo Apple, cambio de color a error y reseteo
      const nextCount = failedAttempts + 1;
      setFailedAttempts(nextCount);
      setIsPasscodeShaking(true);
      setUnlockError("Código incorrecto");

      // Al 3er intento fallido: Bloqueo de 10 minutos
      if (nextCount >= 3) {
        const lockoutTime = Date.now() + 10 * 60 * 1000;
        setLockoutUntil(lockoutTime);
        try {
          localStorage.setItem("lumina_gallery_lockout_until", String(lockoutTime));
        } catch {}
      }

      // Tras el rebote de resorte (550ms), limpiar dígitos y refocalizar la primera casilla
      setTimeout(() => {
        setIsPasscodeShaking(false);
        setUnlockPinDigits(["", "", "", "", "", ""]);
        unlockInputRefs.current[0]?.focus();
      }, 550);
    }
  };

  // Guardar nuevo PIN (Admin)
  const handleAdminSaveNewPin = async () => {
    if (!isAdmin) return;
    if (adminNewPin.length !== 6 || !/^\d{6}$/.test(adminNewPin)) {
      setAdminFormError("El PIN debe tener exactamente 6 dígitos numéricos.");
      return;
    }
    if (adminNewPin !== adminConfirmPin) {
      setAdminFormError("Los PINs no coinciden.");
      return;
    }

    const hashed = await hashSecurityPin(adminNewPin);
    try {
      localStorage.setItem("lumina_gallery_pin_hash", hashed);
      setSavedPinHash(hashed);
      setIsLocked(true);
      setAdminFormSuccess("PIN guardado y activado.");
      setAdminFormError(null);
      setTimeout(() => {
        setShowAdminPinMenu(false);
        setAdminPinMode('view');
        setAdminNewPin("");
        setAdminConfirmPin("");
      }, 1000);
    } catch {
      setAdminFormError("Error al guardar en el navegador.");
    }
  };

  // Cambiar PIN existente (Admin)
  const handleAdminChangePin = async () => {
    if (!isAdmin || !savedPinHash) return;
    const currentHashed = await hashSecurityPin(adminCurrentPin);
    if (currentHashed !== savedPinHash) {
      setAdminFormError("El PIN actual no es correcto.");
      return;
    }
    if (adminNewPin.length !== 6 || !/^\d{6}$/.test(adminNewPin)) {
      setAdminFormError("El nuevo PIN debe tener exactamente 6 dígitos numéricos.");
      return;
    }
    if (adminNewPin !== adminConfirmPin) {
      setAdminFormError("Los nuevos PINs no coinciden.");
      return;
    }

    const newHashed = await hashSecurityPin(adminNewPin);
    try {
      localStorage.setItem("lumina_gallery_pin_hash", newHashed);
      setSavedPinHash(newHashed);
      setAdminFormSuccess("PIN actualizado con éxito.");
      setAdminFormError(null);
      setTimeout(() => {
        setShowAdminPinMenu(false);
        setAdminPinMode('view');
        setAdminCurrentPin("");
        setAdminNewPin("");
        setAdminConfirmPin("");
      }, 1000);
    } catch {
      setAdminFormError("Error al guardar el nuevo PIN.");
    }
  };

  // Quitar / Eliminar PIN (Admin)
  const handleAdminRemovePin = async () => {
    if (!isAdmin) return;
    try {
      localStorage.removeItem("lumina_gallery_pin_hash");
      localStorage.removeItem("lumina_gallery_lockout_until");
      setSavedPinHash(null);
      setIsLocked(false);
      setLockoutUntil(null);
      setFailedAttempts(0);
      setAdminFormSuccess("PIN eliminado. Seguridad desactivada.");
      setTimeout(() => {
        setShowAdminPinMenu(false);
        setAdminPinMode('view');
      }, 1000);
    } catch {
      setAdminFormError("Error al eliminar el PIN.");
    }
  };

  // Lightbox / Visor HD
  const [previewPhoto, setPreviewPhoto] = useState<GoogleDriveFile | null>(null);

  // Responsividad de la Media Rueda (ArcPicker) en móviles
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [showMobileWheel, setShowMobileWheel] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Estado local para el valor activo del ArcPicker (evita saltos/bloqueos al hacer scroll)
  const [activeArcFolderId, setActiveArcFolderId] = useState<string>(settings.selectedFolderId || "root");
  const debouncedSelectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estado interactivo de desenfoque / enfoque exclusivo para la rueda (ArcPicker):
  // Desenfocado/opaco en reposo (blur 4px, opacidad 0.42), enfocado nítido al pasar cursor o interactuar en táctil
  const [isWheelHovered, setIsWheelHovered] = useState(false);
  const [isWheelTouched, setIsWheelTouched] = useState(false);
  const wheelTouchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activateTouchWheelFocus = useCallback(() => {
    if (wheelTouchTimerRef.current) {
      clearTimeout(wheelTouchTimerRef.current);
    }
    setIsWheelTouched(true);
  }, []);

  const handleTouchWheelSettle = useCallback(() => {
    if (wheelTouchTimerRef.current) {
      clearTimeout(wheelTouchTimerRef.current);
    }
    wheelTouchTimerRef.current = setTimeout(() => {
      setIsWheelTouched(false);
    }, 650);
  }, []);

  const isWheelFocused = isWheelHovered || isWheelTouched;

  // Manejador del porcentaje de scroll del canvas de contenido
  const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const maxScroll = target.scrollHeight - target.clientHeight;
    if (maxScroll <= 0) {
      setContentScrollPercent(0);
      return;
    }
    const pct = Math.min(100, Math.max(0, Math.round((target.scrollTop / maxScroll) * 100)));
    setContentScrollPercent(pct);
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  // Al cerrar sesión o desconectar, el contador de porcentaje cambia automáticamente a 0%
  useEffect(() => {
    if (!settings.isConnected) {
      setArcProgressPercent(0);
      setContentScrollPercent(0);
    }
  }, [settings.isConnected]);

  // Al cambiar de directorio, resetear el porcentaje de scroll del canvas
  useEffect(() => {
    setContentScrollPercent(0);
  }, [settings.selectedFolderId]);

  // Sincronizar activeArcFolderId cuando el store se actualice externamente (solo si no hay interacción activa)
  useEffect(() => {
    if (settings.selectedFolderId && !debouncedSelectRef.current) {
      setActiveArcFolderId(settings.selectedFolderId);
    }
  }, [settings.selectedFolderId]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (debouncedSelectRef.current) {
        clearTimeout(debouncedSelectRef.current);
      }
      if (wheelTouchTimerRef.current) {
        clearTimeout(wheelTouchTimerRef.current);
      }
    };
  }, []);

  // Confirmar y cargar archivos solo cuando el usuario se queda quieto
  const commitFolderSelection = useCallback((val: string) => {
    if (debouncedSelectRef.current) {
      clearTimeout(debouncedSelectRef.current);
      debouncedSelectRef.current = null;
    }
    // Si ya está seleccionada y cargada esta misma carpeta, no reiniciar fetch
    if (val === settings.selectedFolderId) {
      return;
    }

    if (val === "root") {
      selectFolder("root", "Mi Unidad");
    } else {
      const target = (settings.availableFolders || []).find((f) => f.id === val);
      if (target) {
        selectFolder(target.id, target.name);
      }
    }
  }, [settings.selectedFolderId, settings.availableFolders, selectFolder]);

  // Selección inmediata (para clics directos en carpetas o botones)
  const handleSelectFolderImmediate = useCallback(async (folder: GoogleDriveFolder) => {
    if (debouncedSelectRef.current) {
      clearTimeout(debouncedSelectRef.current);
      debouncedSelectRef.current = null;
    }
    setActiveArcFolderId(folder.id);
    await selectFolder(folder.id, folder.name);
  }, [selectFolder]);

  // Manejo de cambio en ArcPicker: durante el desplazamiento rápido no recarga archivos hasta frenar
  const handleArcValueChange = useCallback((val: string) => {
    if (savedPinHash && isLocked) {
      triggerLockAnimation();
      return;
    }
    activateTouchWheelFocus();
    setActiveArcFolderId(val);
    if (debouncedSelectRef.current) {
      clearTimeout(debouncedSelectRef.current);
    }
    // Esperar a que el usuario se quede quieto durante 500ms antes de cargar contenido
    debouncedSelectRef.current = setTimeout(() => {
      commitFolderSelection(val);
    }, 500);
  }, [commitFolderSelection, activateTouchWheelFocus, savedPinHash, isLocked, triggerLockAnimation]);

  // Cuando el movimiento de la media rueda o drag se detiene completamente en una carpeta
  const handleArcSettle = useCallback((val: string) => {
    if (savedPinHash && isLocked) {
      triggerLockAnimation();
      return;
    }
    handleTouchWheelSettle();
    setActiveArcFolderId(val);
    if (debouncedSelectRef.current) {
      clearTimeout(debouncedSelectRef.current);
    }
    // Margen de 180ms tras frenar para confirmar que no girará otro notch inmediatamente
    debouncedSelectRef.current = setTimeout(() => {
      commitFolderSelection(val);
    }, 180);
  }, [commitFolderSelection, handleTouchWheelSettle, savedPinHash, isLocked, triggerLockAnimation]);

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
    if (!settings.isConnected) {
      return [];
    }
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
  }, [availableFolders, searchFilter, settings.isConnected]);

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

  // Navegación de teclado en Visor HD (Escape, Flecha Izq / Der)
  useEffect(() => {
    if (!previewPhoto) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewPhoto(null);
      } else if (e.key === "ArrowRight") {
        const currIdx = filteredFiles.findIndex((f) => f.id === previewPhoto.id);
        if (currIdx !== -1 && currIdx < filteredFiles.length - 1) {
          setPreviewPhoto(filteredFiles[currIdx + 1]);
        }
      } else if (e.key === "ArrowLeft") {
        const currIdx = filteredFiles.findIndex((f) => f.id === previewPhoto.id);
        if (currIdx > 0) {
          setPreviewPhoto(filteredFiles[currIdx - 1]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewPhoto, filteredFiles]);

  const renderAdminPinMenuBody = () => (
    <>
      {/* Header del menú estilo Apple */}
      <div className="flex items-center justify-between pb-3.5 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
              Seguridad de Galería
            </h4>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5 leading-none">
              Código de acceso · Administrador
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdminPinMenu(false)}
          className="w-6 h-6 rounded-full bg-zinc-200/50 hover:bg-zinc-200 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer active:scale-95"
          title="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mensajes de error / éxito */}
      {adminFormError && (
        <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium leading-tight flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{adminFormError}</span>
        </div>
      )}
      {adminFormSuccess && (
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium leading-tight flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>{adminFormSuccess}</span>
        </div>
      )}

      {/* Contenido según el modo */}
      {!savedPinHash || adminPinMode === 'create' ? (
        /* MODO: CREAR PIN NUEVO */
        <div className="mt-3.5 space-y-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Establece un código numérico de 6 dígitos para restringir el cambio de carpetas, el gestor lateral y la desconexión de cuenta.
          </p>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
              Nuevo código (6 dígitos)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={adminNewPin}
              onChange={(e) => setAdminNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className={cn(
                "w-full px-3.5 py-2 rounded-xl border text-center text-base tracking-[0.4em] font-medium outline-none transition-all",
                isDark 
                  ? "bg-zinc-800/80 border-white/10 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                  : "bg-white border-black/10 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
              Confirmar código
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={adminConfirmPin}
              onChange={(e) => setAdminConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className={cn(
                "w-full px-3.5 py-2 rounded-xl border text-center text-base tracking-[0.4em] font-medium outline-none transition-all",
                isDark 
                  ? "bg-zinc-800/80 border-white/10 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                  : "bg-white border-black/10 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              )}
            />
          </div>
          <button
            type="button"
            onClick={handleAdminSaveNewPin}
            disabled={adminNewPin.length !== 6 || adminConfirmPin.length !== 6}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium tracking-normal transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Guardar y Proteger
          </button>
        </div>
      ) : adminPinMode === 'change' ? (
        /* MODO: CAMBIAR PIN */
        <div className="mt-3.5 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
              Código actual (6 dígitos)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={adminCurrentPin}
              onChange={(e) => setAdminCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className={cn(
                "w-full px-3.5 py-2 rounded-xl border text-center text-base tracking-[0.4em] font-medium outline-none transition-all",
                isDark 
                  ? "bg-zinc-800/80 border-white/10 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                  : "bg-white border-black/10 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
              Nuevo código (6 dígitos)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={adminNewPin}
              onChange={(e) => setAdminNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className={cn(
                "w-full px-3.5 py-2 rounded-xl border text-center text-base tracking-[0.4em] font-medium outline-none transition-all",
                isDark 
                  ? "bg-zinc-800/80 border-white/10 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                  : "bg-white border-black/10 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
              Confirmar nuevo código
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={adminConfirmPin}
              onChange={(e) => setAdminConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className={cn(
                "w-full px-3.5 py-2 rounded-xl border text-center text-base tracking-[0.4em] font-medium outline-none transition-all",
                isDark 
                  ? "bg-zinc-800/80 border-white/10 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                  : "bg-white border-black/10 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              )}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setAdminPinMode('view');
                setAdminFormError(null);
              }}
              className="flex-1 py-2 px-3 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdminChangePin}
              disabled={adminCurrentPin.length !== 6 || adminNewPin.length !== 6 || adminConfirmPin.length !== 6}
              className="flex-1 py-2 px-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 text-white text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              Actualizar
            </button>
          </div>
        </div>
      ) : adminPinMode === 'remove' ? (
        /* MODO: QUITAR PIN */
        <div className="mt-3.5 space-y-3">
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-1.5">
            <div className="font-semibold flex items-center gap-2 text-[13px]">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>¿Desactivar código?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              Cualquier usuario podrá usar el gestor de carpetas, alternar la carpeta activa o desconectar la cuenta sin restricciones.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAdminPinMode('view')}
              className="flex-1 py-2 px-3 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdminRemovePin}
              className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              Confirmar Quitar
            </button>
          </div>
        </div>
      ) : (
        /* MODO: VISTA GENERAL (VIEW) - Apple Inset Grouped */
        <div className="mt-3 space-y-2.5">
          {/* Status Card Apple Inset */}
          <div className={cn(
            "p-3 rounded-2xl border flex items-center justify-between transition-colors",
            isDark ? "bg-white/[0.04] border-white/8" : "bg-black/[0.03] border-black/6"
          )}>
            <div className="flex items-center gap-2.5">
              <span className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                isLocked 
                  ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                  : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              )} />
              <div>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 block leading-tight">
                  {isLocked ? "Galería protegida" : "Acceso libre"}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block leading-tight mt-0.5">
                  {isLocked ? "Bloqueado actualmente" : "Desbloqueado actualmente"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsLocked(!isLocked);
                setShowAdminPinMenu(false);
              }}
              className={cn(
                "text-[11px] font-medium px-3 py-1 rounded-full transition-all cursor-pointer active:scale-95",
                isLocked
                  ? "bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 shadow-xs"
                  : "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20"
              )}
            >
              {isLocked ? "Desbloquear" : "Bloquear"}
            </button>
          </div>

          {/* Lista Inset Grouped de Acciones Apple */}
          <div className={cn(
            "rounded-2xl border overflow-hidden divide-y transition-colors",
            isDark 
              ? "bg-white/[0.04] border-white/8 divide-white/6" 
              : "bg-black/[0.03] border-black/6 divide-black/6"
          )}>
            <button
              type="button"
              onClick={() => {
                setAdminPinMode('change');
                setAdminCurrentPin("");
                setAdminNewPin("");
                setAdminConfirmPin("");
                setAdminFormError(null);
              }}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-500 transition-colors">
                  Cambiar código de acceso
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            </button>
            <button
              type="button"
              onClick={() => {
                setAdminPinMode('remove');
                setAdminFormError(null);
              }}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-red-500/[0.06] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500 group-hover:text-red-600 transition-colors" />
                <span className="text-xs font-medium text-red-600 dark:text-red-400 group-hover:text-red-500 transition-colors">
                  Desactivar código de acceso
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-red-400/60" />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div 
      data-lenis-prevent="true"
      className={cn(
        "w-full flex flex-col md:flex-row h-[88vh] max-h-[840px] rounded-[2rem] shadow-2xl overflow-hidden select-none border transition-colors duration-300 relative",
        isDark 
          ? "bg-[#0a0a0f] text-zinc-100 border-zinc-800/80 shadow-[0_25px_70px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.06)]" 
          : "bg-[#fafafc] text-zinc-900 border-zinc-200/90 shadow-[0_25px_60px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)]",
        spaceMono.className
      )}
    >
      {/* Botón Flotante Maestro Exterior de Cierre (Always accessible on Mobile, Tablets & Desktop) */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "md:hidden absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-[70] w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer active:scale-90 shadow-xl backdrop-blur-2xl select-none",
            isDark
              ? "bg-[#1c1c1e]/90 hover:bg-[#2c2c2e] active:bg-black text-white border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
              : "bg-white/95 hover:bg-zinc-100 active:bg-zinc-200 text-zinc-900 border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
          )}
          style={{ touchAction: "manipulation" }}
          title="Cerrar galería (Esc)"
          aria-label="Cerrar galería"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-current" />
        </button>
      )}
      
      {/* 1. RAIL DE ICONOS VERTICAL (IZQUIERDA EXTREMA) */}
      <div className={cn(
        "hidden lg:flex w-14 shrink-0 flex-col items-center justify-between py-5 border-r transition-colors duration-200 relative z-50",
        isDark ? "bg-[#0e0e14] border-zinc-800/80" : "bg-zinc-100/80 border-zinc-200/80"
      )}>
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Navegación del Rail */}
          <div className="flex flex-col items-center gap-2 relative">
            {/* Home / Inicio */}
            <button
              type="button"
              onClick={handleHomeClick}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90",
                activeRailTab === 'home' && !showStatsModal
                  ? isDark 
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_14px_rgba(59,130,246,0.25)]" 
                    : "bg-blue-50 text-blue-600 border border-blue-200 shadow-sm"
                  : isDark 
                    ? "text-zinc-400 hover:text-white hover:bg-white/5" 
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70"
              )}
              title="Inicio: Ver todas las carpetas de Mi Unidad"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* Panel de Estadísticas */}
            <button
              type="button"
              onClick={handleStatsClick}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90",
                showStatsModal
                  ? isDark 
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_14px_rgba(59,130,246,0.25)]" 
                    : "bg-blue-50 text-blue-600 border border-blue-200 shadow-sm"
                  : isDark 
                    ? "text-zinc-400 hover:text-white hover:bg-white/5" 
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70"
              )}
              title="Estadísticas de multimedia"
            >
              <BarChart2 className="w-4 h-4" />
            </button>

            {/* Candado Rojo de Seguridad (PIN de 6 dígitos) */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={handlePadlockClick}
                animate={isLockWiggling ? {
                  x: [0, -6, 6, -5, 5, -2, 2, 0],
                  rotate: [0, -9, 9, -7, 7, -3, 3, 0],
                  scale: [1, 1.15, 1.05, 1.12, 1],
                } : {}}
                transition={{ duration: 0.65, ease: "easeInOut" }}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 relative",
                  savedPinHash
                    ? isLocked
                      ? "bg-red-500/10 text-red-500 border border-red-500/30 shadow-[0_0_14px_rgba(239,68,68,0.25)] hover:bg-red-500/15"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-black/5 dark:border-white/10 hover:text-red-500 shadow-xs"
                    : isDark
                      ? "text-zinc-400 hover:text-red-400 hover:bg-white/5 border border-transparent"
                      : "text-zinc-500 hover:text-red-500 hover:bg-zinc-200/70 border border-transparent"
                )}
                title={
                  savedPinHash
                    ? isLocked
                      ? "Galería Bloqueada con PIN (Click para ingresar PIN)"
                      : "Galería Desbloqueada (Click para administrar PIN)"
                    : isAdmin
                      ? "Establecer PIN de Seguridad (Exclusivo Administrador)"
                      : "PIN de Seguridad (Solo Administrador)"
                }
              >
                {savedPinHash ? (
                  isLocked ? (
                    <Lock className="w-4 h-4 text-red-500" />
                  ) : (
                    <Unlock className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                  )
                ) : (
                  <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                )}

                {/* Punto indicador de candado activo */}
                {savedPinHash && isLocked && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0e0e14]" />
                )}
              </motion.button>

              {/* Menú hacia la derecha que sale desde el botón (Desktop) */}
              <div className="hidden lg:block">
                <AnimatePresence>
                  {showAdminPinMenu && isAdmin && (
                    <motion.div
                      initial={{ opacity: 0, x: -8, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -8, scale: 0.96 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "absolute left-full top-0 ml-3.5 w-80 rounded-[22px] border shadow-2xl p-4 z-50 backdrop-blur-3xl font-sans antialiased select-none transition-all",
                        isDark 
                          ? "bg-[#1c1c1e]/95 border-white/10 text-white shadow-[0_24px_60px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)]" 
                          : "bg-white/95 border-black/10 text-zinc-900 shadow-[0_24px_60px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.04)]"
                      )}
                    >
                      {renderAdminPinMenuBody()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Estado inferior de cuenta con pulso de sincronización */}
        {settings.isConnected && (
          <div className="relative">
            <div className={cn(
              "w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs uppercase font-mono transition-transform hover:scale-105",
              isDark ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-white border-zinc-300 text-zinc-800 shadow-xs"
            )} title={settings.accountEmail || "Conectado"}>
              {settings.accountEmail ? settings.accountEmail.charAt(0) : "C"}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0e0e14] animate-pulse" />
          </div>
        )}
      </div>

      {/* 2. PANEL LATERAL: GESTOR DE CARPETAS (beUI Arc Picker) */}
      <div 
        data-lenis-prevent="true"
        className={cn(
          "w-full md:w-72 lg:w-80 shrink-0 flex-col border-b md:border-b-0 md:border-r relative z-30 overflow-visible",
          !showMobileWheel ? "hidden md:flex" : "flex",
          isDark ? "bg-[#0e0e14]/90 border-zinc-800/80" : "bg-zinc-50/90 border-zinc-200/80"
        )}
      >
        {/* Cabecera del Sidebar con título y Scroll Progress */}
        <div className="p-3 sm:p-5 pb-2.5 sm:pb-3 space-y-2.5 sm:space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className={cn(
                "font-bold text-xs uppercase tracking-widest font-mono",
                isDark ? "text-zinc-300" : "text-zinc-700"
              )}>
                CARPETAS DE DRIVE
              </h3>
            </div>
            <ArcScrollProgress percent={settings.isConnected ? arcProgressPercent : 0} isDark={isDark} />
          </div>

          {/* Buscador de carpetas con alineación y simetría perfecta */}
          <div className="relative flex items-center w-full">
            <div className="absolute left-3 inset-y-0 flex items-center justify-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar carpetas..."
              className={cn(
                "w-full pl-9 pr-8 h-8 sm:h-9 rounded-xl border text-xs font-mono transition-all duration-200 outline-none flex items-center",
                isDark 
                  ? "bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30" 
                  : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-xs"
              )}
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 inset-y-0 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer active:scale-90"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* beUI Arc Picker en modo Right con fondo ambiental y desenfoque/enfoque suave interactivo */}
        <div 
          className="flex-1 flex flex-col items-center justify-center p-1 sm:p-2 relative overflow-visible z-30 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_75%)]"
          onMouseEnter={() => {
            if (!isLocked) setIsWheelHovered(true);
          }}
          onMouseLeave={() => setIsWheelHovered(false)}
          onTouchStart={() => {
            if (savedPinHash && isLocked) {
              triggerLockAnimation();
            } else {
              activateTouchWheelFocus();
            }
          }}
          onTouchMove={activateTouchWheelFocus}
          onTouchEnd={handleTouchWheelSettle}
          onPointerDown={() => {
            if (savedPinHash && isLocked) {
              triggerLockAnimation();
            } else {
              activateTouchWheelFocus();
            }
          }}
          onPointerUp={handleTouchWheelSettle}
        >
          {/* Overlay de Bloqueo PIN con Candado Rojo */}
          {savedPinHash && isLocked && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                triggerLockAnimation();
              }}
              className="absolute inset-0 z-30 cursor-pointer flex flex-col items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-[2px] transition-all"
              title="Gestor bloqueado con PIN. Haz clic para ingresar el código"
            >
              <div className="px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#1c1c1e]/90 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white shadow-xl flex items-center gap-2 font-sans antialiased text-xs font-medium backdrop-blur-2xl transition-all">
                <Lock className="w-3.5 h-3.5 text-red-500" />
                <span>Bloqueado con código</span>
              </div>
            </div>
          )}
          {arcOptions.length === 0 ? (
            <div className="text-center p-4 sm:p-6 space-y-2">
              <Folder className="w-8 h-8 mx-auto text-zinc-500 opacity-40" />
              <p className="text-xs text-zinc-500 font-mono">
                No se encontraron carpetas
              </p>
            </div>
          ) : (
            <div 
              className="w-full flex-1 flex flex-col items-center justify-center transition-[filter,opacity] duration-300 ease-out will-change-[filter,opacity]"
              style={{
                filter: isWheelFocused ? "blur(0px)" : "blur(4px)",
                opacity: isWheelFocused ? 1 : 0.42,
                transition: "filter 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <ArcPicker
                options={arcOptions}
                value={activeArcFolderId}
                onValueChange={handleArcValueChange}
                onProgressChange={(p) => {
                  setArcProgressPercent(p);
                }}
                onSettle={(val) => {
                  handleArcSettle(val);
                  handleTouchWheelSettle();
                }}
                side="right"
                radius={isMobileScreen ? 165 : 240}
                itemHeight={isMobileScreen ? 36 : 44}
                visibleCount={isMobileScreen ? 5 : 7}
                className={cn("w-full transition-all", isMobileScreen ? "h-[200px]" : "h-[380px]")}
              />
            </div>
          )}
        </div>

        {/* Pie del Sidebar: Información de carpeta activa y cuenta */}
        <div className={cn(
          "p-3 sm:p-3.5 border-t text-xs flex flex-wrap items-center justify-between gap-2 backdrop-blur-md",
          isDark ? "border-zinc-800/80 bg-[#0c0c12]/80 text-zinc-300" : "border-zinc-200/80 bg-zinc-100/80 text-zinc-700"
        )}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span className="truncate font-semibold font-mono text-[11px]">
              {mainFolder ? mainFolder.name : "Mi Unidad"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded-md font-bold tracking-tight border whitespace-nowrap",
              isDark 
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                : "bg-blue-50 text-blue-600 border-blue-200"
            )}>
              {mainFolder ? `${currentFolderFiles.length} fotos` : `${rootFolders.length} carpetas`}
            </span>

            {settings.isConnected && (
              <button
                type="button"
                onClick={() => {
                  if (savedPinHash && isLocked) {
                    triggerLockAnimation();
                    return;
                  }
                  disconnectAccount();
                }}
                className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer active:scale-90"
                title={savedPinHash && isLocked ? "Desconexión protegida con PIN" : "Desconectar cuenta"}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. ÁREA DE CONTENIDO PRINCIPAL (CANVAS DERECHO) */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden relative z-20 transition-colors duration-200",
        isDark ? "bg-[#0a0a0f]" : "bg-white"
      )}>
        
        {/* Barra Superior del Canvas Principal (Apple Glass Bar) */}
        <div className={cn(
          "px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b flex items-center justify-between gap-2 sm:gap-4 shrink-0 backdrop-blur-xl sticky top-0 z-30 transition-colors duration-200 pr-12 sm:pr-14 md:pr-6",
          isDark ? "bg-[#0a0a0f]/85 border-zinc-800/80 text-white" : "bg-white/80 border-zinc-200/80 text-zinc-900"
        )}>
          {/* Breadcrumb / Navegación */}
          <div className="flex items-center gap-2 min-w-0 font-mono">
            {mainFolder ? (
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (savedPinHash && isLocked) {
                      triggerLockAnimation();
                      return;
                    }
                    handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length });
                  }}
                  className={cn(
                    "text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 active:scale-95 shrink-0",
                    isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-950"
                  )}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Mi Unidad</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                <span className={cn(
                  "text-xs sm:text-sm font-bold truncate max-w-[180px] sm:max-w-[280px]",
                  isDark ? "text-white" : "text-zinc-950"
                )}>
                  {mainFolder.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (savedPinHash && isLocked) {
                      triggerLockAnimation();
                      return;
                    }
                    handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length });
                  }}
                  className={cn(
                    "ml-1.5 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border active:scale-95 flex items-center gap-1 font-sans",
                    savedPinHash && isLocked
                      ? "bg-red-500/10 text-red-500 border-red-500/25 hover:bg-red-500/15"
                      : isDark 
                        ? "bg-zinc-800/80 hover:bg-zinc-700 text-blue-400 border-zinc-700/80" 
                        : "bg-zinc-100 hover:bg-zinc-200 text-blue-600 border-zinc-200 shadow-xs"
                  )}
                  title={savedPinHash && isLocked ? "Bloqueado con código (Click para desbloquear)" : "Cambiar carpeta"}
                >
                  {savedPinHash && isLocked && <Lock className="w-2.5 h-2.5 text-red-500 shrink-0" />}
                  <span>Cambiar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center border",
                  isDark ? "bg-zinc-800 border-zinc-700 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600"
                )}>
                  <FolderOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className={cn(
                    "text-xs sm:text-sm font-bold block leading-none",
                    isDark ? "text-white" : "text-zinc-950"
                  )}>
                    Mi Unidad
                  </span>
                  <span className={cn("text-[10px] font-medium leading-none mt-1 block", isDark ? "text-zinc-500" : "text-zinc-400")}>
                    Explorador de recursos
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Acciones de la derecha: Scroll Progress, Sincronizar, Toggle vista, Cerrar */}
          <div className="flex items-center gap-2">
            {settings.isConnected && (
              <ArcScrollProgress percent={contentScrollPercent} isDark={isDark} />
            )}

            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isSyncing}
              className={cn(
                "p-2 rounded-xl border transition-all duration-200 cursor-pointer active:scale-90",
                isDark 
                  ? "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700" 
                  : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 shadow-xs"
              )}
              title="Sincronizar cambios"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing ? "animate-spin text-blue-500" : "")} />
            </button>

            {/* Segmented Control iOS / Linear: Toggle Cuadrícula / Lista */}
            {mainFolder && (
              <div className={cn(
                "p-0.5 rounded-xl border flex items-center transition-colors",
                isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-zinc-100 border-zinc-200"
              )}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95",
                    viewMode === 'grid'
                      ? isDark 
                        ? "bg-white/15 text-white shadow-xs font-bold" 
                        : "bg-white text-zinc-950 shadow-xs font-bold"
                      : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-950"
                  )}
                  title="Vista en Cuadrícula"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95",
                    viewMode === 'list'
                      ? isDark 
                        ? "bg-white/15 text-white shadow-xs font-bold" 
                        : "bg-white text-zinc-950 shadow-xs font-bold"
                      : isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-950"
                  )}
                  title="Vista en Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Botón Móvil para alternar Rueda de Carpetas */}
            <button
              type="button"
              onClick={() => setShowMobileWheel((prev) => !prev)}
              className={cn(
                "md:hidden px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95",
                showMobileWheel
                  ? "bg-blue-600 text-white border-blue-500 shadow-xs"
                  : isDark
                  ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white"
                  : "bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200"
              )}
              title={showMobileWheel ? "Ocultar rueda de carpetas" : "Ver rueda de carpetas"}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{showMobileWheel ? "Ocultar Rueda" : "Rueda"}</span>
            </button>

            {/* Candado Rojo en Móvil/Tablet */}
            <motion.button
              type="button"
              onClick={handlePadlockClick}
              animate={isLockWiggling ? {
                x: [0, -5, 5, -4, 4, -2, 2, 0],
                rotate: [0, -8, 8, -6, 6, -2, 2, 0],
                scale: [1, 1.12, 1.05, 1.1, 1],
              } : {}}
              transition={{ duration: 0.65, ease: "easeInOut" }}
              className={cn(
                "lg:hidden p-2 rounded-xl border transition-all cursor-pointer active:scale-95 relative",
                savedPinHash
                  ? isLocked
                    ? "bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-black/5 dark:border-white/10"
                  : isDark
                    ? "text-zinc-400 border-zinc-800 hover:bg-white/5"
                    : "text-zinc-500 border-zinc-200 hover:bg-zinc-100"
              )}
              title="Seguridad de Galería"
            >
              {savedPinHash ? (
                isLocked ? <Lock className="w-3.5 h-3.5 text-red-500" /> : <Unlock className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              )}
              {savedPinHash && isLocked && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0e0e14]" />
              )}
            </motion.button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "hidden md:flex p-2 rounded-xl border transition-all duration-200 cursor-pointer active:scale-90",
                  isDark 
                    ? "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700" 
                    : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 shadow-xs"
                )}
                title="Cerrar modal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* BARRA HORIZONTAL DE DESBLOQUEO TIPO APPLE 2FA PASSCODE */}
        <AnimatePresence>
          {showUnlockBar && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "overflow-hidden border-b shrink-0 relative z-40 transition-colors shadow-sm font-sans antialiased select-none",
                isDark 
                  ? "bg-[#1c1c1e]/90 backdrop-blur-2xl border-white/10 text-white" 
                  : "bg-white/90 backdrop-blur-2xl border-black/10 text-zinc-900"
              )}
            >
              <div className="px-3 sm:px-7 py-3 sm:py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Lado izquierdo: Icono Squircle Apple + Copy informativo */}
                <div className="flex items-center gap-2.5 sm:gap-3 text-center sm:text-left">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors shadow-xs",
                    isPasscodeShaking || unlockError
                      ? "bg-red-500/10 border-red-500/30 text-red-500"
                      : isDark 
                      ? "bg-zinc-800 border-white/10 text-zinc-300" 
                      : "bg-zinc-100 border-black/5 text-zinc-700"
                  )}>
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-white leading-none">
                      {lockoutRemainingSec > 0 ? "Bloqueo por Seguridad" : "Código de Acceso Requerido"}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-none mt-1">
                      {lockoutRemainingSec > 0 
                        ? "Has excedido los intentos. Espera a que termine la cuenta regresiva."
                        : "Introduce el código de 6 dígitos para desbloquear el gestor."}
                    </p>
                  </div>
                </div>

                {/* Lado derecho: 6 casillas 2FA con efecto rebote tipo Apple o temporizador */}
                {lockoutRemainingSec <= 0 ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                    <motion.div
                      animate={isPasscodeShaking ? {
                        x: [0, -16, 16, -12, 12, -8, 8, -4, 4, 0],
                      } : { x: 0 }}
                      transition={{ duration: 0.52, ease: "easeInOut" }}
                      className="flex items-center gap-1 sm:gap-1.5 md:gap-2 justify-center"
                    >
                      {unlockPinDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { unlockInputRefs.current[idx] = el; }}
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleUnlockDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleUnlockKeyDown(idx, e)}
                          onPaste={handleUnlockPaste}
                          className={cn(
                            "w-8 h-10 sm:w-9 sm:h-11 md:w-10 md:h-12 text-center text-base sm:text-lg font-semibold rounded-xl border outline-none transition-all duration-200",
                            isPasscodeShaking || unlockError
                              ? "border-red-500 bg-red-500/10 text-red-500 ring-4 ring-red-500/15"
                              : unlockSuccess
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-500 ring-4 ring-emerald-500/20 scale-[1.03]"
                              : digit
                              ? isDark
                                ? "bg-zinc-800 border-blue-500/70 text-white ring-2 ring-blue-500/20"
                                : "bg-white border-blue-500/70 text-zinc-900 ring-2 ring-blue-500/15 shadow-xs"
                              : isDark
                              ? "bg-zinc-800/60 border-zinc-700 text-white focus:bg-zinc-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                              : "bg-zinc-100/80 border-zinc-300 text-zinc-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 shadow-xs"
                          )}
                        />
                      ))}
                    </motion.div>

                    {unlockError && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs font-medium text-red-500 ml-1.5 whitespace-nowrap"
                      >
                        Código incorrecto
                      </motion.span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowUnlockBar(false);
                        setUnlockError(null);
                        setUnlockPinDigits(["", "", "", "", "", ""]);
                      }}
                      className="w-7 h-7 rounded-full bg-zinc-200/50 hover:bg-zinc-200 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors ml-2 cursor-pointer active:scale-95"
                      title="Cerrar barra"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  /* BLOQUEO DE 10 MINUTOS CON CUENTA REGRESIVA ESTILO APPLE */
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 shadow-xs">
                      <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" />
                      <span className="font-mono font-medium text-xs tracking-wider">
                        {String(Math.floor(lockoutRemainingSec / 60)).padStart(2, '0')}:{String(lockoutRemainingSec % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUnlockBar(false)}
                      className="w-7 h-7 rounded-full bg-zinc-200/50 hover:bg-zinc-200 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer active:scale-95"
                      title="Cerrar barra"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTENIDO DEL CANVAS */}
        {!settings.isConnected ? (
          /* Pantalla única cuando Google Drive NO está conectado */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className={cn(
              "w-20 h-20 rounded-3xl border flex items-center justify-center shadow-xl transition-transform hover:scale-105",
              isDark 
                ? "bg-[#121219] border-zinc-800 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]" 
                : "bg-blue-50/50 border-blue-200 text-blue-600 shadow-sm"
            )}>
              <FolderOpen className="w-9 h-9" />
            </div>

            <div className="max-w-md space-y-2">
              <h4 className={cn("text-lg font-bold tracking-tight", isDark ? "text-white" : "text-zinc-950")}>
                Conectar Banco de Fotografías
              </h4>
              <p className={cn("text-xs leading-relaxed font-mono", isDark ? "text-zinc-400" : "text-zinc-600")}>
                Vincula tu unidad para explorar carpetas interactivas en 3D y asociar fotografías en alta resolución a tus productos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => connectGoogleOAuth()}
              disabled={isSyncing}
              className={cn(
                "py-3 px-8 rounded-2xl font-bold text-xs tracking-wide shadow-lg transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50",
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
          <ReactLenis 
            root={false}
            key="root"
            onScroll={handleContentScroll}
            className="flex-1 overflow-y-auto pl-6 sm:pl-9 pr-5 sm:pr-7 pt-5 sm:pt-7 pb-8 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain"
            options={{
              lerp: 0.075,
              duration: 1.25,
              easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
              smoothWheel: true,
            }}
          >
            <CanvasScrollWatcher onProgress={setContentScrollPercent} />
            {/* Tarjeta Guía de Alto Nivel (Apple Card) */}
            <div className={cn(
              "p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors",
              isDark 
                ? "bg-[#0e0e16]/80 border-zinc-800/80 shadow-inner" 
                : "bg-zinc-50 border-zinc-200/80 shadow-xs"
            )}>
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                  isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600"
                )}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={cn("text-sm font-bold tracking-tight", isDark ? "text-white" : "text-zinc-950")}>
                    Catálogo de Carpetas en Mi Unidad
                  </h4>
                  <p className={cn("text-xs font-mono mt-0.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Selecciona una carpeta madre, que será usada para abastecer el contenido multimédia como imágenes de productos al editar o agregar un producto nuevo a la tienda.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span className={cn(
                  "text-[11px] font-mono font-bold px-3 py-1 rounded-xl border shadow-xs whitespace-nowrap",
                  isDark 
                    ? "bg-zinc-800/80 border-zinc-700 text-zinc-200" 
                    : "bg-white border-zinc-300 text-zinc-800"
                )}>
                  {rootFolders.length} carpetas detectadas
                </span>
              </div>
            </div>

            {/* Grid de Carpetas 3D de Mi Unidad (Filas de 3, libres y sin desplazamiento en hover) */}
            <div className="space-y-4">
              {rootFolders.length === 0 ? (
                <div className={cn(
                  "p-12 rounded-3xl border text-center space-y-3.5",
                  isDark ? "bg-[#101017] border-zinc-800" : "bg-zinc-50 border-zinc-200"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border",
                    isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-zinc-200 border-zinc-300 text-zinc-700"
                  )}>
                    <Folder className="w-6 h-6" />
                  </div>
                  <p className={cn("text-sm font-bold font-mono", isDark ? "text-white" : "text-zinc-900")}>
                    No se encontraron carpetas en Mi Unidad
                  </p>
                  <p className={cn("text-xs font-mono max-w-sm mx-auto", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Crea carpetas en tu Google Drive o pulsa sincronizar para actualizar la lista.
                  </p>
                  <button
                    type="button"
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className={cn(
                      "py-2.5 px-5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer active:scale-95 shadow-sm",
                      isDark ? "bg-white text-zinc-950 hover:bg-zinc-200" : "bg-zinc-950 text-white hover:bg-zinc-800"
                    )}
                  >
                    {isSyncing ? "Sincronizando..." : "Sincronizar Carpetas"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 sm:gap-x-10 lg:gap-x-12 gap-y-10 sm:gap-y-12 pt-4 sm:pt-6 pb-6 justify-items-center">
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
          </ReactLenis>
        ) : (
          /* PANTALLA DE CARPETA SELECCIONADA: SUBCARPETAS + FOTOGRAFÍAS */
          <ReactLenis 
            root={false}
            key={mainFolder.id}
            onScroll={handleContentScroll}
            className="flex-1 overflow-y-auto pl-6 sm:pl-9 pr-5 sm:pr-7 pt-5 sm:pt-7 pb-8 space-y-7 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain"
            options={{
              lerp: 0.075,
              duration: 1.25,
              easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
              smoothWheel: true,
            }}
          >
            <CanvasScrollWatcher onProgress={setContentScrollPercent} />
            {/* Si tiene subcarpetas, mostrarlas arriba en filas de 3 */}
            {currentSubfolders.length > 0 && (
              <div className="space-y-4">
                <div className={cn("flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b pb-2.5", isDark ? "border-zinc-800/80" : "border-zinc-200/80")}>
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-500" />
                    <h4 className={cn("text-xs sm:text-sm font-bold uppercase tracking-wider font-mono", isDark ? "text-white" : "text-zinc-900")}>
                      Subcarpetas
                    </h4>
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border whitespace-nowrap",
                    isDark ? "text-zinc-300 bg-zinc-800/80 border-zinc-700" : "text-zinc-700 bg-zinc-100 border-zinc-300"
                  )}>
                    {currentSubfolders.length} subcarpetas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 sm:gap-x-10 lg:gap-x-12 gap-y-10 sm:gap-y-12 pt-3 pb-3 justify-items-center">
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
            <div className="space-y-4 pb-6">
              <div className={cn("flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b pb-2.5", isDark ? "border-zinc-800/80" : "border-zinc-200/80")}>
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                  <h4 className={cn("text-xs sm:text-sm font-bold uppercase tracking-wider font-mono truncate max-w-[200px] sm:max-w-none", isDark ? "text-white" : "text-zinc-900")}>
                    Fotografías ({mainFolder.name})
                  </h4>
                </div>
                <span className={cn(
                  "text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border whitespace-nowrap",
                  isDark ? "text-zinc-300 bg-zinc-800/80 border-zinc-700" : "text-zinc-700 bg-zinc-100 border-zinc-300"
                )}>
                  {filteredFiles.length} archivos
                </span>
              </div>

              {filteredFiles.length === 0 ? (
                <div className={cn(
                  "p-12 rounded-3xl border text-center space-y-3",
                  isDark ? "bg-[#101017] border-zinc-800" : "bg-zinc-50 border-zinc-200"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border",
                    isDark ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-zinc-200 border-zinc-300 text-zinc-600"
                  )}>
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className={cn("text-sm font-bold font-mono", isDark ? "text-white" : "text-zinc-900")}>
                    No se encontraron fotografías en esta carpeta
                  </p>
                  <p className={cn("text-xs font-mono max-w-sm mx-auto", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Sube imágenes a esta carpeta en Google Drive o explora otras secciones.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectFolder({ id: 'root', name: 'Mi Unidad', itemCount: rootFolders.length })}
                    className={cn(
                      "py-2 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer active:scale-95 border",
                      isDark ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" : "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100"
                    )}
                  >
                    Volver a Mi Unidad
                  </button>
                </div>
              ) : viewMode === 'list' ? (
                /* TABLA LISTA EDITORIAL DE ALTO CONTRASTE */
                <div className={cn(
                  "rounded-2xl border overflow-hidden",
                  isDark ? "border-zinc-800 bg-[#0e0e15]" : "border-zinc-200 bg-white shadow-xs"
                )}>
                  <div className={cn(
                    "grid grid-cols-12 px-4 py-3 text-[11px] font-bold font-mono uppercase tracking-wider border-b",
                    isDark ? "text-zinc-400 border-zinc-800 bg-[#12121c]" : "text-zinc-600 border-zinc-200 bg-zinc-50"
                  )}>
                    <div className="col-span-7 sm:col-span-5">Archivo</div>
                    <div className="col-span-5 sm:col-span-4">Dimensiones / Peso</div>
                    <div className="hidden sm:block sm:col-span-3 text-right">Acciones</div>
                  </div>

                  <div className={cn("divide-y", isDark ? "divide-zinc-800/80" : "divide-zinc-200")}>
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={cn(
                          "grid grid-cols-12 px-4 py-3 items-center transition-colors duration-150 group text-xs",
                          isDark ? "hover:bg-white/[0.04]" : "hover:bg-zinc-50/80"
                        )}
                      >
                        <div className="col-span-7 sm:col-span-5 flex items-center gap-3 min-w-0 pr-3">
                          <div 
                            onClick={() => setPreviewPhoto(file)}
                            className={cn(
                              "w-9 h-9 rounded-xl border shrink-0 overflow-hidden flex items-center justify-center cursor-pointer relative group/thumb transition-transform hover:scale-105",
                              isDark ? "bg-black border-zinc-800" : "bg-zinc-100 border-zinc-200"
                            )}
                            title="Ver en Visor HD"
                          >
                            {file.thumbnailUrl ? (
                              <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className={cn("w-4 h-4", isDark ? "text-zinc-400" : "text-zinc-500")} />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className={cn(
                              "font-semibold truncate transition-colors font-mono text-xs",
                              isDark ? "text-zinc-200 group-hover:text-blue-400" : "text-zinc-900 group-hover:text-blue-600"
                            )} title={file.name}>
                              {file.name}
                            </p>
                            <p className={cn("text-[10px] font-mono mt-0.5", isDark ? "text-zinc-500" : "text-zinc-400")}>
                              Google Drive CDN
                            </p>
                          </div>
                        </div>

                        <div className="col-span-5 sm:col-span-4 flex items-center gap-2 min-w-0">
                          <span className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded border font-semibold",
                            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-700"
                          )}>
                            {file.dimensions || "Drive HD"}
                          </span>
                          <span className={cn("text-[10px] font-mono", isDark ? "text-zinc-500" : "text-zinc-400")}>
                            {file.size || "Original"}
                          </span>
                        </div>

                        <div className="hidden sm:flex sm:col-span-3 items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(file)}
                            className={cn(
                              "p-1.5 rounded-lg border transition-all cursor-pointer active:scale-90",
                              isDark 
                                ? "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700" 
                                : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100"
                            )}
                            title="Vista previa HD"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {onSelectPhotoForProduct && (
                            <button
                              type="button"
                              onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                              className={cn(
                                "px-3 py-1 rounded-lg font-bold text-xs font-mono transition-all cursor-pointer active:scale-95 shadow-xs flex items-center gap-1",
                                isDark 
                                  ? "bg-white text-zinc-950 hover:bg-zinc-200" 
                                  : "bg-zinc-950 text-white hover:bg-zinc-800"
                              )}
                            >
                              <Sparkles className="w-3 h-3 text-blue-500" />
                              <span>Usar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* CUADRÍCULA DE ALTO NIVEL RESPONSIVA (Apple/Linear Media Cards para móvil y desktop) */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        "group relative rounded-2xl border overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 ease-out flex flex-col justify-between",
                        isDark 
                          ? "bg-[#0e0e15] border-zinc-800/80 hover:border-blue-500/50" 
                          : "bg-white border-zinc-200/90 hover:border-blue-400 hover:shadow-md"
                      )}
                    >
                      {/* Viewport de Imagen con tap directo para visor HD */}
                      <div 
                        onClick={() => setPreviewPhoto(file)}
                        className="aspect-square w-full relative bg-black overflow-hidden cursor-pointer"
                        title="Toca para ver en Visor HD"
                      >
                        <img
                          src={file.thumbnailUrl || file.cdnUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                          loading="lazy"
                        />
                        {/* Chip Flotante HD */}
                        <div className="absolute top-2 left-2 backdrop-blur-md bg-black/60 text-white text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/15">
                          {file.size || "HD"}
                        </div>

                        {/* Overlay Flotante al Hover en desktop */}
                        <div className="hidden sm:flex absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center justify-center p-2 pointer-events-none group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPhoto(file);
                            }}
                            className="p-2.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-lg"
                            title="Ver en pantalla completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Metadatos inferiores de la tarjeta con acciones accesibles en móvil */}
                      <div className={cn("p-2.5 sm:p-3.5 border-t space-y-2", isDark ? "border-zinc-800/80" : "border-zinc-200/80")}>
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-[11px] sm:text-xs font-bold truncate font-mono tracking-tight", isDark ? "text-zinc-200" : "text-zinc-900")} title={file.name}>
                              {file.name}
                            </p>
                            <p className={cn("text-[9px] sm:text-[10px] font-mono mt-0.5 truncate font-medium", isDark ? "text-zinc-500" : "text-zinc-400")}>
                              {file.dimensions || "Drive HD"} • {file.size || "Original"}
                            </p>
                          </div>

                          {/* Botón ver pantalla completa visible para móvil */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPhoto(file);
                            }}
                            className={cn(
                              "p-1.5 rounded-lg border transition-all cursor-pointer active:scale-90 shrink-0 sm:hidden",
                              isDark 
                                ? "bg-zinc-900/80 border-zinc-700 text-zinc-300 hover:text-white" 
                                : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-950"
                            )}
                            title="Ver fotografía completa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {onSelectPhotoForProduct && (
                          <button
                            type="button"
                            onClick={() => onSelectPhotoForProduct(file.cdnUrl, file)}
                            className={cn(
                              "w-full py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold font-mono transition-all duration-150 cursor-pointer active:scale-95 shadow-xs flex items-center justify-center gap-1.5",
                              isDark 
                                ? "bg-white text-zinc-950 hover:bg-zinc-200" 
                                : "bg-zinc-950 text-white hover:bg-zinc-800"
                            )}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            <span>Usar en producto</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ReactLenis>
        )}

        {/* MODAL DE ESTADÍSTICAS (Executive Metrics Dashboard) */}
        {showStatsModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className={cn(
              "w-full max-w-md border rounded-[2rem] p-6 shadow-2xl space-y-5 transition-colors font-mono",
              isDark ? "bg-[#111119] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            )}>
              <div className={cn("flex items-center justify-between pb-3.5 border-b", isDark ? "border-zinc-800" : "border-zinc-200")}>
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center border",
                    isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600"
                  )}>
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">Estadísticas Multimedia</h4>
                    <p className={cn("text-[11px]", isDark ? "text-zinc-400" : "text-zinc-500")}>Banco de Fotos Lumina</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className={cn(
                    "p-1.5 rounded-lg border transition-all cursor-pointer active:scale-90",
                    isDark ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white" : "bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-950"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                  "p-4 rounded-2xl border space-y-1",
                  isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                )}>
                  <p className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-zinc-400" : "text-zinc-500")}>Fotos en Carpeta</p>
                  <p className="text-2xl font-bold tracking-tight">{filteredFiles.length}</p>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl border space-y-1",
                  isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                )}>
                  <p className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-zinc-400" : "text-zinc-500")}>Total Carpetas</p>
                  <p className="text-2xl font-bold tracking-tight">{rootFolders.length}</p>
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border space-y-2.5 text-xs",
                isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"
              )}>
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>Cuenta vinculada:</span>
                  <span className="font-semibold truncate max-w-[180px]">{settings.accountEmail || "Sin vincular"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>Estado de enlace:</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {settings.isConnected ? "Conectado" : "Desconectado"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>Directorio actual:</span>
                  <span className="truncate max-w-[180px] font-bold">{mainFolder ? mainFolder.name : "Mi Unidad"}</span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm",
                    isDark ? "bg-white text-zinc-950 hover:bg-zinc-200" : "bg-zinc-950 text-white hover:bg-zinc-800"
                  )}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isSyncing ? "animate-spin" : "")} />
                  <span>Sincronizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className={cn(
                    "py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 border",
                    isDark ? "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700" : "bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200"
                  )}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX / VISOR HD EN PANTALLA COMPLETA CON NAVEGACIÓN COMPLETA */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 z-[1400] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/92 backdrop-blur-2xl"
          onClick={() => setPreviewPhoto(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative max-w-5xl w-full max-h-[92vh] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl overflow-hidden border shadow-2xl flex flex-col font-mono",
              isDark ? "bg-[#0d0d12] border-white/10" : "bg-white border-zinc-200"
            )}
          >
            {/* Cabecera del Visor HD */}
            <div className={cn(
              "px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 backdrop-blur-md",
              isDark ? "border-white/10 bg-zinc-950/80 text-white" : "border-zinc-200 bg-zinc-50/90 text-zinc-900"
            )}>
              <div className="min-w-0 pr-1 flex-1">
                <h5 className="font-bold text-xs sm:text-sm truncate tracking-tight">{previewPhoto.name}</h5>
                <p className={cn("text-[10px] sm:text-[11px] font-mono mt-0.5 truncate", isDark ? "text-zinc-400" : "text-zinc-500")}>
                  {previewPhoto.dimensions || "HD"} • {previewPhoto.size || "Drive"} • {filteredFiles.findIndex(f => f.id === previewPhoto.id) + 1} de {filteredFiles.length}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <a
                  href={previewPhoto.cdnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer active:scale-95 border",
                    isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/15" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
                  )}
                  title="Descargar imagen"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className={cn(
                    "p-2 sm:p-2.5 rounded-full transition-all cursor-pointer active:scale-95 border flex items-center justify-center shrink-0",
                    isDark ? "bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border-white/20 shadow-md" : "bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-800 border-zinc-200 shadow-sm"
                  )}
                  style={{ touchAction: "manipulation", minWidth: "42px", minHeight: "42px" }}
                  title="Cerrar vista previa (Esc)"
                  aria-label="Cerrar vista previa"
                >
                  <X className="w-5 h-5 text-current" />
                </button>
              </div>
            </div>

            {/* Viewport Central con Flechas Flotantes (Totalmente responsivo sin recortes) */}
            <div className="relative flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden bg-black/95 select-none">
              <img
                src={previewPhoto.cdnUrl}
                alt={previewPhoto.name}
                className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl transition-all duration-300"
              />

              {/* Botón Flecha Anterior */}
              {filteredFiles.findIndex(f => f.id === previewPhoto.id) > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = filteredFiles.findIndex(f => f.id === previewPhoto.id);
                    if (idx > 0) setPreviewPhoto(filteredFiles[idx - 1]);
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
                  title="Anterior (Flecha izquierda)"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Botón Flecha Siguiente */}
              {filteredFiles.findIndex(f => f.id === previewPhoto.id) < filteredFiles.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = filteredFiles.findIndex(f => f.id === previewPhoto.id);
                    if (idx < filteredFiles.length - 1) setPreviewPhoto(filteredFiles[idx + 1]);
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
                  title="Siguiente (Flecha derecha)"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>

            {/* Barra Inferior del Visor HD */}
            <div className={cn(
              "px-4 py-2.5 sm:px-5 sm:py-3 border-t flex items-center justify-between gap-4 shrink-0 backdrop-blur-md text-xs",
              isDark ? "border-white/10 bg-zinc-950/80 text-zinc-400" : "border-zinc-200 bg-zinc-50/90 text-zinc-600"
            )}>
              <span className="text-[11px] hidden sm:inline">
                Usa ← / → para navegar • ESC para cerrar
              </span>

              {onSelectPhotoForProduct && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectPhotoForProduct(previewPhoto.cdnUrl, previewPhoto);
                    setPreviewPhoto(null);
                  }}
                  className={cn(
                    "ml-auto py-2 px-5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5",
                    isDark ? "bg-white text-zinc-950 hover:bg-zinc-200" : "bg-zinc-950 text-white hover:bg-zinc-800"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Usar esta foto en producto</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Centrado Apple para Administrador de PIN en Mobile / Tablet (< lg) */}
      <div className="lg:hidden">
        <AnimatePresence>
          {showAdminPinMenu && isAdmin && (
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={() => setShowAdminPinMenu(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "w-full max-w-sm rounded-[24px] border shadow-2xl p-4.5 backdrop-blur-3xl font-sans antialiased select-none transition-all max-h-[90vh] overflow-y-auto",
                  isDark 
                    ? "bg-[#1c1c1e]/95 border-white/10 text-white shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)]" 
                    : "bg-white/95 border-black/10 text-zinc-900 shadow-[0_24px_60px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.05)]"
                )}
              >
                {renderAdminPinMenuBody()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
