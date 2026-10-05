import { create } from "zustand";

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
  selectedFolderId: string;
  selectedFolderName: string;
  availableFolders: GoogleDriveFolder[];
  files: GoogleDriveFile[];
  backupAt?: string;
  backupCount?: number;
}

export const INITIAL_DRIVE_FOLDERS: GoogleDriveFolder[] = [
  { id: "folder_lumina_catalog_2026", name: "Lumina Home - Catálogo Fotográfico 2026", itemCount: 12 },
  { id: "folder_iluminacion_premium", name: "Iluminación & Lámparas de Autor", itemCount: 6 },
  { id: "folder_textiles_tapiceria", name: "Textiles Naturales & Lino", itemCount: 4 },
  { id: "folder_ceramica_decoracion", name: "Cerámica & Accesorios Minimalistas", itemCount: 5 },
];

export const INITIAL_DRIVE_FILES: GoogleDriveFile[] = [
  {
    id: "lumina_drive_img_01",
    name: "LUMINA-AURA-PENDANT-01.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400&auto=format&fit=crop",
    size: "2.4 MB",
    dimensions: "2400 x 1800",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_02",
    name: "LUMINA-NORDIC-FLOOR-LAMP-02.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=400&auto=format&fit=crop",
    size: "3.1 MB",
    dimensions: "2600 x 1950",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_03",
    name: "LUMINA-CERAMIC-VASE-MATTE-03.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=400&auto=format&fit=crop",
    size: "1.8 MB",
    dimensions: "2000 x 2000",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_04",
    name: "LUMINA-LINEN-CUSHIONS-SAND-04.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=400&auto=format&fit=crop",
    size: "2.8 MB",
    dimensions: "2500 x 1667",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_05",
    name: "LUMINA-MARBLE-ACCENT-TABLE-05.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=400&auto=format&fit=crop",
    size: "3.4 MB",
    dimensions: "2800 x 2100",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_06",
    name: "LUMINA-BRASS-CHANDELIER-06.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=400&auto=format&fit=crop",
    size: "2.1 MB",
    dimensions: "2200 x 1650",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_07",
    name: "LUMINA-MINIMALIST-SCONCE-07.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?q=80&w=400&auto=format&fit=crop",
    size: "2.7 MB",
    dimensions: "2400 x 1800",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_08",
    name: "LUMINA-SCANDINAVIAN-ARMCHAIR-08.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400&auto=format&fit=crop",
    size: "3.6 MB",
    dimensions: "3000 x 2000",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_09",
    name: "LUMINA-ORGANIC-WOOD-BENCH-09.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop",
    size: "2.9 MB",
    dimensions: "2600 x 1733",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_10",
    name: "LUMINA-WOVEN-RUG-NATURAL-10.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=400&auto=format&fit=crop",
    size: "2.5 MB",
    dimensions: "2400 x 1800",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_11",
    name: "LUMINA-ARCHITECTURAL-VASE-11.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=400&auto=format&fit=crop",
    size: "1.9 MB",
    dimensions: "2100 x 2100",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
  {
    id: "lumina_drive_img_12",
    name: "LUMINA-ECLIPSE-DESK-LAMP-12.jpg",
    mimeType: "image/jpeg",
    cdnUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=90&w=1200&auto=format&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400&auto=format&fit=crop",
    size: "2.3 MB",
    dimensions: "2400 x 1800",
    folderId: "folder_lumina_catalog_2026",
    source: "google_drive",
  },
];

export type GoogleDriveActiveTab = 'files' | 'folders' | 'upload' | 'backup';

interface GoogleDriveState {
  settings: GoogleDriveSettings;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  activeView: GoogleDriveActiveTab;
  setActiveView: (view: GoogleDriveActiveTab) => void;
  loadSettings: () => Promise<void>;
  connectAccount: (email?: string, name?: string) => Promise<boolean>;
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

const STORAGE_KEY = "lumina_admin_google_drive_v2";

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
    isConnected: true,
    accountEmail: "multimedia.lumina@gmail.com",
    accountName: "Lumina Home Media Assets",
    connectedAt: new Date().toISOString(),
    selectedFolderId: "folder_lumina_catalog_2026",
    selectedFolderName: "Lumina Home - Catálogo Fotográfico 2026",
    availableFolders: INITIAL_DRIVE_FOLDERS,
    files: INITIAL_DRIVE_FILES,
    backupAt: new Date().toISOString(),
    backupCount: INITIAL_DRIVE_FILES.length,
  };

  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.isConnected === "boolean" && Array.isArray(parsed.files)) {
        return {
          ...defaults,
          ...parsed,
          availableFolders: recalculateFolderCounts(
            parsed.availableFolders || INITIAL_DRIVE_FOLDERS,
            parsed.files || INITIAL_DRIVE_FILES
          ),
        };
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

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/admin/google-drive");
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.settings) {
          const loadedSettings: GoogleDriveSettings = {
            ...get().settings,
            ...data.settings,
            availableFolders: recalculateFolderCounts(
              data.settings.availableFolders || get().settings.availableFolders,
              data.settings.files || get().settings.files
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

  connectAccount: async (email = "multimedia.lumina@gmail.com", name = "Lumina Home Media Assets") => {
    set({ isSyncing: true, error: null });
    try {
      const current = get().settings;
      const updated: GoogleDriveSettings = {
        ...current,
        isConnected: true,
        accountEmail: email.trim().toLowerCase(),
        accountName: name.trim(),
        connectedAt: new Date().toISOString(),
      };

      try {
        await fetch("/api/admin/google-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "connect", email, name }),
        });
      } catch {}

      saveToLocal(updated);
      set({ settings: updated, isSyncing: false, activeView: 'files' });
      return true;
    } catch {
      set({ error: "Error al conectar Google Drive", isSyncing: false });
      return false;
    }
  },

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
        selectedFolderName: "Lumina Home - Catálogo Fotográfico 2026",
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
        : `lumina_drive_img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const newFile: GoogleDriveFile = {
        id: photoId,
        name: photoData.name || "NUEVA-FOTOGRAFIA-LUMINA.jpg",
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
        id: "id" in p && p.id ? p.id : `lumina_drive_img_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        name: p.name || `FOTO-LUMINA-${idx + 1}.jpg`,
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
        app: "Lumina Home",
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
      a.download = `lumina_banco_fotos_backup_${dateStr}.json`;
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
