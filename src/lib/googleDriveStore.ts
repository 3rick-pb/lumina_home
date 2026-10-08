import { create } from "zustand";
import { supabase } from "./supabase";
import { supabaseDrive } from "./supabaseDrive";

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType?: string;
  cdnUrl: string;
  thumbnailUrl: string;
  size?: string;
  dimensions?: string;
  folderId?: string;
  source?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhoto?: string;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  parentId?: string | null;
  itemCount: number;
}

export interface GoogleDriveSettings {
  isConnected: boolean;
  accountEmail: string;
  accountName: string;
  connectedAt?: string;
  providerToken?: string;
  selectedFolderId: string;
  selectedFolderName: string;
  availableFolders: GoogleDriveFolder[];
  files: GoogleDriveFile[];
  backupAt?: string;
  backupCount?: number;
  googleClientId?: string;
}

export const INITIAL_DRIVE_FOLDERS: GoogleDriveFolder[] = [
  { id: "root", name: "Mi Unidad", itemCount: 0 },
];

export const INITIAL_DRIVE_FILES: GoogleDriveFile[] = [];

export type GoogleDriveActiveTab = 'files' | 'folders' | 'upload' | 'backup';

interface GoogleDriveState {
  settings: GoogleDriveSettings;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  clearError: () => void;
  activeView: GoogleDriveActiveTab;
  setActiveView: (view: GoogleDriveActiveTab) => void;
  loadSettings: () => Promise<void>;
  connectGoogleOAuth: () => Promise<void>;
  loadGoogleDriveFiles: (tokenOverride?: string) => Promise<void>;
  handleOAuthReturn: () => Promise<void>;
  disconnectAccount: () => Promise<boolean>;
  selectFolder: (folderId: string, folderName?: string) => Promise<boolean>;
  createFolder: (name: string) => Promise<boolean>;
  deleteFolder: (folderId: string) => Promise<boolean>;
  addPhoto: (photo: Omit<GoogleDriveFile, "id"> | GoogleDriveFile) => Promise<boolean>;
  addPhotos: (photos: Array<Omit<GoogleDriveFile, "id"> | GoogleDriveFile>) => Promise<boolean>;
  deletePhoto: (photoId: string) => Promise<boolean>;
  updatePhoto: (photoId: string, updates: Partial<GoogleDriveFile>) => Promise<boolean>;
  backupToDatabase: () => Promise<{ success: boolean; message: string; timestamp?: string }>;
  restoreFromDatabase: () => Promise<boolean>;
  exportBackupJson: () => void;
  importBackupJson: (jsonString: string) => Promise<boolean>;
  syncFiles: () => Promise<void>;
}

const STORAGE_KEY = "lumina_fotoproductos_v5";

function recalculateFolderCounts(folders: GoogleDriveFolder[], files: GoogleDriveFile[]): GoogleDriveFolder[] {
  const counts: Record<string, number> = {};
  files.forEach((f) => {
    if (f.folderId) {
      counts[f.folderId] = (counts[f.folderId] || 0) + 1;
    }
  });
  return folders.map((folder) => {
    if (folder.id === "root" || folder.id === "folder_lumina_catalog_2026") {
      return { ...folder, itemCount: files.length };
    }
    return {
      ...folder,
      itemCount: counts[folder.id] || 0,
    };
  });
}

