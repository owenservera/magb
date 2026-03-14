// src/stores/app-store.ts
// Global app state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // UI state
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  darkMode: boolean;
  
  // Current mode
  currentMode: 'explore' | 'build' | 'health' | 'contribute';
  
  // Actions
  toggleSidebar: () => void;
  toggleCommandPalette: () => void;
  setDarkMode: (dark: boolean) => void;
  setCurrentMode: (mode: 'explore' | 'build' | 'health' | 'contribute') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      commandPaletteOpen: false,
      darkMode: false,
      currentMode: 'explore',
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setDarkMode: (dark) => set({ darkMode: dark }),
      setCurrentMode: (mode) => set({ currentMode: mode }),
    }),
    {
      name: 'magb-app-store',
      partialize: (state) => ({ 
        darkMode: state.darkMode,
        currentMode: state.currentMode,
      }),
    }
  )
);
