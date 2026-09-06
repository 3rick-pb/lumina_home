import { create } from 'zustand';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ConnectedClient {
  id: string;
  name: string;
  email: string;
  city: string;
  country: string;
  x: number;
  y: number;
  frequency: "Semanal" | "Quincenal" | "Mensual" | "Ocasional" | "Primera vez";
  purchasesCount: number;
  totalSpent: number;
  currentSection: string;
  intentScore: number;
  device: "Computador" | "Celular" | "Tablet";
  hasCart: boolean;
  cartItemsCount?: number;
  isRealUser?: boolean;
}

interface RadarStore {
  clients: ConnectedClient[];
  channel: RealtimeChannel | null;
  initRadar: (
    user: { id: string; name?: string; email?: string } | null,
    city?: string,
    totalSpent?: number,
    purchasesCount?: number,
    currentSection?: string
  ) => void;
}

export const useRadarStore = create<RadarStore>((set, get) => ({
  clients: [],
  channel: null,
  initRadar: (user, city = 'Quito', totalSpent = 0, purchasesCount = 0, currentSection = 'Explorando Tienda') => {
    let activeChannel = get().channel;

    if (!activeChannel) {
      activeChannel = supabase.channel('radar:clients');

      activeChannel
        .on('presence', { event: 'sync' }, () => {
          try {
            const newState = activeChannel?.presenceState() || {};
            const clientList: ConnectedClient[] = [];

            for (const key in newState) {
              const presenceArr = newState[key] as unknown[];
              if (presenceArr && presenceArr.length > 0) {
                const clientData = presenceArr[0] as ConnectedClient;
                if (clientData && clientData.id) {
                  clientList.push(clientData);
                }
              }
            }

            set({ clients: clientList });
          } catch (err) {
            console.error('Error synchronizing presence state:', err);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && user?.id) {
            try {
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
              await activeChannel?.track({
                id: user.id,
                name: user.name || user.email?.split('@')[0] || 'Cliente Lumina',
                email: user.email || '',
                city: city || 'Quito',
                country: 'Ecuador',
                x: 48.8,
                y: 26.5,
                frequency: purchasesCount > 3 ? 'Semanal' : 'Primera vez',
                purchasesCount: purchasesCount || 0,
                totalSpent: totalSpent || 0,
                currentSection: currentSection,
                intentScore: 92,
                device: isMobile ? 'Celular' : 'Computador',
                hasCart: false,
                cartItemsCount: 0,
                isRealUser: true,
              });
            } catch (trackErr) {
              console.error('Error tracking user presence:', trackErr);
            }
          }
        });

      set({ channel: activeChannel });
    } else if (user?.id) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      activeChannel.track({
        id: user.id,
        name: user.name || user.email?.split('@')[0] || 'Cliente Lumina',
        email: user.email || '',
        city: city || 'Quito',
        country: 'Ecuador',
        x: 48.8,
        y: 26.5,
        frequency: purchasesCount > 3 ? 'Semanal' : 'Primera vez',
        purchasesCount: purchasesCount || 0,
        totalSpent: totalSpent || 0,
        currentSection: currentSection,
        intentScore: 92,
        device: isMobile ? 'Celular' : 'Computador',
        hasCart: false,
        cartItemsCount: 0,
        isRealUser: true,
      }).catch(() => {});
    }
  },
}));
