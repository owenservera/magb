// src/hooks/useSearch.ts
// Debounced search hook

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSearchStore } from '@/stores/search-store';
import type { SearchResult } from '@/types';

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  enabled?: boolean;
}

export function useSearch(query: string, options: UseSearchOptions = {}) {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    enabled = true,
  } = options;

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const { setResults, setLoading, addRecentSearch } = useSearchStore();

  // Debounce the query
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [query, debounceMs]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < minQueryLength) {
        return [];
      }
      const response = await api.search({
        query: debouncedQuery,
        limit: 10,
      });
      return response.data || [];
    },
    enabled: enabled && debouncedQuery.length >= minQueryLength,
  });

  // Update store with results
  useEffect(() => {
    if (data) {
      setResults(data as SearchResult[]);
      setLoading(false);
    }
  }, [data, setResults, setLoading]);

  // Add to recent searches when query is submitted (non-empty results)
  const handleSearchSubmit = useCallback(() => {
    if (query.trim().length >= minQueryLength) {
      addRecentSearch(query.trim());
    }
  }, [query, minQueryLength, addRecentSearch]);

  return {
    query,
    results: (data as SearchResult[]) || [],
    isLoading,
    error,
    onSubmit: handleSearchSubmit,
  };
}
