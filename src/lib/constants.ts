// App-wide constants

export const APP_NAME = 'magB Platform';
export const APP_DESCRIPTION = 'The Universal Knowledge Engine';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Search defaults
export const SEARCH_DEBOUNCE_MS = 300;
export const MIN_SEARCH_QUERY_LENGTH = 2;

// Token estimation (rough average: 1 token ≈ 4 characters or 0.75 words)
export const TOKEN_ESTIMATE_CHARS = 4;
export const TOKEN_ESTIMATE_WORDS = 0.75;

// Complexity levels
export const COMPLEXITY_LEVELS = ['trivial', 'basic', 'intermediate', 'advanced', 'expert'] as const;
export type ComplexityLevel = typeof COMPLEXITY_LEVELS[number];

// Target kinds
export const TARGET_KINDS = {
  FILE_FORMAT: 'file_format',
  PROGRAMMING_LANGUAGE: 'programming_language',
  PROTOCOL: 'protocol',
  API: 'api',
  TOOL: 'tool',
} as const;

// Drift severity levels
export const DRIFT_SEVERITY = ['low', 'medium', 'high', 'critical'] as const;
export type DriftSeverity = typeof DRIFT_SEVERITY[number];

// Graph layout defaults
export const GRAPH_LAYOUT = {
  NODE_RADIUS: 20,
  LINK_DISTANCE: 100,
  CHARGE_STRENGTH: -300,
  COLLISION_RADIUS: 25,
};

// UI constants
export const UI = {
  SIDEBAR_WIDTH: 240,
  SIDEBAR_COLLAPSED_WIDTH: 64,
  TOP_BAR_HEIGHT: 64,
  COMMAND_PALETTE_WIDTH: 560,
};

// Local storage keys
export const STORAGE_KEYS = {
  API_KEY: 'magb_api_key',
  PREFERENCES: 'magb_preferences',
  RECENT_SEARCHES: 'magb_recent_searches',
  FAVORITE_TARGETS: 'magb_favorite_targets',
};

// API endpoints (for reference)
export const API_ENDPOINTS = {
  TARGETS: '/v1/targets',
  CAPABILITIES: '/v1/capabilities',
  ALGORITHMS: '/v1/algorithms',
  STRUCTURES: '/v1/structures',
  GRAPH: '/v1/graph',
  SEARCH: '/v1/search',
  ASSEMBLE: '/v1/assemble',
  BLUEPRINT: '/v1/blueprint',
  VITALITY: '/v1/vitality',
  AI_CONTEXT: '/v1/ai/context',
} as const;