function loadFromLocal(): GoogleDriveSettings {
  const defaults: GoogleDriveSettings = {
    isConnected: false,
    accountEmail: "",
    accountName: "",
    connectedAt: undefined,
    selectedFolderId: "root",
    selectedFolderName: "Mi Unidad",
    availableFolders: INITIAL_DRIVE_FOLDERS,
    files: [],
    backupAt: undefined,
    backupCount: 0,
  };

  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    localStorage.removeItem("lumina_fotoproductos_v4");
    localStorage.removeItem("lumina_fotoproductos_v3");
    localStorage.removeItem("lumina_fotoproductos_v2");

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const isDemo = parsed.accountEmail === "multimedia.lumina@gmail.com";
        const hasUnsplash = Array.isArray(parsed.files) && parsed.files.some((f: GoogleDriveFile) => f.cdnUrl?.includes("unsplash.com") || f.name?.includes("LUMINA-AURA"));
        const hasMockFolders = Array.isArray(parsed.availableFolders) && parsed.availableFolders.some((f: GoogleDriveFolder) => f.id === "folder_iluminacion_premium" || f.id === "folder_lumina_catalog_2026");

        if (isDemo || hasUnsplash || hasMockFolders) {
          localStorage.removeItem(STORAGE_KEY);
          return defaults;
        }

        const sanitized: GoogleDriveSettings = {
          ...defaults,
          ...parsed,
          selectedFolderId: parsed.selectedFolderId === "folder_lumina_catalog_2026" ? "root" : (parsed.selectedFolderId || "root"),
          selectedFolderName: parsed.selectedFolderName?.includes("Catálogo") ? "Mi Unidad" : (parsed.selectedFolderName || "Mi Unidad"),
          availableFolders: recalculateFolderCounts(
            parsed.availableFolders || INITIAL_DRIVE_FOLDERS,
            parsed.files || INITIAL_DRIVE_FILES
          ),
        };
        return sanitized;
      }
    }
  } catch {}

  return defaults;
}

function saveToLocal(settings: GoogleDriveSettings) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }
}

