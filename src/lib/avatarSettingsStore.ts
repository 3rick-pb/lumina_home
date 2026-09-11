import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AvatarSettingsState {
  showAvatarInNavbar: boolean;
  setShowAvatarInNavbar: (show: boolean) => void;
}

export const useAvatarSettingsStore = create<AvatarSettingsState>()(
  persist(
    (set) => ({
      // Por defecto en falso: en la barra de navegación de Inicio se conserva el icono clásico de usuario
      showAvatarInNavbar: false,
      setShowAvatarInNavbar: (show: boolean) => set({ showAvatarInNavbar: show }),
    }),
    {
      name: 'lumina-avatar-settings',
    }
  )
);
