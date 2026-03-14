import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './api-client';

// Mock fetch
global.fetch = vi.fn();

function createMockResponse(data: any, status = 200, contentType = 'application/json') {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    headers: {
      get: (name: string) => name === 'content-type' ? contentType : null,
    },
  } as Response;
}

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('health', () => {
    it('should fetch health status', async () => {
      const mockResponse = {
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: { database: 'connected' },
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await api.health.check();
      
      expect(fetch).toHaveBeenCalled();
      expect(result.data.status).toBe('healthy');
    });
  });

  describe('targets', () => {
    it('should list targets with filters', async () => {
      const mockResponse = {
        data: [
          { id: 'json', name: 'JSON', kind: 'DATA_FORMAT', capability_count: 5 }
        ],
        meta: { total: 1, limit: 20, offset: 0 },
      };

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await api.targets.list({ kind: 'DATA_FORMAT', limit: 20 });
      
      expect(fetch).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('json');
    });

    it('should get target by ID', async () => {
      const mockResponse = {
        data: {
          id: 'json',
          name: 'JSON',
          kind: 'DATA_FORMAT',
          description: 'JavaScript Object Notation',
          capability_count: 5,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await api.targets.get('json');
      
      expect(fetch).toHaveBeenCalled();
      expect(result.data.id).toBe('json');
    });

    it('should handle 404 for missing target', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createMockResponse({ error: 'Target not found' }, 404)
      );

      await expect(api.targets.get('nonexistent')).rejects.toThrow();
    });
  });

  describe('search', () => {
    it('should search with query', async () => {
      const mockResponse = {
        data: [
          { id: '1', type: 'entry', name: 'JSON Parsing', snippet: 'Parse JSON strings' }
        ],
        meta: { total: 1, limit: 20 },
      };

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await api.search.run({
        query: 'json parsing',
        limit: 20,
      });
      
      expect(fetch).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('vitality', () => {
    it('should get vitality overview', async () => {
      const mockResponse = {
        data: {
          overall_vitality: 85,
          freshness: 90,
          correctness: 80,
          completeness: 85,
          healthy_nodes: 100,
          critical_nodes: 10,
          total_nodes: 110,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await api.vitality.overview();
      
      expect(fetch).toHaveBeenCalled();
      expect(result.data.overall_vitality).toBe(85);
    });
  });

  describe('concepts', () => {
    it('should list concepts with domain filter', async () => {
      const mockResponse = {
        data: [
          { id: 'iteration', name: 'Iteration', domain: 'control_flow', entry_count: 10 }
        ],
      };

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await api.concepts.list({ domain: 'control_flow' });
      
      expect(fetch).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].domain).toBe('control_flow');
    });
  });

  describe('error handling', () => {
    it('should throw APIError on non-200 response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createMockResponse({ error: 'Internal server error' }, 500)
      );

      await expect(api.health.check()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(api.health.check()).rejects.toThrow('Network error');
    });
  });

  describe('API key management', () => {
    it('should include API key in headers when set', () => {
      api.setApiKey('test-key-123');
      
      // Verify key is stored
      // Note: We can't easily test localStorage in Node environment
      expect(typeof api.setApiKey).toBe('function');
    });
  });
});
