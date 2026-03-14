// src/stores/build-store.ts
// Build mode workspace state

import { create } from 'zustand';
import type { AssembleResponse, Blueprint } from '@/types';

interface BuildState {
  // Form state
  target: string;
  task: string;
  implementationLanguage: string;
  maxContextTokens: number;
  includeTests: boolean;
  includeEdgeCases: boolean;
  
  // Results
  assembleResult: AssembleResponse | null;
  blueprintResult: Blueprint | null;
  mode: 'bundle' | 'ai-context';
  
  // History
  buildHistory: Array<{
    id: string;
    target: string;
    task: string;
    timestamp: number;
  }>;
  
  // Actions
  setTarget: (target: string) => void;
  setTask: (task: string) => void;
  setImplementationLanguage: (lang: string) => void;
  setMaxContextTokens: (tokens: number) => void;
  setIncludeTests: (include: boolean) => void;
  setIncludeEdgeCases: (include: boolean) => void;
  setAssembleResult: (result: AssembleResponse | null) => void;
  setBlueprintResult: (result: Blueprint | null) => void;
  setMode: (mode: 'bundle' | 'ai-context') => void;
  addToHistory: (target: string, task: string) => void;
  clearHistory: () => void;
  resetForm: () => void;
}

const DEFAULT_LANGUAGE = 'python';
const DEFAULT_MAX_TOKENS = 8000;

export const useBuildStore = create<BuildState>((set) => ({
  target: '',
  task: '',
  implementationLanguage: DEFAULT_LANGUAGE,
  maxContextTokens: DEFAULT_MAX_TOKENS,
  includeTests: true,
  includeEdgeCases: true,
  
  assembleResult: null,
  blueprintResult: null,
  mode: 'bundle',
  
  buildHistory: [],
  
  setTarget: (target) => set({ target }),
  setTask: (task) => set({ task }),
  setImplementationLanguage: (lang) => set({ implementationLanguage: lang }),
  setMaxContextTokens: (tokens) => set({ maxContextTokens: tokens }),
  setIncludeTests: (include) => set({ includeTests: include }),
  setIncludeEdgeCases: (include) => set({ includeEdgeCases: include }),
  setAssembleResult: (result) => set({ assembleResult: result }),
  setBlueprintResult: (result) => set({ blueprintResult: result }),
  setMode: (mode) => set({ mode }),
  addToHistory: (target, task) => set((state) => ({
    buildHistory: [
      { id: crypto.randomUUID(), target, task, timestamp: Date.now() },
      ...state.buildHistory,
    ].slice(0, 20),
  })),
  clearHistory: () => set({ buildHistory: [] }),
  resetForm: () => set({
    target: '',
    task: '',
    implementationLanguage: DEFAULT_LANGUAGE,
    maxContextTokens: DEFAULT_MAX_TOKENS,
    includeTests: true,
    includeEdgeCases: true,
    assembleResult: null,
    blueprintResult: null,
  }),
}));
