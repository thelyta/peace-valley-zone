"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  activeZoneId: string | null;
  activeGateId: string | null;
  navOpen: boolean;
  /** In-memory only — never persisted. Holds a scanned visitor code/token briefly. */
  pendingVisitorCode: string | null;
  setActiveZoneId: (zoneId: string | null) => void;
  setActiveGateId: (gateId: string | null) => void;
  setNavOpen: (open: boolean) => void;
  setPendingVisitorCode: (code: string | null) => void;
  consumePendingVisitorCode: () => string | null;
  clearSelection: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeZoneId: null,
      activeGateId: null,
      navOpen: false,
      pendingVisitorCode: null,
      setActiveZoneId: (activeZoneId) => set({ activeZoneId }),
      setActiveGateId: (activeGateId) => set({ activeGateId }),
      setNavOpen: (navOpen) => set({ navOpen }),
      setPendingVisitorCode: (pendingVisitorCode) => set({ pendingVisitorCode }),
      consumePendingVisitorCode: () => {
        const code = get().pendingVisitorCode;
        if (code) {
          set({ pendingVisitorCode: null });
        }
        return code;
      },
      clearSelection: () =>
        set({
          activeZoneId: null,
          activeGateId: null,
          navOpen: false,
          pendingVisitorCode: null,
        }),
    }),
    {
      name: "peace-valley-preferences",
      partialize: (state) => ({
        activeZoneId: state.activeZoneId,
        activeGateId: state.activeGateId,
      }),
    },
  ),
);
