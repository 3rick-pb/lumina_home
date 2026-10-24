import { create } from "zustand";

export type BootPhase = "loading" | "fading" | "done";

// Bandera en memoria de la sesión SPA: sobrevive transiciones client-side de Next.js
// (/ -> /shop -> /), pero se resetea limpiamente en recargas completas (F5, reload) o aperturas directas.
let hasBootedInSpaMemory = false;

interface BootState {
  bootPhase: BootPhase;
  hasBootedInSpa: () => boolean;
  setBootPhase: (phase: BootPhase) => void;
  markBootCompleted: () => void;
  resetBootState: () => void;
}

export const useBootStore = create<BootState>((set) => ({
  bootPhase: hasBootedInSpaMemory ? "done" : "loading",
  hasBootedInSpa: () => hasBootedInSpaMemory,
  setBootPhase: (phase: BootPhase) => {
    if (phase === "done") {
      hasBootedInSpaMemory = true;
    }
    set({ bootPhase: phase });
  },
  markBootCompleted: () => {
    hasBootedInSpaMemory = true;
    set({ bootPhase: "done" });
  },
  resetBootState: () => {
    hasBootedInSpaMemory = false;
    set({ bootPhase: "loading" });
  },
}));
