// src/stores/graph-store.ts
// Graph exploration state

import { create } from 'zustand';
import type { GraphData, GraphNode } from '@/types';

interface GraphState {
  graphData: GraphData | null;
  selectedNode: GraphNode | null;
  highlightedNodes: string[]; // node IDs
  zoom: number;
  pan: { x: number; y: number };
  layoutType: 'force' | 'hierarchical' | 'circular';
  filterByType: string[];
  
  // Actions
  setGraphData: (data: GraphData | null) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setHighlightedNodes: (nodeIds: string[]) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setLayoutType: (type: 'force' | 'hierarchical' | 'circular') => void;
  setFilterByType: (types: string[]) => void;
  toggleNodeType: (type: string) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  graphData: null,
  selectedNode: null,
  highlightedNodes: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  layoutType: 'force',
  filterByType: [],
  
  setGraphData: (data) => set({ graphData: data }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setHighlightedNodes: (nodeIds) => set({ highlightedNodes: nodeIds }),
  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  setLayoutType: (type) => set({ layoutType: type }),
  setFilterByType: (types) => set({ filterByType: types }),
  toggleNodeType: (type) => set((state) => ({
    filterByType: state.filterByType.includes(type)
      ? state.filterByType.filter(t => t !== type)
      : [...state.filterByType, type],
  })),
}));
