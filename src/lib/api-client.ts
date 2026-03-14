import type {
  ApiResponse,
  Target,
  CapabilityBundle,
  Algorithm,
  StructureTemplate,
  CoordinateSystem,
  Concept,
  GraphData,
  SearchResult,
  Statistics,
  VitalityOverview,
  DriftEvent,
  AssembleRequest,
  AssembleResponse,
  Blueprint,
  // New types for database browsing
  Entry,
  AlgorithmSummary,
  CapabilitySummary,
  BlueprintSummary,
  GenerationRun,
} from '@/types';

const BASE_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

export class APIError extends Error {
  constructor(
    public status: number, 
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }

  static isRetryable(error: APIError): boolean {
    return error.status === 429 || error.status >= 500;
  }
}

class APIClient {
  private apiKey: string;
  private requestQueue: Promise<unknown> = Promise.resolve();

  constructor() {
    this.apiKey = typeof window !== 'undefined'
      ? localStorage.getItem('magb_api_key') || ''
      : '';
  }

  setApiKey(key: string) {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('magb_api_key', key);
    }
  }

  getApiKey(): string {
    return this.apiKey;
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  clearApiKey() {
    this.apiKey = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('magb_api_key');
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry<T>(
    path: string, 
    options: RequestInit = {},
    retries: number = MAX_RETRIES
  ): Promise<T> {
    try {
      return await this.fetch<T>(path, options);
    } catch (error) {
      if (error instanceof APIError && APIError.isRetryable(error) && retries > 0) {
        await this.delay(RETRY_DELAY * (MAX_RETRIES - retries + 1));
        return this.fetchWithRetry<T>(path, options, retries - 1);
      }
      throw error;
    }
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const error = await response.json();
        errorDetail = error.detail || error.message || errorDetail;
      } catch {
        // Response wasn't JSON
      }
      
      throw new APIError(
        response.status, 
        errorDetail,
        `ERR_${response.status}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/plain')) {
      return await response.text() as T;
    }

    return response.json() as Promise<T>;
  }

  targets = {
    list: (params?: { kind?: string; search?: string; limit?: number; offset?: number }) =>
      this.fetchWithRetry<ApiResponse<Target[]>>('/v1/targets?' + new URLSearchParams(params as Record<string, string>)),

    get: (id: string) =>
      this.fetchWithRetry<ApiResponse<Target>>(`/v1/targets/${id}`),

    capabilities: (id: string, params?: { search?: string; complexity?: string }) =>
      this.fetchWithRetry<ApiResponse<unknown>>(`/v1/targets/${id}/capabilities?` + new URLSearchParams(params as Record<string, string>)),

    coordinateSystem: (id: string) =>
      this.fetchWithRetry<ApiResponse<CoordinateSystem>>(`/v1/targets/${id}/coordinate-system`),

    minimalFile: (id: string) =>
      this.fetchWithRetry<ApiResponse<unknown>>(`/v1/targets/${id}/minimal-file`),
  };

  graph = {
    neighbors: (nodeId: string, params?: { relationship?: string; direction?: string; depth?: number }) =>
      this.fetchWithRetry<ApiResponse<GraphData>>(`/v1/graph/neighbors/${encodeURIComponent(nodeId)}?` + new URLSearchParams(params as Record<string, string>)),
  };

  concepts = {
    list: (params?: { domain?: string; search?: string }) =>
      this.fetchWithRetry<ApiResponse<Concept[]>>('/v1/concepts?' + new URLSearchParams(params as Record<string, string>)),

    get: (id: string) =>
      this.fetchWithRetry<ApiResponse<Concept>>(`/v1/concepts/${encodeURIComponent(id)}`),
  };

  capabilities = {
    bundle: (id: string, params?: { implementation_language?: string; include_prerequisites?: boolean; include_edge_cases?: boolean; response_format?: string }) =>
      this.fetchWithRetry<ApiResponse<CapabilityBundle>>(`/v1/capabilities/${encodeURIComponent(id)}/bundle?` + new URLSearchParams(params as Record<string, string>)),
  };

  algorithms = {
    get: (id: string, params?: { implementation_language?: string; include_optimizations?: boolean; include_test_vectors?: boolean }) =>
      this.fetchWithRetry<ApiResponse<Algorithm>>(`/v1/algorithms/${encodeURIComponent(id)}?` + new URLSearchParams(params as Record<string, string>)),

    search: (params: { query: string; domain?: string; has_implementation?: string; limit?: number }) =>
      this.fetchWithRetry<ApiResponse<Algorithm[]>>('/v1/search/algorithms?' + new URLSearchParams(params as any)),
  };

  structures = {
    get: (id: string) =>
      this.fetchWithRetry<ApiResponse<StructureTemplate>>(`/v1/structures/${encodeURIComponent(id)}`),
  };

  assemble = {
    run: (body: AssembleRequest) =>
      this.fetchWithRetry<ApiResponse<AssembleResponse>>('/v1/assemble', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
  };

  blueprint = {
    create: (body: { target: string; application_description: string; implementation_language?: string }) =>
      this.fetchWithRetry<ApiResponse<Blueprint>>('/v1/blueprint', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
  };

  diagnose = {
    run: (body: { target: string; problem_description: string; code_snippet?: string }) =>
      this.fetchWithRetry<ApiResponse<unknown>>('/v1/diagnose', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
  };

  convert = {
    plan: (body: { source_format: string; target_format: string; implementation_language?: string }) =>
      this.fetchWithRetry<ApiResponse<unknown>>('/v1/convert', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
  };

  compare = {
    run: (targets: string[]) =>
      this.fetchWithRetry<ApiResponse<unknown>>('/v1/compare?' + targets.map(t => `targets=${t}`).join('&'), {
        method: 'POST'
      }),
  };

  search = {
    run: (body: { query: string; node_types?: string[]; targets?: string[]; limit?: number }) =>
      this.fetchWithRetry<ApiResponse<SearchResult[]>>('/v1/search', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
  };

  ai = {
    context: (body: { target: string; task: string; implementation_language?: string; max_context_tokens?: number }) =>
      this.fetchWithRetry<string>('/v1/ai/context', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    systemPrompt: (targetId: string, params?: { scope?: string }) =>
      this.fetchWithRetry<string>(`/v1/ai/system-prompt/${targetId}?` + new URLSearchParams(params as Record<string, string>)),
  };

  vitality = {
    overview: (params?: { target?: string }) =>
      this.fetchWithRetry<ApiResponse<VitalityOverview>>('/v1/vitality?' + new URLSearchParams(params as Record<string, string>)),

    driftEvents: (params?: { severity?: string; target?: string; limit?: number }) =>
      this.fetchWithRetry<ApiResponse<DriftEvent[]>>('/v1/vitality/drift-events?' + new URLSearchParams(params as Record<string, string>)),
  };

  meta = {
    statistics: () => this.fetchWithRetry<ApiResponse<Statistics>>('/v1/meta/statistics'),
    nodeTypes: () => this.fetchWithRetry<ApiResponse<unknown>>('/v1/meta/node-types'),
    relationshipTypes: () => this.fetchWithRetry<ApiResponse<unknown>>('/v1/meta/relationship-types'),
  };

   health = {
     check: () => this.fetchWithRetry<ApiResponse<unknown>>('/v1/health'),
   };

   // Database browsing endpoints
   database = {
     entries: (params?: { search?: string; type?: string; limit?: number; offset?: number }) =>
       this.fetchWithRetry<ApiResponse<Entry[]>>(`/v1/database/entries?` + new URLSearchParams(params as Record<string, string>)),
     algorithms: (params?: { search?: string; limit?: number; offset?: number }) =>
       this.fetchWithRetry<ApiResponse<AlgorithmSummary[]>>(`/v1/database/algorithms?` + new URLSearchParams(params as Record<string, string>)),
     capabilities: (params?: { search?: string; limit?: number; offset?: number }) =>
       this.fetchWithRetry<ApiResponse<CapabilitySummary[]>>(`/v1/database/capabilities?` + new URLSearchParams(params as Record<string, string>)),
   };

   // Generation control endpoints
   generate = {
     start: (body: { target: string; targetType?: string; budgetUsd?: number }) =>
       this.fetchWithRetry<ApiResponse<{ runId: string; status: string }>>('/v1/generate', {
         method: 'POST',
         body: JSON.stringify(body)
       }),
     getRun: (runId: string) =>
       this.fetchWithRetry<ApiResponse<GenerationRun>>(`/v1/generate?runId=${runId}`),
   };
 }

export const api = new APIClient();
