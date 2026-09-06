import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode, userId?: string) => void;
  loadFromDB: (userId: string) => Promise<void>;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light', // Default to light mode
      setMode: async (mode, userId) => {
        set({ mode });
        if (userId) {
          try {
            await supabase
              .from('user_settings')
              .upsert({ user_id: userId, theme: mode, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          } catch {}
        }
      },
      loadFromDB: async (userId: string) => {
        try {
          const { data } = await supabase
            .from('user_settings')
            .select('theme')
            .eq('user_id', userId)
            .single();
            
          if (data && data.theme) {
            set({ mode: data.theme as ThemeMode });
          } else {
            set({ mode: 'light' });
          }
        } catch {}
      }
    }),
    {
      name: 'lumina-theme',
    }
  )
);

export const getResolvedTheme = (mode: ThemeMode) => {
  if (mode === 'auto') {
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
  }
  return mode;
};
