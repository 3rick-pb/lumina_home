import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

let avatarRealtimeChannel: RealtimeChannel | null = null;

export function setupAvatarRealtimeListener(userId: string) {
  if (!userId || typeof window === 'undefined') return;
  if (avatarRealtimeChannel) {
    try {
      avatarRealtimeChannel.unsubscribe();
    } catch {}
    avatarRealtimeChannel = null;
  }

  avatarRealtimeChannel = supabase
    .channel(`realtime:user_avatar_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_avatar_settings',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row: any = payload.new;
          useAvatarSettingsStore.setState({
            showAvatarInNavbar: typeof row.show_in_navbar === 'boolean' ? row.show_in_navbar : useAvatarSettingsStore.getState().showAvatarInNavbar,
            backgroundShape: row.background_shape === 'circle' ? 'circle' : 'squircle',
            animationMode: row.animation_mode || useAvatarSettingsStore.getState().animationMode,
            customSeed: row.custom_seed ?? useAvatarSettingsStore.getState().customSeed,
            lastSavedAt: row.updated_at || null,
            tableReady: true,
          });
        }
      }
    )
    .subscribe();
}

export function cleanupAvatarRealtimeListener() {
  if (avatarRealtimeChannel) {
    try {
      avatarRealtimeChannel.unsubscribe();
    } catch {}
    avatarRealtimeChannel = null;
  }
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
          // 1. Direct Supabase Query (Fastest, zero-hop, authenticated via user session)
          const { data, error } = await supabase
            .from('user_avatar_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (!error && data) {
            set({
              showAvatarInNavbar: typeof data.show_in_navbar === 'boolean' ? data.show_in_navbar : get().showAvatarInNavbar,
              backgroundShape: data.background_shape === 'circle' ? 'circle' : 'squircle',
              animationMode: data.animation_mode || get().animationMode,
              customSeed: data.custom_seed ?? userId,
              tableReady: true,
              lastSavedAt: data.updated_at || null,
              isSyncing: false,
            });
            return;
          }

          // 2. If row does not exist in Supabase yet, create canonical initial row
          if (!error && !data) {
            const canonicalSeed = userId;
            try {
              await supabase.from('user_avatar_settings').upsert({
                user_id: userId,
                custom_seed: canonicalSeed,
                background_shape: 'squircle',
                animation_mode: 'always',
                show_in_navbar: false,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' });
            } catch {}

            set({
              customSeed: canonicalSeed,
              backgroundShape: 'squircle',
              animationMode: 'always',
              showAvatarInNavbar: false,
              tableReady: true,
              isSyncing: false,
            });
            return;
          }

          // 3. Fallback to API route with explicit Bearer token
          const { data: { session } } = await supabase.auth.getSession();
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }

          const res = await fetch(`/api/user/avatar-settings?userId=${encodeURIComponent(userId)}`, {
            cache: 'no-store',
            headers,
          });
          const json = await res.json();
          if (json.success && json.settings) {
            set({
              showAvatarInNavbar: typeof json.settings.showInNavbar === 'boolean' ? json.settings.showInNavbar : get().showAvatarInNavbar,
              backgroundShape: json.settings.backgroundShape || get().backgroundShape,
              animationMode: json.settings.animationMode || get().animationMode,
              customSeed: json.settings.customSeed ?? userId,
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
        const current = get();
        const effectiveSeed = current.customSeed || userId;

        // 1. Direct Supabase Upsert (Instant database write)
        try {
          const { error: directErr } = await supabase
            .from('user_avatar_settings')
            .upsert({
              user_id: userId,
              user_email: email || null,
              show_in_navbar: current.showAvatarInNavbar,
              background_shape: current.backgroundShape,
              animation_mode: current.animationMode,
              custom_seed: effectiveSeed,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          if (!directErr) {
            set({
              customSeed: effectiveSeed,
              tableReady: true,
              lastSavedAt: new Date().toISOString(),
              isSyncing: false,
              errorMessage: null,
            });
          }
        } catch (e) {
          console.warn('[avatarSettingsStore] Direct save notice:', e);
        }

        // 2. Also notify API with authenticated Bearer token
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }

          const res = await fetch('/api/user/avatar-settings', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              userId,
              userEmail: email,
              showInNavbar: current.showAvatarInNavbar,
              backgroundShape: current.backgroundShape,
              animationMode: current.animationMode,
              customSeed: effectiveSeed,
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
          }
        } catch (e) {
          set({
            isSyncing: false,
            errorMessage: String(e),
          });
        }
        return true;
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
