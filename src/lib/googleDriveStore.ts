import { create } from "zustand";
import { supabase } from "./supabase";

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
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
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
  { id: "folder_lumina_catalog_2026", name: "Catálogo General", itemCount: 0 },
  { id: "folder_iluminacion_premium", name: "Iluminación", itemCount: 0 },
  { id: "folder_textiles_tapiceria", name: "Textiles", itemCount: 0 },
  { id: "folder_ceramica_decoracion", name: "Decoración", itemCount: 0 },
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

const STORAGE_KEY = "lumina_fotoproductos_v4";

function recalculateFolderCounts(folders: GoogleDriveFolder[], files: GoogleDriveFile[]): GoogleDriveFolder[] {
  const counts: Record<string, number> = {};
  files.forEach((f) => {
    if (f.folderId) {
      counts[f.folderId] = (counts[f.folderId] || 0) + 1;
    }
  });
  return folders.map((folder) => {
    if (folder.id === "folder_lumina_catalog_2026") {
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
    selectedFolderId: "folder_lumina_catalog_2026",
    selectedFolderName: "Catálogo General",
    availableFolders: INITIAL_DRIVE_FOLDERS,
    files: [],
    backupAt: undefined,
    backupCount: 0,
  };

  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    // Check v4 first, fallback to legacy v3/v2 to preserve any uploaded files
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem("lumina_fotoproductos_v3") || localStorage.getItem("lumina_fotoproductos_v2");
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        // Purge legacy demo account completely
        const isDemo = parsed.accountEmail === "multimedia.lumina@gmail.com";
        const sanitized: GoogleDriveSettings = {
          ...defaults,
          ...parsed,
          isConnected: isDemo ? false : Boolean(parsed.isConnected),
          accountEmail: isDemo ? "" : (parsed.accountEmail || ""),
          accountName: isDemo ? "" : (parsed.accountName || ""),
          connectedAt: isDemo ? undefined : parsed.connectedAt,
          availableFolders: recalculateFolderCounts(
            parsed.availableFolders || INITIAL_DRIVE_FOLDERS,
            parsed.files || INITIAL_DRIVE_FILES
          ),
        };
        // Save cleaned settings to current key
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        localStorage.removeItem("lumina_fotoproductos_v3");
        return sanitized;
      }
    }
  } catch {}

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
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
      const res = await fetch("/api/admin/google-drive");
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.settings) {
          const rawSettings = data.settings;
          const isDemo = rawSettings.accountEmail === "multimedia.lumina@gmail.com";
          const localStoredClientId = typeof window !== "undefined" ? localStorage.getItem("lumina_google_client_id") || "" : "";
          const resolvedClientId = rawSettings.googleClientId || localStoredClientId || get().settings.googleClientId || "";

          const loadedSettings: GoogleDriveSettings = {
            ...get().settings,
            ...rawSettings,
            googleClientId: resolvedClientId,
            isConnected: isDemo ? false : Boolean(rawSettings.isConnected),
            accountEmail: isDemo ? "" : (rawSettings.accountEmail || ""),
            accountName: isDemo ? "" : (rawSettings.accountName || ""),
            connectedAt: isDemo ? undefined : rawSettings.connectedAt,
            availableFolders: recalculateFolderCounts(
              rawSettings.availableFolders || get().settings.availableFolders,
              rawSettings.files || get().settings.files
            ),
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
      // Resolve Client ID from environment or server settings
      let clientId = get().settings.googleClientId?.trim();

      if (!clientId) {
        const envId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (envId && envId.trim() && !envId.includes("YOUR_GOOGLE_CLIENT_ID")) {
          clientId = envId.trim();
        }
      }

      // Check server API runtime env if not yet loaded in client bundle
      if (!clientId) {
        try {
          const res = await fetch("/api/admin/google-drive");
          if (res.ok) {
            const data = await res.json();
            const serverId = data?.settings?.googleClientId;
            if (serverId && typeof serverId === "string" && serverId.trim() && !serverId.includes("YOUR_GOOGLE_CLIENT_ID")) {
              clientId = serverId.trim();
            }
          }
        } catch { /* ignore */ }
      }

      if (!clientId) {
        set({
          error: "Configuración de Google no disponible. Verifica que la variable de entorno NEXT_PUBLIC_GOOGLE_CLIENT_ID esté configurada en el servidor.",
          isSyncing: false,
        });
        return;
      }

      // Persist resolved valid client ID locally
      if (typeof window !== "undefined") {
        localStorage.setItem("lumina_google_client_id", clientId);
      }

      // Ensure GIS script is ready
      const { requestDriveAccessToken, loadGIS } = await import("./googleIdentity");
      await loadGIS();

      // Open Google popup — doesn't disrupt admin session
      const accessToken = await requestDriveAccessToken(clientId);

      // Fetch user profile from Google with the access token
      let userEmail = "";
      let userName = "";
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const info = await res.json();
          userEmail = info.email || "";
          userName = info.name || info.email?.split("@")[0] || "";
        }
      } catch { /* ignore */ }

      // Update store settings with new connection state
      const { data: { session } } = await supabase.auth.getSession();
      const updated: GoogleDriveSettings = {
        ...get().settings,
        isConnected: true,
        accountEmail: userEmail || get().settings.accountEmail || "Google Drive Conectado",
        accountName: userName || get().settings.accountName || "Admin Drive",
        providerToken: accessToken,
        googleClientId: clientId,
        connectedAt: new Date().toISOString(),
      };

      set({ settings: updated, isSyncing: false, error: null });
      saveToLocal(updated);

      // Persist connection info to server database
      try {
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ settings: updated }),
        });
      } catch { /* ignore */ }

      // Automatically load real Google Drive folders and photos
      await get().loadGoogleDriveFiles(accessToken);
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
        cdnUrl: `https://lh3.googleusercontent.com/d/${file.id}=s0`,
        thumbnailUrl: file.thumbnailLink || `https://lh3.googleusercontent.com/d/${file.id}=w600`,
        size: file.size ? `${(parseInt(file.size, 10) / (1024 * 1024)).toFixed(1)} MB` : "HD Stream",
        dimensions: file.imageMediaMetadata?.width && file.imageMediaMetadata?.height
          ? `${file.imageMediaMetadata.width} x ${file.imageMediaMetadata.height}`
          : "Resolución Google Drive",
        folderId: file.parents?.[0] || "folder_lumina_catalog_2026",
        source: "google_drive",
      }));

      // 2. Fetch real folders from Google Drive API
      const folderQuery = encodeURIComponent("trashed = false and mimeType = 'application/vnd.google-apps.folder'");
      let realFolders: GoogleDriveFolder[] = [
        { id: "folder_lumina_catalog_2026", name: "Catálogo General", itemCount: driveFiles.length },
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

  handleOAuthReturn: async () => { /* no-op: GIS popup is self-contained */ },

  disconnectAccount: async () => {
    set({ isSyncing: true, error: null });
    try {
      const updated: GoogleDriveSettings = {
        ...get().settings,
        isConnected: false,
        accountEmail: "",
        accountName: "",
        connectedAt: undefined,
      };

      try {
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      const resolvedName = folderName || folder?.name || folderId;

      const updated: GoogleDriveSettings = {
        ...get().settings,
        selectedFolderId: folderId,
        selectedFolderName: resolvedName,
      };

      try {
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "select_folder", folderId, folderName: resolvedName }),
        });
      } catch {}

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
    if (folderId === "folder_lumina_catalog_2026") return false;
    set({ isSyncing: true });
    try {
      const filteredFolders = get().settings.availableFolders.filter((f) => f.id !== folderId);
      const remappedFiles = get().settings.files.map((f) =>
        f.folderId === folderId ? { ...f, folderId: "folder_lumina_catalog_2026" } : f
      );

      const updated: GoogleDriveSettings = {
        ...get().settings,
        availableFolders: recalculateFolderCounts(filteredFolders, remappedFiles),
        files: remappedFiles,
        selectedFolderId: "folder_lumina_catalog_2026",
        selectedFolderName: "Catálogo General",
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
        folderId: photoData.folderId || get().settings.selectedFolderId || "folder_lumina_catalog_2026",
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
        folderId: p.folderId || get().settings.selectedFolderId || "folder_lumina_catalog_2026",
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
