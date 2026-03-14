// Test utilities and helpers

import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement, ReactNode } from 'react';

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });
};

// Custom render wrapper with providers
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: {
    queryClient?: QueryClient;
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}

// Mock data factories
export const mockTarget = {
  id: 'test-target',
  name: 'Test Target',
  kind: 'FILE_FORMAT',
  description: 'A test target',
  capability_count: 5,
  extensions: ['.test'],
  media_types: ['application/test'],
};

export const mockCapability = {
  id: 'test-capability',
  name: 'Test Capability',
  description: 'A test capability',
  complexity: 'basic' as const,
};

export const mockAlgorithm = {
  id: 'test-algorithm',
  name: 'Test Algorithm',
  purpose: 'Testing purposes',
  content: {
    name: 'Test Algorithm',
    purpose: 'Testing',
    implementations: {
      python: {
        code: 'def test(): pass',
        language: 'python',
      },
    },
  },
};

// Wait for async operations
export const waitForAsync = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock API response helper
export const mockApiResponse = <T>(data: T) => ({
  data,
  meta: {
    total: 1,
    limit: 10,
    offset: 0,
  },
});
