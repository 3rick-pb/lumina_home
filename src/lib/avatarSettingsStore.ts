import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AvatarSettingsState {
  showAvatarInNavbar: boolean;
  backgroundShape: 'squircle' | 'circle';
  animationMode: 'always' | 'hover' | 'none';
  customSeed: string | null;
  isSyncing: boolean;
  tableReady: boolean | null;
  lastSavedAt: string | null;
  errorMessage: string | null;

  setShowAvatarInNavbar: (show: boolean, userId?: string, email?: string) => Promise<void>;
  setBackgroundShape: (shape: 'squircle' | 'circle', userId?: string, email?: string) => Promise<void>;
  setCustomSeed: (seed: string | null, userId?: string, email?: string) => Promise<void>;
  loadSettingsFromDatabase: (userId: string) => Promise<void>;
  saveSettingsToDatabase: (userId: string, email?: string) => Promise<boolean>;
}

export const useAvatarSettingsStore = create<AvatarSettingsState>()(
  persist(
    (set, get) => ({
      showAvatarInNavbar: false,
      backgroundShape: 'squircle',
      animationMode: 'always',
      customSeed: null,
      isSyncing: false,
      tableReady: null,
      lastSavedAt: null,
      errorMessage: null,

      setShowAvatarInNavbar: async (show: boolean, userId?: string, email?: string) => {
        set({ showAvatarInNavbar: show });
        if (userId) {
          await get().saveSettingsToDatabase(userId, email);
        }
      },

      setBackgroundShape: async (shape: 'squircle' | 'circle', userId?: string, email?: string) => {
        set({ backgroundShape: shape });
        if (userId) {
          await get().saveSettingsToDatabase(userId, email);
        }
      },

      setCustomSeed: async (seed: string | null, userId?: string, email?: string) => {
        set({ customSeed: seed });
        if (userId) {
          await get().saveSettingsToDatabase(userId, email);
        }
      },

      loadSettingsFromDatabase: async (userId: string) => {
        if (!userId) return;
        set({ isSyncing: true, errorMessage: null });
        try {
          const res = await fetch(`/api/user/avatar-settings?userId=${encodeURIComponent(userId)}`, {
            cache: 'no-store',
          });
          const json = await res.json();
          if (json.success && json.settings) {
            set({
              showAvatarInNavbar: typeof json.settings.showInNavbar === 'boolean' ? json.settings.showInNavbar : get().showAvatarInNavbar,
              backgroundShape: json.settings.backgroundShape || get().backgroundShape,
              animationMode: json.settings.animationMode || get().animationMode,
              customSeed: json.settings.customSeed ?? get().customSeed,
              tableReady: json.tableReady ?? true,
              lastSavedAt: json.settings.updatedAt || null,
              isSyncing: false,
            });
          } else {
            set({
              tableReady: json.tableReady ?? false,
              errorMessage: json.error || null,
              isSyncing: false,
            });
          }
        } catch {
          set({ isSyncing: false });
        }
      },

      saveSettingsToDatabase: async (userId: string, email?: string): Promise<boolean> => {
        if (!userId) return false;
        set({ isSyncing: true, errorMessage: null });
        try {
          const current = get();
          const res = await fetch('/api/user/avatar-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              userEmail: email,
              showInNavbar: current.showAvatarInNavbar,
              backgroundShape: current.backgroundShape,
              animationMode: current.animationMode,
              customSeed: current.customSeed,
            }),
          });
          const json = await res.json();
          if (json.success) {
            set({
              tableReady: true,
              lastSavedAt: new Date().toISOString(),
              isSyncing: false,
              errorMessage: null,
            });
            return true;
          } else {
            set({
              tableReady: json.tableReady ?? false,
              errorMessage: json.error || 'Error al guardar en base de datos',
              isSyncing: false,
            });
            return false;
          }
        } catch (e) {
          set({
            isSyncing: false,
            errorMessage: String(e),
          });
          return false;
        }
      },
    }),
    {
      name: 'lumina-avatar-settings',
      partialize: (state) => ({
        showAvatarInNavbar: state.showAvatarInNavbar,
        backgroundShape: state.backgroundShape,
        animationMode: state.animationMode,
        customSeed: state.customSeed,
      }),
    }
  )
);
