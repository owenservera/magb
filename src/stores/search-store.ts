// src/stores/search-store.ts
// Search state

import { create } from 'zustand';
import type { SearchResult } from '@/types';

interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  selectedResult: SearchResult | null;
  recentSearches: string[];
  
  // Actions
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedResult: (result: SearchResult | null) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  isLoading: false,
  selectedResult: null,
  recentSearches: [],
  
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSelectedResult: (result) => set({ selectedResult: result }),
  addRecentSearch: (query) => set((state) => ({
    recentSearches: [query, ...state.recentSearches.filter(s => s !== query)].slice(0, 10),
  })),
  clearRecentSearches: () => set({ recentSearches: [] }),
  clearResults: () => set({ results: [], selectedResult: null }),
}));