export const useGoogleDriveStore = create<GoogleDriveState>((set, get) => ({
  settings: loadFromLocal(),
  isLoading: false,
  isSyncing: false,
  error: null,
  activeView: 'files',

  setActiveView: (view: GoogleDriveActiveTab) => {
    set({ activeView: view });
  },

  clearError: () => set({ error: null }),

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/google-drive", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.settings) {
          const rawSettings = data.settings;
          const isDemo = rawSettings.accountEmail === "multimedia.lumina@gmail.com";
          const localStoredClientId = typeof window !== "undefined" ? localStorage.getItem("lumina_google_client_id") || "" : "";
          const resolvedClientId = rawSettings.googleClientId || localStoredClientId || get().settings.googleClientId || "";

          // Filtrar cualquier residuo de carpetas o imágenes de demostración
          let cleanFolders: GoogleDriveFolder[] = (rawSettings.availableFolders || [])
            .filter(
              (f: GoogleDriveFolder) =>
                !f.id?.includes("iluminacion_premium") &&
                !f.id?.includes("textiles_tapiceria") &&
                !f.id?.includes("ceramica_decoracion") &&
                f.id !== "folder_lumina_catalog_2026"
            )
            .map((f: GoogleDriveFolder) => ({
              id: f.id,
              name: f.name,
              parentId: f.parentId !== undefined ? f.parentId : (f.id === "root" ? null : "root"),
              itemCount: f.itemCount || 0,
            }));
          if (cleanFolders.length === 0) {
            cleanFolders = [{ id: "root", name: "Mi Unidad", parentId: null, itemCount: 0 }];
          }

          const cleanFiles = (rawSettings.files || []).filter(
            (f: GoogleDriveFile) => !f.cdnUrl?.includes("unsplash.com") && !f.name?.includes("LUMINA-AURA")
          );

          const loadedSettings: GoogleDriveSettings = {
            ...get().settings,
            ...rawSettings,
            selectedFolderId: rawSettings.selectedFolderId === "folder_lumina_catalog_2026" ? "root" : (rawSettings.selectedFolderId || "root"),
            selectedFolderName: rawSettings.selectedFolderName?.includes("Catálogo") || rawSettings.selectedFolderName?.includes("Lumina") ? "Mi Unidad" : (rawSettings.selectedFolderName || "Mi Unidad"),
            googleClientId: resolvedClientId,
            isConnected: isDemo ? false : Boolean(rawSettings.isConnected),
            accountEmail: isDemo ? "" : (rawSettings.accountEmail || ""),
            accountName: isDemo ? "" : (rawSettings.accountName || ""),
            connectedAt: isDemo ? undefined : rawSettings.connectedAt,
            availableFolders: recalculateFolderCounts(cleanFolders, cleanFiles),
            files: cleanFiles,
          };
          set({ settings: loadedSettings, isLoading: false });
          saveToLocal(loadedSettings);
          return;
        }
      }
    } catch {
      // Fallback gracefully
    }
    set({ settings: loadFromLocal(), isLoading: false });
  },

  connectGoogleOAuth: async () => {
    set({ isSyncing: true, error: null });
    try {
      if (typeof window === "undefined") {
        set({ isSyncing: false });
        return;
      }

      // 1. Abrir popup de forma síncrona en el evento click para evitar bloqueos del navegador
      const popup = window.open("about:blank", "google_drive_oauth", "width=540,height=680");
      if (popup) {
        try {
          popup.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Google Drive</title>
                <style>
                  body { background: #1c1917; color: #f5f5f4; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                  .box { text-align: center; }
                  .spinner { width: 32px; height: 32px; border: 3px solid #44403c; border-top-color: #fafaf9; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
                  @keyframes spin { to { transform: rotate(360deg); } }
                  p { font-size: 13px; margin: 0; color: #a8a29e; }
                </style>
              </head>
              <body>
                <div class="box">
                  <div class="spinner"></div>
                  <p>Conectando con Google...</p>
                </div>
              </body>
            </html>
          `);
        } catch {}
      }

      // 2. Limpiar resultados previos en localStorage
      try {
        localStorage.removeItem("lumina_fotoproductos_auth_result");
      } catch {}

      // 3. Solicitar URL de OAuth segura con state criptográfico al backend
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/google-drive/auth", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        if (popup) popup.close();
        set({
          error: data?.error || "No se pudo iniciar la conexión con Google Drive.",
          isSyncing: false,
        });
        return;
      }

      // 4. Navegar el popup a la pantalla de consentimiento de Google
      if (popup) {
        popup.location.href = data.url;
      } else {
        // Fallback si el navegador forzó bloqueo estricto de ventanas emergentes
        window.location.href = data.url;
        return;
      }

      // 5. Esperar resolución mediante BroadcastChannel, postMessage, storage o sondeo activo
      let resolved = false;

      const cleanup = () => {
        try { if (bc) bc.close(); } catch {}
        try { window.removeEventListener("message", onMessage); } catch {}
        try { window.removeEventListener("storage", onStorage); } catch {}
        try { window.removeEventListener("focus", onFocus); } catch {}
        clearInterval(pollInterval);
      };

      const finishConnection = async (_payload?: { email?: string; name?: string }) => {
        if (resolved) return;
        resolved = true;
        cleanup();

        if (popup && !popup.closed) {
          try { popup.close(); } catch {}
        }

        // Recargar configuración, colecciones y fotos directamente del backend seguro
        await get().loadSettings();
        set({ isSyncing: false, error: null });
      };

      // A. Canal BroadcastChannel (instantáneo entre pestañas y popups del mismo origen)
      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel("lumina_google_drive_channel");
        bc.onmessage = (event) => {
          const type = event.data?.type;
          if (type === "GOOGLE_DRIVE_AUTH_SUCCESS" || type === "GOOGLE_DRIVE_OAUTH_SUCCESS") {
            finishConnection(event.data);
          }
        };
      } catch {}

      // B. Escuchador para postMessage (si window.opener sigue vinculado)
      const onMessage = (event: MessageEvent) => {
        const type = event.data?.type;
        if (type === "GOOGLE_DRIVE_AUTH_SUCCESS" || type === "GOOGLE_DRIVE_OAUTH_SUCCESS") {
          finishConnection(event.data);
        }
      };
      window.addEventListener("message", onMessage);

      // C. Escuchador storage
      const onStorage = (event: StorageEvent) => {
        if (event.key === "lumina_fotoproductos_auth_result" && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            if (parsed?.type === "GOOGLE_DRIVE_AUTH_SUCCESS" || parsed?.type === "GOOGLE_DRIVE_OAUTH_SUCCESS") {
              localStorage.removeItem("lumina_fotoproductos_auth_result");
              finishConnection(parsed);
            }
          } catch {}
        }
      };
      window.addEventListener("storage", onStorage);

      // D. Escuchador focus (cuando el usuario vuelve a enfocar esta pestaña tras el popup)
      const onFocus = async () => {
        if (resolved) return;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch("/api/admin/google-drive", {
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.success && data?.settings?.isConnected) {
              finishConnection(data.settings);
            }
          }
        } catch {}
      };
      window.addEventListener("focus", onFocus);

      // E. Sondeo activo continuo
      const startTime = Date.now();
      let closedCheckAttempts = 0;
      const pollInterval = setInterval(async () => {
        if (resolved) {
          cleanup();
          return;
        }

        // 1. Verificar localStorage
        try {
          const stored = localStorage.getItem("lumina_fotoproductos_auth_result");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (
              (parsed?.type === "GOOGLE_DRIVE_AUTH_SUCCESS" || parsed?.type === "GOOGLE_DRIVE_OAUTH_SUCCESS") &&
              parsed.timestamp >= startTime
            ) {
              localStorage.removeItem("lumina_fotoproductos_auth_result");
              finishConnection(parsed);
              return;
            }
          }
        } catch {}

        // 2. Consultar servidor directamente
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch("/api/admin/google-drive", {
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.success && data?.settings?.isConnected) {
              finishConnection(data.settings);
              return;
            }
          }
        } catch {}

        // 3. Manejar cierre del popup con varios reintentos para no rendirse prematuramente
        if (popup?.closed) {
          closedCheckAttempts++;
          if (closedCheckAttempts >= 3) {
            cleanup();
            if (!resolved) {
              // Intento final antes de apagar estado sincronizando
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch("/api/admin/google-drive", {
                  headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data?.success && data?.settings?.isConnected) {
                    finishConnection(data.settings);
                    return;
                  }
                }
              } catch {}
              set({ isSyncing: false });
            }
          }
        }

        // 4. Timeout máximo de 3 minutos
        if (Date.now() - startTime > 180000) {
          cleanup();
          if (!resolved) {
            set({ isSyncing: false, error: "Tiempo de espera agotado al conectar con Google." });
          }
        }
      }, 1000);

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al conectar con Google Drive";
      set({ error: msg, isSyncing: false });
    }
  },

  loadGoogleDriveFiles: async (tokenOverride?: string) => {
    const token = tokenOverride || get().settings.providerToken;
    if (!token) return;

    set({ isSyncing: true, error: null });
    try {
      // 1. Fetch images from Google Drive API
      const query = encodeURIComponent("trashed = false and (mimeType contains 'image/')");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=100&fields=nextPageToken,files(id,name,mimeType,thumbnailLink,webContentLink,size,imageMediaMetadata,parents)&orderBy=modifiedTime desc`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          set({
            error: "La sesión de Google Drive ha expirado. Haz clic en 'Conectar Google Drive' para renovar el acceso.",
            isSyncing: false,
          });
          return;
        }
        throw new Error(`Google Drive API error: ${res.statusText}`);
      }

      interface GoogleDriveApiRawFile {
        id: string;
        name: string;
        mimeType?: string;
        thumbnailLink?: string;
        size?: string;
        imageMediaMetadata?: { width?: number; height?: number };
        parents?: string[];
      }

      interface GoogleDriveApiRawFolder {
        id: string;
        name: string;
      }

      const data = await res.json();
      const rawFileList: GoogleDriveApiRawFile[] = Array.isArray(data.files) ? data.files : [];
      const driveFiles: GoogleDriveFile[] = rawFileList.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType || "image/jpeg",
        cdnUrl: `/api/admin/google-drive/image?id=${file.id}`,
        thumbnailUrl: file.thumbnailLink || `/api/admin/google-drive/image?id=${file.id}&thumb=1`,
        size: file.size ? `${(parseInt(file.size, 10) / (1024 * 1024)).toFixed(1)} MB` : "HD Stream",
        dimensions: file.imageMediaMetadata?.width && file.imageMediaMetadata?.height
          ? `${file.imageMediaMetadata.width} x ${file.imageMediaMetadata.height}`
          : "Resolución Google Drive",
        folderId: file.parents?.[0] || "root",
        source: "google_drive",
      }));

      // 2. Fetch real folders from Google Drive API
      const folderQuery = encodeURIComponent("trashed = false and mimeType = 'application/vnd.google-apps.folder'");
      let realFolders: GoogleDriveFolder[] = [
        { id: "root", name: "Mi Unidad", itemCount: driveFiles.length },
      ];

      try {
        const folderRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&pageSize=50&fields=files(id,name)&orderBy=name`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (folderRes.ok) {
          const folderData = await folderRes.json();
          const rawFolderList: GoogleDriveApiRawFolder[] = Array.isArray(folderData.files) ? folderData.files : [];
          const apiFolders = rawFolderList.map((f) => ({
            id: f.id,
            name: f.name,
            itemCount: driveFiles.filter((item) => item.folderId === f.id).length,
          }));
          realFolders = [...realFolders, ...apiFolders];
        }
      } catch { /* ignore folder listing error */ }

      const updated: GoogleDriveSettings = {
        ...get().settings,
        files: driveFiles.length > 0 ? driveFiles : get().settings.files,
        availableFolders: recalculateFolderCounts(realFolders, driveFiles.length > 0 ? driveFiles : get().settings.files),
      };

      set({ settings: updated, isSyncing: false, error: null });
      saveToLocal(updated);

      // Persist backup to DB
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            action: "backup_now",
            files: updated.files,
            folders: updated.availableFolders,
          }),
        });
      } catch { /* ignore */ }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al obtener archivos de Google Drive";
      set({ error: msg, isSyncing: false });
    }
  },

  handleOAuthReturn: async () => {
    try {
      if (typeof window === "undefined") return;

      const stored = localStorage.getItem("lumina_fotoproductos_auth_result");
      if (stored) {
        localStorage.removeItem("lumina_fotoproductos_auth_result");
        const parsed = JSON.parse(stored);
        if (parsed?.providerToken || parsed?.email) {
          const updated: GoogleDriveSettings = {
            ...get().settings,
            isConnected: true,
            accountEmail: parsed.email || get().settings.accountEmail || "Google Drive Conectado",
            accountName: parsed.name || get().settings.accountName || "Google Drive",
            providerToken: parsed.providerToken || get().settings.providerToken,
            connectedAt: new Date().toISOString(),
          };
          set({ settings: updated });
          saveToLocal(updated);

          if (parsed.providerToken) {
            await get().loadGoogleDriveFiles(parsed.providerToken);
          }
          return;
        }
      }

      // Fallback: verificar sesión en supabaseDrive
      const { data: { session } } = await supabaseDrive.auth.getSession();
      if (session?.provider_token) {
        const updated: GoogleDriveSettings = {
          ...get().settings,
          isConnected: true,
          accountEmail: session.user?.email || get().settings.accountEmail || "Google Drive Conectado",
          accountName:
            session.user?.user_metadata?.full_name ||
            session.user?.user_metadata?.name ||
            get().settings.accountName ||
            "Google Drive",
          providerToken: session.provider_token,
          connectedAt: new Date().toISOString(),
        };
        set({ settings: updated });
        saveToLocal(updated);
        await get().loadGoogleDriveFiles(session.provider_token);
      }
    } catch {}
  },

  disconnectAccount: async () => {
    set({ isSyncing: true, error: null });
    try {
      try {
        await supabaseDrive.auth.signOut();
      } catch {}

      const updated: GoogleDriveSettings = {
        ...get().settings,
        isConnected: false,
        accountEmail: "",
        accountName: "",
        providerToken: undefined,
        connectedAt: undefined,
      };

      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ action: "disconnect" }),
        });
      } catch {}

      saveToLocal(updated);
      set({ settings: updated, isSyncing: false, activeView: 'folders' });
      return true;
    } catch {
      set({ error: "Error al desconectar", isSyncing: false });
      return false;
    }
  },

  selectFolder: async (folderId: string, folderName?: string) => {
    set({ isSyncing: true, error: null });
    try {
      const folder = get().settings.availableFolders.find((f) => f.id === folderId);
      const resolvedName = folderName || folder?.name || (folderId === 'root' ? 'Mi Unidad' : folderId);

      let folderFiles: GoogleDriveFile[] = [];
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ action: "select_folder", folderId, folderName: resolvedName }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.files)) {
            folderFiles = data.files;
          }
        }
      } catch {}

      const updated: GoogleDriveSettings = {
        ...get().settings,
        selectedFolderId: folderId,
        selectedFolderName: resolvedName,
        files: folderFiles.length > 0 ? folderFiles : get().settings.files,
      };

      saveToLocal(updated);
      set({ settings: updated, isSyncing: false, activeView: 'files' });
      return true;
    } catch {
      set({ error: "Error al seleccionar carpeta", isSyncing: false });
      return false;
    }
  },

  createFolder: async (name: string) => {
    if (!name.trim()) return false;
    set({ isSyncing: true });
    try {
      const newFolderId = `folder_${Date.now()}`;
      const newFolder: GoogleDriveFolder = {
        id: newFolderId,
        name: name.trim(),
        itemCount: 0,
      };

      const updatedFolders = [newFolder, ...get().settings.availableFolders];
      const updated: GoogleDriveSettings = {
        ...get().settings,
        availableFolders: updatedFolders,
        selectedFolderId: newFolderId,
        selectedFolderName: name.trim(),
      };

      try {
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create_folder", folder: newFolder }),
        });
      } catch {}

      saveToLocal(updated);
      set({ settings: updated, isSyncing: false, activeView: 'files' });
      return true;
    } catch {
      set({ isSyncing: false });
      return false;
    }
  },

  deleteFolder: async (folderId: string) => {
    if (folderId === "root" || folderId === "folder_lumina_catalog_2026") return false;
    set({ isSyncing: true });
    try {
      const filteredFolders = get().settings.availableFolders.filter((f) => f.id !== folderId);
      const remappedFiles = get().settings.files.map((f) =>
        f.folderId === folderId ? { ...f, folderId: "root" } : f
      );

      const updated: GoogleDriveSettings = {
        ...get().settings,
        availableFolders: recalculateFolderCounts(filteredFolders, remappedFiles),
        files: remappedFiles,
        selectedFolderId: "root",
        selectedFolderName: "Mi Unidad",
      };

      try {
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete_folder", folderId }),
        });
      } catch {}

      saveToLocal(updated);
      set({ settings: updated, isSyncing: false, activeView: 'folders' });
      return true;
    } catch {
      set({ isSyncing: false });
      return false;
    }
  },

  addPhoto: async (photoData) => {
    set({ isSyncing: true });
    try {
      const photoId = "id" in photoData && photoData.id 
        ? photoData.id 
        : `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const newFile: GoogleDriveFile = {
        id: photoId,
        name: photoData.name || "FOTOGRAFIA.jpg",
        mimeType: photoData.mimeType || "image/jpeg",
        cdnUrl: photoData.cdnUrl,
        thumbnailUrl: photoData.thumbnailUrl || photoData.cdnUrl,
        size: photoData.size || "2.1 MB",
        dimensions: photoData.dimensions || "2400 x 1800",
        folderId: photoData.folderId || get().settings.selectedFolderId || "root",
        source: photoData.source || "upload",
      };

      const updatedFiles = [newFile, ...get().settings.files];
      const updatedFolders = recalculateFolderCounts(get().settings.availableFolders, updatedFiles);

      const updated: GoogleDriveSettings = {
        ...get().settings,
        files: updatedFiles,
        availableFolders: updatedFolders,
        backupCount: updatedFiles.length,
      };

      try {
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add_photo", photo: newFile }),
        });
      } catch {}

      saveToLocal(updated);
      set({ settings: updated, isSyncing: false, activeView: 'files' });
      return true;
    } catch {
      set({ isSyncing: false });
      return false;
    }
  },

  addPhotos: async (photosList) => {
    if (!photosList || photosList.length === 0) return false;
    set({ isSyncing: true });
    try {
      const formattedItems: GoogleDriveFile[] = photosList.map((p, idx) => ({
        id: "id" in p && p.id ? p.id : `img_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        name: p.name || `FOTO-${idx + 1}.jpg`,
        mimeType: p.mimeType || "image/jpeg",
        cdnUrl: p.cdnUrl,
        thumbnailUrl: p.thumbnailUrl || p.cdnUrl,
        size: p.size || "2.2 MB",
        dimensions: p.dimensions || "2400 x 1800",
        folderId: p.folderId || get().settings.selectedFolderId || "root",
        source: p.source || "upload",
      }));

      const updatedFiles = [...formattedItems, ...get().settings.files];
      const updatedFolders = recalculateFolderCounts(get().settings.availableFolders, updatedFiles);

      const updated: GoogleDriveSettings = {
        ...get().settings,
        files: updatedFiles,
        availableFolders: updatedFolders,
        backupCount: updatedFiles.length,
      };

      try {
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add_photos", photos: formattedItems }),
        });
      } catch {}

      saveToLocal(updated);
      set({ settings: updated, isSyncing: false, activeView: 'files' });
      return true;
    } catch {
      set({ isSyncing: false });
      return false;
    }
  },

  deletePhoto: async (photoId: string) => {
    set({ isSyncing: true });
    try {
      const updatedFiles = get().settings.files.filter((f) => f.id !== photoId);
      const updatedFolders = recalculateFolderCounts(get().settings.availableFolders, updatedFiles);

      const updated: GoogleDriveSettings = {
        ...get().settings,
        files: updatedFiles,
        availableFolders: updatedFolders,
        backupCount: updatedFiles.length,
      };

      try {
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete_photo", photoId }),
        });
      } catch {}

      saveToLocal(updated);
      set({ settings: updated, isSyncing: false });
      return true;
    } catch {
      set({ isSyncing: false });
      return false;
    }
  },

  updatePhoto: async (photoId: string, updates: Partial<GoogleDriveFile>) => {
    try {
      const updatedFiles = get().settings.files.map((f) =>
        f.id === photoId ? { ...f, ...updates } : f
      );
      const updatedFolders = recalculateFolderCounts(get().settings.availableFolders, updatedFiles);

      const updated: GoogleDriveSettings = {
        ...get().settings,
        files: updatedFiles,
        availableFolders: updatedFolders,
      };

      saveToLocal(updated);
      set({ settings: updated });
      return true;
    } catch {
      return false;
    }
  },

  backupToDatabase: async () => {
    set({ isSyncing: true, error: null });
    try {
      const current = get().settings;
      const res = await fetch("/api/admin/google-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "backup_now",
          files: current.files,
          folders: current.availableFolders,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const timestamp = data.backupAt || new Date().toISOString();
        const updated: GoogleDriveSettings = {
          ...current,
          backupAt: timestamp,
          backupCount: current.files.length,
        };
        saveToLocal(updated);
        set({ settings: updated, isSyncing: false });
        return {
          success: true,
          message: `Respaldo exitoso: ${current.files.length} fotografías y ${current.availableFolders.length} colecciones respaldadas en Base de Datos.`,
          timestamp,
        };
      }
      throw new Error("No se pudo completar el respaldo");
    } catch {
      set({ isSyncing: false, error: "Error al respaldar en la nube" });
      return { success: false, message: "Error al comunicarse con la base de datos." };
    }
  },

  restoreFromDatabase: async () => {
    set({ isSyncing: true, error: null });
    try {
      const res = await fetch("/api/admin/google-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore_backup" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.settings) {
          const restored: GoogleDriveSettings = {
            ...get().settings,
            ...data.settings,
            availableFolders: recalculateFolderCounts(
              data.settings.availableFolders || get().settings.availableFolders,
              data.settings.files || get().settings.files
            ),
          };
          saveToLocal(restored);
          set({ settings: restored, isSyncing: false, activeView: 'files' });
          return true;
        }
      }
      set({ isSyncing: false });
      return false;
    } catch {
      set({ isSyncing: false, error: "Error al restaurar desde base de datos" });
      return false;
    }
  },

  exportBackupJson: () => {
    try {
      const payload = {
        app: "Fotoproductos",
        type: "MEDIA_BANK_DATABASE_BACKUP",
        exportedAt: new Date().toISOString(),
        settings: get().settings,
      };
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `fotoproductos_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
    }
  },

  importBackupJson: async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const importedSettings = parsed.settings || parsed;
      if (Array.isArray(importedSettings.files)) {
        const updated: GoogleDriveSettings = {
          ...get().settings,
          ...importedSettings,
          availableFolders: recalculateFolderCounts(
            importedSettings.availableFolders || get().settings.availableFolders,
            importedSettings.files
          ),
          backupCount: importedSettings.files.length,
          backupAt: new Date().toISOString(),
        };

        saveToLocal(updated);
        set({ settings: updated, activeView: 'files' });

        // Enviar a la base de datos
        try {
          await fetch("/api/admin/google-drive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "backup_now",
              files: updated.files,
              folders: updated.availableFolders,
            }),
          });
        } catch {}

        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  syncFiles: async () => {
    set({ isSyncing: true, error: null });
    try {
      await get().loadSettings();
      set({ isSyncing: false });
    } catch {
      set({ isSyncing: false });
    }
  },
}));
