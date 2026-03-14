// src/stores/preferences-store.ts
// User preferences

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Preferences {
  // Display preferences
  defaultLanguage: string;
  defaultComplexityFilter: string | null;
  showVitalityIndicators: boolean;
  showTooltips: boolean;
  
  // Code preferences
  codeFontSize: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // Graph preferences
  graphAutoLayout: boolean;
  showNodeLabels: boolean;
  minNodeVitality: number;
  
  // Actions
  setDefaultLanguage: (lang: string) => void;
  setDefaultComplexityFilter: (filter: string | null) => void;
  setShowVitalityIndicators: (show: boolean) => void;
  setShowTooltips: (show: boolean) => void;
  setCodeFontSize: (size: number) => void;
  setShowLineNumbers: (show: boolean) => void;
  setWordWrap: (wrap: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setGraphAutoLayout: (auto: boolean) => void;
  setShowNodeLabels: (show: boolean) => void;
  setMinNodeVitality: (min: number) => void;
}

export const usePreferencesStore = create<Preferences>()(
  persist(
    (set) => ({
      defaultLanguage: 'python',
      defaultComplexityFilter: null,
      showVitalityIndicators: true,
      showTooltips: true,
      
      codeFontSize: 14,
      showLineNumbers: true,
      wordWrap: false,
      theme: 'system',
      
      graphAutoLayout: true,
      showNodeLabels: true,
      minNodeVitality: 0,
      
      setDefaultLanguage: (lang) => set({ defaultLanguage: lang }),
      setDefaultComplexityFilter: (filter) => set({ defaultComplexityFilter: filter }),
      setShowVitalityIndicators: (show) => set({ showVitalityIndicators: show }),
      setShowTooltips: (show) => set({ showTooltips: show }),
      setCodeFontSize: (size) => set({ codeFontSize: size }),
      setShowLineNumbers: (show) => set({ showLineNumbers: show }),
      setWordWrap: (wrap) => set({ wordWrap: wrap }),
      setTheme: (theme) => set({ theme }),
      setGraphAutoLayout: (auto) => set({ graphAutoLayout: auto }),
      setShowNodeLabels: (show) => set({ showNodeLabels: show }),
      setMinNodeVitality: (min) => set({ minNodeVitality: min }),
    }),
    {
      name: 'magb-preferences',
    }
  )
);
