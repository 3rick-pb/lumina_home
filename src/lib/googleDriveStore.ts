import { create } from "zustand";

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  cdnUrl: string;
  thumbnailUrl: string;
  size?: string;
  dimensions?: string;
  folderId?: string;
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
  },
];

interface GoogleDriveState {
  settings: GoogleDriveSettings;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  activeView: 'folders' | 'files';
  setActiveView: (view: 'folders' | 'files') => void;
  loadSettings: () => Promise<void>;
  connectAccount: (email?: string, name?: string) => Promise<boolean>;
  disconnectAccount: () => Promise<boolean>;
  selectFolder: (folderId: string, folderName?: string) => Promise<boolean>;
  createFolder: (name: string) => Promise<boolean>;
  syncFiles: () => Promise<void>;
}

const STORAGE_KEY = "lumina_admin_google_drive_v1";

function loadFromLocal(): GoogleDriveSettings {
  if (typeof window === "undefined") {
    return {
      isConnected: true,
      accountEmail: "multimedia.lumina@gmail.com",
      accountName: "Lumina Home Media Assets",
      connectedAt: new Date().toISOString(),
      selectedFolderId: "folder_lumina_catalog_2026",
      selectedFolderName: "Lumina Home - Catálogo Fotográfico 2026",
      availableFolders: INITIAL_DRIVE_FOLDERS,
      files: INITIAL_DRIVE_FILES,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.isConnected === "boolean") {
        return parsed;
      }
    }
  } catch {}

  const defaults: GoogleDriveSettings = {
    isConnected: true,
    accountEmail: "multimedia.lumina@gmail.com",
    accountName: "Lumina Home Media Assets",
    connectedAt: new Date().toISOString(),
    selectedFolderId: "folder_lumina_catalog_2026",
    selectedFolderName: "Lumina Home - Catálogo Fotográfico 2026",
    availableFolders: INITIAL_DRIVE_FOLDERS,
    files: INITIAL_DRIVE_FILES,
  };
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

  setActiveView: (view: 'folders' | 'files') => {
    set({ activeView: view });
  },

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/admin/google-drive");
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.settings) {
          set({ settings: data.settings, isLoading: false });
          saveToLocal(data.settings);
          return;
        }
      }
    } catch {
      // Fallback gracefully to local store
    }
    set({ settings: loadFromLocal(), isLoading: false });
  },

  connectAccount: async (email = "multimedia.lumina@gmail.com", name = "Lumina Home Media Assets") => {
    set({ isSyncing: true, error: null });
    try {
      const updated: GoogleDriveSettings = {
        ...get().settings,
        isConnected: true,
        accountEmail: email.trim().toLowerCase(),
        accountName: name.trim(),
        connectedAt: new Date().toISOString(),
        selectedFolderId: "folder_lumina_catalog_2026",
        selectedFolderName: "Lumina Home - Catálogo Fotográfico 2026",
        availableFolders: INITIAL_DRIVE_FOLDERS,
        files: INITIAL_DRIVE_FILES,
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

      const filteredFiles = INITIAL_DRIVE_FILES.filter(
        (f) => !f.folderId || f.folderId === folderId || folderId === "folder_lumina_catalog_2026"
      );

      const updated: GoogleDriveSettings = {
        ...get().settings,
        selectedFolderId: folderId,
        selectedFolderName: resolvedName,
        files: filteredFiles.length > 0 ? filteredFiles : INITIAL_DRIVE_FILES,
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

      const updated: GoogleDriveSettings = {
        ...get().settings,
        availableFolders: [newFolder, ...get().settings.availableFolders],
        selectedFolderId: newFolderId,
        selectedFolderName: name.trim(),
        files: [],
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

  syncFiles: async () => {
    set({ isSyncing: true, error: null });
    try {
      await new Promise((r) => setTimeout(r, 600));
      set({ isSyncing: false });
    } catch {
      set({ isSyncing: false });
    }
  },
}));
